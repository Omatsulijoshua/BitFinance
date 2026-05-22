const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), "ether")
}

describe("Token", () => {
	let token, deployer, accounts
	
	beforeEach(async() => {
		const Token = await ethers.getContractFactory("Token")
		token = await Token.deploy("CFY Token", "CFYT", "21000000" )
		accounts = await ethers.getSigners()
		deployer = accounts[0]
	})

	describe("Deployment", () => {
		const name = "CFY Token";
		const symbol = "CFYT";
		const decimals = "18";
		const totalSupply = "21000000";

		it("has correct name", async () => {
			expect(await token.name()).to.equal(name)
		})
		it("has correct symbol", async () => {
			expect(await token.symbol()).to.equal(symbol)
		})

		it("has correct decimals", async () => {
			expect(await token.decimals()).to.equal(18)
		})

		it("has correct total supply", async () => {
			expect(await token.totalSupply()).to.equal(tokens(totalSupply))
		})

		it("assingns total supply to deplyer", async () => {
			expect(await token.balanceOf(deployer.address)).to.equal(tokens(totalSupply))
		})
	})

})