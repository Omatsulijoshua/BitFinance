const fs = require("fs")
const path = require("path")

async function main() {
  console.log("Preparing Sepolia deployment...\n")

  const Token = await ethers.getContractFactory("Token")
  const Exchange = await ethers.getContractFactory("Exchange")
  const accounts = await ethers.getSigners()
  const deployer = accounts[0]

  console.log(`Deployer Account: ${deployer.address}\n`)

  // 1. Deploy BTF Base Token
  const btf = await Token.deploy("BitFinance Token", "BTF", "21000000")
  await btf.waitForDeployment()
  const btfAddress = await btf.getAddress()
  console.log(`BTF Deployed to: ${btfAddress}`)

  // 2. Deploy Exchange (Set feeAccount to the deployer, set feePercent to 1)
  const exchange = await Exchange.deploy(deployer.address, 1)
  await exchange.waitForDeployment()
  const exchangeAddress = await exchange.getAddress()
  console.log(`Exchange Deployed to: ${exchangeAddress}`)

  // 3. Deploy mock quote tokens (excluding mETH and mDAI)
  const { chainId } = await ethers.provider.getNetwork()
  const chainIdStr = chainId.toString()
  
  console.log(`Deploying mock quote tokens on Sepolia (Chain ID: ${chainIdStr})...`)
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

  // 4. Save to deployments.json
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
  console.log(`\nDeployment addresses saved to ${deploymentsPath}`)

  // 5. Update src/config.json
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
      configData[chainIdStr].explorerURL = `https://sepolia.etherscan.io`
    }

    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2))
    console.log(`src/config.json updated successfully for chain ${chainId}`)
  }

  console.log("\nSepolia deployment complete. All tokens are held by the deployer account.")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
