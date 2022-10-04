/**
 * Niftron XDR Type Interface
 */
export enum NiftronXDRType {
  MINT_ART = "MINT0000001",
  MINT_TICKET = "MINT0000002",
  MINT_DOMAIN = "MINT0000003",
  MINT_CERTIFICATE = "MINT0000004",
  TRANSFER_ART = "TRAN0000001",
  TRANSFER_TICKET = "TRAN0000002",
  TRANSFER_DOMAIN = "TRAN0000003",
  TRANSFER_CERTIFICATE = "TRAN0000004",
  PROOF_OF_SIGNATURE = "PROOF0000001",
  ADD_DATA = "DATA0000001",
  AUTH_LOGIN = "AUTH0000001",
}

/**
 * XDR Interface
 */
export interface XDR {
  xdr: string;
  version: string;
  signers?: Array<string>;
  sequence?: string;
  niftronCost?: number;
}

/**
 * Mint Ticket XDR Interface
 */
export interface MintTicketXDR extends XDR {}

/**
 * Mint Domain XDR Interface
 */
export interface MintDomainXDR extends XDR {}

/**
 * Mint Art XDR Interface
 */
export interface MintArtXDR extends XDR {}

/**
 * Mint Certificate XDR Interface
 */
export interface MintCertificateXDR extends XDR {}

/**
 * Transfer Certificate XDR Interface
 */
export interface TransferCertificateXDR extends XDR {}
/**
 * Register XDR Interface
 */
export interface RegisterXDR extends XDR {}


/**
 * XDR Builder response Interface
 */
export interface XDRBuilderResponse{
  xdrs: Array<XDR>;
  secondaryPublicKey?: string;
  niftronId?: string;
}