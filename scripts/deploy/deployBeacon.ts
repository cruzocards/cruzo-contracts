import { ethers, network, upgrades } from "hardhat";
import { ContractType, setAddress } from "../../utils/addressTracking";

async function main() {
  const chainId = network.config.chainId;
  if (!chainId) {
    throw "Chain ID is undefined, terminating";
  }
  console.log("Deploying Beacon contract");
  const Token = await ethers.getContractFactory("Cruzo1155");

  const beacon = await upgrades.deployBeacon(Token);
  await beacon.deployed();

  console.log("Beacon Contract Deployed");
  console.log("Beacon Contract Address : ", beacon.address);
  // TODO: replace with appropriate website depending on the network
  // console.log(`https://polygonscan.com/token/${token.address}`);
  // console.log(`https://mumbai.polygonscan.com/token/${token.address}`);

  setAddress(chainId, ContractType.beacon, beacon.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
