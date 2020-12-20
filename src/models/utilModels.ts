
/**
 * EncryptedObject
 */
export interface AsymEncryptedObject {
    encryptedData: string;
    nonce: string;
    senderPublicKey: string;
    receiverPublicKey: string;
}

