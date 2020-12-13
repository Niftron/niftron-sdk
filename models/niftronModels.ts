import { Keypair, KeypairType } from "stellar-sdk";

/**
 * Niftron Id Interface
 */
export interface NiftronId {
  id: string;
  redeemId: string;
  version: string;
}
/**
 * Token Type Interface
 */
export enum TokenType {
  NFT = "NFT",
  SFT = "SFT",
}
/**
 * Token Category Interface
 */
export enum TokenCategory {
  CERTIFICATE = "CERTIFICATE",
  BADGE = "BADGE",
  DIGITALART = "DIGITALART",
  TICKET = "TICKET",
  GIFTCARD = "GIFTCARD",

}
/**
 * Token Realm Interface
 */
export enum TokenRealm {
  DIGITAL = "DIGITAL",
  PHYSICAL = "PHYSICAL",
}
/**
 * Token Interface
 */
export interface Token {
  _id?: string;
  tokenName: string;
  tokenType: string;
  assetRealm: string;
  tradable: boolean;
  transferable: boolean;
  category: string;
  assetCode: string;
  assetIssuer: string;
  assetCount: number;
  previewUrl: string;
  ipfsHash: string;
  price: Number;
  xdr: string;
  lastTxnHash: string;
}

/**
 * Certificate Interface
 */
export interface Certificate {
  _id?: string;
  tokenName: string;
  tokenType?: string;
  assetRealm: string;
  tradable: boolean;
  transferable: boolean;
  category?: string;
  assetCode?: string;
  assetIssuer: string;
  issuerAlias: string;
  assetCount: number;
  previewUrl: string;
  isUrl: boolean;

  ipfsHash?: string;
  price?: Number;
  xdr?: string;
  lastTxnHash?: string;
}

/**
 * Badge Interface
 */
export interface Badge {
  _id?: string;
  tokenName: string;
  tokenType?: string;
  assetRealm: string;
  tradable: boolean;
  transferable: boolean;
  category?: string;
  assetCode?: string;
  assetIssuer?: string;
  issuerAlias: string;

  assetCount: number;
  previewUrl: string;
  isUrl: boolean;

  ipfsHash?: string;
  price?: Number;
  xdr?: string;
  lastTxnHash?: string;
}

/**
 * GiftCard Interface
 */
export interface GiftCard {
  _id?: string;
  tokenName: string;
  tokenType?: string;
  assetRealm: string;
  tradable: boolean;
  transferable: boolean;
  category?: string;
  assetCode?: string;
  assetIssuer?: string;
  issuerAlias: string;
  assetCount: number;
  previewUrl: string;
  isUrl: boolean;
  ipfsHash?: string;
  price?: Number;
  xdr?: string;
  lastTxnHash?: string;
}
/**
 * Transfer Interface
 */
export interface Transfer {
  _id?: string;
  transferType: string;
  sender: string;
  receiver: string;
  assetCode: string;
  assetIssuer: string;
  assetCount: Number;
  previewUrl?: string;
  xdr: string;
  signers?: Array<signer>;
  lastProofHash?: string;
  txnHash?: string;
  status?: SignerStatus;
  createdAt?: string;
  updatedAt?: string;
}
/**
 * signer Interface
 */
interface signer {
  publicKey: string;
  status: SignerStatus;
}
/**
 * SignerStatus Interface
 */
export enum SignerStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}
/**
 * AcceptApproval Interface
 */
export interface AcceptApproval {
  proofXdr: string;
  xdr: string;
}
/**
 * RejectApproval Interface
 */
export interface RejectApproval {
  proofXdr: string;
}
/**
 * NiftronCredential Interface
 */
export interface NiftronCredential extends File { }
// /**
//  * NiftronCredential Interface
//  */
// export class NiftronCredential extends File {}

/**
 * User Type Interface
 */
export enum UserType {
  CREATOR = "0",
  COLLECTOR = "1",
}

/**
 * User Auth Type Interface
 */
export enum UserAuthType {
  LOWPRIVACY = "0",
  MEDIUMPRIVACY = "1",
  HIGHPRIVACY = "2",
}

/**
 * Pledge Model
 */
export interface PledgeModel {
  amount?: number;
}

/**
 * Pledge Response
 */
export interface PledgeResponse {
  status: string;
}

/**
 * User Creation Response
 */
