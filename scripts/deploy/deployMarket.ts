import { ethers, network, upgrades } from "hardhat";
import { ContractType, setAddress } from "../../utils/addressTracking";
import { RAW_VAULT_FUNCTION_SIGNATURE } from "../../constants/signatures"

async function main() {
  const chainId = network.config.chainId;
  if (!chainId) {
    throw "Chain ID is undefined, terminating";
  }

  console.log("Deploying market contract");
  const marketServiceFee = parseInt(process.env.MARKET_SERVICE_FEE || "");
  const rawVaultFuncSignature = RAW_VAULT_FUNCTION_SIGNATURE;

  const Market = await ethers.getContractFactory("CruzoMarket");

  const market = await upgrades.deployProxy(Market, [marketServiceFee, rawVaultFuncSignature], {
    kind: "uups",
  });
  await market.deployed();

  console.log("Market Contract Deployed");
  console.log("Market Contract Address : ", market.address);
  // TODO: replace with appropriate website depending on the network
  // console.log(`https://polygonscan.com/token/${market.address}`);
  // console.log(`https://mumbai.polygonscan.com/token/${market.address}`);

  setAddress(chainId, ContractType.market, market.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
