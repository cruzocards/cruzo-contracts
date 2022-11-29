import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Cruzo1155, TransferProxy } from "../typechain";
import { Contract } from "ethers";

const tokenDetails = {
  name: "Cruzo",
  symbol: "CRZ",
  baseOnlyURI: "https://cruzo.io/tokens/{id}.json",
  baseAndIdURI: "https://cruzo.io/tokens",
  altBaseOnlyURI: "https://opensea.io/tokens/{id}.json",
  ipfsHash: "Qme3TrFkt28tLgHR2QXjH1ArfamtpkVsgMc9asdw3LXn7y",
  altBaseAndIdURI: "https:opensea.io/tokens/",
  collectionURI: "https://cruzo.io/collection",
};

async function deployToken(
  beaconAddress: string,
  transferProxyAddress: string,
  _publiclyMintable: boolean
): Promise<Cruzo1155> {
  const Cruzo1155 = await ethers.getContractFactory("Cruzo1155");
  const token = (await upgrades.deployBeaconProxy(beaconAddress, Cruzo1155, [
    tokenDetails.name,
    tokenDetails.symbol,
    tokenDetails.baseOnlyURI,
    tokenDetails.collectionURI,
    transferProxyAddress,
    _publiclyMintable,
  ])) as Cruzo1155;
  await token.deployed();
  return token;
}

