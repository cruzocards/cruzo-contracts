import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import { ethers } from "hardhat";
import { assert, expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Cruzo1155 } from "../typechain/Cruzo1155";

const tokenDetails = {
  name: "Cruzo",
  symbol: "CRZ",
  baseOnlyURI: "https://cruzo.io/tokens/{id}.json",
  baseAndIdURI: "https://cruzo.io/tokens",
  altBaseOnlyURI: "https://opensea.io/tokens/{id}.json",
  ipfsHash: "Qme3TrFkt28tLgHR2QXjH1ArfamtpkVsgMc9asdw3LXn7y",
  altBaseAndIdURI: "https:opensea.io/tokens/",
};
const real = (inp: string) => inp + "0".repeat(9);

describe("Testing Cruzo1155 Contract", () => {
  let admin: SignerWithAddress;

  let signers: SignerWithAddress[];

  let token: Cruzo1155;

  before(async () => {
    signers = await ethers.getSigners();
    admin = signers[0];
  });

  beforeEach(async () => {
    let Token = await ethers.getContractFactory("Cruzo1155");
    token = (await Token.deploy(
      tokenDetails.baseOnlyURI,
      "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"
    )) as Cruzo1155;
  });

  it("Check Contract Data", async () => {
    expect(await token.marketAddress()).equal(signers[5].address);
    expect(await token.baseURI()).equal(tokenDetails.baseOnlyURI);
    await token.create(1, 1, admin.address, tokenDetails.ipfsHash, []);
    expect(await token.uri(1)).equal("ipfs://" + tokenDetails.ipfsHash);
  });

  it("Should update baseURI", async () => {
    await token.create(1, 1, admin.address, tokenDetails.ipfsHash, []);
    expect(await token.baseURI()).equal(tokenDetails.baseOnlyURI);
    await token.setBaseURI(tokenDetails.altBaseOnlyURI);
    expect(await token.baseURI()).eq(tokenDetails.altBaseOnlyURI);
    await token.setURIType(0);
    expect(await token.uri(1)).eq(tokenDetails.altBaseOnlyURI);
  });

  it("Should change URI Type", async () => {
    expect(await token.uriType()).eq(1);
    await token.setURIType(1);
    expect(await token.uriType()).eq(1);
  });

  it("Should return baseURI when URIType is Default", async () => {
    await token.create(0, 1, admin.address, tokenDetails.ipfsHash, []);

    await token.setURIType(0);
    expect(await token.uri(0)).eq(tokenDetails.baseOnlyURI);
  });

  it("Should return ipfs://tokenURI when URIType is IPFS ", async () => {
    await token.create(1, 1, admin.address, tokenDetails.ipfsHash, []);
    expect(await token.setURIType(1));
    expect(await token.setTokenURI(1, tokenDetails.ipfsHash));
    expect(await token.uri(1)).eq("ipfs://" + tokenDetails.ipfsHash);
  });

  it("Should return concatenaed basUri+id when URIType is ID and baseURI is set", async () => {
    await token.create(0, 1, admin.address, tokenDetails.ipfsHash, []);

    expect(await token.setURIType(2));
    expect(await token.uri(0)).eq(tokenDetails.baseOnlyURI + "/" + "0.json");
  });

  it("Should update balance and totalSupply on create", async () => {
    await token.create(1, 1000, admin.address, "", []);
    await token.create(2, 1, admin.address, "", []);
    expect(await token.balanceOf(admin.address, 1)).equal(1000);
    expect(await token.totalSupply(1)).equal(1000);
    expect(await token.balanceOf(admin.address, 2)).equal(1);
    expect(await token.totalSupply(2)).equal(1);
  });

  it("Should update creator on create()", async () => {
    await token.create(1, 1000, admin.address, "", []);
    expect(await token.creators(1)).equal(admin.address);
    await token.create(2, 1000, signers[1].address, "", []);
    expect(await token.creators(2)).equal(admin.address);
    await token.connect(signers[1]).create(3, 1, admin.address, "", []);
    expect(await token.creators(3)).equal(signers[1].address);
    await token.connect(signers[1]).create(4, 1, signers[1].address, "", []);
    expect(await token.creators(4)).equal(signers[1].address);
  });

  it("Check marketAddress approval", async () => {
    await token.create(1, 1000, admin.address, "", []);
    await expect(
      token
        .connect(signers[1])
        .safeTransferFrom(admin.address, signers[1].address, 1, 1, [])
    ).to.be.reverted;
    await expect(
      token
        .connect(signers[5])
        .safeTransferFrom(admin.address, signers[1].address, 1, 1, [])
    ).not.to.be.reverted;
    expect(await token.balanceOf(signers[1].address, 1)).equal(1);
  });

  it("Should puase and unpause", async () => {
    await token.create(1, 1000, admin.address, "", []);
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

  it("Check mintTo function", async () => {
    await token.create(1, 1, signers[1].address, "", []);
    await token.create(2, 1, signers[1].address, "", []);
    await token.mintTo(1, 1, signers[1].address, []);
    await token.mintTo(2, 1, signers[1].address, []);
    expect(await token.balanceOf(signers[1].address, 1)).equal(2);
    expect(await token.balanceOf(signers[1].address, 2)).equal(2);
    await expect(
      token.connect(signers[1]).mintTo(1, 1, signers[1].address, [])
    ).revertedWith("ERC1155CruzoBase#onlyCreator: ONLY_CREATOR_ALLOWED");
  });

  it("Should update balance and totalSupply on burn", async () => {
    await token.create(1, 1000, admin.address, "", []);
    expect(await token.totalSupply(1)).equal(1000);
    expect(await token.balanceOf(admin.address, 1)).equal(1000);
    await token.burn(admin.address, 1, 1);
    expect(await token.balanceOf(admin.address, 1)).equal(999);
    expect(await token.totalSupply(1)).equal(999);
  });

  it("Should not burn if msg.sender is not approved", async () => {
    await token.create(1, 1000, signers[1].address, "", []);
    await expect(token.burn(signers[1].address, 1, 1)).to.revertedWith(
      "ERC1155CruzoBase: caller is not owner nor approved"
    );
  });

  it("Should update balance and totalSupply on burnBatch", async () => {
    await token.create(1, 1000, admin.address, "", []);
    await token.create(2, 1000, admin.address, "", []);
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
});
