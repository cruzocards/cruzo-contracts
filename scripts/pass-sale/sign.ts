import fs from "fs";
import { ethers } from "ethers";
import path from "path";

const ADDRESSES_PATH = path.join(
  __dirname,
  "../../data/pass-sale/addresses.json"
);

const SIGNATURES_PATH = path.join(
  __dirname,
  "../../data/pass-sale/signatures.json"
);

function parseEnv() {
  const SIGNER_KEY = process.env.SIGNER_KEY;
  if (typeof SIGNER_KEY !== "string") {
    throw new Error("SIGNER_KEY is required");
  }
  return {
    SIGNER_KEY,
  };
}

async function loadAddresses(): Promise<string[]> {
  const content = await fs.promises.readFile(ADDRESSES_PATH, "utf8");
  return JSON.parse(content);
}

async function main() {
  const { SIGNER_KEY } = parseEnv();
  const signer = new ethers.Wallet(SIGNER_KEY);
  const addresses = await loadAddresses();
  const signatures: Record<string, string> = {};
  await Promise.all(
    addresses.map(async (address) => {
      signatures[address] = await signer.signMessage(
        ethers.utils.arrayify(ethers.utils.hexZeroPad(address, 32))
      );
    })
  );
  console.log(`Save signatures to ${SIGNATURES_PATH}`);
  await fs.promises.writeFile(
    SIGNATURES_PATH,
    JSON.stringify(signatures, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
