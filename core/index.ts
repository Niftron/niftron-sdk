import { Utils } from "../utils";
import { XDRBuilder } from "../xdrBuilder";
import { TokenBuilder } from "../token";
import { User } from "../user";
import { NiftronConfig } from "../models";
import { patternSK, patternPK } from "../constants";

export class NIFTRON {
  private static isInitialized: boolean = false;
  private static secretKey: string | undefined = undefined;
  private static projectKey: string | undefined = undefined;
  private static projectIssuer: string | undefined = undefined;


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
    if (niftronConfig.credential != undefined) {
      const niftronCredential: File = niftronConfig.credential;
      if (niftronCredential.type != "niftron") {
        throw new Error("Only .niftron credential files are accepted");
      }
      const reader = new FileReader();
      reader.addEventListener("load", async () => {
        if (reader.result) {
          NIFTRON.secretKey = JSON.parse(
            atob(reader.result.toString())
          ).secretKey;
        }
      });
      reader.readAsText(niftronCredential);
    }
    // if (
    //   niftronConfig.projectKey == undefined
    // ) {
    //   throw new Error(
    //     "please provide a project key"
    //   );
    // }
  }
  /**
   * initializes niftron
   */
  public initialize() {
    try {
      if (NIFTRON.secretKey == undefined) {
        throw new Error(
          "Please provide a secret key or .niftron credential file"
        );
      }
      if (!patternSK.test(NIFTRON.secretKey)) {
        throw new Error("Invalid secret key")
      }
      if (NIFTRON.projectKey == undefined) {
        throw new Error(
          "Please provide a project key"
        );
      }
      if (!patternPK.test(NIFTRON.projectKey)) {
        throw new Error("Invalid project key")
      }
      // if (NIFTRON.projectKey == null) {
      //   throw new Error(
      //     "please provide a project key"
      //   );
      // }
      NIFTRON.xdrBuilder.initialize(NIFTRON.secretKey, NIFTRON.projectKey);
      NIFTRON.tokenBuilder.initialize(NIFTRON.secretKey, NIFTRON.projectKey);
      NIFTRON.user.initialize(NIFTRON.secretKey, NIFTRON.projectKey);
      NIFTRON.isInitialized = true;
    } catch (err) {
      throw err;
    }
  }
  /**
   * returns secretKey
   * @returns {string} secretKey string
   */
  public getSecret(): string {
    try {
      if (NIFTRON.secretKey == null) {
        throw new Error(
          "Please provide a secret key or .niftron credential file"
        );
      }
      if (!NIFTRON.isInitialized) {
        throw new Error("Please initialize the config");
      }
      return NIFTRON.secretKey;
    } catch (err) {
      throw err;
    }
  }
  user = User;
  xdrBuilder = XDRBuilder;
  utils = Utils;
  tokenBuilder = TokenBuilder;
}
/**
 * The main NIFTRON namespace
 */
export namespace NIFTRON {
  export var utils = Utils;
  export var tokenBuilder = TokenBuilder;
  export var xdrBuilder = XDRBuilder;
  export var user = User;
  export var getSecret: () => string;
}
