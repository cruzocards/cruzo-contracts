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
      ).revertedWithCustomError(gift, "ErrInvalidAmount");
    });

    it("Should revert if the sender doesn't have enough tokens", async () => {
      const { signers, token, gift } = await loadFixture(fixture);
      const [from, to] = signers;
      await expect(
        gift.connect(from).gift(token.address, 1, to.address, 1)
      ).revertedWith("ERC1155: insufficient balance for transfer");
    });
  });

  describe("createLink", () => {
    it("Should create a new link", async () => {
      const {
        gift,
        token,
        signers: [from],
      } = await loadFixture(fixture);

      const tokenId = 1;
      const amount = 123;
      const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("secret"));

      await token
        .connect(from)
        .create(tokenId, amount, from.address, "", [], from.address, 0);

      await expect(
        gift.connect(from).createLink(token.address, tokenId, amount, hash)
      )
        .emit(gift, "LinkCreated")
        .withArgs(1, token.address, tokenId, from.address, amount, hash);

      const link = await gift.links(1);

      expect(link.tokenAddress).eq(token.address);
      expect(link.tokenId).eq(tokenId);
      expect(link.amount).eq(amount);
      expect(link.hash).eq(hash);
    });

    it("Should create multiple links with the same hash", async () => {
      const {
        gift,
        token,
        signers: [from],
      } = await loadFixture(fixture);

      const tokenId = 1;
      const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("secret"));

      const amount1 = 30;
      const amount2 = 70;

      await token
        .connect(from)
        .create(
          tokenId,
          amount1 + amount2,
          from.address,
          "",
          [],
          from.address,
          0
        );

      await gift
        .connect(from)
        .createLink(token.address, tokenId, amount1, hash);

      await gift
        .connect(from)
        .createLink(token.address, tokenId, amount2, hash);

      const link1 = await gift.links(1);
      expect(link1.amount).eq(amount1);
      expect(link1.hash).eq(hash);

      const link2 = await gift.links(2);
      expect(link2.amount).eq(amount2);
      expect(link2.hash).eq(hash);
    });

    it("Should validate amount", async () => {
      const {
        signers: [from],
        token,
        gift,
      } = await loadFixture(fixture);
      const tokenId = 1;
      const amount = 0;
      const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("secret"));

      await expect(
        gift.connect(from).createLink(token.address, tokenId, amount, hash)
      ).revertedWithCustomError(gift, "ErrInvalidAmount");
    });

    it("Should revert if the sender doesn't have enough tokens", async () => {
      const {
        signers: [from],
        token,
        gift,
      } = await loadFixture(fixture);
      const tokenId = 1;
      const amount = 123;
      const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("secret"));
      await expect(
        gift.connect(from).createLink(token.address, tokenId, amount, hash)
      ).revertedWith("ERC1155: insufficient balance for transfer");
    });
  });

  describe("claimLink", () => {
    it("Should claim links", async () => {
      const {
        gift,
        token,
        signers: [from, claimer],
      } = await loadFixture(fixture);

      const secret = "secret";

      const tokenId = 1;
      const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret));

      const amount1 = 30;
      const amount2 = 70;

      await token
        .connect(from)
        .create(
          tokenId,
          amount1 + amount2,
          from.address,
          "",
          [],
          from.address,
          0
        );

      await gift
        .connect(from)
        .createLink(token.address, tokenId, amount1, hash);

      await gift
        .connect(from)
        .createLink(token.address, tokenId, amount2, hash);

      expect(await token.balanceOf(claimer.address, tokenId)).eq(0);

      await expect(gift.connect(claimer).claimLink(1, secret))
        .emit(gift, "LinkClaimed")
        .withArgs(1, claimer.address);

      const link1 = await gift.links(1);
      expect(link1.amount).eq(0);

      expect(await token.balanceOf(claimer.address, tokenId)).eq(amount1);

      await expect(gift.connect(claimer).claimLink(2, secret))
        .emit(gift, "LinkClaimed")
        .withArgs(2, claimer.address);

      expect(await token.balanceOf(claimer.address, tokenId)).eq(
        amount1 + amount2
      );
    });

    it("ErrLinkNotFound", async () => {
      const {
        gift,
        signers: [claimer],
      } = await loadFixture(fixture);

      await expect(
        gift.connect(claimer).claimLink(123, "")
      ).revertedWithCustomError(gift, "ErrLinkNotFound");
    });

    it("ErrInvalidSecret", async () => {
      const {
        gift,
        token,
        signers: [from, claimer],
      } = await loadFixture(fixture);

      const secret = "secret";

      const tokenId = 1;
      const amount = 100;
      const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret));

      await token
        .connect(from)
        .create(tokenId, amount, from.address, "", [], from.address, 0);

      await gift.connect(from).createLink(token.address, tokenId, amount, hash);
      await expect(
        gift.connect(claimer).claimLink(1, "")
      ).revertedWithCustomError(gift, "ErrInvalidSecret");
    });
  });
});
