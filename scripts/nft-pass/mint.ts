import fs from "fs";

import { ethers } from "hardhat";

import { METADATA_PATH, SUPPLY } from "./constants";

function parseEnv() {
  const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
  if (typeof TOKEN_ADDRESS !== "string") {
    throw new Error("TOKEN_ADDRESS is required");
  }
  return {
    TOKEN_ADDRESS,
  };
}

async function loadMetadata(): Promise<Record<string, string>> {
  const content = await fs.promises.readFile(METADATA_PATH, {
    encoding: "utf8",
  });
  return JSON.parse(content);
}

async function main() {
  const env = parseEnv();

  // Validate metadata
  const metadata = await loadMetadata();
  for (let i = 0; i < SUPPLY; i++) {
    const tokenId = i + 1;
    if (!metadata[tokenId]) {
      throw new Error(`No metadata for #${tokenId}`);
    }
  }

  const Cruzo1155 = await ethers.getContractFactory("Cruzo1155");
  const [minter] = await ethers.getSigners();

  const cruzo1155 = Cruzo1155.attach(env.TOKEN_ADDRESS);

  for (let i = 0; i < SUPPLY; i++) {
    const tokenId = i + 1;
    while (true) {
      try {
        // TODO: cruzo1155.createBatch ?
        const tx = await cruzo1155.create(
          tokenId,
          1,
          // TODO: whitelist.address ?
          minter.address,
          metadata[tokenId],
          [],
          minter.address,
          0
        );
        const receipt = await tx.wait();
        if (receipt.status === 0) {
          throw new Error("Transaction failed");
        }
        console.log(`#${tokenId} created`);
        break;
      } catch (err) {
        console.error(`ERROR: ${err}`);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
