import { ContractReceipt } from "ethers";
import { ethers, network } from "hardhat";
import { NewTokenCreatedEvent } from "../../typechain/Cruzo1155FactoryV2";
import {
  ContractType,
  getAddress,
  setAddress,
} from "../../utils/addressTracking";
import { getEvent } from "../../utils/getEvent";

const params = {
  name: "Cruzo",
  symbol: "CRZ",
  baseURI: "",
  contractURI: "",
  publiclyMintable: true,
};

async function main() {
  const chainId = network.config.chainId;
  if (!chainId) {
    throw "Chain ID is undefined, terminating";
  }
  const factoryAddress = getAddress(chainId)?.factory;
  if (!factoryAddress) {
    throw "Factory address is undefined, nothing to update, terminating";
  }

  console.log("Deploying Token contract");
  const Factory = await ethers.getContractFactory("Cruzo1155FactoryV2");
  const factory = await Factory.attach(factoryAddress);
  const tx = await factory.create(
    params.name,
    params.symbol,
    params.baseURI,
    params.contractURI,
    params.publiclyMintable
  );
  const receipt: ContractReceipt = await tx.wait();
  const event = getEvent<NewTokenCreatedEvent>(receipt, "NewTokenCreated");
  const tokenAddress = event.args?.tokenAddress;
  console.log("Token Contract Deployed");
  console.log("Token Contract Address : ", tokenAddress);
  setAddress(chainId, ContractType.token, tokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
