import { AsymmetricEncryption } from "./asymmetricEncryption";
import { SymmetricEncryption } from "./symmetricEncryption";
import { NiftronIdBuilder } from "./niftron";
/**
 * Utils Class
 */
export module Utils {
  export const symmetricEncryption = SymmetricEncryption;
  export const asymmetricEncryption = AsymmetricEncryption;
  export const niftronIdBuilder = NiftronIdBuilder;

}

