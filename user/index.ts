import sha256 from "sha256";
import axios from "axios";
import {
  UserType,
  UserAuthType,
  HighPrivacyUserCreation,
  HighPrivacyAccountResponse,
  LowPrivacyUserCreation,
  LowPrivacyAccountResponse,
  MediumPrivacyAccountResponse,
  MediumPrivacyUserCreation,
  XDR,
} from "../models";
import { niftronUserLambda } from "../constants";
import { Keypair } from "stellar-sdk";
import { Utils } from "../utils";
import { XDRBuilder } from "../xdrBuilder";
/**
 * User Class
 */
export module User {
  let secretKey: string = "";
  /**
   * register niftron user
   * @param {UserType} type UserType.
   * @param {string} alias string.
   * @param {string} email string.
   * @param {string} password string.
   * @param {string} recoveryQuestion string.
   * @param {string} securityAnswer string.
   * @param {Keypair} keypair Keypair.
   * @param {UserAuthType} authType UserAuthType.
   * @returns {string} niftronId string
   */
  const register = async (
    type: UserType,
    alias: string,
    email: string,
    password: string,
    recoveryQuestion: string,
    securityAnswer: string,
    keypair: Keypair,
    authType: UserAuthType
  ): Promise<number | null> => {
    try {
      let publicKey = keypair.publicKey();

      let pash = "";
      let encryptedSecret = "";
      let encryptedRecoverySecret = "";

      if (password != "") {
        pash = sha256(password);
        encryptedSecret = Utils.encryptSecret(keypair.secret(), pash);
      }

      if (securityAnswer != "") {
        encryptedRecoverySecret = Utils.encryptSecret(
          keypair.secret(),
          sha256(securityAnswer.toLowerCase())
        );
      }

      let { xdrs, secondaryPublicKey } = await XDRBuilder.register(
        keypair.publicKey()
      );

      await Promise.all(
        xdrs.map(async (item: XDR, index: number, array: Array<XDR>) => {
          xdrs[index].xdr = await XDRBuilder.signXDR(item.xdr, keypair.secret());
        })
      );

      let accounts = [];
      accounts.push({ publicKey: keypair.publicKey(), accountType: "0" });
      accounts.push({ publicKey: secondaryPublicKey, accountType: "1" });

      let postBody = {
        type: type,
        alias: alias.toLowerCase(),
        email: email != "" ? email.toLowerCase() : "",
        publicKey: publicKey,
        encryptedSecret: encryptedSecret,
        encryptedRecoverySecret: encryptedRecoverySecret,
        recoveryQuestion: recoveryQuestion,
        authType: authType,
        accounts: accounts,
        xdrs,
      };
      const res = await axios.post(
        niftronUserLambda + "/users/register",
        postBody,
        {
          headers: {
            // 'Authorization': "bearer " + token,
            "Content-Type": "application/json",
          },
        }
      );

     
      if (res == null) {
        return null;
      }

      if (res.status != 200) {
        return res.status;
      }

      return res.status;

    } catch (err) {
      console.log("register: " + err);
      throw err;
    }
  };
  /**
   * Fund Account In Testnet
   * @param {string} publicKey string.
   * @returns {boolean} response boolean
   */
  const fundAccountInTestnet = async (publicKey: string): Promise<boolean> => {
    try {
      // if (StellarNetwork === "TestNet") {
      const STELLAT_FRIEND_BOT_URL = `https://friendbot.stellar.org/?addr=`;
      const stellarResponse = await axios.get(
        `${STELLAT_FRIEND_BOT_URL}${publicKey}`
      );

      if (stellarResponse !== null && stellarResponse.status !== 200) {
        throw new Error("test bot failed");
      }
      return true;
      // }
    } catch (err) {
      throw err;
    }
  };
  /**
   * Create High Privacy Niftron User
   * @param {HighPrivacyUserCreation} options HighPrivacyUserCreation.
   * @returns {HighPrivacyAccountResponse} result HighPrivacyAccountResponse
   */
  export const createHighPrivacyUser = async (
    options: HighPrivacyUserCreation
  ): Promise<HighPrivacyAccountResponse> => {
    try {
      let keypair = Keypair.random();
      let result: MediumPrivacyAccountResponse = {
        status: "Account created successfully",
      };
      const response = await register(
        options.type,
        options.alias,
        "",
        "",
        "",
        "",
        keypair,
        UserAuthType.HIGHPRIVACY
      );
      if (response === null) {
        throw new Error("Registration failed");
      }
      if (response === 202) {
        result.status = "Alias already used";
        return result;
      }
      secretKey = keypair.secret();
      result.publicKey = keypair.publicKey();
      result.secretKey = keypair.secret();
      return result;
    } catch (err) {
      throw err;
    }
  };
  /**
   * Create High Privacy Niftron User
   * @param {MediumPrivacyAccountCreation} options MediumPrivacyAccountCreation.
   * @returns {MediumPrivacyAccountResponse} result MediumPrivacyAccountResponse
   */
  export const createMediumPrivacyUser = async (
    options: MediumPrivacyUserCreation
  ): Promise<MediumPrivacyAccountResponse> => {
    try {
      let keypair = Keypair.random();
      let result: MediumPrivacyAccountResponse = {
        status: "Account created successfully",
      };

      const response = await register(
        options.type,
        options.alias,
        "",
        options.password,
        "",
        "",
        keypair,
        UserAuthType.MEDIUMPRIVACY
      );
      if (response === null) {
        throw new Error("Registration failed");
      }
      if (response === 202) {
        result.status = "Alias already used";
        return result;
      }
      if (response === 201) {
        result.status = "Email already used";
        return result;
      }
      secretKey = keypair.secret();
      result.publicKey = keypair.publicKey();
      result.secretKey = keypair.secret();
      return result;
    } catch (err) {
      throw err;
    }
  };
  /**
   * Create High Privacy Niftron User
   * @param {LowPrivacyUserCreation} options LowPrivacyUserCreation.
   * @returns {LowPrivacyAccountResponse} result LowPrivacyAccountResponse
   */
  export const createLowPrivacyUser = async (
    options: LowPrivacyUserCreation
  ): Promise<LowPrivacyAccountResponse> => {
    try {
      let keypair = Keypair.random();
      let result: LowPrivacyAccountResponse = {
        status: "Account created successfully",
      };
      const response = await register(
        options.type,
        options.alias,
        options.email,
        options.password,
        options.recoveryQuestion,
        options.securityAnswer,
        keypair,
        UserAuthType.LOWPRIVACY
      );
      if (response === null) {
        throw new Error("Registration failed");
      }
      if (response === 202) {
        result.status = "Alias already used";
        return result;
      }
      if (response === 201) {
        result.status = "Email already used";
        return result;
      }
      secretKey = keypair.secret();
      result.publicKey = keypair.publicKey();
      result.secretKey = keypair.secret();
      return result;
    } catch (err) {
      throw err;
    }
  };
  // /**
  //  * Download Credentials
  //  */
  // export const downloadCredentials = async () => {
  //   try {
  //     var FileSaver = require("file-saver");
  //     var blob = new Blob([btoa(JSON.stringify({ secretKey: secretKey }))], {
  //       type: "text/plain;charset=utf-8",
  //     });
  //     FileSaver.saveAs(blob, "credential.niftron");
  //   } catch (err) {
  //     throw err;
  //   }
  // };
  /**
   * Download Credentials
   */
  export const getCredentials = () => {
    try {
      return JSON.stringify({ secretKey: secretKey });
    } catch (err) {
      throw err;
    }
  };
}