describe("Testing Cruzo1155 Contract", () => {
  let admin: SignerWithAddress;
  let user1: SignerWithAddress;

  let signers: SignerWithAddress[];

  let transferProxy: TransferProxy;
  let beacon: Contract;
  let token: Cruzo1155;

  before(async () => {
    signers = await ethers.getSigners();
    admin = signers[0];
    user1 = signers[1];
  });

  beforeEach(async () => {
    const TransferProxy = await ethers.getContractFactory("TransferProxy");
    transferProxy = (await upgrades.deployProxy(TransferProxy, [], {
      kind: "uups",
    })) as TransferProxy;
    await transferProxy.deployed();

    const Cruzo1155 = await ethers.getContractFactory("Cruzo1155");
    beacon = await upgrades.deployBeacon(Cruzo1155);
    await beacon.deployed();

    token = await deployToken(beacon.address, transferProxy.address, true);
  });

  it("Check Contract Data", async () => {
    expect(await token.baseURI()).equal(tokenDetails.baseOnlyURI);
    await token.create(
      1,
      1,
      admin.address,
      tokenDetails.ipfsHash,
      [],
      admin.address,
      0
    );
    expect(await token.uri(1)).equal("ipfs://" + tokenDetails.ipfsHash);
  });

  it("Should update baseURI", async () => {
    await token.create(
      1,
      1,
      admin.address,
      tokenDetails.ipfsHash,
      [],
      admin.address,
      0
    );
    expect(await token.baseURI()).equal(tokenDetails.baseOnlyURI);
    await token.setBaseURI(tokenDetails.altBaseOnlyURI);
    expect(await token.baseURI()).eq(tokenDetails.altBaseOnlyURI);
    await token.setURIType(0);
    expect(await token.uri(1)).eq(tokenDetails.altBaseOnlyURI);
  });

  it("Should change URI Type", async () => {
    expect(await token.uriType()).eq(1);
    await token.setURIType(2);
    expect(await token.uriType()).eq(2);
  });

  it("Should return baseURI when URIType is Default", async () => {
    await token.create(
      0,
      1,
      admin.address,
      tokenDetails.ipfsHash,
      [],
      admin.address,
      0
    );
    await token.setURIType(0);
    expect(await token.uri(0)).eq(tokenDetails.baseOnlyURI);
  });

  it("Should return ipfs://tokenURI when URIType is IPFS ", async () => {
    await token.create(
      1,
      1,
      admin.address,
      tokenDetails.ipfsHash,
      [],
      admin.address,
      0
    );
    expect(await token.setURIType(1));
    expect(await token.setTokenURI(1, tokenDetails.ipfsHash));
    expect(await token.uri(1)).eq("ipfs://" + tokenDetails.ipfsHash);
  });

  it("Should return concatenaed basUri+id when URIType is ID and baseURI is set", async () => {
    await token.create(
      0,
      1,
      admin.address,
      tokenDetails.ipfsHash,
      [],
      admin.address,
      0
    );
    expect(await token.setURIType(2));
    expect(await token.uri(0)).eq(tokenDetails.baseOnlyURI + "/" + "0.json");
  });

  it("Should update balance and totalSupply on create", async () => {
    await token.create(1, 1000, admin.address, "", [], admin.address, 0);
    await token.create(2, 1, admin.address, "", [], admin.address, 0);
    expect(await token.balanceOf(admin.address, 1)).equal(1000);
    expect(await token.totalSupply(1)).equal(1000);
    expect(await token.balanceOf(admin.address, 2)).equal(1);
    expect(await token.totalSupply(2)).equal(1);
  });

  it("Should update creator on create()", async () => {
    await token.create(1, 1000, admin.address, "", [], admin.address, 0);
    expect(await token.creators(1)).equal(admin.address);
    await token.create(2, 1000, signers[1].address, "", [], admin.address, 0);
    expect(await token.creators(2)).equal(admin.address);
    await token
      .connect(signers[1])
      .create(3, 1, admin.address, "", [], admin.address, 0);
    expect(await token.creators(3)).equal(signers[1].address);
    await token
      .connect(signers[1])
      .create(4, 1, signers[1].address, "", [], admin.address, 0);
    expect(await token.creators(4)).equal(signers[1].address);
  });

  it("Should puase and unpause", async () => {
    await token.create(1, 1000, admin.address, "", [], admin.address, 0);
    await expect(
      token.safeTransferFrom(admin.address, signers[1].address, 1, 1, [])
    ).not.to.be.reverted;
    await token.pause();
    expect(await token.paused()).equal(true);
    await expect(
      token.safeTransferFrom(admin.address, signers[1].address, 1, 1, [])
    ).to.be.revertedWith("ERC1155CruzoBase: token transfer while paused");
    await token.unpause();
    expect(await token.paused()).equal(false);
    await expect(
      token.safeTransferFrom(admin.address, signers[1].address, 1, 1, [])
    ).not.to.be.reverted;
    expect(await token.balanceOf(signers[1].address, 1)).equal(2);
  });

  it("Should update balance and totalSupply on burn", async () => {
    await token.create(1, 1000, admin.address, "", [], admin.address, 0);
    expect(await token.totalSupply(1)).equal(1000);
    expect(await token.balanceOf(admin.address, 1)).equal(1000);
    await token.burn(admin.address, 1, 1);
    expect(await token.balanceOf(admin.address, 1)).equal(999);
    expect(await token.totalSupply(1)).equal(999);
  });

  it("Should not burn if msg.sender is not approved", async () => {
    await token.create(1, 1000, signers[1].address, "", [], admin.address, 0);
    await expect(token.burn(signers[1].address, 1, 1)).to.revertedWith(
      "ERC1155CruzoBase: caller is not owner nor approved"
    );
  });

  it("Should update balance and totalSupply on burnBatch", async () => {
    await token.create(1, 1000, admin.address, "", [], admin.address, 0);
    await token.create(2, 1000, admin.address, "", [], admin.address, 0);
    await token.burnBatch(admin.address, [1, 2], [2, 2]);
    const batchBal = await token.balanceOfBatch(
      [admin.address, admin.address],
      [1, 2]
    );
    expect(await token.totalSupply(1)).equal(998);
    expect(await token.totalSupply(2)).equal(998);
    expect(batchBal[0]).to.equal(998);
    expect(batchBal[1]).to.equal(998);
  });

  it("Should not create a token twice with the same tokenId", async () => {
    expect(
      await token.create(1, 1000, admin.address, "", [], admin.address, 0)
    );
    await expect(
      token.create(1, 1000, admin.address, "", [], admin.address, 0)
    ).revertedWith("Token is already created");
  });

  it("Should create unmintable token", async () => {
    const token2 = await deployToken(
      beacon.address,
      transferProxy.address,
      false
    );
    await token2.create(1, 1000, admin.address, "", [], admin.address, 0);
    await expect(
      token2
        .connect(user1)
        .create(2, 1000, admin.address, "", [], admin.address, 0)
    ).to.be.revertedWith("Cruzo1155: not publicly mintable");
  });

  it("Should approve TransferProxy by default", async () => {
    expect(
      await token.isApprovedForAll(user1.address, transferProxy.address)
    ).eq(true);
  });
});
