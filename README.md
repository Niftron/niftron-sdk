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

```

## Mint Token

-Mint Token (CreateCertificate)

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

niftron.tokenBuilder
  .CreateCertificate(createCertificateModel)
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log("err" + err);
  });


```
