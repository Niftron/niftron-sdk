import sha256 from "sha256";
import axios from "axios";
import {
  UserType,
  UserAuthType,
  HighPrivacyUserCreation,
  HighPrivacyAccountResponse,
  LowPrivacyUserCreation,
  LowPrivacyAccountResponse,
  MediumPrivacyAccountResponse,
  MediumPrivacyUserCreation,
  XDR,
  AuthModel,
  MerchantAuthType,
  UserModel,
  AuthResponse,
  ActivateUserModel,
  CreateBadgeOptionsModel,
  NiftronAccount,
  PledgeModel,
  PledgeResponse,
  NiftronAssetResponse,
  XLMAssetResponse,
} from "../models";
import { niftronUserLambda, StellarUrlTest, StellarUrl, NiftronIssuerPublicKey } from "../constants";
import { Keypair, Server, Networks, TransactionBuilder, Operation } from "stellar-sdk";
import { Utils } from "../utils";
import { XDRBuilder } from "../xdrBuilder";
import jwt from "jsonwebtoken";
import { Observable, Observer } from 'rxjs';
import { getAccountById, goLive, pledge } from "../api";
/**
 * User Class
 */
export module User {
  let secretKey: string;
  let session: UserModel;
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
  * Test Transfer - Sends a minimum of 2 NIFTRONS to Niftron Distributor
  * @param {PledgeModel} options PledgeModel.
  * @returns {PledgeResponse} result PledgeResponse
  */
  export const testTransfer = async (
    options?: PledgeModel
  ): Promise<PledgeResponse> => {
    try {

      let { xdrs } = await XDRBuilder.pledge(
        merchantKeypair.publicKey(), options?.amount ? options.amount : undefined
      );
      const xdr = await XDRBuilder.signXDR(xdrs[0].xdr, merchantKeypair.secret());

      let postBody = {
        primaryPublicKey: merchantKeypair.publicKey(),
        merchant: projectPublicKey,
        xdr
      };
      const res = await pledge(postBody);
      if (res == null) {
        throw new Error("Failed to submit pledge to NIFTRON");
      }

      switch (res) {
        case 200:
          const result: PledgeResponse = {
            status: "Your pledge has been heard!"
          }
          return result;
        case 201:
          throw new Error("Account not found");
        case 202:
          throw new Error("Insufficient fund in account");
        case 400:
          throw new Error("Failed to submit pledge to NIFTRON");
        default:
          throw new Error("Failed to submit pledge to NIFTRON");
      }
    } catch (err) {
      throw err;
    }
  };

  /**
   * Get Niftron Credit Balance
   * @param {string} publicKey string.
   * @param {boolean} test boolean.
   * @returns {Promise<NiftronAssetResponse | null>} result Promise<NiftronAssetResponse | null>
   */
  export const getNiftronCreditBalance = async (publicKey?: string, test?: boolean): Promise<NiftronAssetResponse | null> => {
    try {
      let response: NiftronAssetResponse | null = null
      let server = new Server(test ? StellarUrlTest : StellarUrl);
      let sourceAccount;
      try {
        sourceAccount = await server.loadAccount(publicKey ? publicKey : merchantKeypair.publicKey());
      } catch (err) {
        try {
          server = new Server(StellarUrlTest);
          sourceAccount = await server.loadAccount(publicKey ? publicKey : merchantKeypair.publicKey());
        } catch (err2) {
          throw err2;
        }
      }
      sourceAccount.balances.forEach(function (balance) {
        if (balance.asset_type != "native" && balance.asset_issuer == NiftronIssuerPublicKey && balance.asset_code == "NIFTRON") {
          response = <NiftronAssetResponse>{
            assetCode: balance.asset_code, balance: parseFloat(balance.balance),
            limit: parseFloat(balance.limit), issuer: balance.asset_issuer
          };
        }
      });
      return response
    } catch (err) {
      throw err;
    }
  }

  /**
   * Get Niftron Credit Balance
   * @param {string} publicKey string.
   * @param {boolean} test boolean.
   * @returns {Promise<XLMAssetResponse | null>} result Promise<XLMAssetResponse | null>
   */
  export const getXLMBalance = async (publicKey?: string, test?: boolean): Promise<XLMAssetResponse | null> => {
    try {
      let response: XLMAssetResponse | null = null
      let server = new Server(test ? StellarUrlTest : StellarUrl);
      let sourceAccount;
      try {
        sourceAccount = await server.loadAccount(publicKey ? publicKey : merchantKeypair.publicKey());
      } catch (err) {
        try {
          server = new Server(StellarUrlTest);
          sourceAccount = await server.loadAccount(publicKey ? publicKey : merchantKeypair.publicKey());
        } catch (err2) {
          throw err2;
        }
      }
      sourceAccount.balances.forEach(function (balance) {
        if (balance.asset_type == "native") {
          response = <XLMAssetResponse>{
            assetCode: "XLM", balance: parseFloat(balance.balance)
          };

        }
      });
      return response
    } catch (err) {
      throw err;
    }
  }


