import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers, upgrades } from "hardhat";
import { RAW_FACTORY_INITIALIZE_SIGNATURE } from "../../constants/signatures";
import {
  ALLOCATION,
  MAX_PER_ACCOUNT,
  MAX_SUPPLY,
  PRICE,
  REWARDS,
} from "../../constants/pass-sale";
import { Cruzo1155, CruzoPassSale } from "../../typechain";
import { sign } from "../../utils/pass-sale";

describe.skip("CruzoPassSale", () => {
  const contractURI =
    "ipfs://bafkreic7g3c57uef4sw7yxn7exx6eeugv4ynuoxle5yalorxkzqw5kz7xq";
  const baseURI =
    "ipfs://bafybeicajjv7xymvm57xygq35edjagq7x2lq7giwg67wvdb3klscrunyve";

  const price = ethers.utils.parseEther(PRICE);

  let owner: SignerWithAddress;
  let signer: SignerWithAddress;
  let rewardsAccount: SignerWithAddress;

  let passSale: CruzoPassSale;
  let token: Cruzo1155;

  async function createMember() {
    const member = ethers.Wallet.createRandom().connect(ethers.provider);
    await ethers.provider.send("hardhat_setBalance", [
      member.address,
      "0x" + parseEther("10000").toBigInt().toString(16),
    ]);
    return member;
  }

  beforeEach(async () => {
    [owner, signer, rewardsAccount] = await ethers.getSigners();

    const Cruzo1155 = await ethers.getContractFactory("Cruzo1155");
    const Factory = await ethers.getContractFactory("Cruzo1155Factory");

    const beacon = await upgrades.deployBeacon(Cruzo1155);
    await beacon.deployed();

    const factory = await Factory.deploy(
      beacon.address,
      RAW_FACTORY_INITIALIZE_SIGNATURE,
      "https://cruzo.market",
      ethers.constants.AddressZero
    );
    await factory.deployed();

    const CruzoPassSale = await ethers.getContractFactory("CruzoPassSale");

    passSale = await CruzoPassSale.deploy(
      factory.address,
      signer.address,
      rewardsAccount.address,
      contractURI,
      baseURI,
      price
    );

    await passSale.deployed();
    await passSale.setSaleActive(true).then((tx) => tx.wait());

    token = Cruzo1155.attach(await passSale.token());
  });

  it("Should create a new Cruzo1155", async () => {
    expect(await passSale.token()).eq(token.address);
    expect(await token.owner()).eq(passSale.address);
  });

  it("Should get MAX_PER_ACCOUNT", async () => {
    expect(await passSale.MAX_PER_ACCOUNT()).eq(MAX_PER_ACCOUNT);
  });

  it("Should get REWARDS", async () => {
    expect(await passSale.REWARDS()).eq(REWARDS);
  });

  it("Should get ALLOCATION", async () => {
    expect(await passSale.ALLOCATION()).eq(ALLOCATION);
  });

  it("Should get MAX_SUPPLY", async () => {
    expect(await passSale.MAX_SUPPLY()).eq(MAX_SUPPLY);
  });

  it("Should get signerAddress", async () => {
    expect(await passSale.signerAddress()).eq(signer.address);
  });

  it("Should get price", async () => {
    expect(await passSale.price()).eq(price);
  });

  it("Should get owner", async () => {
    expect(await passSale.owner()).eq(owner.address);
  });

  it("Should get saleActive", async () => {
    expect(await passSale.saleActive()).eq(true);
  });

  it("Should get publicSale", async () => {
    expect(await passSale.publicSale()).eq(false);
  });

  it("Should mint 20 tokens to rewards account", async () => {
    for (let i = 0; i < REWARDS; i++) {
      const tokenId = i + 1;
      expect(await token.balanceOf(rewardsAccount.address, tokenId)).eq(1);
      expect(await token.uri(tokenId)).eq(baseURI + `/${tokenId}.json`);
    }
    expect(await passSale.tokenId()).eq(REWARDS);
  });

  it("Should buy 1 token", async () => {
    const member = await createMember();
    const tokenId = REWARDS + 1;
    const signature = await sign(signer, member.address);

    expect(await ethers.provider.getBalance(passSale.address)).eq(0);
    expect(await token.balanceOf(member.address, tokenId)).eq(0);

    await expect(
      passSale.connect(member).buy(1, signature, {
        value: price,
      })
    )
      .emit(passSale, "Mint")
      .withArgs(member.address, tokenId);

    expect(await passSale.tokenId()).eq(tokenId);
    expect(await ethers.provider.getBalance(passSale.address)).eq(price);
    expect(await token.balanceOf(member.address, tokenId)).eq(1);
  });

  it("Should deactivate sale", async () => {
    expect(await passSale.setSaleActive(false));

    const member = await createMember();
    await expect(
      passSale.connect(member).buy(1, await sign(signer, member.address), {
        value: price,
      })
    ).revertedWith("CruzoPassSale: sale is not active");
  });

  it("Should buy all allocated tokens", async () => {
    const MAX_SUPPLY = await passSale.MAX_SUPPLY();
    const MAX_PER_ACCOUNT = await passSale.MAX_PER_ACCOUNT();
    let tokenId = await passSale.tokenId();

    expect(await ethers.provider.getBalance(passSale.address)).eq(0);

    while (tokenId.lt(MAX_SUPPLY)) {
      const member = await createMember();

      const amount = Math.min(
        MAX_PER_ACCOUNT.toNumber(),
        MAX_SUPPLY.sub(tokenId).toNumber()
      );

      expect(
        await passSale
          .connect(member)
          .buy(amount, await sign(signer, member.address), {
            value: price.mul(amount),
          })
      );

      for (let i = 0; i < amount; i++) {
        tokenId = tokenId.add(1);
        expect(await token.balanceOf(member.address, tokenId)).eq(1);
        expect(await token.uri(tokenId)).eq(baseURI + `/${tokenId}.json`);
      }
    }

    expect(await passSale.tokenId()).eq(MAX_SUPPLY);

    expect(await ethers.provider.getBalance(passSale.address)).eq(
      price.mul(ALLOCATION)
    );

    // reverts here
    const member = await createMember();
    await expect(
      passSale.connect(member).buy(1, await sign(signer, member.address), {
        value: price,
      })
    ).revertedWith("CruzoPassSale: not enough supply");
  });

  it("Should revert if the signature is invalid", async () => {
    const member1 = await createMember();
    const signature1 = await sign(signer, member1.address);
    const member2 = await createMember();

    await expect(
      passSale.connect(member2).buy(1, signature1, {
        value: price,
      })
    ).revertedWith("CruzoPassSale: invalid signature");
  });

  it("Should revert if the value is incorrect", async () => {
    const member = await createMember();
    const signature = await sign(signer, member.address);

    await expect(passSale.connect(member).buy(1, signature)).revertedWith(
      "CruzoPassSale: incorrect value sent"
    );
  });

  it("Should revert if the amount is invalid", async () => {
    const member = await createMember();
    const signature = await sign(signer, member.address);
    await expect(passSale.connect(member).buy(0, signature)).revertedWith(
      "CruzoPassSale: invalid amount"
    );
  });

  it("Should revert if the amount exceeds MAX_PER_ACCOUNT", async () => {
    const member = await createMember();
    const signature = await sign(signer, member.address);

    const MAX_PER_ACCOUNT = await passSale.MAX_PER_ACCOUNT();

    expect(
      await passSale.connect(member).buy(MAX_PER_ACCOUNT, signature, {
        value: MAX_PER_ACCOUNT.mul(price),
      })
    );

    expect(await passSale.allocation(member.address)).eq(MAX_PER_ACCOUNT);

    await expect(
      passSale.connect(member).buy(1, signature, {
        value: price,
      })
    ).revertedWith("CruzoPassSale: too many NFT passes in one hand");
  });

  it("Should withdraw", async () => {
    expect(await ethers.provider.getBalance(passSale.address)).eq(0);

    const wei = "10000000000000";
    await ethers.provider.send("hardhat_setBalance", [
      passSale.address,
      "0x" + BigInt(wei).toString(16),
    ]);

    expect(await ethers.provider.getBalance(passSale.address)).eq(wei);

    const to = ethers.Wallet.createRandom();
    expect(await ethers.provider.getBalance(to.address)).eq(0);
    expect(await passSale.withdraw(to.address));
    expect(await ethers.provider.getBalance(passSale.address)).eq(0);
    expect(await ethers.provider.getBalance(to.address)).eq(wei);

    // reverts here
    const member = await createMember();
    await expect(
      passSale.connect(member).withdraw(member.address)
    ).revertedWith("Ownable: caller is not the owner");
  });

  it("Should transfer Cruzo1155 ownership", async () => {
    expect(await token.owner()).eq(passSale.address);
    const to = ethers.Wallet.createRandom();
    expect(await passSale.transferTokenOwnership(to.address));
    expect(await token.owner()).eq(to.address);
  });

  it("Should buy without a signature (public sale)", async () => {
    expect(await passSale.setPublicSale(true));
    const member = await createMember();
    expect(
      await passSale.connect(member).buy(1, [], {
        value: price,
      })
    );
  });
});
