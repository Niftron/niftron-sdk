import { Utils } from "../utils";
import { XDRBuilder } from "../xdrBuilder";
import { TokenBuilder } from "../token";
import { User } from "../user";
import { NiftronConfig } from "../models";
import { PatternSK, PatternPK } from "../constants";
import { ContractBuilder } from "../contractBuilder";

/**
 * The main NIFTRON namespace
 */
export class NIFTRON {
  private static isInitialized: boolean = false;
  private static secretKey: string | undefined = undefined;
  private static projectKey: string | undefined = undefined;
  private static projectIssuer: string | undefined = undefined;

  /**
   * Constructor
   * @param {NiftronConfig} niftronConfig Niftron Configuration Interface
   */
  constructor(niftronConfig: NiftronConfig) {
    if (niftronConfig.secretKey != undefined) {
      NIFTRON.secretKey = niftronConfig.secretKey;
    }
    if (niftronConfig.projectKey != undefined) {
      NIFTRON.projectKey = niftronConfig.projectKey;
    }
    if (niftronConfig.projectIssuer != undefined) {
      NIFTRON.projectIssuer = niftronConfig.projectIssuer;
    }
  }
  /**
   * initializes niftron
   */
  public initialize() {
    try {
      if (NIFTRON.secretKey == undefined) {
        throw new Error("Please provide a secret key");
      }
      if (!PatternSK.test(NIFTRON.secretKey)) {
        throw new Error("Invalid secret key");
      }
      if (NIFTRON.projectKey == undefined) {
        throw new Error("Please provide a project key");
      }
      if (!PatternPK.test(NIFTRON.projectKey)) {
        throw new Error("Invalid project key");
      }
      const config: NiftronConfig = {
        secretKey: NIFTRON.secretKey,
        projectKey: NIFTRON.projectKey,
        projectIssuer: NIFTRON.projectIssuer,
      };
      NIFTRON.xdrBuilder.initialize(config);
      NIFTRON.tokenBuilder.initialize(config);
      NIFTRON.contractBuilder.initialize(config);
      NIFTRON.user.initialize(config);
      NIFTRON.isInitialized = true;
    } catch (err) {
      throw err;
    }
  }
}

/**
 * The main NIFTRON namespace
 */
export namespace NIFTRON {
  export const user = User;
  export const tokenBuilder = TokenBuilder;
  export const xdrBuilder = XDRBuilder;
  export const contractBuilder = ContractBuilder;
  export const utils = Utils;
}
