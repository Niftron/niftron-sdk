import {
  NiftronUserLambda,
  NiftronTokenLambda,
  NiftronDistributorPublicKey,
  StellarUrlTest,
  StellarUrl,
  PatternSK,
  PatternPK,
  NiftronAPI,
} from "../constants";
import { Server, Networks, Keypair, Transaction } from "stellar-sdk";
import axios from "axios";
import { XDRBuilderResponse, NiftronConfig } from "../models";
/**
 * Holds the functions to generate Niftron Specific XDR
 */
export module ContractBuilder {
  let merchantKeypair: Keypair;
  let projectPublicKey: string | undefined;
  let projectIssuerKey: string | undefined;

  /**
   * initialize
   * @param {NiftronConfig} niftronConfig NiftronConfig.
   */
  export const initialize = (niftronConfig: NiftronConfig) => {
    if (niftronConfig.secretKey == undefined) {
      throw new Error(
        "Please provide a secret key or .niftron credential file"
      );
    }
    if (!PatternSK.test(niftronConfig.secretKey)) {
      throw new Error("Invalid secret key");
    }
    if (niftronConfig.projectKey == undefined) {
      throw new Error("Please provide a project key");
    }
    if (!PatternPK.test(niftronConfig.projectKey)) {
      throw new Error("Invalid project key");
    }
    merchantKeypair = Keypair.fromSecret(niftronConfig.secretKey);
    projectPublicKey = niftronConfig.projectKey;
    projectIssuerKey = niftronConfig.projectIssuer;
  };

  /**
   * signXDR
   * @param {string} xdr string
   * @param {string} secretKey string
   * @returns {any} transactionResponse any
   */
  export async function signContract(
    xdr: string,
    secretKey: string
  ): Promise<any> {
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
  }

  /**
   * Build ERC20 Contract
   * @param {string} tokenName string
   * @param {string} tokenType string
   * @param {boolean} tradable boolean
   * @param {boolean} transferable boolean
   * @param {boolean} authorizable boolean
   * @param {string} creator string
   * @param {number} assetCount number
   * @param {string} dataHash string
   * @returns {any} builderResponse any
   */
  export async function ERC20(
    tokenName: string,
    tokenType: string,
    tradable: boolean,
    transferable: boolean,
    authorizable: boolean,
    creator: string,
    assetCount: number,
    dataHash: string
  ): Promise<any> {
    try {
      let postBody = {
        tokenName,
        tokenType,
        tradable,
        transferable,
        authorizable,
        primaryPublicKey: creator,
        merchantPublicKey: projectPublicKey
          ? projectPublicKey
          : merchantKeypair.publicKey(),
        assetCount: assetCount,
        dataHash: dataHash,
      };
      const res = await axios.post(
        NiftronAPI + "/contracts/ETHEREUM/erc20",
        postBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res === null) {
        throw Error("failed to build ERC20 contract");
      }
      const contract = res.data.data;
      const niftronId = res.data.metaData?.niftronId;
      const payment = res.data.metaData?.payment;

      return { contract, niftronId, payment };
    } catch (err) {
      throw err;
    }
  }

  /**
   * Build ERC721 Contract
   * @param {string} tokenName string
   * @param {string} tokenType string
   * @param {boolean} tradable boolean
   * @param {boolean} transferable boolean
   * @param {boolean} authorizable boolean
   * @param {string} creator string
   * @param {number} assetCount number
   * @param {string} dataHash string
   * @returns {any} builderResponse any
   */
  export async function ERC721(
    tokenName: string,
    tokenType: string,
    tradable: boolean,
    transferable: boolean,
    authorizable: boolean,
    creator: string,
    assetCount: number,
    dataHash: string
  ): Promise<any> {
    try {
      let postBody = {
        tokenName,
        tokenType,
        tradable,
        transferable,
        authorizable,
        primaryPublicKey: creator,
        merchantPublicKey: projectPublicKey
          ? projectPublicKey
          : merchantKeypair.publicKey(),
        assetCount: assetCount,
        dataHash: dataHash,
      };
      const res = await axios.post(
        NiftronAPI + "/contracts/ETHEREUM/erc721",
        postBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res === null) {
        throw Error("failed to build ERC20 contract");
      }
      const contract = res.data.data;
      const niftronId = res.data.metaData?.niftronId;
      const xdr = res.data.metaData?.niftronId;

      return { contract, niftronId };
    } catch (err) {
      throw err;
    }
  }

    /**
   * Build PayForToken
   * @param {string} tokenName string
   * @param {string} tokenType string
   * @param {boolean} tradable boolean
   * @param {boolean} transferable boolean
   * @param {boolean} authorizable boolean
   * @param {string} creator string
   * @param {number} assetCount number
   * @param {string} dataHash string
   * @returns {any} builderResponse any
   */
     export async function PayForToken(
      tokenName: string,
      tokenType: string,
      tradable: boolean,
      transferable: boolean,
      authorizable: boolean,
      creator: string,
      assetCount: number,
      dataHash: string
    ): Promise<any> {
      try {
        let postBody = {
          tokenName,
          tokenType,
          tradable,
          transferable,
          authorizable,
          primaryPublicKey: creator,
          merchantPublicKey: projectPublicKey
            ? projectPublicKey
            : merchantKeypair.publicKey(),
          assetCount: assetCount,
          dataHash: dataHash,
        };
        const res = await axios.post(
          NiftronAPI + "/xdrs/payForToken",
          postBody,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (res === null) {
          throw Error("failed to build Payment");
        }
        // const contract = res.data.data;
        const niftronId = res.data.data?.niftronId;
        const payment = res.data.data?.payment;
  
        return {  niftronId, payment };
      } catch (err) {
        throw err;
      }
    }
}
