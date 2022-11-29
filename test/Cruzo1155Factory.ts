import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

import { Contract } from "ethers";
import { getEvent } from "../utils/getEvent";
import { Cruzo1155, Cruzo1155FactoryV2, TransferProxy } from "../typechain";
import { Cruzo1155TestUpgrade } from "../typechain/Cruzo1155TestUpgrade";

describe("CruzoFactory", () => {
  let transferProxy: TransferProxy;

  let beacon: Contract;
  let factory: Cruzo1155FactoryV2;
  let token: Cruzo1155;
  let tokenV2: Cruzo1155TestUpgrade;

  let owner: SignerWithAddress;

  const tokenDetails = {
    name: "Cruzo",
    symbol: "CRZ",
    baseURI: "https://cruzo.io",
    contractURI: "ipfs://contractURI",
  };

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const TransferProxy = await ethers.getContractFactory("TransferProxy");
    transferProxy = (await upgrades.deployProxy(TransferProxy, [], {
      kind: "uups",
    })) as TransferProxy;
    await transferProxy.deployed();

    const Cruzo1155 = await ethers.getContractFactory("Cruzo1155");
    beacon = await upgrades.deployBeacon(Cruzo1155);
    await beacon.deployed();

    const Factory = await ethers.getContractFactory("Cruzo1155FactoryV2");
    beacon = await upgrades.deployBeacon(Cruzo1155);
    await beacon.deployed();

    factory = await Factory.deploy(beacon.address, transferProxy.address);
    await factory.deployed();
  });

  describe("Simple token creation", () => {
    it("Creates a new token via factory", async () => {
      const createTokenTx = await factory.connect(owner).create(
        tokenDetails.name,
        tokenDetails.symbol,
        tokenDetails.baseURI,
        tokenDetails.contractURI,

        true
      );
      const createTokenReceipt = await createTokenTx.wait();
      const createTokenEvent = getEvent(createTokenReceipt, "NewTokenCreated");

      token = await ethers.getContractAt(
        "Cruzo1155",
        createTokenEvent.args?.tokenAddress
      );
      expect(await token.symbol()).to.eq(tokenDetails.symbol);
    });
  });

  describe("Proxy upgrade", () => {
    it("Change implementation", async () => {
      const Cruzo1155TestUpgrade = await ethers.getContractFactory(
        "Cruzo1155TestUpgrade"
      );

      const createTokenTx = await factory
        .connect(owner)
        .create(
          tokenDetails.name,
          tokenDetails.symbol,
          tokenDetails.baseURI,
          tokenDetails.contractURI,
          true
        );
      const createTokenReceipt = await createTokenTx.wait();
      const createTokenEvent = getEvent(createTokenReceipt, "NewTokenCreated");
      token = await ethers.getContractAt(
        "Cruzo1155",
        createTokenEvent.args?.tokenAddress
      );

      await upgrades.upgradeBeacon(beacon, Cruzo1155TestUpgrade);

      tokenV2 = await ethers.getContractAt(
        "Cruzo1155TestUpgrade",
        createTokenEvent.args?.tokenAddress
      );
      expect(await tokenV2.testUpgrade()).to.eq("hello");
    });
  });
});
