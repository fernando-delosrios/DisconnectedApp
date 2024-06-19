import { Attributes, Key, StdEntitlementReadOutput } from '@sailpoint/connector-sdk'
import { EntitlementBeta } from 'sailpoint-api-client'

export class DisconnectedEntitlement implements StdEntitlementReadOutput {
    identity?: string | undefined
    uuid?: string | undefined
    key?: Key | undefined
    type: string
    attributes: Attributes

    constructor(entitlement: EntitlementBeta, type: string) {
        this.identity = entitlement.value
        this.uuid = entitlement.name
        this.type = type
        this.attributes = entitlement.attributes as Attributes
    }
}
