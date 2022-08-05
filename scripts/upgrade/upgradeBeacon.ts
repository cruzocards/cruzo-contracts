import { ethers, network, upgrades } from "hardhat";
import { getAddress, setNewBeaconAddress } from "../../utils/addressTracking";

async function main() {
    const chainId = network.config.chainId;
    if (!chainId) {
        throw "Chain ID is undefined, terminating";
    }
    console.log("Upgrading Beacon contract");
    let beacon = getAddress(chainId)!.beacon
    const Token = await ethers.getContractFactory("Cruzo1155");

    const Beacon = await upgrades.upgradeBeacon(beacon, Token)

    console.log("Beacon Contract upgraded");
    console.log("New Beacon Contract Address : ", Beacon.address);
    // TODO: replace with appropriate website depending on the network
    // console.log(`https://polygonscan.com/token/${token.address}`);
    // console.log(`https://mumbai.polygonscan.com/token/${token.address}`);

    setNewBeaconAddress(chainId, Beacon.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
