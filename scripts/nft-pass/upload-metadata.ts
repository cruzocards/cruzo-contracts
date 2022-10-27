import axios, { Axios } from "axios";
import fs from "fs";
import FormData from "form-data";
import path from "path";
import { SUPPLY, IMAGE_PATH, METADATA_PATH } from "./constants";

const SLEEP = 1000 * 10;
const WORKERS = 10;

function parseEnv() {
  const NFTSTORAGE_TOKEN = process.env.NFTSTORAGE_TOKEN;
  if (typeof NFTSTORAGE_TOKEN !== "string") {
    throw Error("NFTSTORAGE_TOKEN is required");
  }

  return {
    NFTSTORAGE_TOKEN,
  };
}

type NftStorageUploadResponse = {
  ok: true;
  value: {
    cid: string;
  };
};

class NftStorage {
  private readonly client: Axios;

  constructor(readonly token: string) {
    this.client = axios.create({
      baseURL: "https://api.nft.storage",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async json(json: any) {
    return await this.client.post<NftStorageUploadResponse>("/upload", json);
  }

  async file(buffer: Buffer, filename: string) {
    const form = new FormData();
    form.append("file", buffer, {
      filename,
    });
    return await this.client.post<NftStorageUploadResponse>("/upload", form);
  }
}

async function main() {
  const env = parseEnv();
  const nftStorage = new NftStorage(env.NFTSTORAGE_TOKEN);

  // Upload image
  const buffer = await fs.promises.readFile(IMAGE_PATH);
  const imageFilename = path.basename(IMAGE_PATH);
  const {
    data: {
      value: { cid: imageCid },
    },
  } = await nftStorage.file(buffer, imageFilename);
  const image = `ipfs://${imageCid}/${imageFilename}`;

  const metadata: Record<string, string> = {};

  for (let i = 0; i < SUPPLY; i += WORKERS) {
    const promises: Promise<void>[] = [];

    for (let j = 0; i + j < SUPPLY && j < WORKERS; j++) {
      const tokenId = i + j + 1;
      promises.push(
        new Promise(async (resolve) => {
          while (true) {
            try {
              const {
                data: {
                  value: { cid },
                },
              } = await nftStorage.json({
                name: `NFT Pass #${tokenId}`,
                description: `NFT Pass #${tokenId}`,
                image,
              });
              metadata[tokenId] = cid;
              console.log(`#${tokenId} uploaded`);
              return resolve();
            } catch (err) {
              console.error(`ERROR: ${err}`);
              console.log(`Retrying in ${SLEEP}ms...`);
              await new Promise((resolve) => setTimeout(resolve, SLEEP));
            }
          }
        })
      );
    }

    await Promise.all(promises);
  }

  console.log(`Save metadata to ${METADATA_PATH}`);
  await fs.promises.writeFile(METADATA_PATH, JSON.stringify(metadata, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
