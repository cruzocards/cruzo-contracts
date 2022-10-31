import axios, { Axios } from "axios";
import fs from "fs";
import FormData from "form-data";
import path from "path";
import { MAX_SUPPLY } from "../../constants/pass-sale";

const COLLECTION_IMAGE_PATH = path.join(__dirname, "collection-image.jpg");

const IMAGE_PATH = path.join(__dirname, "image.png");
const VIDEO_PATH = path.join(__dirname, "video.mp4");

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

type NftStorageFile = {
  name: string;
  data: Buffer;
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

  async files(files: NftStorageFile[]) {
    const form = new FormData();
    files.forEach((file) => {
      form.append("file", file.data, {
        filename: file.name,
      });
    });
    return await this.client.post<NftStorageUploadResponse>("/upload", form);
  }
}

async function main() {
  const { NFTSTORAGE_TOKEN } = parseEnv();
  const nftStorage = new NftStorage(NFTSTORAGE_TOKEN);

  // Upload image
  const collectionImageBuffer = await fs.promises.readFile(
    COLLECTION_IMAGE_PATH
  );
  const collectionImageName = path.basename(COLLECTION_IMAGE_PATH);
  const {
    data: {
      value: { cid: collectionImageCid },
    },
  } = await nftStorage.files([
    {
      name: collectionImageName,
      data: collectionImageBuffer,
    },
  ]);
  const collectionImage = `ipfs://${collectionImageCid}/${collectionImageName}`;

  // Upload contractURI
  const {
    data: {
      value: { cid: contractUriCid },
    },
  } = await nftStorage.json({
    name: "CRUZO Collectors NFT Pass - OFFICIAL",
    description:
      "A collection of 500 utility-enabled NFT Passes gives you member access to the Cruzo Collectors Club and exclusive benefits for its holder. For more info visit https://cruzo.io/nft-pass/",
    image: collectionImage,
  });

  const contractURI = `ipfs://${contractUriCid}`;

  console.log("contractURI:", contractURI);

  // Upload image
  const imageBuffer = await fs.promises.readFile(IMAGE_PATH);
  const imageFilename = path.basename(IMAGE_PATH);
  const {
    data: {
      value: { cid: imageCid },
    },
  } = await nftStorage.files([
    {
      name: imageFilename,
      data: imageBuffer,
    },
  ]);
  const image = `ipfs://${imageCid}/${imageFilename}`;

  // Upload video
  const videoBuffer = await fs.promises.readFile(VIDEO_PATH);
  const videoFilename = path.basename(VIDEO_PATH);
  const {
    data: {
      value: { cid: videoCid },
    },
  } = await nftStorage.files([
    {
      name: videoFilename,
      data: videoBuffer,
    },
  ]);
  const animation_url = `ipfs://${videoCid}/${videoFilename}`;

  const files = [...Array(MAX_SUPPLY)].map((_, i) => {
    const tokenId = i + 1;
    return {
      name: `${tokenId}.json`,
      data: Buffer.from(
        JSON.stringify({
          name: `NFT Pass #${tokenId}`,
          description: `Exclusive membership in Cruzo Collectors Club`,
          image,
          animation_url,
        }),
        "utf8"
      ),
    };
  });

  const {
    data: {
      value: { cid },
    },
  } = await nftStorage.files(files);

  const baseURI = `ipfs://${cid}`;
  console.log("baseURI:", baseURI);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
