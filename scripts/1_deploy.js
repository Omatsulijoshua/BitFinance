const fs = require("fs")
const path = require("path")

async function main() {


	console.log(`Preparing deployment...\n`)


	// Fetch contract to deploy
	const Token = await ethers.getContractFactory("Token")
	const Exchange = await ethers.getContractFactory("Exchange")


	const accounts = await ethers.getSigners()

	console.log(`Accounts fetched:\n${accounts[0].address}\n${accounts[1].address}\n`)

	
	//deploy contracts
	const cfyp = await Token.deploy("CFY Token", "CFYT", "21000000")
	await cfyp.deployed()
	console.log(`CFYT Deployed to: ${cfyp.address}`)


	const mETH = await Token.deploy("mETH", "mETH", "10000000")
	await mETH.deployed()
	console.log(`mETH Deployed to: ${mETH.address}`)


	const mDAI = await Token.deploy("mDAI", "mDAI", "10000000")
	await mDAI.deployed()
	console.log(`mDAI Token Deployed to: ${mDAI.address}`)



	const exchange = await Exchange.deploy(accounts[1].address, 10)
	await exchange.deployed()
	console.log(`Exchange Deployed to: ${exchange.address}`)

	const { chainId } = await ethers.provider.getNetwork()
	const deploymentsPath = path.join(__dirname, "deployments.json")
	const deployments = fs.existsSync(deploymentsPath)
		? JSON.parse(fs.readFileSync(deploymentsPath))
		: {}

	deployments[chainId] = {
		cfyt: cfyp.address,
		mETH: mETH.address,
		mDAI: mDAI.address,
		exchange: exchange.address
	}

	fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2))
	console.log(`Deployment addresses saved to ${deploymentsPath}`)
}     

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
