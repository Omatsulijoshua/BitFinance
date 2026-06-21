import { ethers } from 'ethers'
import TOKEN_ABI from '../abis/Token.json';
import EXCHANGE_ABI from '../abis/Exchange.json';

export const getEthereumProvider = () => {
  if (typeof window === 'undefined' || !window.ethereum) return null
  if (window.ethereum.providers) {
    return window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum.providers[0]
  }
  return window.ethereum
}

export const loadProvider = (dispatch) => {
  const ethereumProvider = getEthereumProvider()
  if (ethereumProvider) {
    const connection = new ethers.BrowserProvider(ethereumProvider)
    dispatch({ type: 'PROVIDER_LOADED', connection })
    return connection
  } else {
    try {
      console.warn("MetaMask or compatible Web3 provider not found. Attempting fallback to local Hardhat node.")
      const connection = new ethers.JsonRpcProvider('http://127.0.0.1:8545')
      dispatch({ type: 'PROVIDER_LOADED', connection })
      return connection
    } catch (e) {
      console.error("Could not construct local JSON-RPC provider:", e)
      dispatch({ type: 'PROVIDER_LOADED', connection: null })
      return null
    }
  }
}

export const loadNetwork = async (provider, dispatch) => {
  if (!provider) return null
  const { chainId } = await provider.getNetwork()
  dispatch({ type: 'NETWORK_LOADED', chainId })

  return chainId
}

export const loadAccount = async (provider, dispatch, isManual = false) => {
  const ethereumProvider = getEthereumProvider()
  if (!ethereumProvider) {
    console.warn("loadAccount called but window.ethereum is undefined")
    return null
  }
  try {
    const accounts = await ethereumProvider.request({ method: 'eth_requestAccounts' })
    if (!accounts || accounts.length === 0) return null
    const account = ethers.getAddress(accounts[0])

    dispatch({ type: 'ACCOUNT_LOADED', account })

    if (provider) {
      let balance = await provider.getBalance(account)
      balance = ethers.formatEther(balance)
      dispatch({ type: 'ETHER_BALANCE_LOADED', balance })
    }

    return account
  } catch (error) {
    console.error("Error loading account:", error)
    if (isManual) {
      const errMsg = error.message ? error.message.toLowerCase() : ""
      if (errMsg.includes("disconnected") || errMsg.includes("port") || errMsg.includes("unexpected")) {
        alert("Wallet extension connection lost or crashed. Please reload the page and unlock your wallet extension.")
      } else if (errMsg.includes("rejected") || error.code === 4001) {
        alert("Connection request rejected.")
      } else {
        alert("Failed to connect wallet. Please ensure MetaMask (or your active wallet) is unlocked.")
      }
    }
    return null
  }
}

const requireContractCode = async (provider, address, label) => {
  const code = await provider.getCode(address)

  if (code === '0x') {
    throw new Error(`${label} contract not found at ${address}. Redeploy and update src/config.json for the active network.`)
  }
}

export const loadTokens = async (provider, addresses, dispatch) => {
  await requireContractCode(provider, addresses[0], 'Token 1')
  await requireContractCode(provider, addresses[1], 'Token 2')

  let token, symbol

  token = new ethers.Contract(addresses[0], TOKEN_ABI, provider)
  symbol = await token.symbol()
  dispatch({ type: 'TOKEN_1_LOADED', token, symbol })

  token = new ethers.Contract(addresses[1], TOKEN_ABI, provider)
  symbol = await token.symbol()
  dispatch({ type: 'TOKEN_2_LOADED', token, symbol })

  return token
}

export const loadExchange = async (provider, address, dispatch) => {
  const exchange = new ethers.Contract(address, EXCHANGE_ABI, provider);
  dispatch({ type: 'EXCHANGE_LOADED', exchange })

  return exchange
}

export const subscribeToEvents = (exchange, dispatch) => {
  exchange.on('Cancel', (id, user, tokenGet, amountGet, tokenGive, amountGive, timestamp, event) => {
    const order = event.args
    dispatch({ type: 'ORDER_CANCEL_SUCCESS', order, event })
  })

  exchange.on('Trade', (id, user, tokenGet, amountGet, tokenGive, amountGive, creator, timestamp, event) => {
    const order = event.args
    dispatch({ type: 'ORDER_FILL_SUCCESS', order, event })
  })

  exchange.on('Deposit', (token, user, amount, balance, event) => {
    dispatch({ type: 'TRANSFER_SUCCESS', event })
  })

  exchange.on('Withdraw', (token, user, amount, balance, event) => {
    dispatch({ type: 'TRANSFER_SUCCESS', event })
  })

  exchange.on('Order', (id, user, tokenGet, amountGet, tokenGive, amountGive, timestamp, event) => {
    const order = event.args
    dispatch({ type: 'NEW_ORDER_SUCCESS', order, event })
  })
}

// ------------------------------------------------------------------------------
// LOAD USER BALANCES (WALLET & EXCHANGE BALANCES)