  // /**
  // * Get Tokens By PublicKey
  // * @param {string} publicKey string.
  // * @param {boolean} test boolean.
  // * @returns {Promise<NiftronAssetResponse | null>} result Promise<NiftronAssetResponse | null>
  // */
  // export const getTokensByPublicKey = async (publicKey: string, test?: boolean): Promise<Array<NiftronAssetResponse> | null> => {
  //   try {
  //     let assets: Array<NiftronAssetResponse> = [];
  //     let server = new Server(test ? StellarUrlTest : StellarUrl);
  //     let sourceAccount;
  //     try {
  //       sourceAccount = await server.loadAccount(publicKey);
  //     } catch (err) {
  //       try {
  //         server = new Server(StellarUrlTest);
  //         sourceAccount = await server.loadAccount(publicKey);
  //       } catch (err2) {
  //         throw err2;
  //       }
  //     }
  //     sourceAccount.balances.forEach(function (balance) {
  //       if (balance.asset_type != "native" && balance.asset_issuer != NiftronIssuerPublicKey && balance.balance > 0.0000000) {
  //         assets.push({
  //           assetCode: balance.asset_code, balance: balance.balance,
  //           limit: balance.limit, issuer: balance.asset_issuer
  //         });
  //       }
  //     });
  //     return assets;
  //   } catch (err) {
  //     throw err;
  //   }
  // }

  const sessionObserver: Observable<any> = Observable.create(function (observer: Observer<any>) {
    if (localStorage.getItem("niftoken") != null) {
      const token = localStorage.getItem("niftoken");
      if (token != null) {
        jwt.verify(token,
          "ijk3dp4n",
          (err: any, decodedToken: any) => {
            if (err || !decodedToken) {
              localStorage.removeItem("niftoken");
              observer.error(new Error("no token"));
            } else {
              session = <UserModel>decodedToken
              observer.next(session);
              observer.error(null);
              observer.complete()
            }
          }
        );
      }
    }
    observer.error(new Error("no token"));
  });

  /**
   * onAuthStateChanged
   * @param {UserModel} authUser UserModel.
   * @param {Error} error Error.
  */
  export const onAuthStateChanged = (
    authUser = (val: UserModel) => { return val },
    error = (err: Error) => { return err }) => {
    sessionObserver.subscribe({
      next: (value) => authUser(value),
      error: (e) => error(e),
      complete: () => console.log('complete')
    });
  }

  /**
   * getCurrentUser
   * @param {UserModel} authUser UserModel.
   * @param {Error} error Error.
  */
  export const getCurrentUser = (
    authUser = (val: UserModel) => { return val },
    error = (err: Error) => { return err }) => {
    sessionObserver.subscribe({
      next: (value) => authUser(value),
      error: (e) => error(e),
      complete: () => console.log('complete')
    });
  }

  /**
   * logout
   */
  export const logout = () => {
    localStorage.removeItem("niftoken");
    window.location.assign(window.location.href);

  }

  /**
  * authRedirect
  * @param {AuthModel} authModel AuthModel.
  */
  export const authRedirect = (test?: boolean) => {
    try {
      let query = ""
      //add projectKey
      query += `&projectKey=${projectPublicKey}`

      // //add redirect url
      // if (authModel.redirectUrl && authModel.redirectUrl != "") {
      //   const RedirectUrl = authModel.redirectUrl
      //   query += `redirectUrl=${encodeURI(RedirectUrl)}`
      // }

      // //add merchantKey
      // query += `&merchantKey=${merchantKeypair.publicKey()}`

      // //add merchantAuthType
      // if (authModel.merchantAuthType) {
      //   const MerchantAuth = authModel.merchantAuthType ? authModel.merchantAuthType : MerchantAuthType.REGULAR;
      //   query += `&merchantAuthType=${encodeURI(MerchantAuth)}`
      // }

      // //add user account type
      // if (authModel.userType) {
      //   const userType = authModel.userType
      //   query += `&type=${encodeURI(userType)}`
      // }

      // //add warning
      // if (authModel.warning) {
      //   const warning = authModel.warning
      //   query += `&warning=${encodeURI(warning)}`
      // }

      // const authLink = `https://auth.niftron.com/?${query}`
      const authLink = test ? `https://dev.account.niftron.com/?${query}` : `https://account.niftron.com/?${query}`;

      window.location.assign(authLink);
    } catch (err) {
      throw err;
    }
  };

