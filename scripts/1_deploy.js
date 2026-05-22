async function main() {
	// Fetch contract to deploy
	const Token = await ethers.getContractFactory("Token")

	//deploy contracts
	const token = await Token.deploy()
	await token.deployed()
	console.log(`Token Deployef to: ${token.address}`)
}     

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
