import sha256 from "sha256";
import {
  TokenType,
  NiftronId,
  Certificate,
  NiftronAccount,
  CreateCertificateModel,
  TokenCategory,
  CreateCertificateOptionsModel,
  TokenRealm,
  Badge,
  CreateBadgeModel,
  CreateBadgeOptionsModel,
  GiftCard,
  CreateGiftCardModel,
  CreateGiftCardOptionsModel,
  Transfer,
  NiftronKeypair,
} from "../models";
import { IpfsService } from "../ipfsService";
import { XDRBuilder } from "../xdrBuilder";
import {
  Server,
  Keypair,
  Transaction,
  Networks,
  AccountResponse,
} from "stellar-sdk";
import { getAccountById, addCertificate, addBadge, addGiftCard, expressTransfer, trust } from "../api";
import Web3 from 'web3';
/**
 * TokenBuilder Class
 * @param {string} secretKey string.
 * @param {NiftronCredential} credential NiftronCredential.
 */
export module TokenBuilder {
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
   * Creates a new Certificate Token
   * @param {CreateCertificateModel} createCertificateModel CreateCertificateModel
   * @param {CreateCertificateOptionsModel} options CreateCertificateOptionsModel
   * @returns {string} niftronId string
   */
  export const createCertificate = async (
    createCertificateModel: CreateCertificateModel,
    options?: CreateCertificateOptionsModel
  ): Promise<Certificate> => {
    try {
      let tradable: boolean = false;
      let transferable: boolean = false;
      let authorizable: boolean = false;
      let encryptData: boolean = false;
      let tokenCost: number = createCertificateModel.tokenCost
        ? createCertificateModel.tokenCost
        : 0;

      if (options) {
        tradable = options.tradable ? options.tradable : tradable;
        transferable = options.transferable
          ? options.transferable
          : transferable;
        authorizable = options.authorizable
          ? options.authorizable
          : authorizable;
        encryptData = options.encryptData ? options.encryptData : encryptData;
      }

      let creatorKeypair: Keypair = createCertificateModel.creatorKeypair != undefined ? createCertificateModel.creatorKeypair : merchantKeypair

      if (createCertificateModel.creatorPublicKey != undefined && createCertificateModel.creatorPublicKey != merchantKeypair.publicKey()) {
        const secretKey = await approvalPopUp(createCertificateModel.test != undefined ? createCertificateModel.test : false)
        if (secretKey == null) {
          throw new Error("Creator account did not approve the transaction");
        }
        creatorKeypair = Keypair.fromSecret(secretKey)
      }

      const user: NiftronAccount = await getAccountById(
        creatorKeypair.publicKey()
      );

      if (user == null) {
        throw new Error("Creator account not found in niftron");
      }

      let IssuerPublicKey = user.publicKey;
      let IssuerAlias = user.alias;

      user.accounts.forEach((account) => {
        if (!tradable && account.accountType == "1") {
          IssuerPublicKey = account.publicKey;
        }
        if (tradable && account.accountType == "0") {
          IssuerPublicKey = account.publicKey;
        }
      });


      let previewUrl = createCertificateModel.previewImageBase64 != undefined ?
        createCertificateModel.previewImageBase64 : createCertificateModel.previewImageUrl;

      const { ipfsHash, data } = await IpfsService.AddToIPFS(
        createCertificateModel.tokenData,
        encryptData ? creatorKeypair.secret() : undefined
      );
      const { xdrs, niftronId } = await XDRBuilder.mintCertificate(
        createCertificateModel.tokenName,
        createCertificateModel.tokenType,
        tradable,
        transferable,
        authorizable,
        creatorKeypair.publicKey(),
        createCertificateModel.tokenCount,
        sha256(createCertificateModel.tokenData)
      );

      let xdr;
      if (xdrs != null && xdrs.length > 0) {
        await Promise.all(
          xdrs.map(async (item: any, index: number) => {
            xdrs[index].xdr = await XDRBuilder.signXDR(item.xdr, creatorKeypair.secret());
            if (creatorKeypair.publicKey() !== merchantKeypair.publicKey()) {
              xdrs[index].xdr = await XDRBuilder.signXDR(xdrs[index].xdr, merchantKeypair.secret());
            }
          })
        );
        xdr = xdrs[0]?.xdr
      }

      const certificate: Certificate = {
        tokenName: createCertificateModel.tokenName,
        tokenType: createCertificateModel.tokenType,
        assetRealm: TokenRealm.DIGITAL,
        tradable,
        transferable,
        category: TokenCategory.CERTIFICATE,
        assetCode: niftronId,
        assetIssuer: IssuerPublicKey,
        issuerAlias: IssuerAlias,
        assetCount: createCertificateModel.tokenCount,
        previewUrl,
        isUrl: createCertificateModel.previewImageBase64 == undefined ? true : false,
        ipfsHash,
        price: tokenCost,
        xdr,
      };
      const serverRes = await addCertificate(certificate);
      if (serverRes == null) {
        throw new Error("Failed to submit certificate to NIFTRON");
      }
      switch (serverRes) {
        case 200:
          return certificate;
        case 201:
          throw new Error("Token Name is already taken");
        case 202:
          throw new Error("Insufficient fund in account");
        case 203:
          throw new Error("Only creators can create Tradable Tokens");
        case 204:
          throw new Error("Token name already used by issuer");
        case 400:
          throw new Error("Failed to submit certificate to NIFTRON");
        default:
          throw new Error("Failed to submit certificate to NIFTRON");
      }
    } catch (err) {
      console.log("Certificate minting error" + err);
      throw err;
    }
  };
  /**
 * Creates a new Badge Token
 * @param {CreateBadgeModel} createBadgeModel CreateBadgeModel
 * @param {CreateBadgeOptionsModel} options CreateBadgeOptionsModel
 * @returns {string} niftronId string
 */
  export const createBadge = async (
    createBadgeModel: CreateBadgeModel,
    options?: CreateBadgeOptionsModel
  ): Promise<Badge | null> => {
    try {
      let tradable: boolean = false;
      let transferable: boolean = false;
      let authorizable: boolean = false;
      let encryptData: boolean = false;
      let tokenCost: number = createBadgeModel.tokenCost
        ? createBadgeModel.tokenCost
        : 0;

      if (options) {
        tradable = options.tradable ? options.tradable : tradable;
        transferable = options.transferable
          ? options.transferable
          : transferable;
        authorizable = options.authorizable
          ? options.authorizable
          : authorizable;
        encryptData = options.encryptData ? options.encryptData : encryptData;
      }

      let creatorKeypair: NiftronKeypair = createBadgeModel.creatorKeypair != undefined ? createBadgeModel.creatorKeypair : merchantKeypair

      if (createBadgeModel.creatorPublicKey != undefined && createBadgeModel.creatorPublicKey != merchantKeypair.publicKey()) {
        const secretKey = await approvalPopUp(createBadgeModel.test != undefined ? createBadgeModel.test : false)
        if (secretKey == null) {
          throw new Error("Creator account did not approve the transaction");
        }
        creatorKeypair = Keypair.fromSecret(secretKey)
      }

      const user: NiftronAccount = await getAccountById(
        creatorKeypair.publicKey()
      );
      if (user == null) {
        throw new Error("Creator account not found in niftron");
      }

      let IssuerPublicKey = user.publicKey;
      let IssuerAlias = user.alias;

      user.accounts.forEach((account) => {
        if (!tradable && account.accountType == "1") {
          IssuerPublicKey = account.publicKey;
        }
        if (tradable && account.accountType == "0") {
          IssuerPublicKey = account.publicKey;
        }
      });

      let previewUrl = createBadgeModel.previewImageBase64 != undefined ?
        createBadgeModel.previewImageBase64 : createBadgeModel.previewImageUrl;

      // const { ipfsHash, data } = await IpfsService.AddToIPFS(
      //   createBadgeModel.tokenData,
      //   encryptData ? creatorKeypair.secret() : undefined
      // );

      const { xdrs, niftronId } = await XDRBuilder.mintBadge(
        createBadgeModel.tokenName,
        createBadgeModel.tokenType,
        tradable,
        transferable,
        authorizable,
        creatorKeypair.publicKey(),
        createBadgeModel.tokenCount,
        sha256(createBadgeModel.tokenData)
      );
      let xdr;
      if (xdrs != null && xdrs.length > 0) {
        await Promise.all(
          xdrs.map(async (item: any, index: number) => {
            xdrs[index].xdr = await XDRBuilder.signXDR(item.xdr, creatorKeypair.secret());
            if (creatorKeypair.publicKey() !== merchantKeypair.publicKey()) {
              xdrs[index].xdr = await XDRBuilder.signXDR(xdrs[index].xdr, merchantKeypair.secret());
            }
          })
        );
        xdr = xdrs[0]?.xdr
      }

      const badge: Badge = {
        tokenName: createBadgeModel.tokenName,
        tokenType: createBadgeModel.tokenType,
        assetRealm: TokenRealm.DIGITAL,
        tradable,
        transferable,
        category: TokenCategory.BADGE,
        assetCode: niftronId,
        assetIssuer: IssuerPublicKey,
        issuerAlias: IssuerAlias,
        assetCount: createBadgeModel.tokenCount,
        previewUrl,
        isUrl: createBadgeModel.previewImageBase64 == undefined ? true : false,
        ipfsHash: "ipfsHash",
        price: tokenCost,
        xdr,
      };

      console.log("OK so far 5")

      const serverRes = await addBadge(badge);
      if (serverRes == null) {
        throw new Error("Failed to submit certificate to NIFTRON");
      }
      switch (serverRes) {
        case 200:
          return badge;
        case 201:
          throw new Error("Token Name is already taken");
        case 202:
          throw new Error("Insufficient fund in account");
        case 203:
          throw new Error("Only creators can create Tradable Tokens");
        case 204:
          throw new Error("Token name already used by issuer");
        case 400:
          throw new Error("Failed to submit certificate to NIFTRON");
        default:
          throw new Error("Failed to submit certificate to NIFTRON");
      }


    } catch (err) {
      console.log("Badge minting error" + err);
      throw err;
    }
  };
  /**
* Creates a new GiftCard Token
* @param {CreateGiftCardModel} createGiftCardModel CreateGiftCardModel
* @param {CreateGiftCardOptionsModel} options CreateGiftCardOptionsModel
* @returns { Promise<GiftCard>}  giftCard  Promise<GiftCard>
*/
  export const createGiftCard = async (
    createGiftCardModel: CreateGiftCardModel,
    options?: CreateGiftCardOptionsModel
  ): Promise<GiftCard> => {
    try {
      let tradable: boolean = false;
      let transferable: boolean = false;
      let authorizable: boolean = false;
      let encryptData: boolean = false;
      let tokenCost: number = createGiftCardModel.tokenCost
        ? createGiftCardModel.tokenCost
        : 0;

      if (options) {
        tradable = options.tradable ? options.tradable : tradable;
        transferable = options.transferable
          ? options.transferable
          : transferable;
        authorizable = options.authorizable
          ? options.authorizable
          : authorizable;
        encryptData = options.encryptData ? options.encryptData : encryptData;
      }

      let creatorKeypair: NiftronKeypair = createGiftCardModel.creatorKeypair != undefined ? createGiftCardModel.creatorKeypair : merchantKeypair

      if (createGiftCardModel.creatorPublicKey != undefined && createGiftCardModel.creatorPublicKey != merchantKeypair.publicKey()) {
        const secretKey = await approvalPopUp(createGiftCardModel.test != undefined ? createGiftCardModel.test : false)
        if (secretKey == null) {
          throw new Error("Creator account did not approve the transaction");
        }
        creatorKeypair = Keypair.fromSecret(secretKey)
      }

      const user: NiftronAccount = await getAccountById(
        creatorKeypair.publicKey()
      );

      if (user == null) {
        throw new Error("Creator account not found in niftron");
      }

      let IssuerPublicKey = user.publicKey;
      let IssuerAlias = user.alias;

      user.accounts.forEach((account) => {
        if (!tradable && account.accountType == "1") {
          IssuerPublicKey = account.publicKey;
        }
        if (tradable && account.accountType == "0") {
          IssuerPublicKey = account.publicKey;
        }
      });

      let previewUrl = createGiftCardModel.previewImageBase64 != undefined ?
        createGiftCardModel.previewImageBase64 : createGiftCardModel.previewImageUrl;

      const { ipfsHash, data } = await IpfsService.AddToIPFS(
        createGiftCardModel.tokenData,
        encryptData ? creatorKeypair.secret() : undefined
      );

      const { xdrs, niftronId } = await XDRBuilder.mintGiftCard(
        createGiftCardModel.tokenName,
        createGiftCardModel.tokenType,
        tradable,
        transferable,
        authorizable,
        creatorKeypair.publicKey(),
        createGiftCardModel.tokenCount,
        sha256(data)
      );
      let xdr;
      if (xdrs != null && xdrs.length > 0) {
        await Promise.all(
          xdrs.map(async (item, index, array) => {
            xdrs[index].xdr = await XDRBuilder.signXDR(
              item.xdr,
              creatorKeypair.secret()
            );
          })
        );
        xdr = xdrs[0]?.xdr;
      }

      const giftCard: GiftCard = {
        tokenName: createGiftCardModel.tokenName,
        tokenType: createGiftCardModel.tokenType,
        assetRealm: TokenRealm.DIGITAL,
        tradable,
        transferable,
        category: TokenCategory.GIFTCARD,
        assetCode: niftronId,
        assetIssuer: IssuerPublicKey,
        issuerAlias: IssuerAlias,
        isUrl: createGiftCardModel.previewImageBase64 == undefined ? true : false,
        assetCount: createGiftCardModel.tokenCount,
        previewUrl,
        ipfsHash,
        price: tokenCost,
        xdr,
      };
      const serverRes = await addGiftCard(giftCard);
      if (serverRes == null) {
        throw new Error("Failed to submit giftcard to NIFTRON");
      }
      switch (serverRes) {
        case 200:
          return giftCard;
        case 201:
          throw new Error("Token Name is already taken");
        case 202:
          throw new Error("Insufficient fund in account");
        case 203:
          throw new Error("Only creators can create Tradable Tokens");
        case 204:
          throw new Error("Token name already used by issuer");
        case 400:
          throw new Error("Failed to submit giftcard to NIFTRON");
        default:
          throw new Error("Failed to submit giftcard to NIFTRON");
      }
    } catch (err) {
      console.log("Giftcard minting error" + err);
      throw err;
    }
  };


