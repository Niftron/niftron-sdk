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
  UserModel,
  ActivateUserModel,
  NiftronAccount,
  PledgeModel,
  PledgeResponse,
  NiftronAssetResponse,
  XLMAssetResponse,
  TokenId,
  Token,
  Pledge,
  NiftronConfig,
} from "../models";
import { NiftronUserLambda, StellarUrlTest, StellarUrl, NiftronIssuerPublicKey, PatternPK, PatternSK } from "../constants";
import { Keypair, Server, Networks, TransactionBuilder, Operation } from "stellar-sdk";
import { Utils } from "../utils";
import { XDRBuilder } from "../xdrBuilder";
import jwt from "jsonwebtoken";
import { Observable, Observer } from 'rxjs';
import { getAccountById, goLive, pledge, getTokenByIdList } from "../api";
/**
 * User Module
 */
export module User {
  let secretKey: string;
  let session: UserModel;
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

  const sessionObserver: Observable<any> = Observable.create(function (observer: Observer<any>) {
    if (localStorage.getItem("niftoken")) {
      const token = localStorage.getItem("niftoken");
      if (token != null) {
        const decodedToken: any = jwt.decode(token);
        if (decodedToken == null && typeof (decodedToken) == "string") {
          localStorage.removeItem("niftoken");
          observer.error(new Error("no token"));
        } else {
          if (new Date(decodedToken.exp).toISOString() > new Date().toISOString()) {
            localStorage.removeItem("niftoken");
            observer.error(new Error("no token"));
          } else {
            session = <UserModel>decodedToken
            observer.next(session);
            observer.error(null);
            observer.complete()
          }
        }
      }
    }
    observer.error(new Error("no token"));
  });

