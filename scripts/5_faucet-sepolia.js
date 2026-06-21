const fs = require("fs")
const path = require("path")

// Run this script to fund your MetaMask wallet with mock tokens on Sepolia:
// npx hardhat run scripts/5_faucet-sepolia.js --network sepolia

// Change this to your MetaMask address:
const RECIPIENT_ADDRESS = "0x74c236D649a800A7479679803aC8A25C1F30Dcdc"; 

const tokens = (n) => ethers.parseUnits(n.toString(), "ether")

async function main() {
  const { chainId } = await ethers.provider.getNetwork()
  const chainIdStr = chainId.toString()
  console.log(`Using Network Chain ID: ${chainIdStr}`)

  // Sanitize the recipient address to ensure correct EIP-55 checksumming
  const recipient = ethers.getAddress(RECIPIENT_ADDRESS.trim().toLowerCase())

  if (recipient === "0x74c236D649a800A7479679803aC8A25C1F30Dcdc") {
    console.warn("WARNING: Using default recipient address. Make sure this matches your active browser wallet!\n")
  }

  const deploymentsPath = path.join(__dirname, "deployments.json")
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error("No deployment file found. Run scripts/4_deploy-sepolia.js first.")
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath))
  const deployment = deployments[chainIdStr]

  if (!deployment) {
    throw new Error(`No deployment found for chain ${chainIdStr} in deployments.json`)
  }

  const accounts = await ethers.getSigners()
  const deployer = accounts[0]
  console.log(`Deployer sending from: ${deployer.address}`)
  console.log(`Recipient wallet to fund: ${recipient}\n`)

  const fundAmount = tokens(5000) // Fund 5,000 tokens of each type

  const tokenKeys = Object.keys(deployment).filter(key => key !== "exchange")

  for (const symbol of tokenKeys) {
    const address = deployment[symbol]
    console.log(`Funding ${symbol.toUpperCase()} (${address})...`)

    const tokenContract = await ethers.getContractAt("Token", address)
    const balance = await tokenContract.balanceOf(deployer.address)
    console.log(`  Deployer Balance: ${ethers.formatEther(balance)} ${symbol}`)

    if (balance >= fundAmount) {
      const tx = await tokenContract.connect(deployer).transfer(recipient, fundAmount)
      await tx.wait()
      console.log(`  Sent ${ethers.formatEther(fundAmount)} ${symbol} to ${recipient}`)
    } else {
      console.warn(`  Insufficient balance to transfer ${symbol}`)
    }
  }

  console.log("\nFaucet funding complete! All mock tokens have been sent to your wallet.")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
