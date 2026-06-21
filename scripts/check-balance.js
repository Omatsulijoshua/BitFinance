async function main() {
  const networks = [
    { name: "sepolia", label: "Sepolia" },
    { name: "optimismSepolia", label: "Optimism Sepolia" },
    { name: "arbitrumSepolia", label: "Arbitrum Sepolia" },
    { name: "polygonAmoy", label: "Polygon Amoy" },
    { name: "baseSepolia", label: "Base Sepolia" },
    { name: "bscTestnet", label: "BSC Testnet" }
  ]

  const signers = await ethers.getSigners()
  if (signers.length === 0) {
    console.error("No accounts configured in hardhat.config.js")
    return
  }
  const deployer = signers[0]
  console.log(`Checking balances for Deployer: ${deployer.address}\n`)

  for (const net of networks) {
    try {
      const provider = new ethers.JsonRpcProvider(hre.config.networks[net.name].url)
      const balance = await provider.getBalance(deployer.address)
      console.log(`- ${net.label}: ${ethers.formatEther(balance)} ETH/native`)
    } catch (e) {
      console.log(`- ${net.label}: Error connecting or retrieving balance: ${e.message}`)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
