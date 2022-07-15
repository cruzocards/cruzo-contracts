import { ethers, network, upgrades } from "hardhat";
import { Cruzo1155 } from "../typechain";
import { setAddress } from "../utils/addressTracking";

async function main() {
  const chainId = network.config.chainId;
  if (!chainId) {
    throw "Chain ID is undefined, terminating";
  }

  console.log("Deploying market contract");
  const marketServiceFee = parseInt(process.env.MARKET_SERVICE_FEE || "");
  const Market = await ethers.getContractFactory("CruzoMarket");

  const market = await upgrades.deployProxy(Market, [marketServiceFee], {
    kind: "uups",
  });
  await market.deployed();

  console.log("Market Contract Deployed");
  console.log("Market Contract Address : ", market.address);
  // TODO: replace with appropriate website depending on the network
  // console.log(`https://polygonscan.com/token/${market.address}`);
  // console.log(`https://mumbai.polygonscan.com/token/${market.address}`);

  console.log("Deploying token contract");
  const Token = await ethers.getContractFactory("Cruzo1155");

  const token = (await Token.deploy(
    "https://cruzo.market",
    market.address
  )) as Cruzo1155;

  console.log("Token Contract Deployed");
  console.log("Token Contract Address : ", token.address);
  // TODO: replace with appropriate website depending on the network
  // console.log(`https://polygonscan.com/token/${token.address}`);
  // console.log(`https://mumbai.polygonscan.com/token/${token.address}`);

  setAddress(chainId, {
    token: token.address,
    market: market.address,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
