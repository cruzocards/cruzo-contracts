import { ethers, network, run } from "hardhat";
import {
  ContractType,
  setAddress,
  getAddress,
} from "../../utils/addressTracking";

import { PRICE } from "../../constants/pass-sale";
import { parseEther } from "ethers/lib/utils";

async function main() {
  const chainId = network.config.chainId;
  if (!chainId) {
    throw "Chain ID is undefined, terminating";
  }
  console.log("Deploying CruzoPassSale contract");
  const CruzoPassSale = await ethers.getContractFactory("CruzoPassSale");

  const factoryAddress = getAddress(chainId)!.factory;
  if (!factoryAddress) {
    throw "Token address is undefined, terminating";
  }

  const signerAddress = process.env.SIGNER_ADDRESS;
  if (typeof signerAddress !== "string") {
    throw new Error("SIGNER_ADDRESS is required");
  }

  const rewardsAddress = process.env.REWARDS_ADDRESS;
  if (typeof rewardsAddress !== "string") {
    throw new Error("REWARDS_ADDRESS is required");
  }

  console.log("Price in ethers : ", parseEther(PRICE));

  const contractURI =
    "ipfs://bafkreia7zth4nvalkblscoebzctl4r6om7wneawovsmol5ybp7eldbvrr4";
  const baseURI =
    "ipfs://bafybeiejbli2hodvgptw3omxox7celejjhwnbarfhwwgixz6mafdq6tify";

  const passSale = await CruzoPassSale.deploy(
    factoryAddress,
    signerAddress,
    rewardsAddress,
    contractURI,
    baseURI,
    parseEther(PRICE)
  );

  await passSale.deployed();

  console.log("CruzoPassSale Contract Deployed");
  console.log("CruzoPassSale Contract Address : ", passSale.address);

  setAddress(chainId, ContractType.passSale, passSale.address);

  // todo: replace with proper implementation: wait until contract is indexed
  await new Promise((r) => setTimeout(r, 30000));

  try {
    await run("verify:verify", {
      address: passSale.address,
      constructorArguments: [
        factoryAddress,
        signerAddress,
        rewardsAddress,
        contractURI,
        baseURI,
        parseEther(PRICE),
      ],
    });
  } catch (err) {
    console.error(err);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
