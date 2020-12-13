import { Utils } from "../utils";
// import IPFS from 'ipfs';
const IPFS = require("ipfs");

export module IpfsService {
  export const AddToIPFS = async (
    file: string,
    secretKey?: string
  ): Promise<any | null> => {
    let stringToUse = file;
    if (secretKey) {
      stringToUse = Utils.encryptSecret(file, secretKey);
    }
    const node = await IPFS.create({
      repo: String(Math.random() + Date.now()),
    });
    console.log("IPFS node is ready");
    const { id, agentVersion, protocolVersion } = await node.id();
    console.log(id, agentVersion, protocolVersion);
    for await (const { cid } of node.add(stringToUse)) {
      return { ipfsHash: cid.toString(), data: stringToUse };
    }
    throw new Error("Failed to add data to IPFS");
  };
}
