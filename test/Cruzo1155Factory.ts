import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Cruzo1155 } from "../typechain/Cruzo1155";
import { CruzoMarket } from "../typechain/CruzoMarket";
import { BigNumberish, Contract } from "ethers";
import { getEvent } from "../utils/getEvent";

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

    const serviceFee = 300;

    const tokenDetails = {
        name: "Cruzo",
        symbol: "CRZ",
        baseOnlyURI: "https://cruzo.market",
        baseAndIdURI: "https://cruzo.io/tokens",
        altBaseOnlyURI: "https://opensea.io/tokens/{id}.json",
        ipfsHash: "Qme3TrFkt28tLgHR2QXjH1ArfamtpkVsgMc9asdw3LXn7y",
        altBaseAndIdURI: "https:opensea.io/tokens/",
        collectionURI: "https://cruzo.io/collection",
    };

    const token2Details = {
        name: "Cruzo2",
        symbol: "CRZ2",
        baseOnlyURI: "https://cruzo.market",
        baseAndIdURI: "https://cruzo.io/tokens",
        altBaseOnlyURI: "https://opensea.io/tokens/{id}.json",
        ipfsHash: "Qme3TrFkt28tLgHR2QXjH1ArfamtpkVsgMc9asdw3LXn7y",
        altBaseAndIdURI: "https:opensea.io/tokens/",
        collectionURI: "https://cruzo.io/collection",
    };

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
            "initialize(string,string,string,string,address,address)",
            "https://cruzo.market",
            market.address
        );

        await factory.deployed();


    });
    describe("Simple token creation", () => {
        it("Cretaes new token via factory", async () => {
            const createTokenTx = await factory
                .connect(owner)
                .create(
                    tokenDetails.name,
                    tokenDetails.symbol,
                    tokenDetails.collectionURI
                );
            const createTokenReceipt = await createTokenTx.wait();
            const createTokenEvent = getEvent(createTokenReceipt, "NewTokenCreated");

            token = await ethers.getContractAt("Cruzo1155", createTokenEvent.args?.tokenAddress);
            expect(await token.symbol()).to.eq(tokenDetails.symbol)

        });
    });

    describe("Proxy upgrade", () => {
        it("Change implementation", async () => {
            const Cruzo1155_v2 = await ethers.getContractFactory("Cruzo1155_v2");


            const createTokenTx = await factory
                .connect(owner)
                .create(
                    tokenDetails.name,
                    tokenDetails.symbol,
                    tokenDetails.collectionURI
                );
            const createTokenReceipt = await createTokenTx.wait();
            const createTokenEvent = getEvent(createTokenReceipt, "NewTokenCreated");
            token = await ethers.getContractAt("Cruzo1155", createTokenEvent.args?.tokenAddress);

            await upgrades.upgradeBeacon(beacon, Cruzo1155_v2);

            token_v2 = await ethers.getContractAt("Cruzo1155_v2", createTokenEvent.args?.tokenAddress);
            expect(await token_v2.check()).to.eq(
                "hello"
            );
            await factory.changeBaseUri("abc")

            const createToken2Tx = await factory
                .connect(owner)
                .create(
                    token2Details.name,
                    token2Details.symbol,
                    token2Details.collectionURI
                );
            const createToken2Receipt = await createToken2Tx.wait();
            const createToken2Event = getEvent(createToken2Receipt, "NewTokenCreated");

            expect(await token_v2.baseURI()).to.eq(
                token2Details.baseOnlyURI
            );
            token_v2 = await ethers.getContractAt("Cruzo1155_v2", createToken2Event.args?.tokenAddress);

            expect(await token_v2.baseURI()).to.eq(
                "abc"
            );
            expect(await token_v2.symbol()).to.eq(
                token2Details.symbol
            );

        });
    });
});
