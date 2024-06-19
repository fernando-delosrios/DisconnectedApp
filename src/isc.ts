import axiosRetry from 'axios-retry'
import {
    Configuration,
    Paginator,
    Search,
    SearchApi,
    SourcesApi,
    Account,
    EntitlementsBetaApi,
    EntitlementBeta,
} from 'sailpoint-api-client'
import { AxiosRequestConfig, AxiosError } from 'axios'
import {
    AccountsApi,
    AccountsApiListAccountsRequest,
    Schema,
    SearchDocument,
    Source,
    SourcesApiCreateSourceSchemaRequest,
} from 'sailpoint-api-client/dist/v3'
import { URL } from 'url'

const TOKEN_URL_PATH = '/oauth/token'
const BATCH_SIZE = 15
const retries = 10

const retryCondition = (error: AxiosError): boolean => {
    return axiosRetry.isRetryableError(error) || (error.response ? error.response.status === 429 : false)
}

const retryDelay = (retryCount: number, error: AxiosError<unknown, any>, delayFactor?: number | undefined): number => {
    if (error.response && error.response.headers['retry-after']) {
        return error.response.headers['retry-after'] * 1000
    } else {
        return axiosRetry.exponentialDelay(retryCount, error, delayFactor)
    }
}

const axiosOptions: AxiosRequestConfig = {
    'axios-retry': {
        retries,
        retryDelay,
        retryCondition,
    },
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export class ISCClient {
    private config: Configuration

    constructor(config: any) {
        const tokenUrl = new URL(config.baseurl).origin + TOKEN_URL_PATH
        this.config = new Configuration({ ...config, tokenUrl })
        this.config.retriesConfig = axiosOptions['axios-retry']
    }

    async listAccountsBySource(id: string): Promise<Account[]> {
        const api = new AccountsApi(this.config)
        const filters = `sourceId eq "${id}"`
        const search = async (
            requestParameters?: AccountsApiListAccountsRequest | undefined,
            axiosOptions?: AxiosRequestConfig<any> | undefined
        ) => {
            return await api.listAccounts({ ...requestParameters, filters })
        }

        const response = await Paginator.paginate(api, search)

        return response.data
    }

    async listSources() {
        const api = new SourcesApi(this.config)

        const response = await Paginator.paginate(api, api.listSources)

        return response.data
    }

    async getAccountBySourceAndNativeIdentity(id: string, nativeIdentity: string): Promise<Account | undefined> {
        const api = new AccountsApi(this.config)
        const filters = `sourceId eq "${id}" and nativeIdentity eq "${nativeIdentity}"`

        const response = await api.listAccounts({ filters })

        return response.data.length > 0 ? response.data[0] : undefined
    }

    async listAccounts(sourceId?: string): Promise<Account[]> {
        const api = new AccountsApi(this.config)
        const filters = `sourceId eq "${sourceId}"`
        const search = async (
            requestParameters?: AccountsApiListAccountsRequest | undefined,
            axiosOptions?: AxiosRequestConfig<any> | undefined
        ) => {
            return await api.listAccounts({ ...requestParameters, filters })
        }

        const response = await Paginator.paginate(api, search)

        return response.data
    }

    async getSource(name: string): Promise<Source | undefined> {
        const api = new SourcesApi(this.config)

        const filters = `name eq ${name}`
        const response = await api.listSources({ filters })

        return response.data.length === 0 ? undefined : response.data[0]
    }

    async getSchema(sourceId: string, schemaId: string): Promise<Schema | undefined> {
        const api = new SourcesApi(this.config)

        const response = await api.getSourceSchema({ sourceId, schemaId })

        return response.data
    }

    async listSourceSchemas(sourceId: string): Promise<Schema[]> {
        const api = new SourcesApi(this.config)

        const response = await api.getSourceSchemas({ sourceId })

        return response.data
    }

    async listEntitlementsBySource(id: string, type?: string): Promise<EntitlementBeta[]> {
        const api = new EntitlementsBetaApi(this.config)

        let filters = `source.id eq "${id}"`
        if (type) {
            filters += ` and type eq "${type}"`
        }

        const search = async (
            requestParameters?: AccountsApiListAccountsRequest | undefined,
            axiosOptions?: AxiosRequestConfig<any> | undefined
        ) => {
            return await api.listEntitlements({ ...requestParameters, filters })
        }

        const response = await Paginator.paginate(api, search)

        return response.data
    }

    async createSchema(sourceId: string, schema: Schema) {
        const api = new SourcesApi(this.config)

        const requestParameters: SourcesApiCreateSourceSchemaRequest = {
            sourceId,
            schema,
        }
        const response = await api.createSourceSchema(requestParameters)
    }

    async getLatestAccountAggregation(sourceName: string): Promise<SearchDocument | undefined> {
        const api = new SearchApi(this.config)

        const search: Search = {
            indices: ['events'],
            query: {
                query: `operation:AGGREGATE AND status:PASSED AND objects:ACCOUNT AND target.name.exact:"${sourceName} [source]"`,
            },
            sort: ['-created'],
        }
        const response = await api.searchPost({ search, limit: 1 })

        return response.data.length === 0 ? undefined : response.data[0]
    }
}
