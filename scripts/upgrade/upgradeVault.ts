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
    const addressEntry = getAddress(chainId);
    if (!addressEntry || !addressEntry.vault) {
        throw "Vault address is undefined, nothing to update, terminating";
    }

    console.log("Upgrading vault contract");
    const Vault = await ethers.getContractFactory("Cruzo1155Vault");
    const vault = await upgrades.upgradeProxy(addressEntry.vault, Vault);
    await vault.deployed();

    console.log("Vault Contract upgraded");
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
