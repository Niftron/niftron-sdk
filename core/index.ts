import { Utils } from "../utils";
import { XDRBuilder } from "../xdrBuilder";
import { TokenBuilder } from "../token";
import { User } from "../user";
import { NiftronConfig } from "../models";

export class NIFTRON {
  private static isInitialized: boolean = false;
  private static secretKey: string | undefined = undefined;
  private static projectKey: string | undefined = undefined;

  constructor(niftronConfig: NiftronConfig) {
    if (niftronConfig.secretKey != undefined) {
      NIFTRON.secretKey = niftronConfig.secretKey;
    }
    if (niftronConfig.projectKey != undefined) {
      NIFTRON.projectKey = niftronConfig.projectKey;
    }
    if (niftronConfig.credential != undefined) {
      const niftronCredential: File = niftronConfig.credential;
      if (niftronCredential.type != "niftron") {
        throw new Error("only .niftron credential files are accepted");
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
          "please provide a secret key or .niftron credential file"
        );
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
          "please provide a secret key or .niftron credential file"
        );
      }
      if (!NIFTRON.isInitialized) {
        throw new Error("please initialize the config");
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
