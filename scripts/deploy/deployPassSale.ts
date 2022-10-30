import { ethers, network } from "hardhat";
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

  const passSale = await CruzoPassSale.deploy(
    factoryAddress,
    signerAddress,
    rewardsAddress,
    "ipfs://bafkreic7g3c57uef4sw7yxn7exx6eeugv4ynuoxle5yalorxkzqw5kz7xq",
    "ipfs://bafybeicajjv7xymvm57xygq35edjagq7x2lq7giwg67wvdb3klscrunyve",
    parseEther(PRICE)
  );

  await passSale.deployed();

  console.log("CruzoPassSale Contract Deployed");
  console.log("CruzoPassSale Contract Address : ", passSale.address);

  setAddress(chainId, ContractType.passSale, passSale.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
