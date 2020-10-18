# niftron-sdk

Niftron SDK enables any application to create NFTs and in the process tokenizing everything.

## Getting Started

Install the niftron sdk to your nodejs application.

```
npm install --save niftron-sdk

```

## Configure SDK

Configure the niftron sdk using your creator secret Key obtained from https://creator.niftron.com.

```
import { NiftronConfig, NIFTRON } from "niftron-sdk";

const niftronConfig: NiftronConfig = {
  secretKey: "--------- Secret Key -----------",
};

const niftron: NIFTRON = new NIFTRON(niftronConfig);

niftron.initialize()

```


## Niftron Auth

The following steps are required to set up Niftron Auth.

-Add Script to index.html on if you are using Niftron Auth Redirect

```
...........
<head>
...........

  <script src="https://niftron-util.s3.amazonaws.com/niftron-auth.js"></script>

...........
</head>
...........

```

-Niftron Auth Redirect allows niftron creators to integrate niftron auth to their applications

```
niftron.user.authRedirect({ redirectUrl: "-----redirectUrl----" });

```

-Niftron Check Auth State

```
niftron.user.onAuthStateChanged(
  authUser => {
    console.log(authUser)
  }, 
  err => {
      if (err) {
        console.log(err)
    }
  }
);
```


-Niftron Get Current User

```
niftron.user.getCurrentUser(
  authUser => {
    console.log(authUser)
  }, 
  err => {
      if (err) {
        console.log(err)
    }
  }
);
```

## Mint Token

-Mint Token (CreateCertificate)

```
import { NiftronKeypair, CreateCertificateModel, TokenType } from "niftron-sdk";

...........
const testKeyPair: NiftronKeypair = NiftronKeypair.fromSecret("--------- Secret Key -----------");

const createCertificateModel: CreateCertificateModel = {
  tokenName: "----Unique Name-----",
  tokenType: TokenType.SFT,
  tokenData: "-----Stringified Json From User-----",
  tokenCount: 10,
  previewImageUrl: "---imageURL---",
  creatorKeypair: testKeyPair,
};

niftron.tokenBuilder
  .CreateCertificate(createCertificateModel)
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log("err" + err);
  });


```
-Mint Token with custom Options (CreateCertificate)

```
import { NiftronKeypair, CreateCertificateModel, TokenType, CreateCertificateOptionsModel } from "niftron-sdk";

...........
const testKeyPair: NiftronKeypair = NiftronKeypair.fromSecret("--------- Secret Key -----------");

const createCertificateModel: CreateCertificateModel = {
  tokenName: "----Unique Name-----",
  tokenType: TokenType.SFT,
  tokenData: "-----Stringified Json From User-----",
  tokenCount: 10,
  previewImageUrl: "---imageURL---",
  creatorKeypair: testKeyPair,
};

const options: CreateCertificateOptionsModel = {
  tradable: true,//default is false
  transferable: true,//default is false
  authorizable: true,//default is false
  encryptData: true,//default is false
};

niftron.tokenBuilder
  .CreateCertificate(createCertificateModel,options)
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log("err" + err);
  });


```


-Mint Token (CreateBadge)

```
import { NiftronKeypair, CreateBadgeModel, TokenType } from "niftron-sdk";

...........
const testKeyPair: NiftronKeypair = NiftronKeypair.fromSecret("--------- Secret Key -----------");

const createBadgeModel: CreateBadgeModel = {
  tokenName: "----Unique Name-----",
  tokenType: TokenType.SFT,
  tokenData: "-----Stringified Json From User-----",
  tokenCount: 10,
  previewImageUrl: "---imageURL---",
  creatorKeypair: testKeyPair,
};

niftron.tokenBuilder
  .CreateBadge(createBadgeModel)
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log("err" + err);
  });


```
-Mint Token with custom Options (CreateBadge)

```
import { NiftronKeypair, CreateBadgeModel, TokenType, CreateBadgeOptionsModel } from "niftron-sdk";

...........
const testKeyPair: NiftronKeypair = NiftronKeypair.fromSecret("--------- Secret Key -----------");

const createBadgeModel: CreateBadgeModel = {
  tokenName: "----Unique Name-----",
  tokenType: TokenType.SFT,
  tokenData: "-----Stringified Json From User-----",
  tokenCount: 10,
  previewImageUrl: "---imageURL---",
  creatorKeypair: testKeyPair,
};

const options: CreateBadgeOptionsModel = {
  tradable: true,//default is false
  transferable: true,//default is false
  authorizable: true,//default is false
  encryptData: true,//default is false
};

niftron.tokenBuilder
  .CreateBadge(createBadgeModel,options)
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log("err" + err);
  });


```
## Add Token Data

-Add Certificate Data (AddCertificateData)

```
import { NiftronKeypair, AddCertificateDataModel, TokenType } from "niftron-sdk";

...........
const testKeyPair: NiftronKeypair = NiftronKeypair.fromSecret("--------- Secret Key -----------");


const addCertificateDataModel: AddCertificateDataModel = {
  assetCode: "SN**********", //can be retrieved from niftron or use the assetCode provided during creation
  data: "Stringified Json",
  ownerKeypair: testKeyPair,
};

niftron.tokenBuilder
  .AddCertificatData(addCertificateDataModel)
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log("err" + err);
  });

```