  /**
   * onAuthStateChanged
   * @param {UserModel} authUser UserModel.
   * @param {Error} error Error.
  */
  export function onAuthStateChanged(
    authUser = (val: UserModel) => { return val },
    error = (err: Error) => { return err }) {
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
  export function getCurrentUser(
    authUser = (val: UserModel) => { return val },
    error = (err: Error) => { return err }) {
    sessionObserver.subscribe({
      next: (value) => authUser(value),
      error: (e) => error(e),
      complete: () => console.log('complete')
    });
  }

  /**
   * logout
   */
  export function logout() {
    localStorage.removeItem("niftoken");
    window.location.assign(window.location.href);

  }

  /**
  * authRedirect
  * @param {AuthModel} authModel AuthModel.
  */
  export function authRedirect() {
    try {
      let query = ""
      query += `&projectKey=${projectPublicKey}`
      const authLink = `https://account.niftron.com/?${query}`;
      window.location.assign(authLink);
    } catch (err) {
      throw err;
    }
  };

  /**
  * popUpAuth
  */
  export async function popUpAuth(): Promise<string | null> {
    return new Promise((resolve) => {
      const url =
        "https://account.niftron.com/" +
        "?serviceType=1" +
        "&projectKey=" +
        projectPublicKey +
        // "&xdr=" + xdr +
        "&origin=" +
        window.location.href;
      const title = "";
      const width = 720;
      const height = 720;
      var left = window.screen.width / 2 - width / 2;
      var top = window.screen.height / 2 - height / 2;
      var options = "";

      options += "toolbar=no,location=no,directories=no,status=no";
      options += ",menubar=no,scrollbars=no,resizable=no,copyhistory=no";

      options += ",width=" + width;
      options += ",height=" + height;
      options += ",top=" + top;
      options += ",left=" + left;

      const MyWindow = window.open(url, title, options);
      const messageEvent = (event: any) => {
        if (event.origin !== "https://account.niftron.com") return;
        window.removeEventListener("message", messageEvent);
        localStorage.setItem("niftoken",event.data)
        resolve(event.data);
      };
      window.addEventListener("message", messageEvent, false);
      if (MyWindow != null && MyWindow.closed) {
        resolve(null);
      }
    });
  }




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
  async function register(
    type: UserType,
    alias: string,
    email: string,
    password: string,
    recoveryQuestion: string,
    securityAnswer: string,
    keypair: Keypair,
    authType: UserAuthType
  ): Promise<number | null> {
    try {
      let publicKey = keypair.publicKey();

      let pash = "";
      let encryptedSecret = "";
      let encryptedRecoverySecret = "";

      if (password != "") {
        pash = sha256(password);
        encryptedSecret = Utils.symmetricEncryption.encrypt(keypair.secret(), pash);
      }

      if (securityAnswer != "") {
        encryptedRecoverySecret = Utils.symmetricEncryption.encrypt(
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
        NiftronUserLambda + "/users/register",
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
  async function fundAccountInTestnet(publicKey: string): Promise<boolean> {
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
  export async function createHighPrivacyUser(
    options: HighPrivacyUserCreation
  ): Promise<HighPrivacyAccountResponse> {
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
  export async function createMediumPrivacyUser(
    options: MediumPrivacyUserCreation
  ): Promise<MediumPrivacyAccountResponse> {
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
  export async function createLowPrivacyUser(
    options: LowPrivacyUserCreation
  ): Promise<LowPrivacyAccountResponse> {
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
  export async function login(key: string, password: string): Promise<NiftronAccount> {
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
      const res = await axios.post(NiftronUserLambda + "/users/login", postBody, {
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
  export async function loginWithSecret(secretKey: string) {
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
        NiftronUserLambda + "/users/xdrLogin",
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
* Test Transfer - Sends a minimum of 2 NIFTRONS to Niftron Distributor
* @param {PledgeModel} options PledgeModel.
* @returns {PledgeResponse} result PledgeResponse
*/
  export async function testTransfer(
    options?: PledgeModel
  ): Promise<PledgeResponse> {
    try {

      let { xdrs } = await XDRBuilder.pledge(
        merchantKeypair.publicKey(), options?.amount ? options.amount : undefined
      );
      const xdr = await XDRBuilder.signXDR(xdrs[0].xdr, merchantKeypair.secret());

      let postBody: Pledge = {
        primaryPublicKey: merchantKeypair.publicKey(),
        merchant: projectPublicKey ? projectPublicKey : merchantKeypair.publicKey(),
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
  export async function getNiftronCreditBalance(publicKey?: string, test?: boolean): Promise<NiftronAssetResponse | null> {
    try {
      if (publicKey != undefined && !PatternPK.test(publicKey)) {
        throw new Error("Invalid public key")
      }
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
  export async function getXLMBalance(publicKey?: string, test?: boolean): Promise<XLMAssetResponse | null> {
    try {
      if (publicKey != undefined && !PatternPK.test(publicKey)) {
        throw new Error("Invalid public key")
      }
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


  /**
  * Get Tokens By PublicKey
  * @param {string} publicKey string.
  * @param {boolean} test boolean.
  * @returns {Promise<Token | null>} result Promise<Token | null>
  */
  export async function getTokensByPublicKey(publicKey?: string, test?: boolean): Promise<Array<Token> | null> {
    try {
      if (publicKey != undefined && !PatternPK.test(publicKey)) {
        throw new Error("Invalid public key")
      }
      let assets: Array<NiftronAssetResponse> = [];
      let idList: Array<TokenId> = [];
      let tokenResponse: Array<Token> = [];

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
        const bal = parseFloat(balance.balance)
        if (balance.asset_type != "native" && balance.asset_issuer != NiftronIssuerPublicKey && bal > 0.0000000) {
          assets.push({
            assetCode: balance.asset_code, balance: bal, issuer: balance.asset_issuer
          });

          idList.push({
            id: balance.asset_code, issuer: balance.asset_issuer
          })
        }
      });
      if (assets.length == 0) {
        throw new Error("Token not found in blockchain")
      }

      let result = await getTokenByIdList(idList)
      if (result == null) {
        throw new Error("Token data not found in Niftron")
      }
      if (result.data && result.data.length == 0) {
        throw new Error("Token data not found in Niftron")
      }
      result.data.forEach((token: any) => {
        tokenResponse.push(<Token>token.data)
      });
      return tokenResponse;
    } catch (err) {
      throw err;
    }
  }


  /**
       * build login xdr
       * @param {Keypair} keypair Keypair.
       * @returns {string|null} response string|null
       */
  async function buildLoginXDR(keypair: Keypair) {
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

  /**
  * Activate Live Net User
  * @param {ActivateUserModel} activateUserModel ActivateUserModel
  * @returns {Promise<NiftronAccount>} niftronId Promise<NiftronAccount>
  */
  export async function activateLiveNetUser(
    activateUserModel: ActivateUserModel,
    // options?: ActivateUserOptionsModel
  ): Promise<NiftronAccount> {
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
}