  /**
   * register niftron user
   * @param {UserType} type UserType.
   * @param {string} alias string.
   * @param {string} email string.
   * @param {string} password string.
   * @param {string} recoveryQuestion string.
   * @param {string} securityAnswer string.
   * @param {Keypair} keypair Keypair.
   * @param {UserAuthType} authType UserAuthType.
   * @returns {string} niftronId string
   */
  const register = async (
    type: UserType,
    alias: string,
    email: string,
    password: string,
    recoveryQuestion: string,
    securityAnswer: string,
    keypair: Keypair,
    authType: UserAuthType
  ): Promise<number | null> => {
    try {
      let publicKey = keypair.publicKey();

      let pash = "";
      let encryptedSecret = "";
      let encryptedRecoverySecret = "";

      if (password != "") {
        pash = sha256(password);
        encryptedSecret = Utils.encryptSecret(keypair.secret(), pash);
      }

      if (securityAnswer != "") {
        encryptedRecoverySecret = Utils.encryptSecret(
          keypair.secret(),
          sha256(securityAnswer.toLowerCase())
        );
      }

      let { xdrs, secondaryPublicKey } = await XDRBuilder.register(
        keypair.publicKey()
      );

      await Promise.all(
        xdrs.map(async (item: XDR, index: number, array: Array<XDR>) => {
          xdrs[index].xdr = await XDRBuilder.signXDR(item.xdr, keypair.secret());
        })
      );

      let accounts = [];
      accounts.push({ publicKey: keypair.publicKey(), accountType: "0" });
      accounts.push({ publicKey: secondaryPublicKey, accountType: "1" });

      let postBody = {
        type: type,
        alias: alias.toLowerCase(),
        email: email != "" ? email.toLowerCase() : "",
        publicKey: publicKey,
        encryptedSecret: encryptedSecret,
        encryptedRecoverySecret: encryptedRecoverySecret,
        recoveryQuestion: recoveryQuestion,
        authType: authType,
        accounts: accounts,
        xdrs,
      };
      const res = await axios.post(
        niftronUserLambda + "/users/register",
        postBody,
        {
          headers: {
            // 'Authorization': "bearer " + token,
            "Content-Type": "application/json",
          },
        }
      );


      if (res == null) {
        return null;
      }

      if (res.status == 200) {
        localStorage.setItem("niftoken", res.data.data.token);
        return res.status;
      }

      return res.status;

    } catch (err) {
      console.log("register: " + err);
      throw err;
    }
  };

  /**
   * Fund Account In Testnet
   * @param {string} publicKey string.
   * @returns {boolean} response boolean
   */
  const fundAccountInTestnet = async (publicKey: string): Promise<boolean> => {
    try {
      // if (StellarNetwork === "TestNet") {
      const STELLAT_FRIEND_BOT_URL = `https://friendbot.stellar.org/?addr=`;
      const stellarResponse = await axios.get(
        `${STELLAT_FRIEND_BOT_URL}${publicKey}`
      );

      if (stellarResponse !== null && stellarResponse.status !== 200) {
        throw new Error("test bot failed");
      }
      return true;
      // }
    } catch (err) {
      throw err;
    }
  };

  /**
   * Create High Privacy Niftron User
   * @param {HighPrivacyUserCreation} options HighPrivacyUserCreation.
   * @returns {HighPrivacyAccountResponse} result HighPrivacyAccountResponse
   */
  export const createHighPrivacyUser = async (
    options: HighPrivacyUserCreation
  ): Promise<HighPrivacyAccountResponse> => {
    try {
      let keypair = Keypair.random();
      let result: MediumPrivacyAccountResponse = {
        status: "Account created successfully",
      };
      const response = await register(
        options.type,
        options.alias,
        "",
        "",
        "",
        "",
        keypair,
        UserAuthType.HIGHPRIVACY
      );
      if (response === null) {
        throw new Error("Registration failed");
      }
      if (response === 202) {
        throw new Error("Alias already used");
        // result.status = "Alias already used";
        // return result;
      }

      secretKey = keypair.secret();
      result.publicKey = keypair.publicKey();
      result.secretKey = keypair.secret();
      return result;
    } catch (err) {
      throw err;
    }
  };

