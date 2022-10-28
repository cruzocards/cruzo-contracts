import axios, { Axios } from "axios";
import fs from "fs";
import FormData from "form-data";
import path from "path";
import { MAX_SUPPLY } from "../../constants/pass-sale";

// 5 sec
const SLEEP = 1000 * 5;

export const PASS_IMAGE_PATH = path.join(__dirname, "pass-image.png");
export const URIS_PATH = path.join(__dirname, "../../data/pass-sale/uris.json");

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
  const { NFTSTORAGE_TOKEN } = parseEnv();
  const nftStorage = new NftStorage(NFTSTORAGE_TOKEN);

  // Upload contractURI
  const {
    data: {
      value: { cid: contractUriCid },
    },
  } = await nftStorage.json({
    name: "CRUZO Collectors NFT Pass - OFFICIAL",
    description:
      "A collection of 500 utility-enabled NFT Passes gives you member access to the Cruzo Collectors Club and exclusive benefits for its holder. For more info visit https://cruzo.io/nft-pass/",
    // TODO: set image?
    image: undefined,
  });
  console.log("contractURI:", `ipfs://${contractUriCid}`);

  // Upload image
  const passImageBuffer = await fs.promises.readFile(PASS_IMAGE_PATH);
  const passImageFilename = path.basename(PASS_IMAGE_PATH);
  const {
    data: {
      value: { cid: passImageCid },
    },
  } = await nftStorage.file(passImageBuffer, passImageFilename);
  const passImage = `ipfs://${passImageCid}/${passImageFilename}`;

  const uris: string[] = [];

  for (let i = 0; i < MAX_SUPPLY; i++) {
    const tokenId = i + 1;

    while (true) {
      try {
        const {
          data: {
            value: { cid },
          },
        } = await nftStorage.json({
          name: `NFT Pass #${tokenId}`,
          description: `Exclusive membership in Cruzo Collectors Club`,
          image: passImage,
          // TODO: animation_url
        });
        uris.push(cid);
        console.log(`#${tokenId} uploaded`);
        break;
      } catch (err) {
        console.error(`ERROR: ${err}`);
        console.log(`Retrying in ${SLEEP}ms...`);
        await new Promise((resolve) => setTimeout(resolve, SLEEP));
      }
    }
  }

  console.log(`Save uris to ${URIS_PATH}`);
  await fs.promises.writeFile(URIS_PATH, JSON.stringify(uris, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
