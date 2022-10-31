import { AbiCoder } from "ethers/lib/utils";
import { ethers, network, upgrades } from "hardhat";

async function main() {
    console.log(ethers.utils.defaultAbiCoder.encode(["uint16"], [300]))
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