  /**
   * Create High Privacy Niftron User
   * @param {MediumPrivacyAccountCreation} options MediumPrivacyAccountCreation.
   * @returns {MediumPrivacyAccountResponse} result MediumPrivacyAccountResponse
   */
  export const createMediumPrivacyUser = async (
    options: MediumPrivacyUserCreation
  ): Promise<MediumPrivacyAccountResponse> => {
    try {
      let keypair = Keypair.random();
      let result: MediumPrivacyAccountResponse = {
        status: "Account created successfully",
      };

      const response = await register(
        options.type,
        options.alias,
        "",
        options.password,
        "",
        "",
        keypair,
        UserAuthType.MEDIUMPRIVACY
      );
      if (response === null) {
        throw new Error("Registration failed");
      }
      if (response === 202) {
        throw new Error("Alias already used");
      }
      if (response === 201) {
        throw new Error("Email already used");
      }
      secretKey = keypair.secret();
      result.publicKey = keypair.publicKey();
      result.secretKey = keypair.secret();
      return result;
    } catch (err) {
      throw err;
    }
  };

  /**
   * Create High Privacy Niftron User
   * @param {LowPrivacyUserCreation} options LowPrivacyUserCreation.
   * @returns {LowPrivacyAccountResponse} result LowPrivacyAccountResponse
   */
  export const createLowPrivacyUser = async (
    options: LowPrivacyUserCreation
  ): Promise<LowPrivacyAccountResponse> => {
    try {
      let keypair = Keypair.random();
      let result: LowPrivacyAccountResponse = {
        status: "Account created successfully",
      };
      const response = await register(
        options.type,
        options.alias,
        options.email,
        options.password,
        options.recoveryQuestion,
        options.securityAnswer,
        keypair,
        UserAuthType.LOWPRIVACY
      );
      if (response === null) {
        throw new Error("Registration failed");
      }
      if (response === 202) {
        throw new Error("Alias already used");
      }
      if (response === 201) {
        throw new Error("Alias already used");
      }
      secretKey = keypair.secret();
      result.publicKey = keypair.publicKey();
      result.secretKey = keypair.secret();
      return result;
    } catch (err) {
      throw err;
    }
  };

  /**
   * Login
   * @param {string} key string.
   * @param {string} password string.
   * @returns {Promise<NiftronAccount>} response Promise<NiftronAccount>
   */
  export const login = async (key: string, password: string): Promise<NiftronAccount> => {
    try {
      const user: NiftronAccount = await getAccountById(key);
      if (user == null) {
        throw new Error("Account not found in niftron");
      }

      let pash = sha256(password);
      ////console.log(pash)
      let postBody = {
        key: key,
        password: pash
      };
      const res = await axios.post(niftronUserLambda + "/users/login", postBody, {
        headers: {
          // 'Authorization': "bearer " + token,
          "Content-Type": "application/json"
        }
      });
      if (res == null) {
        throw new Error("Failed to log in");
      }
      switch (res.status) {
        case 200:
          localStorage.setItem("niftoken", res.data.data.token);

          return user;
        case 201:
          throw new Error("Password is incorrect");
        case 202:
          throw new Error("Activate merchant account first");
        case 203:
          throw new Error("You are a high privacy user try secret key login");
        case 400:
          throw new Error("Failed to log in");
        default:
          throw new Error("Failed to log in");
      }

      // return user;

    } catch (err) {
      throw err;
    }
  }

