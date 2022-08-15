import { ethers, network } from "hardhat";
import { getAddress } from "../../utils/addressTracking";
import { ContractReceipt } from "ethers";

async function main() {
  const chainId = network.config.chainId;
  if (!chainId) {
    throw "Chain ID is undefined, terminating";
  }
  const addressEntry = getAddress(chainId);
  if (!addressEntry || !addressEntry.factory) {
    throw "Factory address is undefined, nothing to update, terminating";
  }

  console.log("Deploying Token contract");
  const Factory = await ethers.getContractFactory("Cruzo1155Factory");
  const factory = await Factory.attach(addressEntry.factory);
  const tx = await factory.create("Cruzo", "CRZ");
  const receipt: ContractReceipt = await tx.wait();
  const tokenCreatedEvent = receipt.events?.filter((x) => {
    return x.event == "newTokenCreated";
  });
  if (!tokenCreatedEvent || !tokenCreatedEvent[0]) {
    throw "`newTokenCreated` event is missing, terminating";
  }

  console.log("Token Contract Deployed");
  console.log("Token ID : ", Number(tokenCreatedEvent[0].args?.newTokenId));
  console.log(
    "Token Contract Address : ",
    tokenCreatedEvent[0].args?.tokenAddress
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
