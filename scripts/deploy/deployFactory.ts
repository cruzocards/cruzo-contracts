import { ethers, network } from "hardhat";
import {
  ContractType,
  getAddress,
  setAddress,
} from "../../utils/addressTracking";
import { RAW_FACTORY_INITIALIZE_SIGNATURE } from "../../constants/signatures"

async function main() {
  const chainId = network.config.chainId;
  if (!chainId) {
    throw "Chain ID is undefined, terminating";
  }
  let beaconAddress = getAddress(chainId)!.beacon;
  let marketAddress = getAddress(chainId)!.market;
  if (!beaconAddress || !marketAddress) {
    throw `Beacon (${beaconAddress}) or Market (${marketAddress}) address is undefined, terminating`;
  }

  console.log("Deploying Factory contract");
  const Factory = await ethers.getContractFactory("Cruzo1155Factory");
  const factory = await Factory.deploy(
    beaconAddress,
    RAW_FACTORY_INITIALIZE_SIGNATURE,
    "https://cruzo.market",
    marketAddress
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
