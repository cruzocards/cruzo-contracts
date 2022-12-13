import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, upgrades } from "hardhat";
import { CruzoAirdrop, TransferProxy } from "../typechain";

describe("CruzoAirdrop", () => {
  async function fixture() {
    const signers = await ethers.getSigners();

    const TransferProxy = await ethers.getContractFactory("TransferProxy");
    const transferProxy = (await upgrades.deployProxy(TransferProxy, [], {
      kind: "uups",
    })) as TransferProxy;
    await transferProxy.deployed();

    const CruzoAirdrop = await ethers.getContractFactory("CruzoAirdrop");
    const airdrop = (await upgrades.deployProxy(
      CruzoAirdrop,
      [transferProxy.address],
      {
        kind: "uups",
      }
    )) as CruzoAirdrop;
    await airdrop.deployed();

    await transferProxy.setOperator(airdrop.address, true);

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
      airdrop,
      token,
    };
  }

  it("Should deploy", async () => {
    const { signers, airdrop } = await loadFixture(fixture);
    expect(await airdrop.owner()).eq(signers[0].address);
  });

  describe("create", () => {
    it("Should create a new airdrop", async () => {
      const {
        airdrop,
        token,
        signers: [creator, notowner],
      } = await loadFixture(fixture);

      const tokenId = 1;
      const amount = 123;

      await token
        .connect(creator)
        .create(tokenId, amount, creator.address, "", [], creator.address, 0);

      await expect(
        airdrop.connect(creator).create(token.address, tokenId, amount)
      )
        .emit(airdrop, "DropCreated")
        .withArgs(1, token.address, tokenId, creator.address, amount);

      const drop = await airdrop.drops(1);

      expect(drop.tokenAddress).eq(token.address);
      expect(drop.tokenId).eq(tokenId);
      expect(drop.amount).eq(amount);
      expect(drop.claimed).eq(0);

      // onlyOwner
      await expect(
        airdrop.connect(notowner).create(token.address, tokenId, amount)
      ).revertedWith("Ownable: caller is not the owner");
    });

    it("Should validate amount", async () => {
      const {
        signers: [creator],
        token,
        airdrop,
      } = await loadFixture(fixture);
      const tokenId = 1;
      const amount = 0;

      await expect(
        airdrop.connect(creator).create(token.address, tokenId, amount)
      ).revertedWithCustomError(airdrop, "ErrInvalidAmount");
    });

    it("Should revert if the creator doesn't have enough tokens", async () => {
      const {
        signers: [creator],
        token,
        airdrop,
      } = await loadFixture(fixture);
      const tokenId = 1;
      const amount = 123;
      await expect(
        airdrop.connect(creator).create(token.address, tokenId, amount)
      ).revertedWith("ERC1155: insufficient balance for transfer");
    });
  });

  describe("claim", () => {
    it("Should claim", async () => {
      const {
        airdrop,
        token,
        signers: [creator, claimer],
      } = await loadFixture(fixture);

      const tokenId = 1;
      const amount = 100;

      await token
        .connect(creator)
        .create(tokenId, amount, creator.address, "", [], creator.address, 0);

      await airdrop.connect(creator).create(token.address, tokenId, amount);

      expect(await token.balanceOf(claimer.address, tokenId)).eq(0);

      await expect(airdrop.connect(claimer).claim(1))
        .emit(airdrop, "DropClaimed")
        .withArgs(1, claimer.address);

      expect(await token.balanceOf(claimer.address, tokenId)).eq(1);

      const drop = await airdrop.drops(1);
      expect(drop.claimed).eq(1);
    });

    it("ErrNotFound", async () => {
      const {
        airdrop,
        signers: [claimer],
      } = await loadFixture(fixture);

      await expect(airdrop.connect(claimer).claim(123)).revertedWithCustomError(
        airdrop,
        "ErrNotFound"
      );
    });

    it("Airdrop: closed", async () => {
      const {
        airdrop,
        token,
        signers: [creator, claimer1, claimer2, claimer3],
      } = await loadFixture(fixture);

      const tokenId = 1;
      const amount = 2;

      await token
        .connect(creator)
        .create(tokenId, amount, creator.address, "", [], creator.address, 0);

      await airdrop.connect(creator).create(token.address, tokenId, amount);

      await airdrop.connect(claimer1).claim(1);

      await airdrop.connect(claimer2).claim(1);

      await expect(airdrop.connect(claimer3).claim(1)).revertedWithCustomError(
        airdrop,
        "ErrClosed"
      );
    });

    it("ErrAlreadyClaimed", async () => {
      const {
        airdrop,
        token,
        signers: [creator, claimer],
      } = await loadFixture(fixture);

      const tokenId = 1;
      const amount = 100;

      await token
        .connect(creator)
        .create(tokenId, amount, creator.address, "", [], creator.address, 0);

      await airdrop.connect(creator).create(token.address, tokenId, amount);

      await airdrop.connect(claimer).claim(1);

      await expect(airdrop.connect(claimer).claim(1)).revertedWithCustomError(
        airdrop,
        "ErrAlreadyClaimed"
      );
    });
  });
});