export const loadBalances = async (exchange, tokens, account, dispatch) => {
  let balance = ethers.formatUnits(await tokens[0].balanceOf(account), 18)
  dispatch({ type: 'TOKEN_1_BALANCE_LOADED', balance })

  balance = ethers.formatUnits(await exchange.balanceOf(tokens[0].target, account), 18)
  dispatch({ type: 'EXCHANGE_TOKEN_1_BALANCE_LOADED', balance })

  balance = ethers.formatUnits(await tokens[1].balanceOf(account), 18)
  dispatch({ type: 'TOKEN_2_BALANCE_LOADED', balance })

  balance = ethers.formatUnits(await exchange.balanceOf(tokens[1].target, account), 18)
  dispatch({ type: 'EXCHANGE_TOKEN_2_BALANCE_LOADED', balance })

}


// ------------------------------------------------------------------------------
// LOAD ALL ORDERS

export const loadAllOrders = async (provider, exchange, dispatch) => {

  const block = await provider.getBlockNumber()

  // Fetch canceled orders
  const cancelStream = await exchange.queryFilter('Cancel', 0, block)
  const cancelledOrders = cancelStream.map(event => event.args)

  dispatch({ type: 'CANCELLED_ORDERS_LOADED', cancelledOrders })

  // Fetch filled orders
  const tradeStream = await exchange.queryFilter('Trade', 0, block)
  const filledOrders = tradeStream.map(event => event.args)

  dispatch({ type: 'FILLED_ORDERS_LOADED', filledOrders })

  // Fetch all orders
  const orderStream = await exchange.queryFilter('Order', 0, block)
  const allOrders = orderStream.map(event => event.args)

  dispatch({ type: 'ALL_ORDERS_LOADED', allOrders })
}


// ------------------------------------------------------------------------------
// TRANSFER TOKENS (DEPOSIT & WITHDRAWS)

export const transferTokens =  async (provider, exchange, transferType, token, amount, dispatch) => {
  let transaction

  dispatch({ type: 'TRANSFER_REQUEST' })

  try {
    const signer = await provider.getSigner()
    const amountToTransfer = ethers.parseUnits(amount.toString(), 18)

    if (transferType === 'Deposit') {
      transaction = await token.connect(signer).approve(exchange.target, amountToTransfer)
      await transaction.wait()
      transaction = await exchange.connect(signer).depositToken(token.target, amountToTransfer)
    } else {
      transaction = await exchange.connect(signer).withdrawToken(token.target, amountToTransfer)
    }

    await transaction.wait()

  } catch(error) {
    dispatch({ type: 'TRANSFER_FAIL' })
  }
}

// ------------------------------------------------------------------------------
// ORDERS (BUY & SELL)

export const makeBuyOrder = async (provider, exchange, tokens, order, dispatch) => {
  const tokenGet = tokens[0].target
  const amountGet = ethers.parseUnits(order.amount, 18)
  const tokenGive = tokens[1].target
  const amountGive = ethers.parseUnits((order.amount * order.price).toString(), 18)

  dispatch({ type: 'NEW_ORDER_REQUEST' })

  try {
    const signer = await provider.getSigner()
    const transaction = await exchange.connect(signer).makeOrder(tokenGet, amountGet, tokenGive, amountGive)
    await transaction.wait()
  } catch (error) {
    dispatch({ type: 'NEW_ORDER_FAIL' })
  }
}

export const makeSellOrder = async (provider, exchange, tokens, order, dispatch) => {
  const tokenGet = tokens[1].target
  const amountGet = ethers.parseUnits((order.amount * order.price).toString(), 18)
  const tokenGive = tokens[0].target
  const amountGive = ethers.parseUnits(order.amount, 18)

  dispatch({ type: 'NEW_ORDER_REQUEST' })

  try {
    const signer = await provider.getSigner()
    const transaction = await exchange.connect(signer).makeOrder(tokenGet, amountGet, tokenGive, amountGive)
    await transaction.wait()
  } catch (error) {
    dispatch({ type: 'NEW_ORDER_FAIL' })
  }
}

// ------------------------------------------------------------------------------
// CANCEL ORDER

export const cancelOrder = async (provider, exchange, order, dispatch) => {

  dispatch({ type: 'ORDER_CANCEL_REQUEST' })

  try {
    const signer = await provider.getSigner()
    const transaction = await exchange.connect(signer).cancelOrder(order.id)
    await transaction.wait()
  } catch (error) {
    dispatch({ type: 'ORDER_CANCEL_FAIL' })
  }
}

// ------------------------------------------------------------------------------
// FILL ORDER

export const fillOrder = async (provider, exchange, order, dispatch) => {
  dispatch({ type: 'ORDER_FILL_REQUEST' })

  try {
    const signer = await provider.getSigner()
    const transaction = await exchange.connect(signer).fillOrder(order.id)
    await transaction.wait()
  } catch (error) {
    dispatch({ type: 'ORDER_FILL_FAIL' })
  }
}
