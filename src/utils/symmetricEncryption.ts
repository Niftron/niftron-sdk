// import nacl from "tweetnacl-zeemzo";
// import naclUtil from "tweetnacl-util";
// import { convertPublicKey, convertSecretKey } from "ed2curve";
// import { StrKey } from "stellar-base";
// import { Keypair } from "stellar-sdk";
import CryptoJS from "crypto-js";

export class SymmetricEncryption {
  public static decrypt = (secret: string, signer: string) => {
    try {
      const decrypted = CryptoJS.AES.decrypt(secret, signer);
      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      return plaintext;
    } catch (error) {
      throw error;
    }
  };
  public static encrypt = (secret: string, signer: string) => {
    try {
      const ciphertext = CryptoJS.AES.encrypt(secret, signer);
      return ciphertext.toString();
    } catch (error) {
      throw error;
    }
  };
}
