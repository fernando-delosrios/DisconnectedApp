import {
    Context,
    createConnector,
    readConfig,
    Response,
    logger,
    StdAccountListOutput,
    StdAccountReadInput,
    StdAccountReadOutput,
    StdTestConnectionOutput,
    StdAccountListInput,
    StdTestConnectionInput,
    StdAccountDiscoverSchemaOutput,
    ConnectorError,
    StdEntitlementListInput,
    StdEntitlementListOutput,
    StdEntitlementReadInput,
    StdEntitlementReadOutput,
    StdAccountCreateInput,
    StdAccountCreateOutput,
    StdAccountUpdateInput,
    StdAccountUpdateOutput,
    AttributeChangeOp,
    StdAccountDisableInput,
    StdAccountDisableOutput,
    StdAccountEnableInput,
    StdAccountEnableOutput,
} from '@sailpoint/connector-sdk'
import { ISCClient } from './isc'
import { Config } from './model/config'
import { Account, Source } from 'sailpoint-api-client/dist/v3'
import { DisconnectedAccount } from './model/account'
import { DisconnectedEntitlement } from './model/entitlement'
import { cleanSchema, isAttributeMulti, schemaTransform } from './utils'

// Connector must be exported as module property named connector
export const connector = async () => {
    // Get connector source config
    const config: Config = await readConfig()

    // Use the vendor SDK, or implement own client as necessary, to initialize a client
    const client = new ISCClient(config)

    const sources = await client.listSources()
    const originSource = sources.find((x) => x.name === config.source) as Source
    const destinationSource = sources.find(
        (x) => (x.connectorAttributes as any).spConnectorInstanceId === config.spConnectorInstanceId
    ) as Source

    let originSourceAggregationTime = 0
    const originSourceAggregationQuery = await client.getLatestAccountAggregation(originSource.name)
    if (originSourceAggregationQuery) {
        originSourceAggregationTime = new Date(originSourceAggregationQuery.created!).getTime()
    }

    let destinationSourceAggregationTime = 0
    const destinationSourceAggregationQuery = await client.getLatestAccountAggregation(destinationSource.name)
    if (destinationSourceAggregationQuery) {
        destinationSourceAggregationTime = new Date(destinationSourceAggregationQuery.created!).getTime()
    }

    const getExistingAccount = async (nativeIdentity: string): Promise<DisconnectedAccount> => {
        const rawAccount = await client.getAccountBySourceAndNativeIdentity(destinationSource.id!, nativeIdentity)
        const account = new DisconnectedAccount(rawAccount!)

        return account
    }

    return createConnector()
        .stdTestConnection(
            async (context: Context, input: StdTestConnectionInput, res: Response<StdTestConnectionOutput>) => {
                if (!originSource) {
                    throw new ConnectorError(`Source ${config.source} not found`)
                } else {
                    res.send({})
                }
            }
        )
        .stdAccountList(async (context: Context, input: StdAccountListInput, res: Response<StdAccountListOutput>) => {
            let accounts: Account[] = []
            if (originSourceAggregationTime > destinationSourceAggregationTime) {
                logger.info('Returning origin data')
                accounts = await client.listAccounts(originSource.id!)
            } else {
                logger.info('Returning destination data')
                accounts = await client.listAccounts(destinationSource.id!)
            }

            for (const acc of accounts) {
                const account = new DisconnectedAccount(acc)

                logger.info(account)
                res.send(account)
            }
        })
        .stdAccountRead(async (context: Context, input: StdAccountReadInput, res: Response<StdAccountReadOutput>) => {
            logger.info(input)

            let account: DisconnectedAccount
            if (originSourceAggregationTime > destinationSourceAggregationTime) {
                logger.info('Returning origin data')
                const originAccount = await client.getAccountBySourceAndNativeIdentity(originSource.id!, input.identity)
                if (!originAccount) {
                    account = new DisconnectedAccount(originAccount!)
                } else {
                    logger.info('Reverting to destination data')
                    const destinationAccount = await client.getAccountBySourceAndNativeIdentity(
                        destinationSource.id!,
                        input.identity
                    )
                    account = new DisconnectedAccount(destinationAccount!)
                }
            } else {
                logger.info('Returning destination data')
                const destinationAccount = await client.getAccountBySourceAndNativeIdentity(
                    destinationSource.id!,
                    input.identity
                )
                account = new DisconnectedAccount(destinationAccount!)
            }

            logger.info(account)
            res.send(account)
        })
        .stdAccountCreate(
            async (context: Context, input: StdAccountCreateInput, res: Response<StdAccountCreateOutput>) => {
                logger.info(input)
                const account: DisconnectedAccount = {
                    identity: input.identity!,
                    uuid: input.attributes[input.schema?.displayAttribute!],
                    attributes: input.attributes,
                    disabled: false,
                }
                account.attributes.IQDisabled = false

                logger.info(account)
                res.send(account)
            }
        )
        .stdAccountUpdate(
            async (context: Context, input: StdAccountUpdateInput, res: Response<StdAccountUpdateOutput>) => {
                logger.info(input)
                const account = await getExistingAccount(input.identity)

                if (input.changes) {
                    for (const change of input.changes) {
                        if (!account.attributes[change.attribute]) {
                            if (isAttributeMulti(change.attribute, input.schema!)) {
                                account.attributes[change.attribute] = []
                            }
                        }
                        switch (change.op) {
                            case AttributeChangeOp.Add:
                                if (isAttributeMulti(change.attribute, input.schema!)) {
                                    ;(account.attributes[change.attribute] as any[]).push(change.value)
                                } else {
                                    account.attributes[change.attribute] = change.value
                                }
                                account!.attributes![change.attribute] = change.value
                                break
                            case AttributeChangeOp.Set:
                                account!.attributes![change.attribute] = change.value
                                break
                            case AttributeChangeOp.Remove:
                                if (isAttributeMulti(change.attribute, input.schema!)) {
                                    const attribute = account.attributes[change.attribute] as any[]
                                    account.attributes[change.attribute] = attribute.filter((x) => x !== change.value)
                                } else {
                                    delete account!.attributes![change.attribute]
                                }
                                break

                            default:
                                break
                        }
                    }
                }
                account!.uuid = account!.attributes![input.schema?.displayAttribute!] as string

                logger.info(account)
                res.send(account!)
            }
        )
        .stdAccountDisable(
            async (context: Context, input: StdAccountDisableInput, res: Response<StdAccountDisableOutput>) => {
                logger.info(input)
                const account = await getExistingAccount(input.identity)
                account.disabled = true
                account.attributes.IQDisabled = true

                logger.info(account)
                res.send(account)
            }
        )
        .stdAccountEnable(
            async (context: Context, input: StdAccountEnableInput, res: Response<StdAccountEnableOutput>) => {
                logger.info(input)
                const account = await getExistingAccount(input.identity)
                account.disabled = false
                account.attributes.IQDisabled = false

                logger.info(account)
                res.send(account)
            }
        )
        .stdEntitlementList(
            async (context: Context, input: StdEntitlementListInput, res: Response<StdEntitlementListOutput>) => {
                logger.info(input)
                const rawEntitlements = await client.listEntitlementsBySource(originSource.id!, input.type)

                for (const rawEntitlement of rawEntitlements) {
                    const entitlement = new DisconnectedEntitlement(rawEntitlement, input.type)

                    logger.info(entitlement)
                    res.send(entitlement)
                }
            }
        )
        .stdEntitlementRead(
            async (context: Context, input: StdEntitlementReadInput, res: Response<StdEntitlementReadOutput>) => {
                logger.info(input)
            }
        )
        .stdAccountDiscoverSchema(
            async (context: Context, input: undefined, res: Response<StdAccountDiscoverSchemaOutput>) => {
                const originSchemas = await client.listSourceSchemas(originSource.id!)
                const destinationSchemas = await client.listSourceSchemas(destinationSource.id!)
                for (const originSchema of originSchemas) {
                    if (originSchema.name === 'account') {
                        const accountSchema = schemaTransform(originSchema)
                        logger.info('Returning accounts schema')
                        logger.info(accountSchema)
                        res.send(accountSchema)
                    } else {
                        if (destinationSchemas.findIndex((x) => x.name === originSchema.name) === -1) {
                            logger.info(`Creating entitlement schema ${originSchema.name}`)
                            const newSchema = cleanSchema(originSchema)
                            logger.info(newSchema)
                            await client.createSchema(destinationSource.id!, newSchema)
                        }
                    }
                }
            }
        )
}