  /**
   * Express Transfer Token 
   * @param {string} receiverPublicKey string.
   * @param {string} NiftronId string.
   * @param {string} assetIssuer string.
   * @param {number} assetCount number.
   * @param {string} senderPublickey string.
   * @param {string} senderSecretKey string.
   * @param {boolean} test boolean.
   * @returns {string} niftronId string
   */
  export const expressTransferToken = async (
    receiverPublicKey: string,
    NiftronId: string,
    assetIssuer: string,
    assetCount: number,
    senderPublickey: string,
    senderSecretKey?: string,
    test?: boolean
  ): Promise<Transfer> => {
    try {

      let senderKeypair: NiftronKeypair = senderSecretKey != undefined ? Keypair.fromSecret(senderSecretKey) : merchantKeypair

      if (senderPublickey != undefined && senderPublickey != merchantKeypair.publicKey()) {
        const secretKey = await approvalPopUp(test != undefined ? test : false)
        if (secretKey == null) {
          throw new Error("Sender account did not approve the transaction");
        }
        senderKeypair = Keypair.fromSecret(secretKey)
      }

      let xdr;
      try {
        const { xdrs } = await XDRBuilder.expressTransfer(
          senderPublickey,
          receiverPublicKey,
          assetIssuer,
          NiftronId,
          assetCount
        )
        if (xdrs != null && xdrs.length > 0) {
          await Promise.all(
            xdrs.map(async (item: any, index: number) => {
              xdrs[index].xdr = await XDRBuilder.signXDR(item.xdr, senderKeypair.secret());
              if (senderPublickey !== merchantKeypair.publicKey()) {
                xdrs[index].xdr = await XDRBuilder.signXDR(xdrs[index].xdr, merchantKeypair.secret());
              }
            })
          );
          xdr = xdrs[0]?.xdr
        }
      } catch (e) {
        throw e
      }

      //in testnet (should add check to change)
      let parsedTx: Transaction = new Transaction(xdr, Networks.TESTNET);
      let txnHash = parsedTx.hash().toString("hex");

      const expressT: Transfer = {
        transferType: "0",
        sender: senderPublickey,
        receiver: receiverPublicKey,
        assetCode: NiftronId,
        assetIssuer,
        assetCount,
        xdr,
        txnHash
      };
      const serverRes = await expressTransfer(expressT);
      if (serverRes == null) {
        throw new Error("Failed to submit expressTransfer to NIFTRON");
      }
      switch (serverRes) {
        case 200:
          return expressT;
        case 201:
          throw new Error("Merchant not found");
        case 202:
          throw new Error("User not found");
        case 400:
          throw new Error("Failed to submit expressTransfer to NIFTRON");
        default:
          throw new Error("Failed to submit expressTransfer to NIFTRON");
      }
    } catch (err) {
      throw err;
    }
  };



