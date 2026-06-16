const fs = require("fs")
const path = require("path")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether")
}

const loadDeployment = async () => {
	const { chainId } = await ethers.provider.getNetwork()
	const deploymentsPath = path.join(__dirname, "deployments.json")

	if (!fs.existsSync(deploymentsPath)) {
		throw new Error("No deployment file found. Run scripts/1_deploy.js first.")
	}

	const deployments = JSON.parse(fs.readFileSync(deploymentsPath))
	const deployment = deployments[chainId]

	if (!deployment) {
		throw new Error(`No deployment found for chain ${chainId}. Run scripts/1_deploy.js on this network first.`)
	}

	return deployment
}

const requireContract = async (name, address) => {
	const code = await ethers.provider.getCode(address)

	if (code === "0x") {
		throw new Error(`${name} address ${address} has no contract code. Run scripts/1_deploy.js and seed with the saved deployment addresses.`)
	}
}


const wait = (seconds) => {
	const milliseconds  = seconds * 1000
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function main() {


	const accounts = await ethers.getSigners()

	const { chainId } = await ethers.provider.getNetwork()
	console.log("Using chainID:", chainId)

	const deployment = await loadDeployment()

	await requireContract("CFYT", deployment.cfyt)
	const cfyt = await ethers.getContractAt("Token", deployment.cfyt)
	console.log(`CFYT Fetched: ${cfyt.address}\n`)


	await requireContract("mETH", deployment.mETH)
	const mETH = await ethers.getContractAt("Token", deployment.mETH)
	console.log(`mETH Fetched to: ${mETH.address}\n`)


	await requireContract("mDAI", deployment.mDAI)
	const mDAI = await ethers.getContractAt("Token", deployment.mDAI)
	console.log(`mDAI Fetched to: ${mDAI.address}\n`)


	await requireContract("Exchange", deployment.exchange)
	const exchange = await ethers.getContractAt("Exchange", deployment.exchange)
	console.log(`Exchange Fetched to: ${exchange.address}\n`)

	
	const sender = accounts[0]
	const reciever = accounts[1]
	let amount = tokens(10000)

	let transaction, result
	transaction = await mETH.connect(sender).transfer(reciever.address, amount)
	await transaction.wait()
	console.log(`Transferred ${amount} tokens from ${sender.address} to ${reciever.address}\n`)


	const user1 = accounts[0]
	const user2 = accounts[1]
	amount = tokens(10000)


	transaction = await cfyt.connect(user1).approve(exchange.address, amount)
	await transaction.wait()
	console.log(`Approved ${amount} tokens from ${user1.address}`)

	transaction = await exchange.connect(user1).depositToken(cfyt.address, amount)
	await transaction.wait()
	console.log(`Deposited ${amount} Ethers from ${user1.address}\n`)

	transaction = await mETH.connect(user2).approve(exchange.address, amount)
	await transaction.wait()
	console.log(`Approved ${amount} tokens from ${user2.address}`)


	transaction = await exchange.connect(user2).depositToken(mETH.address, amount)
	await transaction.wait()
	console.log(`Deposited ${amount} tokens from ${user2.address}\n`)


	const getOrderId = (receipt) => {
		const orderEvent = (receipt.events || []).find((event) => {
			return event.event === "Order"
		})

		if (orderEvent) {
			return orderEvent.args.id
		}

		const orderTopic = exchange.interface.getEventTopic("Order")
		const logs = receipt.logs || []
		const orderLog = logs.find((log) => {
			return (
				log.address &&
				log.address.toLowerCase() === exchange.address.toLowerCase() &&
				log.topics[0] === orderTopic
			)
		})

		if (!orderLog) {
			throw new Error("Order event not found in transaction receipt")
		}

		return exchange.interface.parseLog(orderLog).args.id
	}





	let orderId
	transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), cfyt.address, tokens(5))
	result = await transaction.wait()
	console.log(`Made order from ${user1.address}`)


	orderId = getOrderId(result)
	transaction = await exchange.connect(user1).cancelOrder(orderId)
	result = await transaction.wait()
	console.log(`Cancelled order from ${user1.address}\n`)


	await wait(1)



 // Trades


	transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), cfyt.address, tokens(10))
	result = await transaction.wait()
	console.log(`Made order from ${user1.address}`)


	orderId = getOrderId(result)
	transaction = await exchange.connect(user2).fillOrder(orderId)
	result = await transaction.wait()
	console.log(`Filled order from ${user1.address}\n`)


	await wait(1)


	transaction = await exchange.makeOrder(mETH.address, tokens(50), cfyt.address, tokens(15))
	result = await transaction.wait()
	console.log(`Made order from ${user1.address}`)


	orderId = getOrderId(result)
	transaction = await exchange.connect(user2).fillOrder(orderId)
	result = await transaction.wait()
	console.log(`Filled order from ${user1.address}\n`)


	await wait(1)


	transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(200), cfyt.address, tokens(20))
	result = await transaction.wait()
	console.log(`Made order from ${user1.address}\n`)



	orderId = getOrderId(result)
	transaction = await exchange.connect(user2).fillOrder(orderId)
	result = await transaction.wait()
	console.log(`Filled order from ${user1.address}\n`)




		// --------------------
// Order Book
// --------------------

		for (let i = 1; i <= 10; i++) {
		  transaction = await exchange.connect(user1).makeOrder(
		    mETH.address,
		    tokens(10 * i),
		    cfyt.address,
		    tokens(10)
		  )

		  await transaction.wait()

		  console.log(`Made order from ${user1.address}`)

		  await wait(1)
		}

		for (let i = 1; i <= 10; i++) {
		  transaction = await exchange.connect(user2).makeOrder(
		    cfyt.address,
		    tokens(10),
		    mETH.address,
		    tokens(10 * i)
		  )

		  await transaction.wait()

		  console.log(`Made order from ${user2.address}`)

		  await wait(1)
		}



}

	main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
