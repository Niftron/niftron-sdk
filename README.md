# Niftron-SDK

Niftron is a Blockchain as a Service platform which allows anyone to integrate blockchain with their products or projects easily and efficiently to improve trust by providing transparency, security and ownership.

Niftron SDK enables any application to create NFTs and in the process tokenizing everything.

## Getting Started

Install the niftron sdk to your nodejs application.

```
npm install --save niftron-sdk

```

## Configure SDK

Configure the Niftron sdk using your project key and dev console secret Key obtained from https://console.niftron.com/credentials.

```typescript
import { NiftronConfig, NIFTRON } from "niftron-sdk";

const niftronConfig: NiftronConfig = {
  projectKey: "--------- Project Key -----------",
  secretKey: "--------- Secret Key -----------",
};

const niftron: NIFTRON = new NIFTRON(niftronConfig);

niftron.initialize()

```


## Niftron Auth

The following steps are required to set up Niftron Auth.

-Add Script to index.html only if you are using Niftron Auth Redirect

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

```typescript
niftron.user.authRedirect();

```

-Niftron Check Auth State

```typescript
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

```typescript
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

```typescript
import { NiftronKeypair, CreateCertificateModel, TokenType } from "niftron-sdk";

...........
const createCertificateModel: CreateCertificateModel = {
  tokenName: "----Unique Name-----",
  tokenType: TokenType.SFT,
  tokenData: "-----Stringified Json From User-----",
  tokenCount: 10,
  previewImageUrl: "---imageURL---",
};

niftron.tokenBuilder.CreateCertificate(createCertificateModel)
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log("err" + err);
  });



```
-Mint Token with custom Options (CreateCertificate)

```typescript
import { NiftronKeypair, CreateCertificateModel, TokenType, CreateCertificateOptionsModel } from "niftron-sdk";

...........
const createCertificateModel: CreateCertificateModel = {
  tokenName: "----Unique Name-----",
  tokenType: TokenType.SFT,
  tokenData: "-----Stringified Json From User-----",
  tokenCount: 10,
  previewImageUrl: "---imageURL---",
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

```typescript
import { CreateBadgeModel, TokenType } from "niftron-sdk";

...........
const createBadgeModel: CreateBadgeModel = {
  tokenName: "----Unique Name-----",
  tokenType: TokenType.SFT,
  tokenData: "-----Stringified Json From User-----",
  tokenCount: 10,
  previewImageUrl: "---imageURL---",
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

```typescript
import { CreateBadgeModel, TokenType, CreateBadgeOptionsModel } from "niftron-sdk";

...........
const createBadgeModel: CreateBadgeModel = {
  tokenName: "----Unique Name-----",
  tokenType: TokenType.SFT,
  tokenData: "-----Stringified Json From User-----",
  tokenCount: 10,
  previewImageUrl: "---imageURL---",
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

```typescript
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
