require("@nomicfoundation/hardhat-chai-matchers");
const { expect } = require("chai")
const { ethers } = require("hardhat")

const tokens = (n) => ethers.parseUnits(n.toString(), "ether")

describe("Token", () => {
  let token
  let deployer
  let receiver
  let exchange

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token")
    token = await Token.deploy("CFY Token", "CFYT", "21000000")
    await token.waitForDeployment()

    ;[deployer, receiver, exchange] = await ethers.getSigners()
  })

  describe("Deployment", () => {
    it("has correct metadata", async () => {
      expect(await token.name()).to.equal("CFY Token")
      expect(await token.symbol()).to.equal("CFYT")
      expect(await token.decimals()).to.equal(18n)
    })

    it("assigns the total supply to the deployer", async () => {
      expect(await token.totalSupply()).to.equal(tokens(21000000))
      expect(await token.balanceOf(deployer.address)).to.equal(tokens(21000000))
    })
  })

  describe("Sending tokens", () => {
    const amount = tokens(100)

    it("transfers token balances", async () => {
      await expect(token.connect(deployer).transfer(receiver.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(deployer.address, receiver.address, amount)

      expect(await token.balanceOf(deployer.address)).to.equal(tokens(20999900))
      expect(await token.balanceOf(receiver.address)).to.equal(amount)
    })

    it("rejects insufficient balances", async () => {
      await expect(token.connect(deployer).transfer(receiver.address, tokens(100000000))).to.be.reverted
    })

    it("rejects invalid recipients", async () => {
      await expect(token.connect(deployer).transfer(ethers.ZeroAddress, amount)).to.be.reverted
    })
  })

  describe("Approving tokens", () => {
    const amount = tokens(100)

    it("allocates an allowance for delegated token spending", async () => {
      await expect(token.connect(deployer).approve(exchange.address, amount))
        .to.emit(token, "Approval")
        .withArgs(deployer.address, exchange.address, amount)

      expect(await token.allowance(deployer.address, exchange.address)).to.equal(amount)
    })

    it("rejects invalid spenders", async () => {
      await expect(token.connect(deployer).approve(ethers.ZeroAddress, amount)).to.be.reverted
    })
  })

  describe("Delegated token transfers", () => {
    const amount = tokens(100)

    beforeEach(async () => {
      await token.connect(deployer).approve(exchange.address, amount)
    })

    it("transfers balances and reduces allowance", async () => {
      await expect(token.connect(exchange).transferFrom(deployer.address, receiver.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(deployer.address, receiver.address, amount)

      expect(await token.balanceOf(deployer.address)).to.equal(tokens(20999900))
      expect(await token.balanceOf(receiver.address)).to.equal(amount)
      expect(await token.allowance(deployer.address, exchange.address)).to.equal(0n)
    })

    it("rejects insufficient amounts", async () => {
      await expect(token.connect(exchange).transferFrom(deployer.address, receiver.address, tokens(100000000))).to.be
        .reverted
    })
  })
})
