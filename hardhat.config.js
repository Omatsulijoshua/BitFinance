require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const getAccounts = () => {
  const privateKeyEnv = process.env.PRIVATE_KEY || process.env.PRIVATE_KEYS;
  if (!privateKeyEnv) return [];
  
  return privateKeyEnv
    .split(",")
    .map(key => key.trim())
    .filter(key => key.length > 0)
    .map(key => {
      if (!key.startsWith("0x")) {
        return "0x" + key;
      }
      return key;
    });
};

const accounts = getAccounts();

const sepoliaUrl = process.env.SEPOLIA_RPC_URL || 
  (process.env.INFURA_API_KEY ? `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY.replace(/["']/g, "")}` : "https://rpc.ankr.com/eth_sepolia");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    localhost: {},
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "",
      accounts: accounts
    },
    sepolia: {
      url: sepoliaUrl,
      accounts: accounts
    },
    optimismSepolia: {
      url: process.env.OPTIMISM_SEPOLIA_RPC_URL || "https://sepolia.optimism.io",
      accounts: accounts
    },
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: accounts
    },
    polygonAmoy: {
      url: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: accounts
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: accounts
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: accounts
    }
  },
};
