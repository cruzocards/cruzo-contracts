import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers, upgrades } from "hardhat";
import { RAW_FACTORY_INITIALIZE_SIGNATURE } from "../constants/signatures";
import {
  ALLOCATION,
  MAX_PER_ACCOUNT,
  MAX_SUPPLY,
  PRICE,
  REWARDS,
} from "../constants/whitelist";
import { Cruzo1155, CruzoWhitelist } from "../typechain";

describe("CruzoWhitelist", () => {
  const uris = [...Array(MAX_SUPPLY)].map(
    (_, i) =>
      `bafkreif3mmhmw254sjxt3d6ezkiyqcwcxgedqqct24kgnghwxe3me2u2qu_${i + 1}`
  );
  const price = ethers.utils.parseEther(PRICE);

  let owner: SignerWithAddress;
  let signer: SignerWithAddress;
  let rewardsAccount: SignerWithAddress;

  let whitelist: CruzoWhitelist;
  let token: Cruzo1155;

  async function sign(address: string): Promise<string> {
    return await signer.signMessage(
      ethers.utils.arrayify(ethers.utils.hexZeroPad(address, 32))
    );
  }

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

    const CruzoWhitelist = await ethers.getContractFactory("CruzoWhitelist");

    whitelist = await CruzoWhitelist.deploy(
      factory.address,
      signer.address,
      rewardsAccount.address,
      uris as any,
      price
    );

    await whitelist.deployed();
    await whitelist.setSaleActive(true).then((tx) => tx.wait());

    token = Cruzo1155.attach(await whitelist.tokenAddress());
  });

  it("Should create a new Cruzo1155", async () => {
    expect(await whitelist.tokenAddress()).eq(token.address);
    expect(await token.owner()).eq(whitelist.address);
  });

  it("Should get MAX_PER_ACCOUNT", async () => {
    expect(await whitelist.MAX_PER_ACCOUNT()).eq(MAX_PER_ACCOUNT);
  });

  it("Should get REWARDS", async () => {
    expect(await whitelist.REWARDS()).eq(REWARDS);
  });

  it("Should get ALLOCATION", async () => {
    expect(await whitelist.ALLOCATION()).eq(ALLOCATION);
  });

  it("Should get MAX_SUPPLY", async () => {
    expect(await whitelist.MAX_SUPPLY()).eq(MAX_SUPPLY);
  });

  it("Should get signerAddress", async () => {
    expect(await whitelist.signerAddress()).eq(signer.address);
  });

  it("Should get price", async () => {
    expect(await whitelist.price()).eq(price);
  });

  it("Should get owner", async () => {
    expect(await whitelist.owner()).eq(owner.address);
  });

  it("Should get saleActive", async () => {
    expect(await whitelist.saleActive()).eq(true);
  });

  it("Should get publicSale", async () => {
    expect(await whitelist.publicSale()).eq(false);
  });

  it("Should mint 20 tokens to rewards account", async () => {
    for (let i = 0; i < REWARDS; i++) {
      const tokenId = i + 1;
      expect(await token.balanceOf(rewardsAccount.address, tokenId)).eq(1);
      expect(await token.uri(tokenId)).eq("ipfs://" + uris[i]);
    }
    expect(await whitelist.tokenId()).eq(REWARDS);
  });

  it("Should buy 1 token", async () => {
    const member = await createMember();
    const tokenId = REWARDS + 1;
    const signature = await sign(member.address);

    expect(await ethers.provider.getBalance(whitelist.address)).eq(0);
    expect(await token.balanceOf(member.address, tokenId)).eq(0);

    await expect(
      whitelist.connect(member).buy(1, signature, {
        value: price,
      })
    )
      .emit(whitelist, "Mint")
      .withArgs(member.address, tokenId);

    expect(await whitelist.tokenId()).eq(tokenId);
    expect(await ethers.provider.getBalance(whitelist.address)).eq(price);
    expect(await token.balanceOf(member.address, tokenId)).eq(1);
  });

  it("Should deactivate sale", async () => {
    expect(await whitelist.setSaleActive(false));

    const member = await createMember();
    await expect(
      whitelist.connect(member).buy(1, await sign(member.address), {
        value: price,
      })
    ).revertedWith("Whitelist: sale is not active");
  });

  it("Should buy all allocated tokens", async () => {
    const MAX_SUPPLY = await whitelist.MAX_SUPPLY();
    const MAX_PER_ACCOUNT = await whitelist.MAX_PER_ACCOUNT();
    let tokenId = await whitelist.tokenId();

    expect(await ethers.provider.getBalance(whitelist.address)).eq(0);

    while (tokenId.lt(MAX_SUPPLY)) {
      const member = await createMember();

      const amount = Math.min(
        MAX_PER_ACCOUNT.toNumber(),
        MAX_SUPPLY.sub(tokenId).toNumber()
      );

      expect(
        await whitelist
          .connect(member)
          .buy(amount, await sign(member.address), {
            value: price.mul(amount),
          })
      );

      for (let i = 0; i < amount; i++) {
        tokenId = tokenId.add(1);
        expect(await token.balanceOf(member.address, tokenId)).eq(1);
        expect(await token.uri(tokenId)).eq(
          "ipfs://" + uris[tokenId.sub(1).toNumber()]
        );
      }
    }

    expect(await whitelist.tokenId()).eq(MAX_SUPPLY);

    expect(await ethers.provider.getBalance(whitelist.address)).eq(
      price.mul(ALLOCATION)
    );

    // reverts here
    const member = await createMember();
    await expect(
      whitelist.connect(member).buy(1, await sign(member.address), {
        value: price,
      })
    ).revertedWith("Whitelist: not enough supply");
  });

  it("Should revert if the signature is invalid", async () => {
    const member = await createMember();
    const signature = await signer.signMessage("invalid message");

    await expect(
      whitelist.connect(member).buy(1, signature, {
        value: price,
      })
    ).revertedWith("Whitelist: invalid signature");
  });

  it("Should revert if the value is incorrect", async () => {
    const member = await createMember();
    const signature = await sign(member.address);

    await expect(whitelist.connect(member).buy(1, signature)).revertedWith(
      "Whitelist: incorrect value sent"
    );
  });

  it("Should revert if the amount is invalid", async () => {
    const member = await createMember();
    const signature = await sign(member.address);
    await expect(whitelist.connect(member).buy(0, signature)).revertedWith(
      "Whitelist: invalid amount"
    );
  });

  it("Should revert if the amount exceeds MAX_PER_ACCOUNT", async () => {
    const member = await createMember();
    const signature = await sign(member.address);

    const MAX_PER_ACCOUNT = await whitelist.MAX_PER_ACCOUNT();

    expect(
      await whitelist.connect(member).buy(MAX_PER_ACCOUNT, signature, {
        value: MAX_PER_ACCOUNT.mul(price),
      })
    );

    expect(await whitelist.allocation(member.address)).eq(MAX_PER_ACCOUNT);

    await expect(
      whitelist.connect(member).buy(1, signature, {
        value: price,
      })
    ).revertedWith("Whitelist: too many NFT passes in one hand");
  });

  it("Should withdraw", async () => {
    expect(await ethers.provider.getBalance(whitelist.address)).eq(0);

    const wei = "10000000000000";
    await ethers.provider.send("hardhat_setBalance", [
      whitelist.address,
      "0x" + BigInt(wei).toString(16),
    ]);

    expect(await ethers.provider.getBalance(whitelist.address)).eq(wei);

    const to = ethers.Wallet.createRandom();
    expect(await ethers.provider.getBalance(to.address)).eq(0);
    expect(await whitelist.withdraw(to.address));
    expect(await ethers.provider.getBalance(whitelist.address)).eq(0);
    expect(await ethers.provider.getBalance(to.address)).eq(wei);

    // reverts here
    const member = await createMember();
    await expect(
      whitelist.connect(member).withdraw(member.address)
    ).revertedWith("Ownable: caller is not the owner");
  });

  it("Should transfer Cruzo1155 ownership", async () => {
    expect(await token.owner()).eq(whitelist.address);
    const to = ethers.Wallet.createRandom();
    expect(await whitelist.transferTokenOwnership(to.address));
    expect(await token.owner()).eq(to.address);
  });

  it("Should buy without a signature (public sale)", async () => {
    expect(await whitelist.setPublicSale(true));
    const member = await createMember();
    expect(
      await whitelist.connect(member).buy(1, [], {
        value: price,
      })
    );
  });
});
