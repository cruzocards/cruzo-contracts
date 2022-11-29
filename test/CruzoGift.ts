import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, upgrades } from "hardhat";
import { CruzoGift, TransferProxy } from "../typechain";

describe("CruzoGift", () => {
  async function fixture() {
    const signers = await ethers.getSigners();

    const TransferProxy = await ethers.getContractFactory("TransferProxy");
    const transferProxy = (await upgrades.deployProxy(TransferProxy, [], {
      kind: "uups",
    })) as TransferProxy;
    await transferProxy.deployed();

    const CruzoGift = await ethers.getContractFactory("CruzoGift");
    const gift = (await upgrades.deployProxy(
      CruzoGift,
      [transferProxy.address],
      {
        kind: "uups",
      }
    )) as CruzoGift;
    await gift.deployed();

    await transferProxy.setOperator(gift.address, true);

    const Cruzo1155 = await ethers.getContractFactory("Cruzo1155");
    const token = await Cruzo1155.deploy();
    await token.deployed();
    await token.initialize(
      "CRUZO",
      "CRZ",
      "baseURI",
      "contractURI",
      transferProxy.address,
      true
    );

    return {
      signers,
      gift,
      token,
    };
  }

  it("Should deploy", async () => {
    const { signers, gift } = await loadFixture(fixture);
    expect(await gift.owner()).eq(signers[0].address);
  });

  describe("gift", () => {
    it("Should gift", async () => {
      const { signers, token, gift } = await loadFixture(fixture);
      const [from, to] = signers;

      const tokenId = 1;

      await token
        .connect(from)
        .create(tokenId, 100, from.address, "", [], from.address, 0);

      expect(await token.balanceOf(from.address, tokenId)).eq(100);
      expect(await token.balanceOf(to.address, tokenId)).eq(0);

      await expect(
        gift.connect(from).gift(token.address, tokenId, to.address, 1)
      )
        .emit(gift, "Gift")
        .withArgs(1, token.address, tokenId, from.address, to.address, 1);
      expect(await token.balanceOf(from.address, tokenId)).eq(99);
      expect(await token.balanceOf(to.address, tokenId)).eq(1);

      await expect(
        gift.connect(from).gift(token.address, tokenId, to.address, 1)
      )
        .emit(gift, "Gift")
        .withArgs(2, token.address, tokenId, from.address, to.address, 1);
      expect(await token.balanceOf(from.address, tokenId)).eq(98);
      expect(await token.balanceOf(to.address, tokenId)).eq(2);
    });

    it("Should validate amount", async () => {
      const { signers, token, gift } = await loadFixture(fixture);
      const [from, to] = signers;
      await expect(
        gift.connect(from).gift(token.address, 1, to.address, 0)
      ).revertedWith("Gift: amount must be greater than 0");
    });

    it("Should revert if the sender doesn't have enough tokens", async () => {
      const { signers, token, gift } = await loadFixture(fixture);
      const [from, to] = signers;
      await expect(
        gift.connect(from).gift(token.address, 1, to.address, 1)
      ).revertedWith("ERC1155: insufficient balance for transfer");
    });
  });
});