export interface UserCreation {
  type: UserType;
  alias: string;
}

/**
 * High Privacy User Creation
 */
export interface HighPrivacyUserCreation extends UserCreation { }

/**
 * Medium Privacy User Creation
 */
export interface MediumPrivacyUserCreation extends UserCreation {
  password: string;
}

/**
 * Low Privacy User Creation
 */
export interface LowPrivacyUserCreation extends UserCreation {
  password: string;
  email: string;
  recoveryQuestion: string;
  securityAnswer: string;
}

/**
 * Account Creation Response
 */
export interface AccountResponse {
  status: string;
  publicKey?: string;
  secretKey?: string;
}

/**
 * High Privacy Account Creation Response
 */
export interface HighPrivacyAccountResponse extends AccountResponse { }

/**
 * Medium Privacy Account Creation Response
 */
export interface MediumPrivacyAccountResponse extends AccountResponse { }

/**
 * Low Privacy Account Creation Response
 */
export interface LowPrivacyAccountResponse extends AccountResponse { }

/**
 * Niftron Config
 */
export interface NiftronConfig {
  secretKey?: string;
  projectKey?: string;
  credential?: NiftronCredential;
}

/**
 * Niftron Base64String for Images
 */
export interface Base64String extends String { }

/**
 * Niftron Base64String for Images
 */
export class Base64String extends String { }

// /**
//  * Niftron Keypair
//  */
// export interface NiftronKeypair extends Keypair {}

/**
 * Niftron Keypair
 */
export class NiftronKeypair extends Keypair { }
/**
 * Niftron Account
 */
export interface NiftronAccount {
  _id?: string;
  type: UserType;
  alias: string;
  email: string;
  publicKey: string;
  encryptedSecret: string;
  encryptedRecoverySecret: string;
  recoveryQuestion: string;
  authType: UserAuthType;
  accounts: Array<NiftronAccountList>;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Niftron Account List
 */
export interface NiftronAccountList {
  publicKey: string;
  accountType: string;
}




/**
 * Create Token Model
 */
export interface CreateTokenModel {
  tokenName: string;
  tokenType: TokenType;
  tokenData: string;
  tokenCount: number;
  tokenCost?: number;
  previewImageBase64?: string;
  previewImageUrl: string;
  creatorPublicKey?: string;
  creatorKeypair?: NiftronKeypair;
  test?: boolean;
}

/**
 * Create Token Options Model
 */
export interface CreateTokenOptionsModel {
  tradable?: boolean;
  transferable?: boolean;
  authorizable?: boolean;
  encryptData?: boolean;
}

/**
 * Create Certificate Model
 */
export interface CreateCertificateModel extends CreateTokenModel { }

/**
 * Create Certificate Options Model
 */
export interface CreateCertificateOptionsModel extends CreateTokenOptionsModel { }

/**
 * Create Badge Model
 */
export interface CreateBadgeModel extends CreateTokenModel { }
/**
 * Create Badge Options Model
 */
export interface CreateBadgeOptionsModel extends CreateTokenOptionsModel { }


/**
 * Create GiftCard Model
 */
export interface CreateGiftCardModel extends CreateTokenModel { }
/**
 * Create GiftCard Options Model
 */
export interface CreateGiftCardOptionsModel extends CreateTokenOptionsModel { }

/**
 * Activate User Model
 */
export interface ActivateUserModel {
  userKeypair: NiftronKeypair;
}

/**
 * User Model
 */
// export interface UserModel {
//   tradable?: boolean;
//   transferable?: boolean;
//   authorizable?: boolean;
//   encryptData?: boolean;
// }

export interface UserModel {
  type: String;
  alias: String;
  email: String;
  authType: String;
  publicKey: String;
  merchant: String;
  verified: Boolean;
  encryptedSecret: String;
  recoveryQuestion: String;
  encryptedRecoverySecret: String;
  accounts: Account[];
}
/**
 * Auth Model
 */
export interface AuthModel {
  redirectUrl?: string;
  merchantAuthType?: MerchantAuthType;
  warning?: string;
  userType?: UserType;
}
/**
 * Auth Response
 */
export interface AuthResponse {
  user?: UserModel;
  error?: Error;
}
/**
 * Merchant Auth Type
 */
export enum MerchantAuthType {
  REGULAR = "0",
  ZEROFAILURE = "1",
}
