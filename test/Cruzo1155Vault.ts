import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { getEvent } from "../utils/getEvent";
import { keccak256 } from "ethers/lib/utils";

describe("CruzoMarket", () => {
    let market: Contract;
    let beacon: Contract;
    let factory: Contract;
    let token: Contract;
    let vault: Contract;
    let tokenV2: Contract;


    let owner: SignerWithAddress;
    let seller: SignerWithAddress;
    let buyer: SignerWithAddress;
    let claimer: SignerWithAddress;

    const serviceFee = 300;
    const rawVaultFuncSignature = "holdGift(bytes32,address,uint256,uint256)"


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

    beforeEach(async () => {
        [owner, seller, buyer, claimer] = await ethers.getSigners();

        const CruzoMarket = await ethers.getContractFactory("CruzoMarket");
        const Cruzo1155 = await ethers.getContractFactory("Cruzo1155");
        const Factory = await ethers.getContractFactory("Cruzo1155Factory");
        const Vault = await ethers.getContractFactory("Cruzo1155Vault");



        market = await upgrades.deployProxy(CruzoMarket, [serviceFee, rawVaultFuncSignature], {
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

        vault = await upgrades.deployProxy(Vault, [market.address], {
            kind: "uups",
        });
        await vault.deployed();

        await market.setVaultAddress(vault.address);

    });



    describe("Simple token gift without wallet", () => {
        it("Give and claim a gift", async () => {

            const tokenId = ethers.BigNumber.from("1");
            const supply = ethers.BigNumber.from("100");
            const tradeAmount = ethers.BigNumber.from("10");
            const price = ethers.utils.parseEther("0.01");
            const utf8Encode = new TextEncoder();
            const secretKey = "skdjf87ddg9ddfud9d9fu"
            const hash = keccak256(utf8Encode.encode(secretKey))

            const createTokenTx = await factory
                .connect(owner)
                .create(
                    tokenDetails.name,
                    tokenDetails.symbol,
                    tokenDetails.collectionURI
                );
            const createTokenReceipt = await createTokenTx.wait();
            const createTokenEvent = getEvent(createTokenReceipt, "NewTokenCreated");

            token = await ethers.getContractAt(
                "Cruzo1155",
                createTokenEvent.args?.tokenAddress
            );



            expect(
                await token
                    .connect(seller)
                    .create(tokenId, supply, seller.address, "", [])
            );
            await expect(
                market
                    .connect(seller)
                    .openTrade(token.address, tokenId, tradeAmount, price)
            )
                .emit(market, "TradeOpened")
                .withArgs(token.address, tokenId, seller.address, tradeAmount, price);

            expect(await market.connect(buyer).giftItemViaVault(token.address, tokenId, seller.address, tradeAmount, hash, { value: tradeAmount.mul(price) }))

            expect(await vault.connect(claimer).claimGift(secretKey))

            expect(await token.balanceOf(claimer.address, tokenId)).to.eq(tradeAmount)





        });
    });

    describe("Upgrade mechanism check", () => {
        it("Make a gift, upgrade proxy and then claim a gift", async () => {
            const tokenId = ethers.BigNumber.from("1");
            const supply = ethers.BigNumber.from("100");
            const tradeAmount = ethers.BigNumber.from("10");
            const price = ethers.utils.parseEther("0.01");
            const utf8Encode = new TextEncoder();
            const secretKey = "skdjf87ddg9ddfud9d9fu"
            const hash = keccak256(utf8Encode.encode(secretKey))
            const newContractFactory = await ethers.getContractFactory(
                "Cruzo1155Vault_Test"
            );
            const createTokenTx = await factory
                .connect(owner)
                .create(
                    tokenDetails.name,
                    tokenDetails.symbol,
                    tokenDetails.collectionURI
                );
            const createTokenReceipt = await createTokenTx.wait();
            const createTokenEvent = getEvent(createTokenReceipt, "NewTokenCreated");

            token = await ethers.getContractAt(
                "Cruzo1155",
                createTokenEvent.args?.tokenAddress
            );

            expect(
                await token
                    .connect(seller)
                    .create(tokenId, supply, seller.address, "", [])
            );
            await expect(
                market
                    .connect(seller)
                    .openTrade(token.address, tokenId, tradeAmount, price)
            )
                .emit(market, "TradeOpened")
                .withArgs(token.address, tokenId, seller.address, tradeAmount, price);

            expect(await market.connect(buyer).giftItemViaVault(token.address, tokenId, seller.address, tradeAmount, hash, { value: tradeAmount.mul(price) }))

            vault = await upgrades.upgradeProxy(
                vault.address,
                newContractFactory
            );

            expect(await vault.connect(claimer).claimGift(secretKey))

            expect(await token.balanceOf(claimer.address, tokenId)).to.eq(tradeAmount)



        });
        it("Upgrade token while it is in castodian", async () => {
            const tokenId = ethers.BigNumber.from("1");
            const supply = ethers.BigNumber.from("100");
            const tradeAmount = ethers.BigNumber.from("10");
            const price = ethers.utils.parseEther("0.01");
            const utf8Encode = new TextEncoder();
            const secretKey = "skdjf87ddg9ddfud9d9fu"
            const hash = keccak256(utf8Encode.encode(secretKey))
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

            token = await ethers.getContractAt(
                "Cruzo1155",
                createTokenEvent.args?.tokenAddress
            );

            expect(
                await token
                    .connect(seller)
                    .create(tokenId, supply, seller.address, "", [])
            );
            await expect(
                market
                    .connect(seller)
                    .openTrade(token.address, tokenId, tradeAmount, price)
            )
                .emit(market, "TradeOpened")
                .withArgs(token.address, tokenId, seller.address, tradeAmount, price);

            expect(await market.connect(buyer).giftItemViaVault(token.address, tokenId, seller.address, tradeAmount, hash, { value: tradeAmount.mul(price) }))

            await upgrades.upgradeBeacon(beacon, Cruzo1155_v2);

            tokenV2 = await ethers.getContractAt(
                "Cruzo1155_v2",
                createTokenEvent.args?.tokenAddress
            );
            expect(await tokenV2.check()).to.eq("hello");

            expect(await vault.connect(claimer).claimGift(secretKey))

            expect(await token.balanceOf(claimer.address, tokenId)).to.eq(tradeAmount)

        });
        it("Make a gift and then upgrade token and vault then claim", async () => {
            const tokenId = ethers.BigNumber.from("1");
            const supply = ethers.BigNumber.from("100");
            const tradeAmount = ethers.BigNumber.from("10");
            const price = ethers.utils.parseEther("0.01");
            const utf8Encode = new TextEncoder();
            const secretKey = "skdjf87ddg9ddfud9d9fu"
            const hash = keccak256(utf8Encode.encode(secretKey))
            const Cruzo1155_v2 = await ethers.getContractFactory("Cruzo1155_v2");
            const newContractFactory = await ethers.getContractFactory(
                "Cruzo1155Vault_Test"
            );

            const createTokenTx = await factory
                .connect(owner)
                .create(
                    tokenDetails.name,
                    tokenDetails.symbol,
                    tokenDetails.collectionURI
                );
            const createTokenReceipt = await createTokenTx.wait();
            const createTokenEvent = getEvent(createTokenReceipt, "NewTokenCreated");

            token = await ethers.getContractAt(
                "Cruzo1155",
                createTokenEvent.args?.tokenAddress
            );

            expect(
                await token
                    .connect(seller)
                    .create(tokenId, supply, seller.address, "", [])
            );
            await expect(
                market
                    .connect(seller)
                    .openTrade(token.address, tokenId, tradeAmount, price)
            )
                .emit(market, "TradeOpened")
                .withArgs(token.address, tokenId, seller.address, tradeAmount, price);

            expect(await market.connect(buyer).giftItemViaVault(token.address, tokenId, seller.address, tradeAmount, hash, { value: tradeAmount.mul(price) }))

            await upgrades.upgradeBeacon(beacon, Cruzo1155_v2);

            tokenV2 = await ethers.getContractAt(
                "Cruzo1155_v2",
                createTokenEvent.args?.tokenAddress
            );

            vault = await upgrades.upgradeProxy(
                vault.address,
                newContractFactory
            );


            expect(await tokenV2.check()).to.eq("hello");

            expect(await vault.connect(claimer).claimGift(secretKey))

            expect(await token.balanceOf(claimer.address, tokenId)).to.eq(tradeAmount)

        });

    });


});
