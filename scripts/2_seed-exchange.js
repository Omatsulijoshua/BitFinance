const fs = require("fs")
const path = require("path")

// Run against a persistent local node after deploying:
// npx hardhat node
// npx hardhat run scripts/1_deploy.js --network localhost
// npx hardhat run scripts/2_seed-exchange.js --network localhost

const tokens = (n) => ethers.parseUnits(n.toString(), "ether")

const loadDeployment = async () => {
  const { chainId } = await ethers.provider.getNetwork()
  const deploymentsPath = path.join(__dirname, "deployments.json")

  if (!fs.existsSync(deploymentsPath)) {
    throw new Error("No deployment file found. Run scripts/1_deploy.js first.")
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath))
  const deployment = deployments[chainId.toString()]

  if (!deployment) {
    throw new Error(`No deployment found for chain ${chainId}. Run scripts/1_deploy.js on this network first.`)
  }

  return deployment
}

const requireContract = async (name, address) => {
  const code = await ethers.provider.getCode(address)

  if (code === "0x") {
    throw new Error(`${name} address ${address} has no contract code. Run scripts/1_deploy.js first.`)
  }
}

const getOrderId = (exchange, receipt) => {
  for (const log of receipt.logs) {
    try {
      const parsed = exchange.interface.parseLog(log)

      if (parsed && parsed.name === "Order") {
        return parsed.args.id
      }
    } catch {
      // Ignore logs emitted by token contracts.
    }
  }

  throw new Error("Order event not found in transaction receipt")
}

const increaseTime = async (seconds) => {
  try {
    await ethers.provider.send("evm_increaseTime", [seconds])
    await ethers.provider.send("evm_mine")
  } catch (error) {
    // Ignore time travel errors on public networks
  }
}

const makeAndFillOrder = async (exchange, maker, filler, tokenGet, amountGet, tokenGive, amountGive) => {
  const transaction = await exchange.connect(maker).makeOrder(tokenGet, amountGet, tokenGive, amountGive)
  const result = await transaction.wait()
  const orderId = getOrderId(exchange, result)

  await (await exchange.connect(filler).fillOrder(orderId)).wait()

  return orderId
}

const makeOpenOrder = async (exchange, maker, tokenGet, amountGet, tokenGive, amountGive) => {
  await (await exchange.connect(maker).makeOrder(tokenGet, amountGet, tokenGive, amountGive)).wait()
}

const seedMarket = async (exchange, tokenQuoteAddress, tokenQuoteName, deployment, traders, isLocalhost) => {
  console.log(`Seeding trades for CFYT / ${tokenQuoteName} market...`)
  let hourlyBasePrices = [
    8.4, 8.8, 9.1, 9.7, 10.2, 10.8, 10.4, 10.9,
    11.5, 12.0, 11.6, 12.4, 12.9, 13.3, 12.7, 13.6,
    14.2, 14.8, 14.1, 15.0, 15.7, 15.2, 16.1, 16.8
  ]
  let intrahourMoves = [-0.15, 0.15]
  let orderLimit = 15

  if (!isLocalhost) {
    // Public network: seed only 2 candles and 2 open orders to keep it fast and cheap
    hourlyBasePrices = [12.5, 13.0]
    intrahourMoves = [-0.1]
    orderLimit = 2
  }

  let filledTradeCount = 0

  for (let hour = 0; hour < hourlyBasePrices.length; hour++) {
    for (let index = 0; index < intrahourMoves.length; index++) {
      const maker = traders[(hour + index) % traders.length]
      const filler = traders[(hour + index + 1) % traders.length]
      const amountGive = 6 + ((hour + index) % 5)
      const price = Math.max(1, hourlyBasePrices[hour] + intrahourMoves[index])
      const amountGet = Number((amountGive * price).toFixed(4))

      // Alternate between Maker Selling CFYT (maker gives CFYT, gets Quote)
      // and Maker Buying CFYT (maker gives Quote, gets CFYT)
      const isBuy = (hour + index) % 2 === 0

      if (isBuy) {
        // Maker buys CFYT (gives Quote, gets CFYT)
        await makeAndFillOrder(
          exchange,
          maker,
          filler,
          deployment.cfyt,
          tokens(amountGive),
          tokenQuoteAddress,
          tokens(amountGet)
        )
      } else {
        // Maker sells CFYT (gives CFYT, gets Quote)
        await makeAndFillOrder(
          exchange,
          maker,
          filler,
          tokenQuoteAddress,
          tokens(amountGet),
          deployment.cfyt,
          tokens(amountGive)
        )
      }

      filledTradeCount++

      if (index < intrahourMoves.length - 1) {
        await increaseTime(60 * 6)
      }
    }

    await increaseTime(60 * 60)
    console.log(`  Seeded candle ${hour + 1}/${hourlyBasePrices.length} for CFYT / ${tokenQuoteName}`)
  }

  console.log(`Seeding open orders for CFYT / ${tokenQuoteName}...`)
  // Open Sell Orders (Maker gives CFYT, wants Quote)
  for (let i = 1; i <= orderLimit; i++) {
    const maker = traders[i % traders.length]
    const amountGive = 8 + (i % 6)
    const amountGet = Number((amountGive * (17 + i * 0.18)).toFixed(4))

    await makeOpenOrder(
      exchange,
      maker,
      tokenQuoteAddress,
      tokens(amountGet),
      deployment.cfyt,
      tokens(amountGive)
    )
  }

  // Open Buy Orders (Maker gives Quote, wants CFYT)
  for (let i = 1; i <= orderLimit; i++) {
    const maker = traders[(i + 2) % traders.length]
    const amountGet = 7 + (i % 5)
    const amountGive = Number((amountGet * (18.5 + i * 0.21)).toFixed(4))

    await makeOpenOrder(
      exchange,
      maker,
      deployment.cfyt,
      tokens(amountGet),
      tokenQuoteAddress,
      tokens(amountGive)
    )
  }
  
  console.log(`Completed CFYT / ${tokenQuoteName} market seed. Filled: ${filledTradeCount}, Open: ${orderLimit * 2}\n`)
}

