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

  export const initialize = (secretKey: string) => {
    merchantKeypair = Keypair.fromSecret(secretKey);
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

      const user: NiftronAccount = await getAccountById(
        createCertificateModel.creatorKeypair.publicKey()
      );

      if (user == null) {
        throw new Error("Creator account not found in niftron");
      }

      let IssuerPublicKey = user.publicKey;
      user.accounts.forEach((account) => {
        if (!tradable && account.accountType == "1") {
          IssuerPublicKey = account.publicKey;
        }
        if (tradable && account.accountType == "0") {
          IssuerPublicKey = account.publicKey;
        }
      });

      let previewUrl = createCertificateModel.previewImageUrl;

      const { ipfsHash, data } = await IpfsService.AddToIPFS(
        createCertificateModel.tokenData,
        encryptData ? createCertificateModel.creatorKeypair.secret() : undefined
      );

      const { xdrs, niftronId } = await XDRBuilder.mintCertificate(
        createCertificateModel.tokenName,
        createCertificateModel.tokenType,
        tradable,
        transferable,
        authorizable,
        createCertificateModel.creatorKeypair.publicKey(),
        createCertificateModel.tokenCount,
        sha256(data)
      );
      let xdr;
      if (xdrs != null && xdrs.length > 0) {
        await Promise.all(
          xdrs.map(async (item, index, array) => {
            xdrs[index].xdr = await XDRBuilder.signXDR(
              item.xdr,
              createCertificateModel.creatorKeypair.secret()
            );
          })
        );
        xdr = xdrs[0]?.xdr;
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
        assetCount: createCertificateModel.tokenCount,
        previewUrl,
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
    createCertificateModel: CreateBadgeModel,
    options?: CreateBadgeOptionsModel
  ): Promise<Badge> => {
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

      const user: NiftronAccount = await getAccountById(
        createCertificateModel.creatorKeypair.publicKey()
      );

      if (user == null) {
        throw new Error("Creator account not found in niftron");
      }

      let IssuerPublicKey = user.publicKey;
      user.accounts.forEach((account) => {
        if (!tradable && account.accountType == "1") {
          IssuerPublicKey = account.publicKey;
        }
        if (tradable && account.accountType == "0") {
          IssuerPublicKey = account.publicKey;
        }
      });

      let previewUrl = createCertificateModel.previewImageUrl;

      const { ipfsHash, data } = await IpfsService.AddToIPFS(
        createCertificateModel.tokenData,
        encryptData ? createCertificateModel.creatorKeypair.secret() : undefined
      );

      const { xdrs, niftronId } = await XDRBuilder.mintBadge(
        createCertificateModel.tokenName,
        createCertificateModel.tokenType,
        tradable,
        transferable,
        authorizable,
        createCertificateModel.creatorKeypair.publicKey(),
        createCertificateModel.tokenCount,
        sha256(data)
      );
      let xdr;
      if (xdrs != null && xdrs.length > 0) {
        await Promise.all(
          xdrs.map(async (item, index, array) => {
            xdrs[index].xdr = await XDRBuilder.signXDR(
              item.xdr,
              createCertificateModel.creatorKeypair.secret()
            );
          })
        );
        xdr = xdrs[0]?.xdr;
      }

      const badge: Badge = {
        tokenName: createCertificateModel.tokenName,
        tokenType: createCertificateModel.tokenType,
        assetRealm: TokenRealm.DIGITAL,
        tradable,
        transferable,
        category: TokenCategory.BADGE,
        assetCode: niftronId,
        assetIssuer: IssuerPublicKey,
        assetCount: createCertificateModel.tokenCount,
        previewUrl,
        ipfsHash,
        price: tokenCost,
        xdr,
      };
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

      const user: NiftronAccount = await getAccountById(
        createGiftCardModel.creatorKeypair.publicKey()
      );

      if (user == null) {
        throw new Error("Creator account not found in niftron");
      }

      let IssuerPublicKey = user.publicKey;
      user.accounts.forEach((account) => {
        if (!tradable && account.accountType == "1") {
          IssuerPublicKey = account.publicKey;
        }
        if (tradable && account.accountType == "0") {
          IssuerPublicKey = account.publicKey;
        }
      });

      let previewUrl = createGiftCardModel.previewImageUrl;

      const { ipfsHash, data } = await IpfsService.AddToIPFS(
        createGiftCardModel.tokenData,
        encryptData ? createGiftCardModel.creatorKeypair.secret() : undefined
      );

      const { xdrs, niftronId } = await XDRBuilder.mintGiftCard(
        createGiftCardModel.tokenName,
        createGiftCardModel.tokenType,
        tradable,
        transferable,
        authorizable,
        createGiftCardModel.creatorKeypair.publicKey(),
        createGiftCardModel.tokenCount,
        sha256(data)
      );
      let xdr;
      if (xdrs != null && xdrs.length > 0) {
        await Promise.all(
          xdrs.map(async (item, index, array) => {
            xdrs[index].xdr = await XDRBuilder.signXDR(
              item.xdr,
              createGiftCardModel.creatorKeypair.secret()
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
   * @param {string} senderPublickey string.
   * @param {string} senderSecretKey string.
   * @param {string} receiverPublicKey string.
   * @param {string} NiftronId string.
   * @param {string} assetIssuer string.
   * @param {number} assetCount number.
   * @returns {string} niftronId string
   */
  export const expressTransferToken = async (
    senderPublickey: string,
    senderSecretKey: string,
    receiverPublicKey: string,
    NiftronId: string,
    assetIssuer: string,
    assetCount: number,

  ): Promise<Transfer> => {
    try {

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
              xdrs[index].xdr = await XDRBuilder.signXDR(item.xdr, senderSecretKey);
              if (senderSecretKey !== merchantKeypair.secret()) {
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
   * @param {Keypair} senderKeypair Keypair.
   * @param {string} receiverPublicKey string.
   * @param {string} NiftronId string.
   * @param {string} assetIssuer string.
   * @param {number} assetCount number.
   * @returns {string} niftronId string
   */
  export const trustToken = async (
    trusterKeypair: Keypair,
    NiftronId: string,
    assetIssuer: string,
  ): Promise<Transfer> => {
    try {
      let xdr;
      try {
        const { xdrs } = await XDRBuilder.trust(
          trusterKeypair.publicKey(),
          assetIssuer,
          NiftronId,
        )
        if (xdrs != null && xdrs.length > 0) {
          await Promise.all(
            xdrs.map(async (item: any, index: number) => {
              xdrs[index].xdr = await XDRBuilder.signXDR(item.xdr, trusterKeypair.secret());
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
      let contractOption :any= [
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
      contract.methods.transfer(receiverPublicKey, assetCount)
        .send({ from: senderPublicKey, value: 0 })
        .then((f: any) => {
          console.log(f)
          return f
        }).catch((e: any) => {
          console.log(e)
          throw new Error("Failed to submit transfer to NIFTRON");
        })
    } catch (err) {
      throw err;
    }
  };



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
