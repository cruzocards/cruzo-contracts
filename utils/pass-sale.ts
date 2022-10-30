import { arrayify, hexZeroPad, toUtf8Bytes } from "ethers/lib/utils";
import { Signer } from "ethers";

export async function sign(signer: Signer, address: string): Promise<string> {
  return await signer.signMessage(arrayify(hexZeroPad(address, 32)));
}
