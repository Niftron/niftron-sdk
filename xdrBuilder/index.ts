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

  export const initialize = (secretKey: string) => {
    merchantKeypair = Keypair.fromSecret(secretKey);
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
        merchantPublicKey: merchantKeypair.publicKey(),
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
        merchantPublicKey: merchantKeypair.publicKey(),
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
        merchant: merchantKeypair.publicKey(),
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
}
