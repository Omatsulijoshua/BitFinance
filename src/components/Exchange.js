import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import config from '../config.json';
import '../Exchange.css';

import {
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
  loadExchange,
  loadAllOrders,
  subscribeToEvents,
  getEthereumProvider
} from '../store/interactions';

import Navbar from './Navbar'
import Markets from './Markets'
import Balance from './Balance'
import Order from './Order'
import PriceChart from './PriceChart'
import Transactions from './Transactions'
import Trades from './Trades'
import OrderBook from './OrderBook'
import Alert from './Alert'


function Exchange({ onBack }) {

 const dispatch = useDispatch()
 const account = useSelector(state => state.provider.account)
 const symbols = useSelector(state => state.tokens.symbols)

  const loadBlockchainData = useCallback(async () => {
    // Connect Ethers to blockchain
    const provider = loadProvider(dispatch)
    if (!provider) {
      console.warn("No Web3 provider or local fallback provider available.")
      return
    }

    // Fetch current network's chainId (e.g. hardhat: 31337, kovan: 42)
    let chainId
    try {
      chainId = await loadNetwork(provider, dispatch)
    } catch (e) {
      console.error("Failed to load network:", e)
      return
    }

    const ethereumProvider = getEthereumProvider()
    if (ethereumProvider) {
      // Reload page when network changes
      ethereumProvider.on('chainChanged', () => {
        window.location.reload()
      })

      // Fetch current account & balance from Metamask when changed
      ethereumProvider.on('accountsChanged', () => {
        loadAccount(provider, dispatch)
      })

      // Auto-connect if already authorized in Metamask
      ethereumProvider.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts && accounts.length > 0) {
            loadAccount(provider, dispatch)
          }
        })
        .catch(err => console.error("Error auto-connecting account:", err))
    }

    // Load token smart contracts
    if (!config[chainId] || !config[chainId].exchange) {
      return
    }

    const DApp = config[chainId].cfyt
    
    // Find the first available quote token configured
    const quoteTokens = ["WETH", "USDT", "USDC", "WBTC", "LINK", "UNI", "DAI", "SHIB", "PEPE", "AAVE"]
    let quoteToken = null
    for (const symbol of quoteTokens) {
      if (config[chainId][symbol] && config[chainId][symbol].address) {
        quoteToken = config[chainId][symbol]
        break
      }
    }

    if (!quoteToken) {
      console.error("No configured quote tokens found")
      return
    }

    await loadTokens(provider, [DApp.address, quoteToken.address], dispatch)

    // Load exchange smart contract
    const exchangeConfig = config[chainId].exchange
    const exchange = await loadExchange(provider, exchangeConfig.address, dispatch)

    // Fetch all orders: open, filled, cancelled
    loadAllOrders(provider, exchange, dispatch)

    // Listen to events
    subscribeToEvents(exchange, dispatch)
  }, [dispatch])

  useEffect(() => {
    loadBlockchainData().catch((error) => {
      console.error('Failed to load blockchain data:', error.message)
    })
  }, [loadBlockchainData])

  return (
    <div className="exchange-shell">

      <Navbar onBack={onBack} />

      {/* Binance-style Ticker Bar */}
      <div className="ticker-bar">
        <div className="ticker-bar__inner">
          <div className="ticker-bar__pair">
            <span className="ticker-bar__symbol">{symbols ? `${symbols[0]}/${symbols[1]}` : 'CFYT/WETH'}</span>
          </div>
          <div className="ticker-bar__stats">
            <div className="ticker-stat">
              <span className="ticker-stat__label">24h Vol</span>
              <span className="ticker-stat__value">—</span>
            </div>
            <div className="ticker-stat">
              <span className="ticker-stat__label">24h High</span>
              <span className="ticker-stat__value">—</span>
            </div>
            <div className="ticker-stat">
              <span className="ticker-stat__label">24h Low</span>
              <span className="ticker-stat__value">—</span>
            </div>
          </div>
        </div>
      </div>

      <main className='exchange grid'>
        {/* LEFT PANEL: Markets + Order Book */}
        <section className='exchange__section--left'>

          <Markets />

          <OrderBook />

        </section>

        {/* CENTER: Chart + Trade History + My Transactions */}
        <section className='exchange__section--center'>

          <PriceChart />

          <div className="exchange__bottom-panels">
            <Transactions />
            <Trades />
          </div>

        </section>

        {/* RIGHT PANEL: Balance + Buy/Sell Order */}
        <section className='exchange__section--right'>

          <Balance />

          <Order />

        </section>
      </main>

      <Alert />

    </div>
  );
}


export default Exchange;
