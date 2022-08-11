import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Cruzo1155 } from "../typechain/Cruzo1155";
import { CruzoMarket } from "../typechain/CruzoMarket";
import { BigNumberish, Contract } from "ethers";
//"8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f"
describe("CruzoMarket", () => {
    let market: Contract;
    let beacon: Contract;
    let factory: Contract;
    let token: Contract;
    let token_v2: Contract;

    let owner: SignerWithAddress;
    let seller: SignerWithAddress;
    let buyer: SignerWithAddress;
    let addressee: SignerWithAddress;
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    const serviceFee = 300;
    const serviceFeeBase = 10000;

    beforeEach(async () => {
        [owner, seller, buyer, addressee] = await ethers.getSigners();

        const CruzoMarket = await ethers.getContractFactory("CruzoMarket");
        const Cruzo1155 = await ethers.getContractFactory("Cruzo1155");

        const Factory = await ethers.getContractFactory("Cruzo1155Factory");

        market = await upgrades.deployProxy(CruzoMarket, [serviceFee], {
            kind: "uups",
        });
        await market.deployed();

        beacon = await upgrades.deployBeacon(Cruzo1155);

        await beacon.deployed();

        factory = await Factory.deploy(
            beacon.address,
            "initialize(string,string,string,address,address)",
            "https://cruzo.market",
            market.address
        );

        await factory.deployed();


        let addr = await factory.getToken(1);
        token = await ethers.getContractAt("Cruzo1155", addr);
    });
    describe("Simple token creation", () => {
        it("Cretaes new token via factory", async () => {
            const tokenId = ethers.BigNumber.from("1");
            await factory.connect(seller).create("1", "abc")
            let Token1 = await ethers.getContractAt("Cruzo1155", await factory.getToken(tokenId));
            expect(await Token1.symbol()).to.eq("abc")

        });
    });

    describe("Proxy upgrade", () => {
        it("Change implementation", async () => {
            const tokenId = ethers.BigNumber.from("1");
            let Token1: Contract;
            await factory.connect(seller).create("1", "abc")
            Token1 = await ethers.getContractAt("Cruzo1155", await factory.getToken(tokenId));
            //await expect(await Token1.check()).to.be.revertedWith("TypeError: Token1.check is not a function")

            const Cruzo1155_v2 = await ethers.getContractFactory("Cruzo1155_v2");

            await upgrades.upgradeBeacon(beacon, Cruzo1155_v2);

            token_v2 = await ethers.getContractAt("Cruzo1155_v2", await factory.getToken(tokenId));
            expect(await token_v2.check()).to.eq(
                "hello"
            );
            await factory.changeBaseUri("abc")

            await factory.connect(seller).create("2", "bbc")

            expect(await token_v2.baseURI()).to.eq(
                "https://cruzo.market"
            );
            token_v2 = await ethers.getContractAt("Cruzo1155_v2", await factory.getToken(2));

            expect(await token_v2.baseURI()).to.eq(
                "abc"
            );
            expect(await token_v2.symbol()).to.eq(
                "bbc"
            );

        });
    });
});
