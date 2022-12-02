import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, upgrades } from "hardhat";
import { TransferProxy } from "../typechain";

describe("TransferProxy", () => {
  async function fixture() {
    const signers = await ethers.getSigners();
    const TransferProxy = await ethers.getContractFactory("TransferProxy");
    const transferProxy = (await upgrades.deployProxy(TransferProxy, [], {
      kind: "uups",
    })) as TransferProxy;
    await transferProxy.deployed();
    return {
      transferProxy,
      signers,
    };
  }

  it("Should deploy", async () => {
    const { transferProxy, signers } = await loadFixture(fixture);
    expect(await transferProxy.owner()).eq(signers[0].address);
  });

  it("Should set operators", async () => {
    const {
      transferProxy,
      signers: [_, notowner],
    } = await loadFixture(fixture);
    const operators = [
      ethers.Wallet.createRandom(),
      ethers.Wallet.createRandom(),
      ethers.Wallet.createRandom(),
      ethers.Wallet.createRandom(),
      ethers.Wallet.createRandom(),
    ];

    // setOperator
    for (const operator of operators) {
      expect(await transferProxy.operators(operator.address)).eq(false);
      await transferProxy.setOperator(operator.address, true);
      expect(await transferProxy.operators(operator.address)).eq(true);
      await transferProxy.setOperator(operator.address, false);
      expect(await transferProxy.operators(operator.address)).eq(false);
    }

    // setOperators
    await transferProxy.setOperators(
      operators.map((operator) => operator.address),
      operators.map(() => true)
    );
    for (const operator of operators) {
      expect(await transferProxy.operators(operator.address)).eq(true);
    }
    await transferProxy.setOperators(
      operators.map((operator) => operator.address),
      operators.map(() => false)
    );
    for (const operator of operators) {
      expect(await transferProxy.operators(operator.address)).eq(false);
    }

    // onlyOwner
    await expect(
      transferProxy.connect(notowner).setOperator(notowner.address, true)
    ).revertedWith("Ownable: caller is not the owner");
    await expect(
      transferProxy.connect(notowner).setOperators([notowner.address], [true])
    ).revertedWith("Ownable: caller is not the owner");
  });

  it("Should transfer", async () => {
    const { transferProxy, signers } = await loadFixture(fixture);

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

    const [operator, from, to] = signers;

    const tokenId = 1;
    const amount = 100;
    await token
      .connect(from)
      .create(tokenId, amount, from.address, "", [], from.address, 0);

    // not the operator
    expect(await transferProxy.operators(operator.address)).eq(false);
    await expect(
      transferProxy
        .connect(operator)
        .safeTransferFrom(
          token.address,
          from.address,
          to.address,
          tokenId,
          amount,
          []
        )
    ).revertedWith("OperatorRole: caller is not the operator");

    expect(await token.balanceOf(from.address, tokenId)).eq(amount);
    expect(await token.balanceOf(to.address, tokenId)).eq(0);

    await transferProxy.setOperator(operator.address, true);
    await transferProxy
      .connect(operator)
      .safeTransferFrom(
        token.address,
        from.address,
        to.address,
        tokenId,
        amount,
        []
      );

    expect(await token.balanceOf(from.address, tokenId)).eq(0);
    expect(await token.balanceOf(to.address, tokenId)).eq(amount);
  });
});
