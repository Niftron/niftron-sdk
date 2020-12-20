import nacl from "tweetnacl-zeemzo";
import naclUtil from "tweetnacl-util";
import { convertPublicKey, convertSecretKey } from "ed2curve";
import { StrKey } from "stellar-base";
import { Keypair } from "stellar-sdk";
import { AsymEncryptedObject } from "../models/utilModels";

/**
 * Asymmetric Encryption
 */
export class AsymmetricEncryption {
  private NaclKeyPairFromStellarSecret = (
    secretKeyInput: string
  ): {
    secretKey: string;
    publicKey: string;
  } => {
    const secretKey: Uint8Array = StrKey.decodeEd25519SecretSeed(
      secretKeyInput
    );
    const keyPair = nacl.sign.keyPair.fromSecretKey(secretKey);
    return {
      secretKey: naclUtil.encodeBase64(keyPair.secretKey),
      publicKey: naclUtil.encodeBase64(keyPair.publicKey),
    };
  };

  private NaclSecretKeyFromStellarSecret = (
    secretKeyInput: string
  ): string => {
    const secretKey: Uint8Array = StrKey.decodeEd25519SecretSeed(
      secretKeyInput
    );
    return naclUtil.encodeBase64(secretKey);
  };

  private NaclPublicKeyFromStellarPublic = (
    publicKeyInput: string
  ): string => {
    const publicKey: Uint8Array = StrKey.decodeEd25519PublicKey(publicKeyInput);
    return naclUtil.encodeBase64(publicKey);
  };

  private StellarKeyPairFromNaclSecret = (
    secretKeyInput: string
  ): Keypair => {
    const some: Buffer = Buffer.from(naclUtil.decodeBase64(secretKeyInput));
    return Keypair.fromSecret(StrKey.encodeEd25519SecretSeed(some));
  };

  private StellarSecretKeyFromNaclSecret = (
    secretKeyInput: string
  ): string => {
    const some: Buffer = Buffer.from(naclUtil.decodeBase64(secretKeyInput));
    return StrKey.encodeEd25519SecretSeed(some);
  };

  private StellarPublicKeyFromNaclPublic = (
    publicKeyInput: string
  ): string => {
    const some: Buffer = Buffer.from(naclUtil.decodeBase64(publicKeyInput));
    return StrKey.encodeEd25519PublicKey(some);
  };


  private Encrypt = (
    dataValue: string,
    theirPublicKeyValue: string,
    mySecretKeyValue: string
  ) => {
    try {
      let data = naclUtil.decodeUTF8(dataValue);
      const theirPublicKey = convertPublicKey(
        naclUtil.decodeBase64(theirPublicKeyValue)
      );
      const mySecretKey = convertSecretKey(
        naclUtil.decodeBase64(mySecretKeyValue)
      );
      const nonce = nacl.randomBytes(nacl.box.nonceLength);
      if (theirPublicKey == null) {
        return {
          data: naclUtil.encodeBase64(data),
          nonce: naclUtil.encodeBase64(nonce),
        };
      }
      data = nacl.box(data, nonce, theirPublicKey, mySecretKey);
      return {
        data: naclUtil.encodeBase64(data),
        nonce: naclUtil.encodeBase64(nonce),
      };
    } catch (err) {
      console.log(err);
      throw new Error(err);
    }
  };


  private Decrypt = (
    dataValue: string,
    nonceValue: string,
    theirPublicKeyValue: string,
    mySecretKeyValue: string
  ) => {
    try {
      let data: Uint8Array = naclUtil.decodeBase64(dataValue);
      const nonce = naclUtil.decodeBase64(nonceValue);
      const theirPublicKey = convertPublicKey(
        naclUtil.decodeBase64(theirPublicKeyValue)
      );
      const mySecretKey = convertSecretKey(
        naclUtil.decodeBase64(mySecretKeyValue)
      );
      if (theirPublicKey == null) {
        return null;
      }
      const decryptedData = nacl.box.open(
        data,
        nonce,
        theirPublicKey,
        mySecretKey
      );
      if (decryptedData == null) {
        throw new Error("failed opening nacl.box");
      }
      return naclUtil.encodeUTF8(decryptedData);
    } catch (err) {
      console.log(err);
      throw new Error(err);
    }
  };

  /**
   * encrypt
   * @param {string} dataString
   * @param {string} receiverPublicKey
   * @param {string} senderSecretKey
   * @returns {AsymEncryptedObject}
   */
  public encrypt = (
    dataString: string,
    receiverPublicKey: string,
    senderSecretKey: string
  ): AsymEncryptedObject => {
    try {
      const senderSecret = this.NaclSecretKeyFromStellarSecret(senderSecretKey)
      const receiverPublic = this.NaclPublicKeyFromStellarPublic(receiverPublicKey)
      let res = this.Encrypt(dataString, receiverPublic, senderSecret)

      const response: AsymEncryptedObject = {
        nonce: res.nonce,
        encryptedData: res.data,
        receiverPublicKey: receiverPublicKey,
        senderPublicKey: Keypair.fromSecret(senderSecretKey).publicKey(),
      }

      return response
    } catch (err) {
      console.log(err);
      throw new Error(err);
    }
  }


  /**
   * decrypt
   * @param {AsymEncryptedObject} asymEncryptedObject
   * @param {string} receiverSecretKey
   * @returns {string|null}
   */
  public decrypt = (
    asymEncryptedObject: AsymEncryptedObject,
    receiverSecretKey: string
  ): string | null => {
    try {
      const senderPublic = this.NaclSecretKeyFromStellarSecret(asymEncryptedObject.senderPublicKey)
      const receiverSecret = this.NaclPublicKeyFromStellarPublic(receiverSecretKey)
      const response = this.Decrypt(
        asymEncryptedObject.encryptedData,
        asymEncryptedObject.nonce,
        senderPublic, receiverSecret
      )
      return response
    } catch (err) {
      console.log(err);
      throw new Error(err);
    }
  };
}
