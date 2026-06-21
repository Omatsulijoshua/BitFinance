import { useSelector, useDispatch } from 'react-redux'

import config from '../config.json'

import { loadTokens } from '../store/interactions'

const Markets = () => {
  const provider = useSelector(state => state.provider.connection)
  const chainId = useSelector(state => state.provider.chainId)

  const dispatch = useDispatch()

  const marketHandler = async (e) => {
    try {
      await loadTokens(provider, (e.target.value).split(','), dispatch)
    } catch (error) {
      console.error('Failed to load market:', error.message)
    }
  }

  const getMarkets = () => {
    if (!chainId || !config[chainId]) return []
    const markets = []
    
    // 1. CFYT pairs (CFYT as base, others as quote)
    const cfytAddress = config[chainId].cfyt?.address
    if (cfytAddress) {
      const otherQuotes = ["WETH", "DAI", "USDT", "USDC", "WBTC", "LINK", "UNI", "SHIB", "PEPE", "AAVE"]
      for (const qSymbol of otherQuotes) {
        const qAddress = config[chainId][qSymbol]?.address
        if (qAddress && qAddress.toLowerCase() !== cfytAddress.toLowerCase()) {
          markets.push({
            label: `CFYT / ${qSymbol}`,
            val: `${cfytAddress},${qAddress}`
          })
        }
      }
    }
    
    // 2. WETH pairs (others as base, WETH as quote)
    const wethAddress = config[chainId].WETH?.address
    if (wethAddress) {
      const wethBases = ["DAI", "USDT", "USDC", "WBTC", "LINK", "UNI", "SHIB", "PEPE", "AAVE"]
      for (const bSymbol of wethBases) {
        const bAddress = config[chainId][bSymbol]?.address
        if (bAddress && bAddress.toLowerCase() !== wethAddress.toLowerCase() && bAddress.toLowerCase() !== cfytAddress?.toLowerCase()) {
          markets.push({
            label: `${bSymbol} / WETH`,
            val: `${bAddress},${wethAddress}`
          })
        }
      }
    }
    
    // 3. DAI pairs (others as base, DAI as quote)
    const daiAddress = config[chainId].DAI?.address
    if (daiAddress) {
      const daiBases = ["WETH", "USDT", "USDC", "WBTC", "LINK", "UNI", "SHIB", "PEPE", "AAVE"]
      for (const bSymbol of daiBases) {
        const bAddress = config[chainId][bSymbol]?.address
        if (bAddress && bAddress.toLowerCase() !== daiAddress.toLowerCase() && bAddress.toLowerCase() !== cfytAddress?.toLowerCase()) {
          markets.push({
            label: `${bSymbol} / DAI`,
            val: `${bAddress},${daiAddress}`
          })
        }
      }
    }
    
    return markets
  }

  const marketsList = getMarkets()

  return(
    <div className='component exchange__markets'>
      <div className='component__header'>
        <h2>Select Market</h2>
      </div>

      {marketsList.length > 0 ? (
        <select name="markets" id="markets" onChange={marketHandler}>
          {marketsList.map((m) => (
            <option key={m.label} value={m.val}>
              {m.label}
            </option>
          ))}
        </select>
      ) : (
        <div>
          <p>Not Deployed to Network</p>
        </div>
      )}

      <hr />
    </div>
  )
}

export default Markets;
