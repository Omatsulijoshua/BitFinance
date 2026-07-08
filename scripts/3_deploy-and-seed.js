const fs = require("fs")
const path = require("path")

const tokens = (n) => ethers.parseUnits(n.toString(), "ether")

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
  await ethers.provider.send("evm_increaseTime", [seconds])
  await ethers.provider.send("evm_mine")
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

const seedMarket = async (exchange, tokenQuoteAddress, tokenQuoteName, btfAddress, traders) => {
  console.log(`Seeding trades for BTF / ${tokenQuoteName} market...`)
  const hourlyBasePrices = [
    8.4, 8.8, 9.1, 9.7, 10.2, 10.8, 10.4, 10.9,
    11.5, 12.0, 11.6, 12.4, 12.9, 13.3, 12.7, 13.6,
    14.2, 14.8, 14.1, 15.0, 15.7, 15.2, 16.1, 16.8
  ]
  const intrahourMoves = [-0.15, 0.15]

  let filledTradeCount = 0

  for (let hour = 0; hour < hourlyBasePrices.length; hour++) {
    for (let index = 0; index < intrahourMoves.length; index++) {
      const maker = traders[(hour + index) % traders.length]
      const filler = traders[(hour + index + 1) % traders.length]
      const amountGive = 6 + ((hour + index) % 5)
      const price = Math.max(1, hourlyBasePrices[hour] + intrahourMoves[index])
      const amountGet = Number((amountGive * price).toFixed(4))

      const isBuy = (hour + index) % 2 === 0

      if (isBuy) {
        // Maker buys BTF (gives Quote, gets BTF)
        await makeAndFillOrder(
          exchange,
          maker,
          filler,
          btfAddress,
          tokens(amountGive),
          tokenQuoteAddress,
          tokens(amountGet)
        )
      } else {
        // Maker sells BTF (gives BTF, gets Quote)
        await makeAndFillOrder(
          exchange,
          maker,
          filler,
          tokenQuoteAddress,
          tokens(amountGet),
          btfAddress,
          tokens(amountGive)
        )
      }

      filledTradeCount++

      if (index < intrahourMoves.length - 1) {
        await increaseTime(60 * 6)
      }
    }

    await increaseTime(60 * 60)
    console.log(`  Seeded candle ${hour + 1}/${hourlyBasePrices.length} for BTF / ${tokenQuoteName}`)
  }

  console.log(`Seeding open orders for BTF / ${tokenQuoteName}...`)
  // Open Sell Orders (Maker gives BTF, wants Quote)
  for (let i = 1; i <= 15; i++) {
    const maker = traders[i % traders.length]
    const amountGive = 8 + (i % 6)
    const amountGet = Number((amountGive * (17 + i * 0.18)).toFixed(4))

    await makeOpenOrder(
      exchange,
      maker,
      tokenQuoteAddress,
      tokens(amountGet),
      btfAddress,
      tokens(amountGive)
    )
  }

  // Open Buy Orders (Maker gives Quote, wants BTF)
  for (let i = 1; i <= 15; i++) {
    const maker = traders[(i + 2) % traders.length]
    const amountGet = 7 + (i % 5)
    const amountGive = Number((amountGet * (18.5 + i * 0.21)).toFixed(4))

    await makeOpenOrder(
      exchange,
      maker,
      btfAddress,
      tokens(amountGet),
      tokenQuoteAddress,
      tokens(amountGive)
    )
  }
  
  console.log(`Completed BTF / ${tokenQuoteName} market seed. Filled: ${filledTradeCount}, Open: 30\n`)
}

