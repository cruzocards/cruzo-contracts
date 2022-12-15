import { ethers, network, upgrades } from "hardhat";
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

  let transferProxyAddress = getAddress(chainId)?.transferProxy;
  if (!transferProxyAddress) {
    throw `TransferProxy address is undefined, terminating`;
  }

  console.log("Deploying Airdrop contract");
  const Airdrop = await ethers.getContractFactory("CruzoAirdrop");
  const airdrop = await upgrades.deployProxy(Airdrop, [transferProxyAddress], {
    kind: "uups",
  });
  await airdrop.deployed();

  console.log("Airdrop Contract Deployed");
  console.log("Airdrop Contract Address : ", airdrop.address);

  setAddress(chainId, ContractType.airdrop, airdrop.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
