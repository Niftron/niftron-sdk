import {
  niftronUserLambda,
  niftronTokenLambda,
  NiftronDistributorPublicKey,
  StellarUrlTest,
  StellarUrl,
} from "../constants";
import { Server, Networks, Keypair, Transaction } from "stellar-sdk";
import axios from "axios";
import { XDRBuilderResponse } from "../models";
/**
 * Holds the functions to generate Niftron Specific XDR
 */
export module XDRBuilder {
  let merchantKeypair: Keypair;
  let projectPublicKey: string | undefined;

  /**
      * initialize
      * @param {string} secretKey string.
      * @param {string} projectKey string.
      */
  export const initialize = (secretKey: string, projectKey?: string) => {
    merchantKeypair = Keypair.fromSecret(secretKey);
    projectPublicKey = projectKey;
  };

  /**
 * signXDR
 * @param {string} xdr string
 * @param {string} secretKey string
 * @returns {any} transactionResponse any
 */
  export const signXDR = async (
    xdr: string,
    secretKey: string
  ): Promise<any> => {
    try {
      let parsedTx;
      let publicKey;
      let server = new Server(StellarUrl);
      let keypair = Keypair.fromSecret(secretKey);
      let sourceAccount;
      try {
        parsedTx = new Transaction(xdr, Networks.PUBLIC);
        publicKey = parsedTx.source;
        sourceAccount = await server.loadAccount(keypair.publicKey());
      } catch (err) {
        try {
          server = new Server(StellarUrlTest);
          parsedTx = new Transaction(xdr, Networks.TESTNET);
          publicKey = parsedTx.source;
          sourceAccount = await server.loadAccount(keypair.publicKey());
        } catch (err2) {
          throw err2;
        }
      }
      parsedTx.sign(keypair);
      let x = parsedTx.toEnvelope().toXDR().toString("base64");
      return x;
    } catch (err) {
      console.log(err);
      throw err;
    }
  };

  /**
 * Build Pledge XDR
 * @param {string} primaryPublicKey string
 * @returns {XDRBuilderResponse} builderResponse XDRBuilderResponse
 */
  export const pledge = async (primaryPublicKey: string, amount?: number): Promise<XDRBuilderResponse> => {
    try {
      let postBody = {
        primaryPublicKey,
        merchantPublicKey: merchantKeypair.publicKey(),
        amount
      };
      const res = await axios.post(
        niftronUserLambda + "/xdrBuilder/pledge",
        postBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res === null) {
        throw Error("failed to build pledge xdr");
      }
      const xdrs = res.data.data;
      return {
        xdrs
      };
    } catch (err) {
      throw err;
    }
  };

  /**
   * Build Add Niftron Signer XDR
   * @param {string} primaryPublicKey string
   * @returns {XDRBuilderResponse} builderResponse XDRBuilderResponse
   */
  export const register = async (primaryPublicKey: string): Promise<XDRBuilderResponse> => {
    try {
      let postBody = {
        primaryPublicKey,
        merchantPublicKey: projectPublicKey ? projectPublicKey : merchantKeypair.publicKey(),
      };
      const res = await axios.post(
        niftronUserLambda + "/xdrBuilder/register",
        postBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res === null) {
        throw Error("failed to build register xdr");
      }
      const xdrs = res.data.data;
      const secondaryPublicKey = res.data.metaData?.secondaryPublicKey;
      return {
        xdrs,
        secondaryPublicKey,
      };
    } catch (err) {
      throw err;
    }
  };