  /**
   * Trust Token 
   * @param {string} NiftronId string.
   * @param {string} assetIssuer string.
   * @param {string} trusterPublickey string.
   * @param {string} trusterSecretKey string.
   * @param {boolean} test boolean.

   * @returns {string} niftronId string
   */
  export const trustToken = async (
    NiftronId: string,
    assetIssuer: string,
    trusterPublickey: string,
    trusterSecretKey?: string,
    test?: boolean
  ): Promise<Transfer> => {
    try {

      let keypair: NiftronKeypair = trusterSecretKey != undefined ? Keypair.fromSecret(trusterSecretKey) : merchantKeypair
      if (trusterPublickey != undefined && trusterPublickey != merchantKeypair.publicKey()) {
        const secretKey = await approvalPopUp(test != undefined ? test : false)
        if (secretKey == null) {
          throw new Error("Truster account did not approve the transaction");
        }
        keypair = Keypair.fromSecret(secretKey)
      }

      let xdr;
      try {
        const { xdrs } = await XDRBuilder.trust(
          trusterPublickey,
          assetIssuer,
          NiftronId,
        )
        if (xdrs != null && xdrs.length > 0) {
          await Promise.all(
            xdrs.map(async (item: any, index: number) => {
              xdrs[index].xdr = await XDRBuilder.signXDR(item.xdr, keypair.secret());
            })
          );
          xdr = xdrs[0]?.xdr
        }
      } catch (e) {
        throw e
      }

      const expressT: any = {
        assetCode: NiftronId,
        assetIssuer,
        xdr,
      };
      const serverRes = await trust(expressT);
      if (serverRes == null) {
        throw new Error("Failed to submit trust to NIFTRON");
      }
      switch (serverRes) {
        case 200:
          return expressT;
        case 201:
          throw new Error("Account not found");
        case 202:
          throw new Error("Token not found");
        case 203:
          throw new Error("Insufficient fund in account");
        case 400:
          throw new Error("Failed to submit trust to NIFTRON");
        default:
          throw new Error("Failed to submit trust to NIFTRON");
      }
    } catch (err) {
      throw err;
    }
  };



