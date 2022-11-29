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

  console.log("Deploying market contract");
  const marketServiceFee = parseInt(process.env.MARKET_SERVICE_FEE || "");
  const Market = await ethers.getContractFactory("CruzoMarketV2");

  const market = await upgrades.deployProxy(
    Market,
    [transferProxyAddress, marketServiceFee],
    {
      kind: "uups",
    }
  );
  await market.deployed();

  console.log("Market Contract Deployed");
  console.log("Market Contract Address : ", market.address);

  setAddress(chainId, ContractType.market, market.address);

  console.log("add Market to TransferProxy.operators...");
  const TransferProxy = await ethers.getContractFactory("TransferProxy");
  const tx = await TransferProxy.attach(transferProxyAddress).setOperator(
    market.address,
    true
  );
  const receipt = await tx.wait();
  console.log(
    "Market has been added to TransferProxy.operators:",
    receipt.transactionHash
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });