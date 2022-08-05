import { ethers, network } from "hardhat";
import { getAddress, setNewFactoryAddress } from "../../utils/addressTracking";

async function main() {
    const chainId = network.config.chainId;
    if (!chainId) {
        throw "Chain ID is undefined, terminating";
    }
    let beacon = getAddress(chainId)!.beacon
    let market = getAddress(chainId)!.market
    console.log("Deploying Factory contract");
    const factory = await ethers.getContractFactory("Factory");

    const Factory = await (factory.deploy(beacon, "initialize(string,string,string,address)", "https://cruzo.market", market))

    console.log("Factory Contract Deployed");
    console.log("Factory Contract Address : ", Factory.address);
    // TODO: replace with appropriate website depending on the network
    // console.log(`https://polygonscan.com/token/${token.address}`);
    // console.log(`https://mumbai.polygonscan.com/token/${token.address}`);

    setNewFactoryAddress(chainId, Factory.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