async function main() {
  console.log("Preparing deployment & seeding...\n")

  const Token = await ethers.getContractFactory("Token")
  const Exchange = await ethers.getContractFactory("Exchange")
  const accounts = await ethers.getSigners()

  const [deployer, feeAccount, user1, user2, user3, user4] = accounts
  console.log(`Accounts fetched:\nDeployer: ${deployer.address}\nFee Account: ${feeAccount.address}\n`)

  const btf = await Token.deploy("BitFinance Token", "BTF", "21000000")
  await btf.waitForDeployment()
  const btfAddress = await btf.getAddress()
  console.log(`BTF Deployed to: ${btfAddress}`)

  // Split fee: 0.5% for maker, 0.5% for taker
  const exchange = await Exchange.deploy(feeAccount.address, 1)
  await exchange.waitForDeployment()
  const exchangeAddress = await exchange.getAddress()
  console.log(`Exchange Deployed to: ${exchangeAddress}`)

  const { chainId } = await ethers.provider.getNetwork()
  const chainIdStr = chainId.toString()

  const tokenSpecs = [
    { name: "Wrapped Ether", symbol: "WETH", supply: "100000000" },
    { name: "Tether USD", symbol: "USDT", supply: "100000000" },
    { name: "USD Coin", symbol: "USDC", supply: "100000000" },
    { name: "Wrapped Bitcoin", symbol: "WBTC", supply: "10000000" },
    { name: "Chainlink", symbol: "LINK", supply: "100000000" },
    { name: "Uniswap", symbol: "UNI", supply: "100000000" },
    { name: "Multi-Collateral Dai", symbol: "DAI", supply: "100000000" },
    { name: "Shiba Inu", symbol: "SHIB", supply: "1000000000000" },
    { name: "Pepe Coin", symbol: "PEPE", supply: "1000000000000" },
    { name: "Aave Token", symbol: "AAVE", supply: "100000000" }
  ]

  const tokenAddresses = {}
  for (const spec of tokenSpecs) {
    const deployedToken = await Token.deploy(spec.name, spec.symbol, spec.supply)
    await deployedToken.waitForDeployment()
    const address = await deployedToken.getAddress()
    console.log(`${spec.symbol} Deployed to: ${address}`)
    tokenAddresses[spec.symbol] = address
  }

  // Save deployments
  const deploymentsPath = path.join(__dirname, "deployments.json")
  const deployments = fs.existsSync(deploymentsPath)
    ? JSON.parse(fs.readFileSync(deploymentsPath))
    : {}

  const currentDeployment = {
    btf: btfAddress,
    exchange: exchangeAddress,
    ...tokenAddresses
  }

  deployments[chainIdStr] = currentDeployment
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2))
  console.log(`Deployment addresses saved to ${deploymentsPath}`)

  // Update src/config.json
  const configPath = path.join(__dirname, "..", "src", "config.json")
  if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath))
    configData[chainIdStr] = {
      ...configData[chainIdStr],
      exchange: { address: exchangeAddress },
      btf: { address: btfAddress }
    }

    for (const symbol of Object.keys(tokenAddresses)) {
      configData[chainIdStr][symbol] = {
        address: tokenAddresses[symbol]
      }
    }

    if (!configData[chainIdStr].explorerURL) {
      configData[chainIdStr].explorerURL = "#"
    }

    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2))
    console.log(`src/config.json updated for chain ${chainId}`)
  }

  // Seeding part
  const traders = [user1, user2, user3, user4]
  const depositAmount = tokens(250000)

  for (const trader of traders) {
    // Fund and deposit BTF
    await (await btf.connect(deployer).transfer(trader.address, depositAmount)).wait()
    await (await btf.connect(trader).approve(exchangeAddress, depositAmount)).wait()
    await (await exchange.connect(trader).depositToken(btfAddress, depositAmount)).wait()

    // Fund and deposit quote tokens
    for (const symbol of Object.keys(tokenAddresses)) {
      const tokenContract = await ethers.getContractAt("Token", tokenAddresses[symbol])
      await (await tokenContract.connect(deployer).transfer(trader.address, depositAmount)).wait()
      await (await tokenContract.connect(trader).approve(exchangeAddress, depositAmount)).wait()
      await (await exchange.connect(trader).depositToken(tokenAddresses[symbol], depositAmount)).wait()
    }
    console.log(`Funded and deposited CFYT and quote tokens for ${trader.address}`)
  }

  console.log(`Fee account: ${feeAccount.address}\n`)

  const activeQuoteToken = tokenAddresses["WETH"]
  const cancelledOrderTx = await exchange
    .connect(user1)
    .makeOrder(activeQuoteToken, tokens(25), btfAddress, tokens(10))
  const cancelledOrderReceipt = await cancelledOrderTx.wait()
  const cancelledOrderId = getOrderId(exchange, cancelledOrderReceipt)
  await (await exchange.connect(user1).cancelOrder(cancelledOrderId)).wait()
  console.log(`Created and cancelled sample order #${cancelledOrderId}\n`)

  // Seed primary markets only to save blocks and prevent EDR crashes
  const primaryMarkets = ["WETH", "USDT", "USDC"]
  for (const symbol of primaryMarkets) {
    if (tokenAddresses[symbol]) {
      await seedMarket(exchange, tokenAddresses[symbol], symbol, btfAddress, traders)
    }
  }

  console.log(`\nDeployment & Seed complete.`)
}

main()
