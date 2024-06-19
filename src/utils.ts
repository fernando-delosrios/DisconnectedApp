import { AccountSchema, SchemaAttribute } from '@sailpoint/connector-sdk'
import { Account, Schema } from 'sailpoint-api-client'

export const cleanSchema = (schema: Schema): Schema => {
    const { name, nativeObjectType, displayAttribute, identityAttribute, attributes } = schema

    return { name, nativeObjectType, displayAttribute, identityAttribute, attributes }
}

export const attributeTransform = (sourceAttribute: any): SchemaAttribute => {
    const { name, type, schema, description, isMulti, isEntitlement, isGroup } = sourceAttribute
    const attribute: SchemaAttribute = {
        name,
        type: type.toLowerCase(),
        description,
        entitlement: isEntitlement,
        managed: isEntitlement,
        multi: isMulti,
    }

    return attribute
}

export const schemaTransform = (sourceSchema: any): AccountSchema => {
    const { identityAttribute, displayAttribute, groupAttribute, attributes } = sourceSchema

    const schema: AccountSchema = {
        identityAttribute: identityAttribute ? identityAttribute : '',
        displayAttribute: displayAttribute ? displayAttribute : '',
        groupAttribute: groupAttribute ? groupAttribute : '',
        attributes: attributes.map(attributeTransform),
    }

    return schema
}

export const getLastAggregationDate = (source: any): Date | undefined => {
    const timestamp = (source.connectorAttributes as any).lastAggregationDate_account as string
    if (timestamp) {
        const lastAggregationDate = new Date(timestamp)

        return lastAggregationDate
    }
}

export const isAttributeMulti = (name: string, schema: AccountSchema): boolean => {
    const attribute = schema.attributes?.find((x) => x.name === name)
    if (attribute) {
        return attribute.multi ? true : false
    } else {
        return false
    }
}
