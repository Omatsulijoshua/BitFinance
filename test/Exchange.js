require("@nomicfoundation/hardhat-chai-matchers");
const { expect } = require("chai")
const { ethers } = require("hardhat")
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs")

const tokens = (n) => ethers.parseUnits(n.toString(), "ether")

describe("Exchange", () => {
  const feePercent = 1n

  let deployer
  let feeAccount
  let user1
  let user2
  let token1
  let token2
  let exchange
  let token1Address
  let token2Address
  let exchangeAddress

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token")
    const Exchange = await ethers.getContractFactory("Exchange")

    ;[deployer, feeAccount, user1, user2] = await ethers.getSigners()

    token1 = await Token.deploy("BitFinance Token", "BTF", "21000000")
    await token1.waitForDeployment()

    token2 = await Token.deploy("Mock Dai", "mDAI", "1000000")
    await token2.waitForDeployment()

    exchange = await Exchange.deploy(feeAccount.address, feePercent)
    await exchange.waitForDeployment()

    token1Address = await token1.getAddress()
    token2Address = await token2.getAddress()
    exchangeAddress = await exchange.getAddress()

    await token1.connect(deployer).transfer(user1.address, tokens(100))
    await token2.connect(deployer).transfer(user2.address, tokens(100))
  })

  const deposit = async (user, token, tokenAddress, amount) => {
    await token.connect(user).approve(exchangeAddress, amount)
    return exchange.connect(user).depositToken(tokenAddress, amount)
  }

  describe("Deployment", () => {
    it("tracks the fee account", async () => {
      expect(await exchange.feeAccount()).to.equal(feeAccount.address)
    })

    it("tracks the fee percent", async () => {
      expect(await exchange.feePercent()).to.equal(feePercent)
    })

    it("tracks the owner", async () => {
      expect(await exchange.owner()).to.equal(deployer.address)
    })
  })

  describe("Updating fee parameters", () => {
    it("allows the owner to update the fee account", async () => {
      await exchange.connect(deployer).setFeeAccount(user1.address)
      expect(await exchange.feeAccount()).to.equal(user1.address)
    })

    it("fails when a non-owner tries to update the fee account", async () => {
      await expect(exchange.connect(user1).setFeeAccount(user2.address)).to.be.revertedWith("caller is not the owner")
    })

    it("allows the owner to update the fee percent", async () => {
      await exchange.connect(deployer).setFeePercent(5n)
      expect(await exchange.feePercent()).to.equal(5n)
    })

    it("fails when a non-owner tries to update the fee percent", async () => {
      await expect(exchange.connect(user1).setFeePercent(5n)).to.be.revertedWith("caller is not the owner")
    })
  })

  describe("Depositing tokens", () => {
    const amount = tokens(10)

    it("tracks token deposits", async () => {
      await expect(deposit(user1, token1, token1Address, amount))
        .to.emit(exchange, "Deposit")
        .withArgs(token1Address, user1.address, amount, amount)

      expect(await token1.balanceOf(exchangeAddress)).to.equal(amount)
      expect(await exchange.tokens(token1Address, user1.address)).to.equal(amount)
      expect(await exchange.balanceOf(token1Address, user1.address)).to.equal(amount)
    })

    it("fails when no tokens are approved", async () => {
      await expect(exchange.connect(user1).depositToken(token1Address, amount)).to.be.reverted
    })
  })

  describe("Withdrawing tokens", () => {
    const amount = tokens(10)

    beforeEach(async () => {
      await deposit(user1, token1, token1Address, amount)
    })

    it("withdraws token funds", async () => {
      await expect(exchange.connect(user1).withdrawToken(token1Address, amount))
        .to.emit(exchange, "Withdraw")
        .withArgs(token1Address, user1.address, amount, 0n)

      expect(await token1.balanceOf(exchangeAddress)).to.equal(0n)
      expect(await exchange.balanceOf(token1Address, user1.address)).to.equal(0n)
    })

    it("fails for insufficient balances", async () => {
      await expect(exchange.connect(user2).withdrawToken(token1Address, amount)).to.be.revertedWith(
        "insufficient balance"
      )
    })
  })

  describe("Making orders", () => {
    const amount = tokens(1)

    beforeEach(async () => {
      await deposit(user1, token1, token1Address, amount)
    })

    it("tracks a new order when no match exists", async () => {
      await expect(exchange.connect(user1).makeOrder(token2Address, amount, token1Address, amount))
        .to.emit(exchange, "Order")
        .withArgs(1n, user1.address, token2Address, amount, token1Address, amount, anyValue)

      expect(await exchange.orderCount()).to.equal(1n)
      expect(await exchange.orderFilled(1)).to.equal(false)
    })

    it("rejects orders with no balance", async () => {
      await expect(
        exchange.connect(user2).makeOrder(token1Address, amount, token2Address, amount)
      ).to.be.revertedWith("insufficient balance")
    })
  })

  describe("Order actions", () => {
    const amount = tokens(1)
    const halfFee = tokens(0.005)

    beforeEach(async () => {
      await deposit(user1, token1, token1Address, amount)
      await deposit(user2, token2, token2Address, tokens(2))
      await exchange.connect(user1).makeOrder(token2Address, amount, token1Address, amount)
    })

    describe("Cancelling orders", () => {
      it("allows the owner to cancel an open order", async () => {
        await expect(exchange.connect(user1).cancelOrder(1))
          .to.emit(exchange, "Cancel")
          .withArgs(1n, user1.address, token2Address, amount, token1Address, amount, anyValue)

        expect(await exchange.orderCancelled(1)).to.equal(true)
      })

      it("rejects invalid order ids", async () => {
        await expect(exchange.connect(user1).cancelOrder(99999)).to.be.revertedWith("order does not exist")
      })

      it("rejects unauthorized cancellations", async () => {
        await expect(exchange.connect(user2).cancelOrder(1)).to.be.revertedWith("not owner")
      })
    })

    describe("Filling orders", () => {
      beforeEach(async () => {
        await exchange.connect(user2).fillOrder(1)
      })

      it("executes the trade and splits fees equally across both received assets", async () => {
        expect(await exchange.balanceOf(token1Address, user1.address)).to.equal(0n)
        expect(await exchange.balanceOf(token1Address, user2.address)).to.equal(amount - halfFee)
        expect(await exchange.balanceOf(token1Address, feeAccount.address)).to.equal(halfFee)

        expect(await exchange.balanceOf(token2Address, user1.address)).to.equal(amount - halfFee)
        expect(await exchange.balanceOf(token2Address, user2.address)).to.equal(tokens(1))
        expect(await exchange.balanceOf(token2Address, feeAccount.address)).to.equal(halfFee)
      })

      it("updates filled orders", async () => {
        expect(await exchange.orderFilled(1)).to.equal(true)
      })

      it("rejects already filled orders", async () => {
        await expect(exchange.connect(user2).fillOrder(1)).to.be.revertedWith("order already filled")
      })
    })
  })

  describe("Matching orders", () => {
    const amount = tokens(1)
    const halfFee = tokens(0.005)

    beforeEach(async () => {
      await deposit(user1, token1, token1Address, amount)
      await deposit(user2, token2, token2Address, amount)
      await exchange.connect(user1).makeOrder(token2Address, amount, token1Address, amount)
    })

    it("pairs exact opposite pending orders and splits fees equally", async () => {
      await expect(exchange.connect(user2).makeOrder(token1Address, amount, token2Address, amount))
        .to.emit(exchange, "Order")
        .withArgs(2n, user2.address, token1Address, amount, token2Address, amount, anyValue)
        .and.to.emit(exchange, "Trade")
        .withArgs(1n, user2.address, token2Address, amount, token1Address, amount, user1.address, anyValue)

      expect(await exchange.orderFilled(1)).to.equal(true)
      expect(await exchange.orderFilled(2)).to.equal(true)

      expect(await exchange.balanceOf(token1Address, user1.address)).to.equal(0n)
      expect(await exchange.balanceOf(token1Address, user2.address)).to.equal(amount - halfFee)
      expect(await exchange.balanceOf(token1Address, feeAccount.address)).to.equal(halfFee)

      expect(await exchange.balanceOf(token2Address, user1.address)).to.equal(amount - halfFee)
      expect(await exchange.balanceOf(token2Address, user2.address)).to.equal(0n)
      expect(await exchange.balanceOf(token2Address, feeAccount.address)).to.equal(halfFee)
    })

    it("leaves non-matching orders open", async () => {
      await exchange.connect(user2).makeOrder(token1Address, tokens(2), token2Address, amount)

      expect(await exchange.orderFilled(1)).to.equal(false)
      expect(await exchange.orderFilled(2)).to.equal(false)
    })
  })
})