  /**
     * Login with Secret
     * @param {string} secretKey string.
     * @returns {Promise<NiftronAccount>} response Promise<NiftronAccount>
     */
  export const loginWithSecret = async (secretKey: string) => {
    try {

      const user: NiftronAccount = await getAccountById(
        Keypair.fromSecret(secretKey).publicKey()
      );
      if (user == null) {
        throw new Error("Account not found in niftron");
      }

      let keypair = Keypair.fromSecret(secretKey)
      const xdr = await buildLoginXDR(keypair);
      if (xdr === null) {
        throw new Error("Login xdr building failed ");
      }

      //console.log(xdr)
      let postBody = {
        xdr: xdr
      };

      const res = await axios.post(
        niftronUserLambda + "/users/xdrLogin",
        postBody,
        {
          headers: {
            // 'Authorization': "bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (res == null) {
        throw new Error("Failed to log in");
      }
      switch (res.status) {
        case 200:
          localStorage.setItem("niftoken", res.data.data.token);

          return user;
        case 201:
          throw new Error("Password is incorrect");
        case 202:
          throw new Error("Activate merchant account first");
        case 203:
          throw new Error("You are a high privacy user try secret key login");
        case 400:
          throw new Error("Failed to log in");
        default:
          throw new Error("Failed to log in");
      }

      // return user;
    } catch (err) {
      throw err;
    }
  }

  /**
       * build login xdr
       * @param {Keypair} keypair Keypair.
       * @returns {string|null} response string|null
       */
  const buildLoginXDR = async (keypair: Keypair) => {
    try {
      let server = new Server(StellarUrlTest);
      let sourceAccount;
      let networkPassphrase;
      try {
        sourceAccount = await server.loadAccount(keypair.publicKey());
        networkPassphrase = Networks.TESTNET
      } catch (err2) {
        return null
      }
      let transaction = new TransactionBuilder(sourceAccount, {
        fee: "150",
        networkPassphrase: networkPassphrase
      })
        .addOperation(Operation.manageData({ name: 'login', value: new Date().toUTCString(), }))
        .setTimeout(0)
        .build();
      transaction.sign(keypair);
      return transaction.toEnvelope().toXDR('base64')
    } catch (e) {
      return null
    }
  }

  // /**
  //  * Download Credentials
  //  */
  // export const downloadCredentials = async () => {
  //   try {
  //     var FileSaver = require("file-saver");
  //     var blob = new Blob([btoa(JSON.stringify({ secretKey: secretKey }))], {
  //       type: "text/plain;charset=utf-8",
  //     });
  //     FileSaver.saveAs(blob, "credential.niftron");
  //   } catch (err) {
  //     throw err;
  //   }
  // };

  /**
  * Activate Live Net User
  * @param {ActivateUserModel} activateUserModel ActivateUserModel
  * @returns {Promise<NiftronAccount>} niftronId Promise<NiftronAccount>
  */
  export const activateLiveNetUser = async (
    activateUserModel: ActivateUserModel,
    // options?: ActivateUserOptionsModel
  ): Promise<NiftronAccount> => {
    try {
      const user: NiftronAccount = await getAccountById(
        activateUserModel.userKeypair.publicKey()
      );
      if (user == null) {
        throw new Error("Creator account not found in niftron");
      }
      //build go live xdr
      const goLiveXdr = await XDRBuilder.goLive(
        activateUserModel.userKeypair.publicKey(),
        merchantKeypair.publicKey()
      );
      //merchant signs go live
      const signedGoLiveXdr = await XDRBuilder.signXDR(goLiveXdr, merchantKeypair.secret())
      //submit go live xdr
      const goLiveRes = await goLive(
        activateUserModel.userKeypair.publicKey(),
        merchantKeypair.publicKey(),
        signedGoLiveXdr
      );
      if (goLiveRes == null) {
        throw new Error("Failed to go live xdr to NIFTRON");
      }
      switch (goLiveRes) {
        case 201:
          throw new Error("Merchant not found");
        case 202:
          throw new Error("Activate merchant account first");
        case 203:
          throw new Error("Account not found");
        case 204:
          throw new Error("User account is already activated");
        case 205:
          throw new Error("Insufficient fund in account");
        case 400:
          throw new Error("Failed to go live xdr to NIFTRON");
      }
      //build activate xdr
      const activateXdr = await XDRBuilder.activate(
        activateUserModel.userKeypair.publicKey(),
        merchantKeypair.publicKey()
      );
      //user signs activate xdr
      const signedActivateXdr = await XDRBuilder.signXDR(activateXdr, activateUserModel.userKeypair.secret())
      //submit activate xdr
      const activateRes = await goLive(
        activateUserModel.userKeypair.publicKey(),
        merchantKeypair.publicKey(),
        signedActivateXdr
      );
      if (activateRes == null) {
        throw new Error("Failed to activate xdr to NIFTRON");
      }
      switch (activateRes) {
        case 200:
          return user
        case 201:
          throw new Error("Merchant not found");
        case 202:
          throw new Error("Activate merchant account first");
        case 203:
          throw new Error("Account not found");
        case 204:
          throw new Error("User account is not live");
        case 205:
          throw new Error("Insufficient fund in account");
        case 400:
          throw new Error("Failed to activate xdr to NIFTRON");
      }
      return user
    } catch (err) {
      console.log("Certificate minting error" + err);
      throw err;
    }
  };

  // export const getCredentials = () => {
  //   try {
  //     return JSON.stringify({ secretKey: secretKey });
  //   } catch (err) {
  //     throw err;
  //   }
  // };
}
