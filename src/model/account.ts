import { Attributes, StdAccountReadOutput } from '@sailpoint/connector-sdk'
import { Account } from 'sailpoint-api-client/dist/v3'

export class DisconnectedAccount implements StdAccountReadOutput {
    identity: string
    uuid: string
    attributes: Attributes
    disabled: boolean
    locked?: boolean

    constructor(account: Account) {
        let disabled: boolean
        if (!account.disabled) {
            if (account.attributes!.IQDisabled) {
                disabled = true
            } else {
                disabled = false
            }
        } else {
            disabled = true
        }

        this.attributes = account.attributes as Attributes
        this.identity = account.nativeIdentity
        this.uuid = account.name
        this.locked = account.locked
        this.disabled = disabled
    }
}
