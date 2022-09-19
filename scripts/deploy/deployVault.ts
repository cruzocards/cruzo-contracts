import { ethers, network, upgrades } from "hardhat";
import { ContractType, setAddress, getAddress } from "../../utils/addressTracking";

async function main() {
    const chainId = network.config.chainId;
    if (!chainId) {
        throw "Chain ID is undefined, terminating";
    }

    console.log("Deploying vault contract");
<<<<<<< HEAD
    const Vault = await ethers.getContractFactory("Cruzo1155TempVault");
=======
    const Vault = await ethers.getContractFactory("Cruzo1155Vault");
>>>>>>> cf76e2c39ac95e0b057c5c841b2266fecf789822

    let marketAddress = getAddress(chainId)!.market;
    if (!marketAddress) {
        throw `Market (${marketAddress}) address is undefined, terminating`;
    }

    const vault = await upgrades.deployProxy(Vault, [marketAddress], {
        kind: "uups",
    });
    await vault.deployed();

    console.log("Vault Contract Deployed");
    console.log("Vault Contract Address : ", vault.address);
    // TODO: replace with appropriate website depending on the network
    // console.log(`https://polygonscan.com/token/${market.address}`);
    // console.log(`https://mumbai.polygonscan.com/token/${market.address}`);

    setAddress(chainId, ContractType.vault, vault.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
