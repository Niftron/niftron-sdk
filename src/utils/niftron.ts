import sha256 from "sha256";
import { TokenType, NiftronId } from "../models";
/**
 * Creates a new Niftron Id
 * @constructor
 * @param {TokenType} tokenType TokenType.
 * @param {boolean} tradable boolean.
 * @param {boolean} transferable boolean.
 * @param {boolean} authorizable boolean.
 * @param {string} tokenName string.
 * @param {string} tokenData string.
 */
export class NiftronIdBuilder {
  tokenType: TokenType;
  tradable: boolean;
  transferable: boolean;
  authorizable: boolean;
  tokenName: string;
  tokenData: string;
  version: string = "1.0";

  constructor(
    tokenType: TokenType,
    tradable: boolean,
    transferable: boolean,
    authorizable: boolean,
    tokenName: string,
    tokenData: string
  ) {
    this.tokenType = tokenType;
    this.tradable = tradable;
    this.transferable = transferable;
    this.authorizable = authorizable;
    this.tokenName = tokenName;
    this.tokenData = tokenData;
  }
  /**
   * Returns Niftron Id
   * @returns {string} niftronId string
   **/
  public niftronId(): NiftronId {
    try {
      if (this.tokenType == null) {
        throw new Error("Token type cannot be null");
      }
      if (this.tokenName == null || this.tokenName == "") {
        throw new Error("Token name cannot be null or empty");
      }
      if (this.tokenData == null || this.tokenData == "") {
        throw new Error("Token data cannot be null or empty");
      }
      let firstByte;
      switch (this.tokenType) {
        case TokenType.NFT:
          firstByte = "N";
          break;
        case TokenType.SFT:
          firstByte = "S";
          break;
        default:
          firstByte = "A";
      }
      const secondByte = this.tradable ? "T" : "N";
      const thirdByte = this.transferable ? "T" : "N";
      const forthByte = this.authorizable ? "A" : "N";

      const tokenNameHash = sha256(this.tokenName).toUpperCase();
      const nextOneBytes =
        tokenNameHash.substring(0, 1) 
      const dataHash = this.tokenData.toUpperCase();
      const lastSixBytes =
        dataHash.substring(0, 3) + dataHash.substring(dataHash.length - 3);

      const id: NiftronId = {
        id:
          firstByte +
          secondByte +
          thirdByte +
          forthByte +
          nextOneBytes +
          "N" +
          lastSixBytes,
        redeemId:
          firstByte +
          secondByte +
          thirdByte +
          forthByte +
          nextOneBytes +
          "R" +
          lastSixBytes,
        version: this.version,
      };
      return id;
    } catch (err) {
      throw err;
    }
  }
}
