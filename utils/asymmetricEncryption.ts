import nacl from "tweetnacl-zeemzo";
import naclUtil from "tweetnacl-util";
import { convertPublicKey, convertSecretKey } from "ed2curve";
import { StrKey } from "stellar-base";
import { Keypair } from "stellar-sdk";

export class AsymmetricEncryption {
  public static NaclKeyPairFromStellarSecret = (
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

  public static NaclSecretKeyFromStellarSecret = (
    secretKeyInput: string
  ): string => {
    const secretKey: Uint8Array = StrKey.decodeEd25519SecretSeed(
      secretKeyInput
    );
    return naclUtil.encodeBase64(secretKey);
  };

  public static NaclPublicKeyFromStellarPublic = (
    publicKeyInput: string
  ): string => {
    const publicKey: Uint8Array = StrKey.decodeEd25519PublicKey(publicKeyInput);
    return naclUtil.encodeBase64(publicKey);
  };

  public static StellarKeyPairFromNaclSecret = (
    secretKeyInput: string
  ): Keypair => {
    const some: Buffer = Buffer.from(naclUtil.decodeBase64(secretKeyInput));
    return Keypair.fromSecret(StrKey.encodeEd25519SecretSeed(some));
  };

  public static StellarSecretKeyFromNaclSecret = (
    secretKeyInput: string
  ): string => {
    const some: Buffer = Buffer.from(naclUtil.decodeBase64(secretKeyInput));
    return StrKey.encodeEd25519SecretSeed(some);
  };

  public static StellarPublicKeyFromNaclPublic = (
    publicKeyInput: string
  ): string => {
    const some: Buffer = Buffer.from(naclUtil.decodeBase64(publicKeyInput));
    return StrKey.encodeEd25519PublicKey(some);
  };

  public static encrypt = (
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

  public static decrypt = (
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
}
