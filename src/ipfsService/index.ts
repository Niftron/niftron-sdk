import { Utils } from "../utils";
import axios from "axios";
const FormData = require('form-data');

export module IpfsService {
  export const AddToIPFS = async (
    file: string,
    secretKey?: string
  ): Promise<any | null> => {
    try {
      let stringToUse = file;
      if (secretKey) {
        stringToUse = Utils.symmetricEncryption.encrypt(file, secretKey);
      }


      const formData = new FormData()
      formData.append("base64", stringToUse)

      const res = await axios.post("https://ipfs.infura.io:5001/api/v0/add", formData,
        {
          headers:formData.getHeaders()
        }
      );
      if (res === null) {
        throw Error("Failed to add data to IPFS");
      }
      return { ipfsHash: res.data.Hash, data: stringToUse };
    } catch (er) {
      console.log(er)
      throw new Error("Failed to add data to IPFS");

    }
  };
}