async function main() {
  const accounts = await ethers.getSigners()
  const { chainId } = await ethers.provider.getNetwork()
  const chainIdStr = chainId.toString()
  console.log("Using chainID:", chainIdStr)

  const isLocalhost = chainIdStr === "31337"

  if (!isLocalhost) {
    console.log(`\n⚠️ Public network detected (Chain ID: ${chainIdStr}).`)
    console.log("Limiting seeding transactions to avoid excessive gas fees and delays...\n")
  }

  const deployment = await loadDeployment()

  await requireContract("CFYT", deployment.cfyt)
  const cfyt = await ethers.getContractAt("Token", deployment.cfyt)
  console.log(`CFYT Fetched: ${deployment.cfyt}`)

  await requireContract("Exchange", deployment.exchange)
  const exchange = await ethers.getContractAt("Exchange", deployment.exchange)
  console.log(`Exchange Fetched: ${deployment.exchange}\n`)

  if (accounts.length < 2) {
    throw new Error("Seeding requires at least 2 accounts/private keys to perform matching trades.")
  }

  const deployer = accounts[0]
  const feeAccount = accounts[1]
  const user1 = accounts[2] || accounts[0]
  const user2 = accounts[3] || accounts[1]
  const user3 = accounts[4] || accounts[0]
  const user4 = accounts[5] || accounts[1]

  const traders = [user1, user2, user3, user4]
  const depositAmount = tokens(250000)

  // Get unique traders to avoid redundant transfer and deposit transactions
  const uniqueTraders = traders.filter((trader, idx, self) => 
    self.findIndex(t => t.address === trader.address) === idx
  )

  let quoteTokens = ["WETH", "USDT", "USDC", "WBTC", "LINK", "UNI", "DAI", "SHIB", "PEPE", "AAVE"]

  // If on a public network, only seed WETH and DAI to conserve gas and speed up execution
  if (!isLocalhost) {
    quoteTokens = ["WETH", "DAI"]
  }

  for (const trader of uniqueTraders) {
    // Fund and deposit CFYT
    const deployerBalance = await cfyt.balanceOf(deployer.address)
    console.log(`Deployer CFYT balance: ${ethers.formatEther(deployerBalance)} CFYT`)
    console.log(`Deposit Amount requested: ${ethers.formatEther(depositAmount)} CFYT to ${trader.address}`)
    await (await cfyt.connect(deployer).transfer(trader.address, depositAmount)).wait()
    await (await cfyt.connect(trader).approve(deployment.exchange, depositAmount)).wait()
    await (await exchange.connect(trader).depositToken(deployment.cfyt, depositAmount)).wait()

    // Fund and deposit each quote token that was deployed
    for (const symbol of quoteTokens) {
      if (deployment[symbol]) {
        const tokenContract = await ethers.getContractAt("Token", deployment[symbol])
        await (await tokenContract.connect(deployer).transfer(trader.address, depositAmount)).wait()
        await (await tokenContract.connect(trader).approve(deployment.exchange, depositAmount)).wait()
        await (await exchange.connect(trader).depositToken(deployment[symbol], depositAmount)).wait()
      }
    }
    console.log(`Funded and deposited CFYT and quote tokens for ${trader.address}`)
  }

  console.log(`Fee account: ${feeAccount.address}\n`)

  // Get first active quote token
  let activeQuoteToken = null
  for (const symbol of quoteTokens) {
    if (deployment[symbol]) {
      activeQuoteToken = deployment[symbol]
      break
    }
  }

  if (!activeQuoteToken) {
    throw new Error("No active quote tokens found in deployment")
  }

  const cancelledOrderTx = await exchange
    .connect(user1)
    .makeOrder(activeQuoteToken, tokens(25), deployment.cfyt, tokens(10))
  const cancelledOrderReceipt = await cancelledOrderTx.wait()
  const cancelledOrderId = getOrderId(exchange, cancelledOrderReceipt)
  await (await exchange.connect(user1).cancelOrder(cancelledOrderId)).wait()
  console.log(`Created and cancelled sample order #${cancelledOrderId}\n`)

  // Seed all deployed quote token markets
  for (const symbol of quoteTokens) {
    if (deployment[symbol]) {
      await seedMarket(exchange, deployment[symbol], symbol, deployment, traders, isLocalhost)
    }
  }

  console.log(`\nSeed complete.`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