  /**
   * Build Mint Certificate XDR
   * @param {string} tokenName string
   * @param {string} tokenType string
   * @param {boolean} tradable boolean
   * @param {boolean} transferable boolean
   * @param {boolean} authorizable boolean
   * @param {string} creator string
   * @param {number} assetCount number
   * @param {string} dataHash string
   * @returns {XDRBuilderResponse} builderResponse XDRBuilderResponse
   */
  export const mintCertificate = async (
    tokenName: string,
    tokenType: string,
    tradable: boolean,
    transferable: boolean,
    authorizable: boolean,
    creator: string,
    assetCount: number,
    dataHash: string
  ): Promise<XDRBuilderResponse> => {
    try {
      let postBody = {
        tokenName,
        tokenType,
        tradable,
        transferable,
        authorizable,
        primaryPublicKey: creator,
        merchantPublicKey: projectPublicKey ? projectPublicKey : merchantKeypair.publicKey(),
        assetCount: assetCount,
        dataHash: dataHash,
      };
      const res = await axios.post(
        niftronTokenLambda + "/xdrBuilder/mint/certificate",
        postBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res === null) {
        throw Error("failed to build mint certificate xdr");
      }
      const xdrs = res.data.data;
      const niftronId = res.data.metaData?.niftronId;
      return { xdrs, niftronId };
    } catch (err) {
      throw err;
    }
  };
  /**
   * Build Transfer Certificate XDR
   * @param {string} sender string
   * @param {string} receiver string
   * @param {string} assetIssuer string
   * @param {string} assetCode string
   * @param {string} assetCount string
   * @param {Array<string>} approvers Array<string>
   * @param {Date} minTime Date
   * @param {Date} maxTime Date
   * @returns {TransferCertificateXDR} transferCertificateXDR TransferCertificateXDR
   */
  export const transferCertificate = async (
    sender: string,
    receiver: string,
    assetIssuer: string,
    assetCode: string,
    assetCount: string,
    approvers: Array<string>,
    minTime: Date,
    maxTime: Date
  ): Promise<any> => {
    try {
      let postBody = {
        sender,
        receiver,
        merchant: projectPublicKey ? projectPublicKey : merchantKeypair.publicKey(),
        assetIssuer,
        assetCode,
        assetCount,
        approvers,
        minTime,
        maxTime,
      };
      const res = await axios.post(
        niftronTokenLambda + "/xdrBuilder/transfer/certificate",
        postBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res === null) {
        throw Error("failed to build transfer certificate xdr");
      }
      const xdrs = res.data.data;
      // const secondaryPublicKey = res.data.metaData?.secondaryPublicKey
      return {
        xdrs, //, secondaryPublicKey
      };
    } catch (err) {
      throw err;
    }
  };


  /**
 * Build Mint Badge XDR
 * @param {string} tokenName string
 * @param {string} tokenType string
 * @param {boolean} tradable boolean
 * @param {boolean} transferable boolean
 * @param {boolean} authorizable boolean
 * @param {string} creator string
 * @param {number} assetCount number
 * @param {string} dataHash string
 * @returns {XDRBuilderResponse} builderResponse XDRBuilderResponse
 */
  export const mintBadge = async (
    tokenName: string,
    tokenType: string,
    tradable: boolean,
    transferable: boolean,
    authorizable: boolean,
    creator: string,
    assetCount: number,
    dataHash: string
  ): Promise<XDRBuilderResponse> => {
    try {
      let postBody = {
        tokenName,
        tokenType,
        tradable,
        transferable,
        authorizable,
        primaryPublicKey: creator,
        merchantPublicKey: projectPublicKey ? projectPublicKey : merchantKeypair.publicKey(),
        assetCount: assetCount,
        dataHash: dataHash,
      };
      const res = await axios.post(
        niftronTokenLambda + "/xdrBuilder/mint/badge",
        postBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res === null) {
        throw Error("failed to build mint badge xdr");
      }
      const xdrs = res.data.data;
      const niftronId = res.data.metaData?.niftronId;
      return { xdrs, niftronId };
    } catch (err) {
      throw err;
    }
  };
  /**
   * Build Transfer Badge XDR
   * @param {string} sender string
   * @param {string} receiver string
   * @param {string} assetIssuer string
   * @param {string} assetCode string
   * @param {string} assetCount string
   * @param {Array<string>} approvers Array<string>
   * @param {Date} minTime Date
   * @param {Date} maxTime Date
   * @returns {TransferCertificateXDR} transferCertificateXDR TransferCertificateXDR
   */
  export const transferBadge = async (
    sender: string,
    receiver: string,
    assetIssuer: string,
    assetCode: string,
    assetCount: string,
    approvers: Array<string>,
    minTime: Date,
    maxTime: Date
  ): Promise<any> => {
    try {
      let postBody = {
        sender,
        receiver,
        merchant: projectPublicKey ? projectPublicKey : merchantKeypair.publicKey(),
        assetIssuer,
        assetCode,
        assetCount,
        approvers,
        minTime,
        maxTime,
      };
      const res = await axios.post(
        niftronTokenLambda + "/xdrBuilder/transfer/badge",
        postBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res === null) {
        throw Error("failed to build transfer badge xdr");
      }
      const xdrs = res.data.data;
      // const secondaryPublicKey = res.data.metaData?.secondaryPublicKey
      return {
        xdrs, //, secondaryPublicKey
      };
    } catch (err) {
      throw err;
    }
  };

