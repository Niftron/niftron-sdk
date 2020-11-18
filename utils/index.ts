import { AsymmetricEncryption } from "./asymmetricEncryption";
const CryptoJS = require("crypto-js");

/**
 * Utils Class
 */
export module Utils {
  export const decryptSecret = (secret: string, signer: string) => {
    try {
      const decrypted = CryptoJS.AES.decrypt(secret, signer);
      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      return plaintext;
    } catch (error) {
      throw error;
    }
  };
  export const encryptSecret = (secret: string, signer: string) => {
    try {
      const ciphertext = CryptoJS.AES.encrypt(secret, signer);
      return ciphertext.toString();
    } catch (error) {
      throw error;
    }
  };

  export const asymmetricEncryption = AsymmetricEncryption;

}

