import { ethers, network } from "hardhat";
import { getAddress } from "../../utils/addressTracking";

async function main() {
  const chainId = network.config.chainId;
  if (!chainId) {
    throw "Chain ID is undefined, terminating";
  }

  let transferProxyAddress = getAddress(chainId)?.transferProxy;
  if (!transferProxyAddress) {
    throw `TransferProxy address is undefined, terminating`;
  }

  let marketAddress = getAddress(chainId)?.market;
  if (!marketAddress) {
    throw `Market address is undefined, terminating`;
  }

  let giftAddress = getAddress(chainId)?.gift;
  if (!giftAddress) {
    throw `Gift address is undefined, terminating`;
  }

  const operators = [marketAddress, giftAddress];
  const TransferProxy = await ethers.getContractFactory("TransferProxy");
  const tx = await TransferProxy.attach(transferProxyAddress).setOperators(
    operators,
    operators.map(() => true)
  );
  const receipt = await tx.wait();
  console.log(`${JSON.stringify(operators)} have been added to operators`);
  console.log("tx hash:", receipt.transactionHash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