  /**
   * Build Mint GiftCard XDR
   * @param {string} tokenName string
   * @param {string} tokenType string
   * @param {boolean} tradable boolean
   * @param {boolean} transferable boolean
   * @param {boolean} authorizable boolean
   * @param {string} creator string
   * @param {number} assetCount number
   * @param {string} dataHash string
   * @returns {XDRBuilderResponse} builderResponse XDRBuilderResponse
   */
  export const mintGiftCard = async (
    tokenName: string,
    tokenType: string,
    tradable: boolean,
    transferable: boolean,
    authorizable: boolean,
    creator: string,
    assetCount: number,
    dataHash: string
  ): Promise<XDRBuilderResponse> => {
    try {
      let postBody = {
        tokenName,
        tokenType,
        tradable,
        transferable,
        authorizable,
        primaryPublicKey: creator,
        merchantPublicKey: projectPublicKey ? projectPublicKey : merchantKeypair.publicKey(),
        assetCount: assetCount,
        dataHash: dataHash,
      };
      const res = await axios.post(
        niftronTokenLambda + "/xdrBuilder/mint/giftcard",
        postBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res === null) {
        throw Error("failed to build mint badge xdr");
      }
      const xdrs = res.data.data;
      const niftronId = res.data.metaData?.niftronId;
      return { xdrs, niftronId };
    } catch (err) {
      throw err;
    }
  };
  /**
   * Build Transfer GiftCard XDR
   * @param {string} sender string
   * @param {string} receiver string
   * @param {string} assetIssuer string
   * @param {string} assetCode string
   * @param {string} assetCount string
   * @param {Array<string>} approvers Array<string>
   * @param {Date} minTime Date
   * @param {Date} maxTime Date
   * @returns {TransferCertificateXDR} transferCertificateXDR TransferCertificateXDR
   */
  export const transferGiftCard = async (
    sender: string,
    receiver: string,
    assetIssuer: string,
    assetCode: string,
    assetCount: string,
    approvers: Array<string>,
    minTime: Date,
    maxTime: Date
  ): Promise<any> => {
    try {
      let postBody = {
        sender,
        receiver,
        merchant: projectPublicKey ? projectPublicKey : merchantKeypair.publicKey(),
        assetIssuer,
        assetCode,
        assetCount,
        approvers,
        minTime,
        maxTime,
      };
      const res = await axios.post(
        niftronTokenLambda + "/xdrBuilder/transfer/giftcard",
        postBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res === null) {
        throw Error("failed to build transfer badge xdr");
      }
      const xdrs = res.data.data;
      // const secondaryPublicKey = res.data.metaData?.secondaryPublicKey
      return {
        xdrs, //, secondaryPublicKey
      };
    } catch (err) {
      throw err;
    }
  };


  /**
 * Build Go Live XDR
 * @param {string} userPublicKey string
 * @param {string} merchantPublicKey string
 * @returns {string} activateXdr string
 */
  export const goLive = async (
    userPublicKey: string,
    merchantPublicKey: string
  ): Promise<string> => {
    try {
      let postBody = {
        userPublicKey,
        merchantPublicKey
      };
      const res = await axios.post(
        niftronUserLambda + "/xdrBuilder/goLive",
        postBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res === null) {
        throw Error("Failed to build go live xdr");
      }
      switch (res.data.code) {
        case 201:
          throw new Error("Merchant not found");
        case 202:
          throw new Error("Activate merchant account first");
        case 203:
          throw new Error("User account not found");
        case 204:
          throw new Error("User account is already live");
        case 400:
          throw new Error("Failed to build go live xdr");
      }

      const xdr = res.data.data;
      return xdr;
    } catch (err) {
      throw err;
    }
  };

  /**
* Build Activate XDR
* @param {string} userPublicKey string
* @param {string} merchantPublicKey string
* @returns {string} activateXdr string
*/
  export const activate = async (
    userPublicKey: string,
    merchantPublicKey: string
  ): Promise<string> => {
    try {
      let postBody = {
        userPublicKey,
        merchantPublicKey
      };
      const res = await axios.post(
        niftronUserLambda + "/xdrBuilder/activate",
        postBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res === null) {
        throw Error("failed to build activate xdr");
      }

      switch (res.data.code) {
        case 201:
          throw new Error("Merchant not found");
        case 202:
          throw new Error("Activate merchant account first");
        case 203:
          throw new Error("User account not found");
        case 204:
          throw new Error("User account is not live");
        case 400:
          throw new Error("Failed to build activate xdr");
      }

      const xdr = res.data.data;
      return xdr;
    } catch (err) {
      throw err;
    }
  };


  /**
 * Build Express Transfer XDR
 * @param {string} sender string
 * @param {string} receiver string
 * @param {string} assetIssuer string
 * @param {string} assetCode string
 * @param {string} assetCount string
 * @returns {Object<Array<XDR>>} xdrs Object<Array<XDR>>
 */
  export const expressTransfer = async (
    sender: string,
    receiver: string,
    assetIssuer: string,
    assetCode: string,
    assetCount: number,
  ): Promise<any> => {
    try {
      let postBody = {
        sender,
        receiver,
        merchant: projectPublicKey ? projectPublicKey : merchantKeypair.publicKey(),
        assetIssuer,
        assetCode,
        assetCount
      };
      const res = await axios.post(
        niftronTokenLambda + "/xdrBuilder/expressTransfer/token",
        postBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res === null) {
        throw Error("failed to build express transfer xdr");
      }
      const xdrs = res.data.data;
      // const secondaryPublicKey = res.data.metaData?.secondaryPublicKey
      return {
        xdrs, //, secondaryPublicKey
      };
    } catch (err) {
      throw err;
    }
  };


  /**
* Build Trust XDR
* @param {string} truster string
* @param {string} assetIssuer string
* @param {string} assetCode string
* @returns {Object<Array<XDR>>} xdrs Object<Array<XDR>>
*/
  export const trust = async (
    truster: string,
    assetIssuer: string,
    assetCode: string,
  ): Promise<any> => {
    try {
      let postBody = {
        truster,
        merchant: projectPublicKey ? projectPublicKey : merchantKeypair.publicKey(),
        assetIssuer,
        assetCode
      };
      const res = await axios.post(
        niftronTokenLambda + "/xdrBuilder/trust",
        postBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res === null) {
        throw Error("failed to build trust xdr");
      }
      const xdrs = res.data.data;
      // const secondaryPublicKey = res.data.metaData?.secondaryPublicKey
      return {
        xdrs, //, secondaryPublicKey
      };
    } catch (err) {
      throw err;
    }
  };
}
