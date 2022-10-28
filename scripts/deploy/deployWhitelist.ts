import { ethers, network } from "hardhat";
import {
  ContractType,
  setAddress,
  getAddress,
} from "../../utils/addressTracking";

import { PRICE } from "../../constants/whitelist";
import { parseEther } from "ethers/lib/utils";

import uris from "../../data/whitelist/uris.json";

async function main() {
  const chainId = network.config.chainId;
  if (!chainId) {
    throw "Chain ID is undefined, terminating";
  }
  console.log("Deploying Whitelist contract");
  const Whitelist = await ethers.getContractFactory("CruzoWhitelist");

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

  const whitelist = await Whitelist.deploy(
    factoryAddress,
    signerAddress,
    rewardsAddress,
    uris as any,
    parseEther(PRICE)
  );

  await whitelist.deployed();

  console.log("Whitelist Contract Deployed");
  console.log("Whitelist Contract Address : ", whitelist.address);

  setAddress(chainId, ContractType.whitelist, whitelist.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
