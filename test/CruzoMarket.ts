import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Cruzo1155 } from "../typechain/Cruzo1155";
import { CruzoMarket } from "../typechain/CruzoMarket";
import { BigNumberish, Contract } from "ethers";

describe("CruzoMarket", () => {
  let market: Contract;
  let token: Cruzo1155;

  let owner: SignerWithAddress;
  let seller: SignerWithAddress;
  let buyer: SignerWithAddress;
  let addressee: SignerWithAddress;
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";


  const serviceFee = 300;
  const serviceFeeBase = 10000;


  beforeEach(async () => {
    [owner, seller, buyer, addressee] = await ethers.getSigners();

    const CruzoMarket = await ethers.getContractFactory("CruzoMarket");
    const Cruzo1155 = await ethers.getContractFactory("Cruzo1155");


    market = await upgrades.deployProxy(
      CruzoMarket,
      [
        serviceFee
      ],
      {
        kind: "uups",
      }
    )
    await market.deployed();



    token = await Cruzo1155.deploy("baseURI", market.address);
    await token.deployed();
  });

  describe("openTrade", () => {
    it("Should Open Trade", async () => {
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      expect(
        await token.connect(seller).create(tokenId, supply, seller.address, "", [])
      );

      await expect(
        market
          .connect(seller)
          .openTrade(token.address, tokenId, tradeAmount, price)
      )
        .emit(market, "TradeOpened")
        .withArgs(token.address, tokenId, seller.address, tradeAmount, price);

      expect(await token.balanceOf(seller.address, tokenId)).eq(
        supply.sub(tradeAmount)
      );
      expect(await token.balanceOf(market.address, tokenId)).eq(tradeAmount);

      const trade = await market.trades(token.address, tokenId, seller.address);
      expect(trade.price).eq(price);
      expect(trade.amount).eq(tradeAmount);
    });

    it("Amount must be greater than 0", async () => {
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("0");
      const price = ethers.utils.parseEther("0.01");

      expect(
        await token.connect(seller).create(tokenId, supply, seller.address, "", [])
      );

      await expect(
        market
          .connect(seller)
          .openTrade(token.address, tokenId, tradeAmount, price)
      ).revertedWith("Amount must be greater than 0");
    });

    it("Trade is already open", async () => {
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      expect(
        await token.connect(seller).create(tokenId, supply, seller.address, "", [])
      );

      expect(
        await market
          .connect(seller)
          .openTrade(token.address, tokenId, tradeAmount, price)
      );

      await expect(
        market
          .connect(seller)
          .openTrade(token.address, tokenId, tradeAmount, price)
      ).revertedWith("Trade is already open");
    });

    it("Not approved", async () => {
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = supply.add(1);
      const price = ethers.utils.parseEther("0.01");

      expect(
        await token.connect(seller).create(tokenId, supply, seller.address, "", [])
      );

      expect(
        await token.connect(seller).setApprovalForAll(market.address, false)
      );

      await expect(
        market
          .connect(seller)
          .openTrade(token.address, tokenId, tradeAmount, price)
      ).revertedWith("ERC1155: caller is not owner nor approved");
    });

    it("Insufficient balance", async () => {
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = supply.add(1);
      const price = ethers.utils.parseEther("0.01");

      expect(
        await token.connect(seller).create(tokenId, supply, seller.address, "", [])
      );

      await expect(
        market
          .connect(seller)
          .openTrade(token.address, tokenId, tradeAmount, price)
      ).revertedWith("ERC1155: insufficient balance for transfer");
    });
  });

  describe("executeTrade", () => {
    it("Should Execute Trade", async () => {
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      const purchaseAmount = ethers.BigNumber.from("5");
      const purchaseValue = price.mul(purchaseAmount);
      const serviceFeeValue = purchaseValue.mul(serviceFee).div(serviceFeeBase);

      expect(
        await token.connect(seller).create(tokenId, supply, seller.address, "", [])
      );

      expect(
        await market
          .connect(seller)
          .openTrade(token.address, tokenId, tradeAmount, price)
      );

      expect(await token.balanceOf(buyer.address, tokenId)).eq(0);

      const sellerBalance = await ethers.provider.getBalance(seller.address);

      await expect(
        market
          .connect(buyer)
          .buyItem(
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
          buyer.address
        );

      expect(await token.balanceOf(buyer.address, tokenId)).eq(purchaseAmount);
      expect(await token.balanceOf(market.address, tokenId)).eq(
        tradeAmount.sub(purchaseAmount)
      );

      expect(sellerBalance.add(purchaseValue).sub(serviceFeeValue)).eq(
        await ethers.provider.getBalance(seller.address)
      );

      expect(await ethers.provider.getBalance(market.address)).eq(
        serviceFeeValue
      );
    });
    it("Should make a gift", async () => {
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      const purchaseAmount = ethers.BigNumber.from("5");
      const purchaseValue = price.mul(purchaseAmount);
      const serviceFeeValue = purchaseValue.mul(serviceFee).div(serviceFeeBase);

      expect(
        await token.connect(seller).create(tokenId, supply, seller.address, "", [])
      );

      expect(
        await market
          .connect(seller)
          .openTrade(token.address, tokenId, tradeAmount, price)
      );

      expect(await token.balanceOf(addressee.address, tokenId)).eq(0);

      const sellerBalance = await ethers.provider.getBalance(seller.address);

      await expect(
        market
          .connect(buyer)
          .giftItem(
            token.address,
            tokenId,
            seller.address,
            purchaseAmount,
            addressee.address,
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
          addressee.address

        );

      expect(await token.balanceOf(addressee.address, tokenId)).eq(purchaseAmount);
      expect(await token.balanceOf(market.address, tokenId)).eq(
        tradeAmount.sub(purchaseAmount)
      );

      expect(sellerBalance.add(purchaseValue).sub(serviceFeeValue)).eq(
        await ethers.provider.getBalance(seller.address)
      );

      expect(await ethers.provider.getBalance(market.address)).eq(
        serviceFeeValue
      );
    });

    it("Trade cannot be executed by the seller", async () => {
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      expect(
        await token.connect(seller).create(tokenId, supply, seller.address, "", [])
      );

      expect(
        await market
          .connect(seller)
          .openTrade(token.address, tokenId, tradeAmount, price)
      );

      await expect(
        market
          .connect(seller)
          .buyItem(token.address, tokenId, seller.address, tradeAmount)
      ).revertedWith("Trade cannot be executed by the seller");
    });

    it("Amount must be greater than 0", async () => {
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      expect(
        await token.connect(seller).create(tokenId, supply, seller.address, "", [])
      );

      expect(
        await market
          .connect(seller)
          .openTrade(token.address, tokenId, tradeAmount, price)
      );

      await expect(
        market
          .connect(buyer)
          .buyItem(token.address, tokenId, seller.address, "0")
      ).revertedWith("Amount must be greater than 0");
    });

    it("Not enough items in trade", async () => {
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      expect(
        await token.connect(seller).create(tokenId, supply, seller.address, "", [])
      );

      expect(
        await market
          .connect(seller)
          .openTrade(token.address, tokenId, tradeAmount, price)
      );

      await expect(
        market
          .connect(buyer)
          .buyItem(
            token.address,
            tokenId,
            seller.address,
            tradeAmount.add("1")
          )
      ).revertedWith("Not enough items in trade");
    });

    it("Ether value sent is incorrect", async () => {
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      expect(
        await token.connect(seller).create(tokenId, supply, seller.address, "", [])
      );

      expect(
        await market
          .connect(seller)
          .openTrade(token.address, tokenId, tradeAmount, price)
      );

      await expect(
        market
          .connect(buyer)
          .buyItem(token.address, tokenId, seller.address, tradeAmount, {
            value: 0,
          })
      ).revertedWith("Ether value sent is incorrect");
    });

    it("ContractSeller (reentrant call)", async () => {
      const ContractSeller = await ethers.getContractFactory("ContractSeller");
      const contractSeller = await ContractSeller.deploy(
        market.address,
        token.address
      );
      await contractSeller.deployed();

      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      const purchaseAmount = ethers.BigNumber.from("5");

      expect(
        await token
          .connect(seller)
          .create(tokenId, supply, contractSeller.address, "", [])
      );

      expect(await contractSeller.openTrade(tokenId, tradeAmount, price));

      await expect(
        market.buyItem(
          token.address,
          tokenId,
          contractSeller.address,
          purchaseAmount,
          {
            value: price.mul(purchaseAmount),
          }
        )
      ).revertedWith(
        "Address: unable to send value, recipient may have reverted"
      );
    });
  });

  describe("closeTrade", () => {
    it("Should Close Trade", async () => {
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      expect(
        await token.connect(seller).create(tokenId, supply, seller.address, "", [])
      );

      expect(
        await market
          .connect(seller)
          .openTrade(token.address, tokenId, tradeAmount, price)
      );

      let trade = await market.trades(token.address, tokenId, seller.address);
      expect(trade.price).eq(price);
      expect(trade.amount).eq(tradeAmount);

      expect(await token.balanceOf(seller.address, tokenId)).eq(
        supply.sub(tradeAmount)
      );

      await expect(market.connect(seller).closeTrade(token.address, tokenId))
        .emit(market, "TradeClosed")
        .withArgs(token.address, tokenId, seller.address);

      trade = await market.trades(token.address, tokenId, seller.address);
      expect(trade.price).eq(0);
      expect(trade.amount).eq(0);

      expect(await token.balanceOf(seller.address, tokenId)).eq(supply);
    });

    it("Trade is not open", async () => {
      await expect(
        market.connect(seller).closeTrade(token.address, "1")
      ).revertedWith("Trade is not open");
    });
  });

  describe("setServiceFee", () => {
    it("Should set service fee", async () => {
      expect(await market.serviceFee()).eq(serviceFee);

      expect(await market.setServiceFee(0));
      expect(await market.serviceFee()).eq(0);

      expect(await market.setServiceFee(1000));
      expect(await market.serviceFee()).eq(1000);

      expect(await market.setServiceFee(10000));
      expect(await market.serviceFee()).eq(10000);
    });

    it("Should not set service fee < 0% or > 100%", async () => {
      await expect(market.setServiceFee(10001)).to.be.revertedWith(
        "Service fee can not exceed 10,000 basis points"
      );
      await expect(market.setServiceFee(50000)).to.be.revertedWith(
        "Service fee can not exceed 10,000 basis points"
      );
      await expect(market.setServiceFee(-1)).to.be.reverted;
      await expect(market.setServiceFee(-5000)).to.be.reverted;
      expect(await market.serviceFee()).eq(serviceFee);
    });
  });

  describe("withdraw", () => {
    it("Should withdraw funds", async () => {
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");

      const purchaseAmount = ethers.BigNumber.from("5");
      const purchaseValue = price.mul(purchaseAmount);
      const serviceFeeValue = purchaseValue.mul(serviceFee).div(serviceFeeBase);

      const ownerBalance = await ethers.provider.getBalance(owner.address);

      expect(
        await token.connect(seller).create(tokenId, supply, seller.address, "", [])
      );

      expect(
        await market
          .connect(seller)
          .openTrade(token.address, tokenId, tradeAmount, price)
      );

      await expect(
        market
          .connect(buyer)
          .buyItem(
            token.address,
            tokenId,
            seller.address,
            purchaseAmount,
            {
              value: purchaseValue,
            }
          )
      ).emit(market, "TradeExecuted");

      expect(await ethers.provider.getBalance(market.address)).eq(
        serviceFeeValue
      );

      let txUsedGasPrice: BigNumberish = 0;
      await expect(
        market
          .connect(owner)
          .withdraw(owner.address, serviceFeeValue)
          .then(async (tx: { wait: () => any; }) => {
            const receipt = await tx.wait();
            txUsedGasPrice = receipt.effectiveGasPrice.mul(receipt.gasUsed);
            return tx;
          })
      )
        .emit(market, "WithdrawalCompleted")
        .withArgs(owner.address, serviceFeeValue);

      expect(await ethers.provider.getBalance(market.address)).eq(0);
      expect(ownerBalance.add(serviceFeeValue.sub(txUsedGasPrice))).eq(
        await ethers.provider.getBalance(owner.address)
      );
    });
  });

  describe("changePrice", () => {
    it("Should Change Trade Price", async () => {
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");
      const newPrice = ethers.utils.parseEther("1");

      expect(
        await token.connect(seller).create(tokenId, supply, seller.address, "", [])
      );

      expect(
        await market
          .connect(seller)
          .openTrade(token.address, tokenId, tradeAmount, price)
      );

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

    it("Trade is not open", async () => {
      await expect(
        market
          .connect(seller)
          .changePrice(token.address, "1", ethers.utils.parseEther("1"))
      ).revertedWith("Trade is not open");
    });
  });
  describe("Proxy upgrade", () => {
    it("Change implementation", async () => {
      const tokenId = ethers.BigNumber.from("1");
      const supply = ethers.BigNumber.from("100");
      const tradeAmount = ethers.BigNumber.from("10");
      const price = ethers.utils.parseEther("0.01");
      const newPrice = ethers.utils.parseEther("1");
      const newContractFactory = await ethers.getContractFactory("CruzoMarket");
      expect(
        await token.connect(seller).create(tokenId, supply, seller.address, "", [])
      );

      market = await upgrades.upgradeProxy(market.address, newContractFactory);



      expect(
        await market
          .connect(seller)
          .openTrade(token.address, tokenId, tradeAmount, price)
      );

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
  });
});
