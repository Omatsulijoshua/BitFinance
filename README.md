# 🪐 BitFinance DEX (Decentralized Exchange)

BitFinance is a modern, premium, multi-network Decentralized Exchange (DEX) DApp built on Ethereum and compatible EVM networks. It supports full token trading, order book management, real-time candle charts, mock token faucets, and persistent testnet deployments.

This platform features a professional order-book trading terminal, a Uniswap-style swap widget, an on-chain administration dashboard, and a live pricing feed for major cryptocurrency assets.

---

## 🚀 Key Features

* **📈 Professional Trading Interface**:
  - Interactive candlestick chart powered by ApexCharts.
  - Real-time Order Book displaying buy/sell pressure and depth.
  - Live Trade History log showing recent matching orders.
  - User-specific transaction history log for managing and cancelling active orders.
  - Dual order form panels for placing limit Buy and Sell orders.

* **🔄 Uniswap-Style Swap Widget**:
  - Simple, clean swap card interface for quick token swaps (e.g. WETH to BTF).
  - Back-end liquidity routing that automatically finds and fills active order-book limit sells to execute swaps.
  - **MetaMask watchAsset integration**: Add the custom **BTF** token directly to MetaMask with a single click, complete with custom token decimals, symbol, and logo asset.

* **🛡️ Admin Dashboard**:
  - Displays smart contract state (Exchange owner, active fee account, fee percentages).
  - Displays real-time contract audit metrics (WETH and BTF contract balances, total orders filled/cancelled).
  - Form panels for the contract owner to dynamically modify the fee percent and fee account on-chain.
  - **Token Faucet**: Integrated faucet module allowing users to distribute WETH and BTF test tokens to any address on localhost or testnets.

* **📊 Live Price Feed**:
  - Fetches real-time price tickers for the top 9 major cryptocurrency assets (BTC, ETH, BNB, SOL, XRP, ADA, DOT, DOGE, LINK) directly from the CoinCap API.
  - Dynamically calculates the USD price of the custom **BTF** token using cross-rates calculated from the live ETH price feed and WETH/BTF trade rates.
  - Real-time price flashes indicating price movement direction (green for up, red for down).

* **⚙️ Multi-Network Compatibility**:
  - Integrated with MetaMask to support seamless switching and automatic network registration across multiple environments:
    - Localhost (Hardhat Node)
    - Ethereum Sepolia
    - Optimism Sepolia
    - Arbitrum Sepolia
    - Polygon Amoy
    - Base Sepolia
    - BSC Testnet

---

## 🛠️ Tech Stack

* **Smart Contracts**: Solidity v0.8.28, Hardhat (Chai, Ethers.js v6)
* **Frontend**: React.js, Redux (Thunk, Reselect), ApexCharts, Vanilla CSS
* **Web3 Integration**: Ethers.js v6, MetaMask (EIP-1193)

---

## 📋 Installation & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/Omatsulijoshua/BitFinance.git
cd BitFinance
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
In a new terminal (or inside WSL if WSL is used):
```bash
# In WSL:
wsl bash -c "source ~/.nvm/nvm.sh && nvm use v22.23.0 && node node_modules/hardhat/internal/cli/cli.js run scripts/1_deploy.js --network localhost"

# Or on Windows standard console (if node is available):
npx hardhat run scripts/1_deploy.js --network localhost
```

### 3. Seed exchange with mock orders (Localhost)
This will generate full historical candle data using Hardhat time-travel RPC methods:
```bash
# In WSL:
wsl bash -c "source ~/.nvm/nvm.sh && nvm use v22.23.0 && node node_modules/hardhat/internal/cli/cli.js run scripts/2_seed-exchange.js --network localhost"

# Or on Windows standard console:
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
*This transfers 5,000 BTF and 5,000 of every mock quote token (WETH, DAI, UNI, etc.) to your address.*

### 3. Seed testnet markets (WETH & DAI)
Runs the optimized seeding script (Fast-Seed mode) to generate test orders on Sepolia:
```bash
npx hardhat run scripts/2_seed-exchange.js --network sepolia
```

---

## 🧪 Running Tests
Run contract verification tests:
```bash
# In WSL:
wsl bash -c "source ~/.nvm/nvm.sh && nvm use v22.23.0 && node node_modules/hardhat/internal/cli/cli.js test"

# Or on Windows standard console:
npx hardhat test
```

---

## 📝 Smart Contract Architecture

* **Token.sol**: Standard ERC20 token implementation with variable name, symbol, and total supply.
* **Exchange.sol**: Core order book and trading system logic.
  - `owner`: Contract owner tracking address.
  - `depositToken`: Allows users to deposit tokens to the exchange.
  - `withdrawToken`: Allows users to withdraw tokens.
  - `makeOrder`: Creates a new limit order in the order book.
  - `cancelOrder`: Cancels a pending order.
  - `fillOrder`: Executes trades against active limit orders, automatically routing fees to the configured fee account.
  - `setFeePercent(uint256)`: Modifies maker/taker transaction fee percentages on-chain (restricted to contract owner).
  - `setFeeAccount(address)`: Modifies the fee collection address on-chain (restricted to contract owner).

---

## 📊 Token Price Calculation

The exchange uses a combination of on-chain trading data and real-time public market APIs to compute token valuations dynamically:

### 1. BTF Token USD Valuation
The USD price of the custom **BTF** token is derived from Ethereum's real-time price feed and exchange order-book trades:
$$\text{BTF Price (USD)} = \text{ETH Price (USD)} \times \text{BTF/WETH Rate}$$
* **ETH Price (USD)**: Fetched dynamically from the public [CoinCap API](https://api.coincap.io/v2/assets) (polling periodically).
* **BTF/WETH Rate**:
  * **On-Chain Trades Exist**: Uses the exchange rate of the **latest filled order** on the order book.
  * **No Trades Exist**: Defaults to a base rate of `0.00025 WETH` per BTF.

### 2. Spot Trading Interface Prices
Prices on the limit order book are calculated as the ratio of tokens traded:
$$\text{Price} = \frac{\text{Amount of WETH (token1)}}{\text{Amount of BTF (token0)}}$$
This calculation is handled in the frontend Redux store ([selectors.js](src/store/selectors.js)) using formatted Ether units, ensuring precise decimal division.

### 3. Uniswap-Style Swap Rates
The exchange rate for token swaps in the **Swap Widget** dynamically mirrors the latest spot trading price:
* **Dynamic rate**: Automatically sets `1 WETH = X BTF` based on the price of the latest filled on-chain trade.
* **Fallback**: Defaults to a mock exchange rate of `1 WETH = 12.5 BTF` if no trades have occurred.
