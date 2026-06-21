const fs = require("fs")
const path = require("path")

async function main() {
  console.log("Preparing deployment...\n")

  const Token = await ethers.getContractFactory("Token")
  const Exchange = await ethers.getContractFactory("Exchange")
  const accounts = await ethers.getSigners()

  console.log(`Accounts fetched:\n${accounts[0].address}\n${accounts[1].address}\n`)

  const cfyt = await Token.deploy("CFY Token", "CFYT", "21000000")
  await cfyt.waitForDeployment()
  const cfytAddress = await cfyt.getAddress()
  console.log(`CFYT Deployed to: ${cfytAddress}`)

  const exchange = await Exchange.deploy(accounts[1].address, 1)
  await exchange.waitForDeployment()
  const exchangeAddress = await exchange.getAddress()
  console.log(`Exchange Deployed to: ${exchangeAddress}`)

  const { chainId } = await ethers.provider.getNetwork()
  const chainIdStr = chainId.toString()

  const MAINNET_ADDRESSES = {
    // Ethereum Mainnet (1)
    "1": {
      "WETH": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "USDT": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      "USDC": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "WBTC": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      "LINK": "0x514910771AF9Ca656af840dff83E8264EcF986CA",
      "UNI":  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      "DAI":  "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      "SHIB": "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
      "PEPE": "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
      "AAVE": "0x7Fc66500c84A76AD7e9c93437bFc5Ac33E2DDaE9"
    },
    // Arbitrum One (42161)
    "42161": {
      "WETH": "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      "USDT": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      "USDC": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      "WBTC": "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
      "LINK": "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
      "UNI":  "0xfa7f8980b0f1e64A20684f506080327f39446d33",
      "DAI":  "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      "SHIB": "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
      "PEPE": "0x25d887Ce7a35c42C434220b3C0bB7898520fAebB",
      "AAVE": "0xba5DDD1f9d7F570dc94a51479a008E3ECCE96719"
    },
    // Base (8453)
    "8453": {
      "WETH": "0x4200000000000000000000000000000000000006",
      "USDT": "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
      "USDC": "0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913",
      "WBTC": "0x03c6fc8885c39935152235c345fd17c462f1d977",
      "LINK": "0x875773784Af8132eA034Bae1ac898418A0d5920D",
      "UNI":  "0x03a520b32C0443bE3207316fF3E06C4293f9e97c",
      "DAI":  "0x50c5725949A6F0c72E6C41641024095F40026601",
      "SHIB": "0x2859e4544C4bB03966803b0b4d0F83E35e12EC4d",
      "PEPE": "0x25d887Ce7a35c42C434220b3C0bB7898520fAebB",
      "AAVE": "0xE4aB69C077896252ADBD39E195e7dF15D3BB6b58"
    },
    // Polygon PoS (137)
    "137": {
      "WETH": "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
      "USDT": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      "USDC": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      "WBTC": "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
      "LINK": "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad79",
      "UNI":  "0xb33eaad8d922b1083446dc23f610c2567fb5180f",
      "DAI":  "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
      "SHIB": "0x6f8a0644e45f82213a7266289d06894564c74075",
      "PEPE": "0x134685354924c5750C16358c5c7423D0174094a4",
      "AAVE": "0xd6df932a45c0f255f85145f8f300c8b6680327f2"
    },
    // BNB Smart Chain (56)
    "56": {
      "WETH": "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
      "USDT": "0x55d398326f99059fF775485246999027B3197955",
      "USDC": "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
      "WBTC": "0x7130d2A12B9BCbFAe4f2634d864A1ee1Ce3Ead9c",
      "LINK": "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD",
      "UNI":  "0xBf5140A22578168FD562DCcF235E5D43A02ec991",
      "DAI":  "0x1AF3F329C8be15757452934120f7a468608d96e9",
      "SHIB": "0x2859e4544C4bB03966803b0b4d0F83E35e12EC4d",
      "PEPE": "0x25d887Ce7a35c42C434220b3C0bB7898520fAebB",
      "AAVE": "0xfb6115445B10731D6e614d107E58F8029584346E"
    },
    // Optimism Mainnet (10)
    "10": {
      "WETH": "0x4200000000000000000000000000000000000006",
      "USDT": "0x94b008aA00579c1307B0EF2c489489354e4A0994",
      "USDC": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      "WBTC": "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
      "LINK": "0x350a791Bf2C1764F14f90b9e13651b57aeC5170f",
      "UNI":  "0x6fd79833777d55d32f4198cc4f726715f55de5de",
      "DAI":  "0xDA10009c55B08e13d50d7521526FC507663eDe90",
      "SHIB": "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
      "PEPE": "0x25d887Ce7a35c42C434220b3C0bB7898520fAebB",
      "AAVE": "0x76FB3164b8f361a1530c5b9937B4741c73B9850c"
    }
  }

  let tokenAddresses = {}

  if (MAINNET_ADDRESSES[chainIdStr]) {
    console.log(`Mainnet detected (Chain ID: ${chainIdStr}). Using official canonical addresses for quote tokens...`)
    tokenAddresses = MAINNET_ADDRESSES[chainIdStr]
  } else {
    console.log(`Local/Testnet detected (Chain ID: ${chainIdStr}). Deploying mock quote tokens...`)
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

    for (const spec of tokenSpecs) {
      const deployedToken = await Token.deploy(spec.name, spec.symbol, spec.supply)
      await deployedToken.waitForDeployment()
      const address = await deployedToken.getAddress()
      console.log(`${spec.symbol} Deployed to: ${address}`)
      tokenAddresses[spec.symbol] = address
    }
  }

  const deploymentsPath = path.join(__dirname, "deployments.json")
  const deployments = fs.existsSync(deploymentsPath)
    ? JSON.parse(fs.readFileSync(deploymentsPath))
    : {}

  const currentDeployment = {
    cfyt: cfytAddress,
    exchange: exchangeAddress,
    ...tokenAddresses
  }

  deployments[chainId.toString()] = currentDeployment
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2))
  console.log(`Deployment addresses saved to ${deploymentsPath}`)

  // Update src/config.json
  const configPath = path.join(__dirname, "..", "src", "config.json")
  if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath))
    
    // Merge current deployment into configData for the chainId
    configData[chainId.toString()] = {
      ...configData[chainId.toString()],
      exchange: { address: exchangeAddress },
      cfyt: { address: cfytAddress }
    }

    // Add each deployed token configuration
    for (const symbol of Object.keys(tokenAddresses)) {
      configData[chainId.toString()][symbol] = {
        address: tokenAddresses[symbol]
      }
    }

    // Set explorerURL if not already present
    if (!configData[chainId.toString()].explorerURL) {
      configData[chainId.toString()].explorerURL = "#"
    }

    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2))
    console.log(`src/config.json updated for chain ${chainId}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
