import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { CruzoMarket, TransferProxy } from "../typechain";

describe("CruzoMarket", () => {
  async function fixture() {
    const signers = await ethers.getSigners();

    const TransferProxy = await ethers.getContractFactory("TransferProxy");
    const transferProxy = (await upgrades.deployProxy(TransferProxy, [], {
      kind: "uups",
    })) as TransferProxy;
    await transferProxy.deployed();

    const serviceFee = 300;
    const serviceFeeBase = 10000;

    const royaltyFee = 1000;
    const royaltyFeeBase = 10000;

    const CruzoMarket = await ethers.getContractFactory("CruzoMarket");
    const market = (await upgrades.deployProxy(
      CruzoMarket,
      [transferProxy.address, serviceFee],
      {
        kind: "uups",
      }
    )) as CruzoMarket;
    await market.deployed();

    await transferProxy.setOperator(market.address, true);

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
      market,
      serviceFee,
      serviceFeeBase,
      token,

      royaltyFee,
      royaltyFeeBase,
    };
  }

  it("Should deploy", async () => {
    const { signers, market, serviceFee } = await loadFixture(fixture);
    expect(await market.owner()).eq(signers[0].address);
    expect(await market.serviceFee()).eq(serviceFee);
  });

  describe("openTrade", () => {
    it("Should open trade", async () => {
      const {
        token,
        market,
        signers: [seller],
      } = await loadFixture(fixture);
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      await token
        .connect(seller)
        .create(tokenId, supply, seller.address, "", [], seller.address, 0);

      await expect(
        market
          .connect(seller)
          .openTrade(token.address, tokenId, tradeAmount, price)
      )
        .emit(market, "TradeOpened")
        .withArgs(token.address, tokenId, seller.address, tradeAmount, price);

      const trade = await market.trades(token.address, tokenId, seller.address);
      expect(trade.price).eq(price);
      expect(trade.amount).eq(tradeAmount);
    });

    it("Market: amount must be greater than 0", async () => {
      const {
        token,
        signers: [seller],
        market,
      } = await loadFixture(fixture);
      await expect(
        market
          .connect(seller)
          .openTrade(token.address, 1, 0, ethers.utils.parseEther("0.01"))
      ).revertedWith("Market: amount must be greater than 0");
    });

    it("Market: trade is already open", async () => {
      const {
        token,
        market,
        signers: [seller],
      } = await loadFixture(fixture);
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      await token
        .connect(seller)
        .create(tokenId, supply, seller.address, "", [], seller.address, 0);

      await market
        .connect(seller)
        .openTrade(token.address, tokenId, tradeAmount, price);

      await expect(
        market
          .connect(seller)
          .openTrade(token.address, tokenId, tradeAmount, price)
      ).revertedWith("Market: trade is already open");
    });
  });

  describe("closeTrade", () => {
    it("Should close trade", async () => {
      const {
        market,
        token,
        signers: [seller],
      } = await loadFixture(fixture);
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      await token
        .connect(seller)
        .create(tokenId, supply, seller.address, "", [], seller.address, 0);

      await market
        .connect(seller)
        .openTrade(token.address, tokenId, tradeAmount, price);

      await expect(market.connect(seller).closeTrade(token.address, tokenId))
        .emit(market, "TradeClosed")
        .withArgs(token.address, tokenId, seller.address);

      const trade = await market.trades(token.address, tokenId, seller.address);
      expect(trade.amount).eq(0);
    });

    it("Market: trade is not open", async () => {
      const {
        market,
        token,
        signers: [seller],
      } = await loadFixture(fixture);

      await expect(
        market.connect(seller).closeTrade(token.address, 1)
      ).revertedWith("Market: trade is not open");
    });
  });

  describe("changePrice", () => {
    it("Should change trade price", async () => {
      const {
        token,
        market,
        signers: [seller],
      } = await loadFixture(fixture);
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");
      const newPrice = ethers.utils.parseEther("1");

      await token
        .connect(seller)
        .create(tokenId, supply, seller.address, "", [], seller.address, 0);

      await market
        .connect(seller)
        .openTrade(token.address, tokenId, tradeAmount, price);

      let trade = await market.trades(token.address, tokenId, seller.address);
      expect(trade.price).eq(price);

      await expect(
        market.connect(seller).changePrice(token.address, tokenId, newPrice)
      )
        .emit(market, "TradePriceChanged")
        .withArgs(token.address, tokenId, seller.address, newPrice);

      trade = await market.trades(token.address, tokenId, seller.address);
      expect(trade.price).eq(newPrice);
    });

    it("Market: trade is not open", async () => {
      const {
        market,
        token,
        signers: [seller],
      } = await loadFixture(fixture);

      await expect(
        market
          .connect(seller)
          .changePrice(token.address, 1, ethers.utils.parseEther("1"))
      ).revertedWith("Market: trade is not open");
    });
  });

  describe("setServiceFee", () => {
    it("Should set service fee", async () => {
      const { market, serviceFee } = await loadFixture(fixture);

      expect(await market.serviceFee()).eq(serviceFee);

      expect(await market.setServiceFee(0));
      expect(await market.serviceFee()).eq(0);

      expect(await market.setServiceFee(1000));
      expect(await market.serviceFee()).eq(1000);

      expect(await market.setServiceFee(10000));
      expect(await market.serviceFee()).eq(10000);
    });

    it("Should not set service fee < 0% or > 100%", async () => {
      const { market } = await loadFixture(fixture);
      await expect(market.setServiceFee(10001)).revertedWith(
        "Market: service fee cannot exceed 10000"
      );
      // await expect(market.setServiceFee(-1)).reverted;
    });
  });

  describe("withdraw", () => {
    it("Should withdraw funds", async () => {
      const {
        market,
        signers: [owner, notowner],
      } = await loadFixture(fixture);

      expect(await ethers.provider.getBalance(market.address)).eq(0);

      const value = 1000000;
      await ethers.provider.send("hardhat_setBalance", [
        market.address,
        "0x" + value.toString(16),
      ]);

      expect(await ethers.provider.getBalance(market.address)).eq(value);

      const to = ethers.Wallet.createRandom();
      expect(await ethers.provider.getBalance(to.address)).eq(0);

      await market.connect(owner).withdraw(to.address, value);

      expect(await ethers.provider.getBalance(to.address)).eq(value);
      expect(await ethers.provider.getBalance(market.address)).eq(0);

      // onlyOwner
      await expect(
        market.connect(notowner).withdraw(to.address, value)
      ).revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("executeTrade", () => {
    it("Should execute trade", async () => {
      const {
        serviceFee,
        serviceFeeBase,
        token,
        market,
        signers: [seller, buyer],
      } = await loadFixture(fixture);
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      const purchaseAmount = ethers.BigNumber.from("5");
      const purchaseValue = price.mul(purchaseAmount);
      const serviceFeeValue = purchaseValue.mul(serviceFee).div(serviceFeeBase);

      await token
        .connect(seller)
        .create(tokenId, supply, seller.address, "", [], seller.address, 0);

      await market
        .connect(seller)
        .openTrade(token.address, tokenId, tradeAmount, price);

      expect(await token.balanceOf(seller.address, tokenId)).eq(supply);

      expect(await token.balanceOf(buyer.address, tokenId)).eq(0);

      const sellerBalance = await ethers.provider.getBalance(seller.address);

      await expect(
        market
          .connect(buyer)
          .executeTrade(
            token.address,
            tokenId,
            seller.address,
            purchaseAmount,
            {
              value: purchaseValue,
            }
          )
      )
        .emit(market, "TradeExecuted")
        .withArgs(
          token.address,
          tokenId,
          seller.address,
          buyer.address,
          purchaseAmount,
          price
        );

      expect(await token.balanceOf(buyer.address, tokenId)).eq(purchaseAmount);
      expect(await token.balanceOf(seller.address, tokenId)).eq(
        supply.sub(purchaseAmount)
      );

      const trade = await market.trades(token.address, tokenId, seller.address);
      expect(trade.amount).eq(tradeAmount.sub(purchaseAmount));

      expect(sellerBalance.add(purchaseValue).sub(serviceFeeValue)).eq(
        await ethers.provider.getBalance(seller.address)
      );

      expect(await ethers.provider.getBalance(market.address)).eq(
        serviceFeeValue
      );
    });

    it("Should execute trade with royalties", async () => {
      const {
        serviceFee,
        serviceFeeBase,
        royaltyFee,
        royaltyFeeBase,
        token,
        market,
        signers: [seller, buyer],
      } = await loadFixture(fixture);
      const royaltyReceiver = ethers.Wallet.createRandom();

      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      const purchaseAmount = ethers.BigNumber.from("5");
      const purchaseValue = price.mul(purchaseAmount);
      const serviceFeeValue = purchaseValue.mul(serviceFee).div(serviceFeeBase);
      const royaltyFeeValue = purchaseValue
        .sub(serviceFeeValue)
        .mul(royaltyFee)
        .div(royaltyFeeBase);

      expect(await ethers.provider.getBalance(royaltyReceiver.address)).eq(0);

      await token
        .connect(seller)
        .create(
          tokenId,
          supply,
          seller.address,
          "",
          [],
          royaltyReceiver.address,
          royaltyFee
        );

      await market
        .connect(seller)
        .openTrade(token.address, tokenId, tradeAmount, price);

      const sellerBalance = await ethers.provider.getBalance(seller.address);

      await market
        .connect(buyer)
        .executeTrade(token.address, tokenId, seller.address, purchaseAmount, {
          value: purchaseValue,
        });

      expect(await token.balanceOf(buyer.address, tokenId)).eq(purchaseAmount);
      expect(await token.balanceOf(seller.address, tokenId)).eq(
        supply.sub(purchaseAmount)
      );

      const trade = await market.trades(token.address, tokenId, seller.address);
      expect(trade.amount).eq(tradeAmount.sub(purchaseAmount));

      expect(
        sellerBalance
          .add(purchaseValue)
          .sub(serviceFeeValue)
          .sub(royaltyFeeValue)
      ).eq(await ethers.provider.getBalance(seller.address));

      expect(await ethers.provider.getBalance(market.address)).eq(
        serviceFeeValue
      );

      expect(await ethers.provider.getBalance(royaltyReceiver.address)).eq(
        royaltyFeeValue
      );
    });

    it("Market: cannot be executed by the seller", async () => {
      const {
        token,
        market,
        signers: [seller],
      } = await loadFixture(fixture);
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      await token
        .connect(seller)
        .create(tokenId, supply, seller.address, "", [], seller.address, 0);

      await market
        .connect(seller)
        .openTrade(token.address, tokenId, tradeAmount, price);

      await expect(
        market
          .connect(seller)
          .executeTrade(token.address, tokenId, seller.address, tradeAmount)
      ).revertedWith("Market: cannot be executed by the seller");
    });

    it("Market: amount must be greater than 0", async () => {
      const {
        token,
        market,
        signers: [seller, buyer],
      } = await loadFixture(fixture);
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      await token
        .connect(seller)
        .create(tokenId, supply, seller.address, "", [], seller.address, 0);

      await market
        .connect(seller)
        .openTrade(token.address, tokenId, tradeAmount, price);

      await expect(
        market
          .connect(buyer)
          .executeTrade(token.address, tokenId, seller.address, "0")
      ).revertedWith("Market: amount must be greater than 0");
    });

    it("Market: not enough items", async () => {
      const {
        token,
        market,
        signers: [seller, buyer],
      } = await loadFixture(fixture);
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      await token
        .connect(seller)
        .create(tokenId, supply, seller.address, "", [], seller.address, 0);

      await market
        .connect(seller)
        .openTrade(token.address, tokenId, tradeAmount, price);

      await expect(
        market
          .connect(buyer)
          .executeTrade(
            token.address,
            tokenId,
            seller.address,
            tradeAmount.add("1")
          )
      ).revertedWith("Market: not enough items");
    });

    it("Market: ether value sent is incorrect", async () => {
      const {
        token,
        market,
        signers: [seller, buyer],
      } = await loadFixture(fixture);
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      await token
        .connect(seller)
        .create(tokenId, supply, seller.address, "", [], seller.address, 0);

      await market
        .connect(seller)
        .openTrade(token.address, tokenId, tradeAmount, price);

      await expect(
        market
          .connect(buyer)
          .executeTrade(token.address, tokenId, seller.address, tradeAmount, {
            value: 0,
          })
      ).revertedWith("Market: ether value sent is incorrect");
    });

    it("ERC1155: insufficient balance for transfer", async () => {
      const {
        token,
        market,
        signers: [seller, buyer],
      } = await loadFixture(fixture);
      const tokenId = ethers.BigNumber.from("1");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      const purchaseAmount = ethers.BigNumber.from("5");
      const purchaseValue = price.mul(purchaseAmount);

      await market
        .connect(seller)
        .openTrade(token.address, tokenId, tradeAmount, price);

      await expect(
        market
          .connect(buyer)
          .executeTrade(
            token.address,
            tokenId,
            seller.address,
            purchaseAmount,
            {
              value: purchaseValue,
            }
          )
      ).revertedWith("ERC1155: insufficient balance for transfer");
    });
  });
});
