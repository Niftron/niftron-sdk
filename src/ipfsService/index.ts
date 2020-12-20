import { Utils } from "../utils";
import axios from "axios";
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
      formData.set("base64", stringToUse)

      const res = await axios.post("https://ipfs.infura.io:5001/api/v0/add", formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (res === null) {
        throw Error("Failed to add data to IPFS");
      }
      return { ipfsHash: res.data.Hash, data: stringToUse };
    } catch (er) {
      throw new Error("Failed to add data to IPFS");

    }
  };
}
