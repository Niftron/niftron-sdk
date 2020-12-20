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
  SignerStatus,
  NiftronConfig,
} from "../models";
import { IpfsService } from "../ipfsService";
import { XDRBuilder } from "../xdrBuilder";
import {
  Keypair,
  Transaction,
  Networks,
} from "stellar-sdk";
import { getAccountById, addCertificate, addBadge, addGiftCard, expressTransfer, trust, transfer, getTokenByIdList, getTokenById, getProjectByPublicKey } from "../api";
import { PatternPK, PatternSK, PatternId } from "../constants";
/**
 * TokenBuilder Module
 */
export module TokenBuilder {
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
      throw new Error("Invalid secret key")
    }
    if (niftronConfig.projectKey == undefined) {
      throw new Error(
        "Please provide a project key"
      );
    }
    if (!PatternPK.test(niftronConfig.projectKey)) {
      throw new Error("Invalid project key")
    }
    merchantKeypair = Keypair.fromSecret(niftronConfig.secretKey);
    projectPublicKey = niftronConfig.projectKey;
    projectIssuerKey = niftronConfig.projectIssuer;
  };

  /**
   * Creates a new Certificate Token
   * @param {CreateCertificateModel} createCertificateModel CreateCertificateModel
   * @param {CreateCertificateOptionsModel} options CreateCertificateOptionsModel
   * @returns {string} niftronId string
   */
  export async function createCertificate(
    createCertificateModel: CreateCertificateModel,
    options?: CreateCertificateOptionsModel
  ): Promise<Certificate> {
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

      if (createCertificateModel.creatorPublicKey != undefined && !PatternPK.test(createCertificateModel.creatorPublicKey)) {
        throw new Error("Invalid creator public key")
      }

      let creatorKeypair: Keypair = createCertificateModel.creatorKeypair != undefined ? createCertificateModel.creatorKeypair : merchantKeypair

      if (createCertificateModel.creatorPublicKey != undefined && createCertificateModel.creatorPublicKey != merchantKeypair.publicKey()) {
        const secretKey = await approvalPopUp()
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
  export async function createBadge(
    createBadgeModel: CreateBadgeModel,
    options?: CreateBadgeOptionsModel
  ): Promise<Badge | null> {
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

      if (createBadgeModel.creatorPublicKey != undefined && !PatternPK.test(createBadgeModel.creatorPublicKey)) {
        throw new Error("Invalid creator public key")
      }

      let creatorKeypair: NiftronKeypair = createBadgeModel.creatorKeypair != undefined ? createBadgeModel.creatorKeypair : merchantKeypair

      if (createBadgeModel.creatorPublicKey != undefined && createBadgeModel.creatorPublicKey != merchantKeypair.publicKey()) {
        const secretKey = await approvalPopUp()
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

      if (projectPublicKey) {
        const project = await getProjectByPublicKey(projectPublicKey);
        if (project == null) {
          throw new Error("Project not found in niftron");
        }
        IssuerPublicKey = project.projectIssuer.publicKey;
        IssuerAlias = project.name;
      }

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
  export async function createGiftCard(
    createGiftCardModel: CreateGiftCardModel,
    options?: CreateGiftCardOptionsModel
  ): Promise<GiftCard> {
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

      if (createGiftCardModel.creatorPublicKey != undefined && !PatternPK.test(createGiftCardModel.creatorPublicKey)) {
        throw new Error("Invalid creator public key")
      }

      let creatorKeypair: NiftronKeypair = createGiftCardModel.creatorKeypair != undefined ? createGiftCardModel.creatorKeypair : merchantKeypair

      if (createGiftCardModel.creatorPublicKey != undefined && createGiftCardModel.creatorPublicKey != merchantKeypair.publicKey()) {
        const secretKey = await approvalPopUp()
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
 * Transfer Token 
 * @param {string} receiverPublicKey string.
 * @param {string} NiftronId string.
 * @param {string} assetIssuer string.
 * @param {number} assetCount number.
 * @param {string} senderPublickey string.
 * @param {string} senderSecretKey string.
 * @param {boolean} test boolean.
 * @returns {string} niftronId string
 */
  export async function transferToken(
    receiverPublicKey: string,
    NiftronId: string,
    assetIssuer: string,
    assetCount: number,
    senderPublicKey: string,
    senderSecretKey?: string,
  ): Promise<Transfer> {
    try {
      if (receiverPublicKey != undefined && !PatternPK.test(receiverPublicKey)) {
        throw new Error("Invalid receiver public key")
      }

      if (NiftronId != undefined && !PatternId.test(NiftronId)) {
        throw new Error("Invalid niftronId or asset code")
      }

      if (assetIssuer != undefined && !PatternPK.test(assetIssuer)) {
        throw new Error("Invalid asset issuer public key")
      }

      if (senderPublicKey != undefined && !PatternPK.test(senderPublicKey)) {
        throw new Error("Invalid sender public key")
      }

      if (senderSecretKey != undefined && !PatternSK.test(senderSecretKey)) {
        throw new Error("Invalid sender secret key")
      }

      let senderKeypair: NiftronKeypair = senderSecretKey != undefined ? Keypair.fromSecret(senderSecretKey) : merchantKeypair

      if (senderPublicKey != undefined && senderPublicKey != merchantKeypair.publicKey()) {
        const secretKey = await approvalPopUp()
        if (secretKey == null) {
          throw new Error("Sender account did not approve the transaction");
        }
        senderKeypair = Keypair.fromSecret(secretKey)
      }

      let xdr;
      let rejectXdr;

      try {
        const { xdrs } = await XDRBuilder.transferBadge(
          senderPublicKey,
          receiverPublicKey,
          assetIssuer,
          NiftronId,
          assetCount,
        )
        if (xdrs != null && xdrs.length > 0) {
          await Promise.all(
            xdrs.map(async (item: any, index: number) => {
              xdrs[index].xdr = await XDRBuilder.signXDR(item.xdr, senderKeypair.secret());
              if (senderPublicKey !== merchantKeypair.publicKey()) {
                xdrs[index].xdr = await XDRBuilder.signXDR(xdrs[index].xdr, merchantKeypair.secret());
              }
            })
          );
          xdr = xdrs[0]?.xdr
          rejectXdr = xdrs[1]?.xdr

        }
      } catch (e) {
        throw e
      }

      //in testnet (should add check to change)
      let parsedTx: Transaction = new Transaction(xdr, Networks.TESTNET);
      // let parsedRejectTx: Transaction = new Transaction(rejectXdr, Networks.TESTNET);

      let txnHash = parsedTx.hash().toString("hex");
      // let txnHash = parsedTx.hash().toString("hex");
      const tokenRes = await getTokenById(NiftronId);
      if (tokenRes == null) {
        throw new Error("Token not found");
      }

      const transferModel: Transfer = {
        transferType: "0",
        sender: senderPublicKey,
        receiver: receiverPublicKey,
        assetCode: NiftronId,
        assetIssuer,
        assetCount,
        tokenName: tokenRes.data.tokenName,
        previewUrl: tokenRes.data.previewUrl,
        xdr,
        rejectXdr,
        signers: [{
          publicKey: senderPublicKey,
          status: SignerStatus.ACCEPTED
        }]
      };
      const serverRes = await transfer(transferModel);
      if (serverRes == null) {
        throw new Error("Failed to submit expressTransfer to NIFTRON");
      }
      switch (serverRes) {
        case 200: transferModel.txnHash = txnHash
          return transferModel;
        case 201:
          throw new Error("Account not found in niftron");
        case 202:
          throw new Error("Token not found");
        case 400:
          throw new Error("Failed to submit transfer to NIFTRON");
        default:
          throw new Error("Failed to submit transfer to NIFTRON");
      }
    } catch (err) {
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
  export async function expressTransferToken(
    receiverPublicKey: string,
    NiftronId: string,
    assetIssuer: string,
    assetCount: number,
    senderPublicKey: string,
    senderSecretKey?: string,
  ): Promise<Transfer> {
    try {
      if (receiverPublicKey != undefined && !PatternPK.test(receiverPublicKey)) {
        throw new Error("Invalid receiver public key")
      }

      if (NiftronId != undefined && !PatternId.test(NiftronId)) {
        throw new Error("Invalid niftronId or asset code")
      }

      if (assetIssuer != undefined && !PatternPK.test(assetIssuer)) {
        throw new Error("Invalid asset issuer public key")
      }

      if (senderPublicKey != undefined && !PatternPK.test(senderPublicKey)) {
        throw new Error("Invalid sender public key")
      }

      if (senderSecretKey != undefined && !PatternSK.test(senderSecretKey)) {
        throw new Error("Invalid sender secret key")
      }

      let senderKeypair: NiftronKeypair = senderSecretKey != undefined ? Keypair.fromSecret(senderSecretKey) : merchantKeypair

      if (senderPublicKey != undefined && senderPublicKey != merchantKeypair.publicKey()) {
        const secretKey = await approvalPopUp()
        if (secretKey == null) {
          throw new Error("Sender account did not approve the transaction");
        }
        senderKeypair = Keypair.fromSecret(secretKey)
      }

      let xdr;
      try {
        const { xdrs } = await XDRBuilder.expressTransfer(
          senderPublicKey,
          receiverPublicKey,
          assetIssuer,
          NiftronId,
          assetCount
        )
        if (xdrs != null && xdrs.length > 0) {
          await Promise.all(
            xdrs.map(async (item: any, index: number) => {
              xdrs[index].xdr = await XDRBuilder.signXDR(item.xdr, senderKeypair.secret());
              if (senderPublicKey !== merchantKeypair.publicKey()) {
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
        sender: senderPublicKey,
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
  export async function trustToken(
    NiftronId: string,
    assetIssuer: string,
    trusterPublickey: string,
    trusterSecretKey?: string,
  ): Promise<Transfer> {
    try {
      if (NiftronId != undefined && !PatternId.test(NiftronId)) {
        throw new Error("Invalid niftronId or asset code")
      }

      if (assetIssuer != undefined && !PatternPK.test(assetIssuer)) {
        throw new Error("Invalid asset issuer public key")
      }

      if (trusterPublickey != undefined && !PatternPK.test(trusterPublickey)) {
        throw new Error("Invalid truster public key")
      }

      if (trusterSecretKey != undefined && !PatternSK.test(trusterSecretKey)) {
        throw new Error("Invalid truster secret key")
      }

      let keypair: NiftronKeypair = trusterSecretKey != undefined ? Keypair.fromSecret(trusterSecretKey) : merchantKeypair
      if (trusterPublickey != undefined && trusterPublickey != merchantKeypair.publicKey()) {
        const secretKey = await approvalPopUp()
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



  export async function approvalPopUp(): Promise<string | null> {
    return new Promise((resolve) => {
      const url = ("https://account.niftron.com/") +
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
        if (event.origin !== "https://account.niftron.com")
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
}
