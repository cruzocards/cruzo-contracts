import {
  formatBytes32String,
  arrayify,
  hexZeroPad,
  toUtf8Bytes,
  hexlify,
} from "ethers/lib/utils";
import { Signer } from "ethers";

/**
 * Converts cid V1 to { bytes32 left; bytes27 right; }
 * @param uri URI (example: bafkreihfdlvzii7famwufwck56bcoensom4ohfjdysxd4nmwg6zm6hro7m)
 * @returns
 */
export function toURI(uri: string): { left: Uint8Array; right: Uint8Array } {
  if (uri.length !== 59) {
    throw new Error("Invalid uri");
  }

  const left = toUtf8Bytes(uri.substring(0, 32));
  const right = toUtf8Bytes(uri.substring(32));

  return {
    left,
    right,
  };
}

export async function sign(signer: Signer, address: string): Promise<string> {
  return await signer.signMessage(arrayify(hexZeroPad(address, 32)));
}