  /**
   * Transfer Token
   * @param {string} senderPublicKey string.
  * @param {string} receiverPublicKey string.
  * @param {string} NiftronId string.
   * @param {number} assetCount number.
   * @returns {string} niftronId string
   */
  export const testEthTransferToken = async (
    senderPublicKey: string,
    receiverPublicKey: string,
    assetCount: number,
    NiftronId?: string,
  ): Promise<any> => {
    try {
      let contractOption: any = [
        {
          "inputs": [],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "tokenOwner",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "spender",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "tokens",
              "type": "uint256"
            }
          ],
          "name": "Approval",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "from",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "to",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "tokens",
              "type": "uint256"
            }
          ],
          "name": "Transfer",
          "type": "event"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "owner",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "delegate",
              "type": "address"
            }
          ],
          "name": "allowance",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "delegate",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "numTokens",
              "type": "uint256"
            }
          ],
          "name": "approve",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "tokenOwner",
              "type": "address"
            }
          ],
          "name": "balanceOf",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "decimals",
          "outputs": [
            {
              "internalType": "uint8",
              "name": "",
              "type": "uint8"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "name",
          "outputs": [
            {
              "internalType": "string",
              "name": "",
              "type": "string"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "symbol",
          "outputs": [
            {
              "internalType": "string",
              "name": "",
              "type": "string"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "totalSupply",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "receiver",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "numTokens",
              "type": "uint256"
            }
          ],
          "name": "transfer",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "owner",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "buyer",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "numTokens",
              "type": "uint256"
            }
          ],
          "name": "transferFrom",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ]
      // try {
      // contractOption = require('ERC20Basic.json');

      // } catch (e) {
      //   const fs = require('fs')
      //   contractOption = JSON.parse(fs.readFileSync('ERC20Basic.json', 'utf-8'))
      // }

      let web3 = new Web3("HTTP://127.0.0.1:8545");
      // contractOption = require('./ERC20Basic.json');

      let contract = new web3.eth.Contract(contractOption, "0xab50b581a71aD946083a4E82E3dA515377EF13E4")

      return new Promise((resolve) => {
        contract.methods.transfer(receiverPublicKey, assetCount)
          .send({ from: senderPublicKey, value: 0 })
          .then((f: any) => {
            console.log(f)
            resolve(f)
          }).catch((e: any) => {
            console.log(e)
            throw new Error("Failed to submit transfer to NIFTRON");
          })

      })
    } catch (err) {
      throw err;
    }
  };

  export const approvalPopUp = async (test: boolean): Promise<string | null> => {
    return new Promise((resolve) => {
      const url = (test ? "https://dev.account.niftron.com/" : "https://account.niftron.com/") +
        "?serviceType=0" +
        "&projectKey=" + projectPublicKey +
        // "&xdr=" + xdr +
        "&origin=" + window.location.href;
      const title = ""
      const width = 720
      const height = 720
      var left = (window.screen.width / 2) - (width / 2);
      var top = (window.screen.height / 2) - (height / 2);
      var options = '';

      options += 'toolbar=no,location=no,directories=no,status=no';
      options += ',menubar=no,scrollbars=no,resizable=no,copyhistory=no';

      options += ',width=' + width;
      options += ',height=' + height;
      options += ',top=' + top;
      options += ',left=' + left;

      const MyWindow = window.open(url, title, options);
      const messageEvent = (event: any) => {
        if (event.origin !== "https://account.niftron.com" && event.origin !== "https://dev.account.niftron.com")
          return;
        window.removeEventListener("message", messageEvent)
        resolve(event.data)
      }
      window.addEventListener("message", messageEvent, false);
      if (MyWindow != null && MyWindow.closed) {
        resolve(null)
      }
    })

  }


  // export const approvalPopUp2 = async (xdr: string): Promise<string> => {

  //   let reponse = ""

  //   const url = "https://dev.account.niftron.com/" +
  //     "?serviceType=0" +
  //     "&projectKey=" + projectPublicKey +
  //     "&xdr=" + xdr +
  //     "&origin=" + window.location.href;
  //   const title = ""
  //   const width = 720
  //   const height = 720
  //   var left = (window.screen.width / 2) - (width / 2);
  //   var top = (window.screen.height / 2) - (height / 2);
  //   var options = '';

  //   options += 'toolbar=no,location=no,directories=no,status=no';
  //   options += ',menubar=no,scrollbars=no,resizable=no,copyhistory=no';

  //   options += ',width=' + width;
  //   options += ',height=' + height;
  //   options += ',top=' + top;
  //   options += ',left=' + left;

  //   const MyWindow = window.open(url, title, options);
  //   const messageEvent = (event: any) => {
  //     if (event.origin !== "https://account.niftron.com" && event.origin !== "https://dev.account.niftron.com")
  //       return;
  //     localStorage.setItem("xdr", event.data)
  //     window.removeEventListener("message", messageEvent)
  //     reponse = event.data
  //   }
  //   window.addEventListener("message", messageEvent, false);
  //   return reponse
  // }

  // const transferCertificate = async (
  //   tokenName: string,
  //   tokenType: TokenType,
  //   tradable: boolean,
  //   transferable: boolean,
  //   tokenData: string
  // ): Promise<Certificate> => {
  //   try {
  //     const certificate: Certificate = {
  //       // _id: niftronId.id,
  //       tokenType,
  //       tradable,
  //       transferable,
  //       tokenName,
  //       assetRealm: "",
  //       assetCount: 0,
  //       previewUrl: "",
  //     };
  //     return certificate;
  //   } catch (err) {
  //     throw err;
  //   }
  // };
  // /**
  //  * Creates a new Badge Token
  //  * @param {string} tokenName string.
  //  * @param {string} tokenData string.
  //  * @param {boolean} tradable boolean.
  //  * @param {boolean} transferable boolean.
  //  * @returns {string} niftronId string
  //  */
  // const transferBadge = async (
  //   tokenName: string,
  //   tokenType: TokenType,
  //   tradable: boolean,
  //   transferable: boolean,
  //   tokenData: string
  // ): Promise<Badge> => {
  //   try {
  //     const badge: Badge = {
  //       // _id: niftronId.id,
  //       tokenType,
  //       tradable,
  //       transferable,
  //       tokenName,
  //       assetRealm: "",
  //       assetCount: 0,
  //       previewUrl: "",
  //     };
  //     return badge;
  //   } catch (err) {
  //     throw err;
  //   }
  // };






  // /**
  //  * Transfer Gift Card
  //  * @param {Keypair} senderKeypair Keypair.
  //  * @param {Keypair} receiverKeypair Keypair.
  //  * @param {NiftronId} NiftronId NiftronId.
  //  * @param {string} assetIssuer string.
  //  * @param {number} assetCount number.
  //  * @returns {string} niftronId string
  //  */
  // const transferGiftCard = async (
  //   senderKeypair: Keypair,
  //   receiverKeypair: Keypair,
  //   NiftronId: NiftronId,
  //   assetIssuer: string,
  //   assetCount: number
  // ): Promise<Certificate> => {
  //   try {

  //     let xdr;
  //     let rejectXdr;
  //     // let fundXdr;
  //     try {

  //       // //console.log(receiver)
  //       const { xdrs } = await XDRBuilder.transferGiftCard(
  //         senderKeypair.publicKey(),
  //         receiverKeypair.publicKey(),
  //         assetIssuer,
  //         props.item.assetCode,
  //         assetCount,
  //         approversList,
  //         // minTime,
  //         // maxTime
  //       )

  //       // let expireXdr;

  //       if (xdrs != null && xdrs.length > 0) {
  //         await Promise.all(
  //           xdrs.map(async (item, index, array) => {
  //             xdrs[index].xdr = await signXDR(item.xdr, keypair.secret());
  //           })
  //         );
  //         // fundXdr = xdrs[0]?.xdr
  //         xdr = xdrs[0]?.xdr
  //         rejectXdr = xdrs[1]?.xdr
  //         // cancelXdr = xdrs[2]?.xdr
  //         // expireXdr = xdrs[3]?.xdr
  //       }



  //     } catch (e) {
  //     }







  //     const certificate: Certificate = {
  //       // _id: niftronId.id,
  //       tokenType,
  //       tradable,
  //       transferable,
  //       tokenName,
  //       assetRealm: "",
  //       assetCount: 0,
  //       previewUrl: "",
  //     };
  //     return certificate;
  //   } catch (err) {
  //     throw err;
  //   }
  // };
}
