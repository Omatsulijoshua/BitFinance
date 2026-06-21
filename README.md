# Crypfinance DEX (Decentralized Exchange)

Crypfinance is a modern, premium, multi-network Decentralized Exchange (DEX) DApp built on Ethereum and compatible EVM networks. It supports full token trading, order book management, real-time candle charts, mock token faucets, and persistent testnet deployments (Localhost, Sepolia, Arbitrum, Base, Optimism, Polygon, and BSC testnets).

---

## 🚀 Key Features

* **Multi-Network Compatibility**: Integrated with MetaMask to support seamless switching across multiple testnets:
  * Localhost (Hardhat Node)
  * Ethereum Sepolia
  * Optimism Sepolia
  * Arbitrum Sepolia
  * Polygon Amoy
  * Base Sepolia
  * BSC Testnet
* **EVM-Modular Token Trading**: Deploys a custom ERC20 token (**CFYT**) along with 10 mock quote tokens (`WETH`, `USDT`, `USDC`, `WBTC`, `LINK`, `UNI`, `DAI`, `SHIB`, `PEPE`, `AAVE`) to simulate realistic multi-pair markets.
* **Dynamic Market Selector**: Automatically creates trading pairs dynamically on the front-end (supporting WETH and DAI quote-paired markets alongside CFYT pairs).
* **On-Demand Account Switching**: Includes a native account switching interface allowing users to trigger MetaMask's account permissions popups directly from the DApp header.
* **Premium Dark Mode UI**: A fully responsive Glassmorphism styled trading interface.
* **Optimized Faucet and Seeding Scripts**:
  * `5_faucet-sepolia.js`: Bulk-transfer script to fund active MetaMask wallets with test tokens on public testnets.
  * `2_seed-exchange.js`: Smart seeding script featuring a gas-preserving **Fast-Seed mode** for public testnets (which bypasses EVM time-travel reverts and restricts volume) while maintaining full simulation on local testnets.

---

## 🛠️ Tech Stack

* **Smart Contracts**: Solidity v0.8.28, Hardhat (Chai, Ethers.js v6)
* **Frontend**: React.js, Redux (Thunk, Reselect), ApexCharts (Candle charts), Vanilla CSS
* **Web3 Integration**: Ethers.js v6, MetaMask (EIP-1193)

---

## 📋 Installation & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/Omatsulijoshua/crypfinance.git
cd crypfinance
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create your Environment Configuration
Create a `.env` file in the root directory:
```env
# Configured private keys (comma-separated if using multiple local accounts)
PRIVATE_KEY="YOUR_PRIVATE_KEY_1,YOUR_PRIVATE_KEY_2"

# Optional Infura key
INFURA_API_KEY="YOUR_INFURA_KEY"
```

---

## 💻 Running Locally (Hardhat Localhost)

### 1. Start the Hardhat node
```bash
npx hardhat node
```

### 2. Deploy contracts to Localhost
In a new terminal:
```bash
npx hardhat run scripts/1_deploy.js --network localhost
```

### 3. Seed exchange with mock orders (Localhost)
This will generate full historical candle data using Hardhat time-travel RPC methods:
```bash
npx hardhat run scripts/2_seed-exchange.js --network localhost
```

### 4. Run the frontend
```bash
npm run start
```

---

## 🌐 Public Testnet Deployments (e.g. Sepolia)

### 1. Deploy the DEX contracts & tokens
```bash
npx hardhat run scripts/4_deploy-sepolia.js --network sepolia
```
*This deploys the Exchange and all mock tokens, saving contract addresses in `scripts/deployments.json` and auto-configuring `src/config.json` for the frontend.*

### 2. Fund your MetaMask Wallet (Faucet)
Update `RECIPIENT_ADDRESS` inside [scripts/5_faucet-sepolia.js](scripts/5_faucet-sepolia.js) to your MetaMask address, then run:
```bash
npx hardhat run scripts/5_faucet-sepolia.js --network sepolia
```
*This transfers 5,000 CFYT and 5,000 of every mock quote token (WETH, DAI, UNI, etc.) to your address.*

### 3. Seed testnet markets (WETH & DAI)
Runs the optimized seeding script (Fast-Seed mode) to generate test orders on Sepolia:
```bash
npx hardhat run scripts/2_seed-exchange.js --network sepolia
```

---

## 🧪 Running Tests
Run contract verification tests:
```bash
npx hardhat test
```

---

## 📝 Smart Contract Architecture

* **Token.sol**: Standard ERC20 token implementation with variable name, symbol, and total supply.
* **Exchange.sol**: Core order book and trading system logic.
  * `depositToken`: Allows users to deposit tokens to the exchange.
  * `withdrawToken`: Allows users to withdraw tokens.
  * `makeOrder`: Creates a new limit order in the order book.
  * `cancelOrder`: Cancels a pending order.
  * `fillOrder`: Executes trades against active limit orders, automatically routing fees to the configured fee account.
