import { ethers, network } from "hardhat";
import {
  ContractType,
  getAddress,
  setAddress,
} from "../../utils/addressTracking";

async function main() {
  const chainId = network.config.chainId;
  if (!chainId) {
    throw "Chain ID is undefined, terminating";
  }
  let beacon = getAddress(chainId)!.beacon;
  let market = getAddress(chainId)!.market;
  console.log("Deploying Factory contract");
  const Factory = await ethers.getContractFactory("Factory");

  // todo: check contract addresses, may be undefined
  const factory = await Factory.deploy(
    beacon,
    "initialize(string,string,string,address)",
    "https://cruzo.market",
    market
  );

  console.log("Factory Contract Deployed");
  console.log("Factory Contract Address : ", factory.address);
  // TODO: replace with appropriate website depending on the network
  // console.log(`https://polygonscan.com/token/${token.address}`);
  // console.log(`https://mumbai.polygonscan.com/token/${token.address}`);

  setAddress(chainId, ContractType.factory, factory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
