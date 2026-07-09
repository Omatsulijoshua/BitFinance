import { useSelector, useDispatch } from 'react-redux'
import Blockies from 'react-blockies'

// Removed old logo import
import eth from '../assets/eth.svg'

import { loadAccount, getEthereumProvider } from '../store/interactions'

import config from '../config.json';

const NETWORK_PARAMS = {
  "0x7a69": {
    chainId: "0x7a69",
    chainName: "Localhost 8545",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["http://127.0.0.1:8545"],
  },
  "0x1": {
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://cloudflare-eth.com"],
    blockExplorerUrls: ["https://etherscan.io"]
  },
  "0xaa36a7": {
    chainId: "0xaa36a7",
    chainName: "Sepolia Test Network",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://rpc.ankr.com/eth_sepolia"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"]
  },
  "0xa": {
    chainId: "0xa",
    chainName: "Optimism Mainnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.optimism.io"],
    blockExplorerUrls: ["https://optimistic.etherscan.io"]
  },
  "0xaa36a8": {
    chainId: "0xaa36a8",
    chainName: "Optimism Sepolia Testnet",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://sepolia.optimism.io"],
    blockExplorerUrls: ["https://sepolia-optimism.etherscan.io"]
  },
  "0xa4b1": {
    chainId: "0xa4b1",
    chainName: "Arbitrum One Mainnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://arbiscan.io"]
  },
  "0x66eee": {
    chainId: "0x66eee",
    chainName: "Arbitrum Sepolia Testnet",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://sepolia.arbitrum.io"],
    blockExplorerUrls: ["https://sepolia.arbiscan.io"]
  },
  "0x89": {
    chainId: "0x89",
    chainName: "Polygon Mainnet",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: ["https://polygon-rpc.com"],
    blockExplorerUrls: ["https://polygonscan.com"]
  },
  "0x13882": {
    chainId: "0x13882",
    chainName: "Polygon Amoy Testnet",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: ["https://rpc-amoy.polygon.technology"],
    blockExplorerUrls: ["https://amoy.polygonscan.com"]
  },
  "0x2105": {
    chainId: "0x2105",
    chainName: "Base Mainnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.base.org"],
    blockExplorerUrls: ["https://basescan.org"]
  },
  "0x14a34": {
    chainId: "0x14a34",
    chainName: "Base Sepolia Testnet",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://sepolia.base.org"],
    blockExplorerUrls: ["https://sepolia.basescan.org"]
  },
  "0x38": {
    chainId: "0x38",
    chainName: "BNB Smart Chain Mainnet",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: ["https://bsc-dataseed.binance.org"],
    blockExplorerUrls: ["https://bscscan.com"]
  },
  "0x61": {
    chainId: "0x61",
    chainName: "BNB Smart Chain Testnet",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
    blockExplorerUrls: ["https://testnet.bscscan.com"]
  },
  "0x2a": {
    chainId: "0x2a",
    chainName: "Kovan Test Network",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://kovan.poa.network"],
    blockExplorerUrls: ["https://kovan.etherscan.io"]
  }
};

const Navbar = ({ onBack }) => {
  const provider = useSelector(state => state.provider.connection)
  const chainId = useSelector(state => state.provider.chainId)
  const account = useSelector(state => state.provider.account)
  const balance = useSelector(state => state.provider.balance)

  const dispatch = useDispatch()

  const connectHandler = async () => {
    const ethereumProvider = getEthereumProvider()
    if (!ethereumProvider) {
      alert("MetaMask (or a compatible wallet) not detected. Please install the MetaMask extension to connect.")
      return
    }
    await loadAccount(provider, dispatch, true)
  }

  const switchAccountHandler = async () => {
    const ethereumProvider = getEthereumProvider()
    if (!ethereumProvider) return
    try {
      await ethereumProvider.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      })
      await loadAccount(provider, dispatch, true)
    } catch (err) {
      console.error("Failed to request wallet permissions for switching accounts:", err)
    }
  }

  const networkHandler = async (e) => {
    const targetChainId = e.target.value
    const ethereumProvider = getEthereumProvider()
    if (!ethereumProvider) {
      alert("MetaMask (or a compatible wallet) not detected. Please install the MetaMask extension to switch networks.")
      return
    }
    try {
      await ethereumProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      })
    } catch (err) {
      // If code is 4902, the network is not added to Metamask, so we request to add it
      if (err.code === 4902 || (err.message && err.message.toLowerCase().includes("unrecognized"))) {
        try {
          const params = NETWORK_PARAMS[targetChainId]
          if (params) {
            await ethereumProvider.request({
              method: 'wallet_addEthereumChain',
              params: [params],
            })
          } else {
            console.error("No network configuration parameters found for chain ID:", targetChainId)
          }
        } catch (addError) {
          console.error("Failed to add network to MetaMask:", addError)
        }
      } else {
        console.error("Failed to switch network:", err)
      }
    }
  }

  return(
    <div className='exchange__header'>
      <div className='exchange__header--container'>
        <div className='flex' style={{ gap: '24px' }}>
          <div className='exchange__header--brand flex'>
            {onBack && (
              <button 
              onClick={onBack} 
              className="tab" 
              style={{ 
                marginRight: '12px', 
                minWidth: '36px', 
                height: '36px',
                padding: '0', 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid var(--clr-border)',
                color: '#fff',
                fontSize: '1.1rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px'
              }}
            >
              ←
            </button>
            )}
            <div style={{ 
              width: '24px', 
              height: '24px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--clr-gold) 0%, #B3913B 100%)', 
              color: 'var(--clr-bg)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '13px', 
              fontWeight: 'bold',
              marginRight: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              B
            </div>
            <h1>BITFINANCE</h1>
          </div>

          {chainId && (
            <div className='exchange__header--networks flex'>
              <img src={eth} alt="ETH Logo" className='Eth Logo' />
              <select name="networks" id="networks" value={config[chainId] ? `0x${chainId.toString(16)}` : `0`} onChange={networkHandler}>
                <option value="0" disabled>Select Network</option>
                <option value="0x7a69">Localhost</option>
                <option value="0xaa36a7">Sepolia</option>
                <option value="0xaa36a8">Optimism Sepolia</option>
                <option value="0x66eee">Arbitrum Sepolia</option>
                <option value="0x13882">Polygon Amoy</option>
                <option value="0x14a34">Base Sepolia</option>
                <option value="0x61">BSC Testnet</option>
              </select>
            </div>
          )}
        </div>

        <div className='exchange__header--account flex'>
          <div className='exchange__header--balance'>
            <span>My Balance</span>
            <strong>{balance ? Number(balance).toFixed(4) : '0'} ETH</strong>
          </div>
          {account ? (
            <div className='flex' style={{ gap: '8px' }}>
              <a
                href={config[chainId] ? `${config[chainId].explorerURL}/address/${account}` : `#`}
                target='_blank'
                rel='noreferrer'
              >
                {account.slice(0,5) + '...' + account.slice(38,42)}
                <Blockies
                  seed={account}
                  size={10}
                  scale={3}
                  color="#2187D0"
                  bgColor="#F1F2F9"
                  spotColor="#767F92"
                  className="identicon"
                />
              </a>
              <button 
                onClick={switchAccountHandler}
                className="button"
                style={{ 
                  margin: '0', 
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  border: '1px solid var(--clr-primary)',
                  background: 'transparent',
                  color: 'var(--clr-primary)',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Switch
              </button>
            </div>
          ) : (
            <button className="button" onClick={connectHandler}>Connect</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Navbar;
