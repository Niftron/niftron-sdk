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
} from "../models";
import { IpfsService } from "../ipfsService";
import { XDRBuilder } from "../xdrBuilder";
import { Keypair } from "stellar-sdk";
import { getAccountById, addCertificate, addBadge, addGiftCard } from "../api";
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
* @param {CreateBadgeModel} createBadgeModel CreateBadgeModel
* @param {CreateBadgeOptionsModel} options CreateBadgeOptionsModel
* @returns {string} niftronId string
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

      const { xdrs, niftronId } = await XDRBuilder.mintBadge(
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





  export const transferCertificate = async (
    tokenName: string,
    tokenType: TokenType,
    tradable: boolean,
    transferable: boolean,
    tokenData: string
  ): Promise<Certificate> => {
    try {
      const certificate: Certificate = {
        // _id: niftronId.id,
        tokenType,
        tradable,
        transferable,
        tokenName,
        assetRealm: "",
        assetCount: 0,
        previewUrl: "",
      };
      return certificate;
    } catch (err) {
      throw err;
    }
  };
  /**
   * Creates a new Badge Token
   * @param {string} tokenName string.
   * @param {string} tokenData string.
   * @param {boolean} tradable boolean.
   * @param {boolean} transferable boolean.
   * @returns {string} niftronId string
   */
  export const transferBadge = async (
    tokenName: string,
    tokenType: TokenType,
    tradable: boolean,
    transferable: boolean,
    tokenData: string
  ): Promise<Badge> => {
    try {
      const badge: Badge = {
        // _id: niftronId.id,
        tokenType,
        tradable,
        transferable,
        tokenName,
        assetRealm: "",
        assetCount: 0,
        previewUrl: "",
      };
      return badge;
    } catch (err) {
      throw err;
    }
  };






  /**
   * Transfer Gift Card
   * @param {Keypair} senderKeypair Keypair.
   * @param {Keypair} receiverKeypair Keypair.
   * @param {NiftronId} NiftronId string.
   * @param {string} assetIssuer string.
   * @param {number} assetCount number.
   * @returns {string} niftronId string
   */
  export const transferGiftCard = async (
    tokenName: string,
    tokenType: TokenType,
    tradable: boolean,
    transferable: boolean,
    tokenData: string
  ): Promise<Certificate> => {
    try {






      const certificate: Certificate = {
        // _id: niftronId.id,
        tokenType,
        tradable,
        transferable,
        tokenName,
        assetRealm: "",
        assetCount: 0,
        previewUrl: "",
      };
      return certificate;
    } catch (err) {
      throw err;
    }
  };
}
