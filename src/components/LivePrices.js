import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

const POPULAR_ASSETS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', fallbackPrice: 65000 },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', fallbackPrice: 3500 },
  { id: 'binance-coin', symbol: 'BNB', name: 'BNB', fallbackPrice: 580 },
  { id: 'solana', symbol: 'SOL', name: 'Solana', fallbackPrice: 145 },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', fallbackPrice: 0.58 },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', fallbackPrice: 0.38 },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', fallbackPrice: 6.2 },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', fallbackPrice: 0.12 },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', fallbackPrice: 15.5 },
];

const LivePrices = () => {
  const [prices, setPrices] = useState({});
  const [prevPrices, setPrevPrices] = useState({});
  const [loading, setLoading] = useState(true);

  const filledOrders = useSelector(state => state.exchange.filledOrders.data || []);

  // Fetch prices from CoinCap
  const fetchLivePrices = useCallback(async () => {
    try {
      const response = await fetch('https://api.coincap.io/v2/assets?ids=bitcoin,ethereum,binance-coin,solana,ripple,cardano,polkadot,dogecoin,chainlink');
      if (!response.ok) throw new Error('Network response not ok');
      const data = await response.json();
      
      const newPrices = {};
      data.data.forEach(asset => {
        newPrices[asset.symbol] = {
          price: parseFloat(asset.priceUsd),
          change: parseFloat(asset.changePercent24Hr),
          volume: parseFloat(asset.volumeUsd24Hr)
        };
      });

      // Calculate BTF Price
      // If there are filled orders, we calculate price based on latest trade price
      // BTF/WETH price = WETH per BTF
      // BTF_Price = WETH_Price * BTF_WETH_rate
      let btfWethRate = 0.00025; // Default rate
      if (filledOrders.length > 0) {
        const latestTrade = filledOrders[0];
        if (latestTrade && latestTrade.tokenPrice) {
          const tradePrice = parseFloat(latestTrade.tokenPrice);
          if (tradePrice > 0) {
            btfWethRate = tradePrice;
          }
        }
      }

      const ethPrice = newPrices['ETH']?.price || 3500;
      const btfPrice = ethPrice * btfWethRate;

      newPrices['BTF'] = {
        price: btfPrice,
        change: 0.85,
        volume: 76000
      };

      setPrevPrices(prev => {
        const updatedPrev = {};
        Object.keys(newPrices).forEach(sym => {
          updatedPrev[sym] = prev[sym] || newPrices[sym].price;
        });
        return updatedPrev;
      });

      setPrices(newPrices);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching live prices:', error);
      // Fallback values if API fails
      const fallback = {
        'BTC': { price: 65000, change: 1.2, volume: 28000000000 },
        'ETH': { price: 3500, change: -0.5, volume: 15000000000 },
        'BNB': { price: 580, change: 0.8, volume: 1200000000 },
        'SOL': { price: 140, change: 4.5, volume: 3100000000 },
        'XRP': { price: 0.48, change: -1.1, volume: 900000000 },
        'ADA': { price: 0.38, change: 0.2, volume: 300000000 },
        'DOT': { price: 5.8, change: -2.3, volume: 180000000 },
        'DOGE': { price: 0.12, change: 3.1, volume: 1100000000 },
        'LINK': { price: 15.2, change: 0.5, volume: 350000000 }
      };

      let btfWethRate = 0.00025;
      if (filledOrders.length > 0) {
        const latestTrade = filledOrders[0];
        if (latestTrade && latestTrade.tokenPrice) {
          btfWethRate = parseFloat(latestTrade.tokenPrice);
        }
      }
      fallback['BTF'] = {
        price: (fallback['ETH']?.price || 3500) * btfWethRate,
        change: 0.85,
        volume: 76000
      };

      setPrices(fallback);
      setLoading(false);
    }
  }, [filledOrders]);

  useEffect(() => {
    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 8000);
    return () => clearInterval(interval);
  }, [fetchLivePrices]);

  const getPriceDirection = (symbol, currentPrice) => {
    const prev = prevPrices[symbol];
    if (!prev) return '';
    if (currentPrice > prev) return 'up';
    if (currentPrice < prev) return 'down';
    return '';
  };

  const formatNumber = (num, decimals = 2) => {
    if (!num) return '0.00';
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  // Combine static array with BTF details
  const displayAssets = [
    ...POPULAR_ASSETS,
    { id: 'bitfinance', symbol: 'BTF', name: 'BitFinance' }
  ];

  return (
    <div className="component exchange__live-prices" style={{ marginTop: '20px' }}>
      <div className="component__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Live Crypto Prices</h2>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Updates Live</span>
      </div>

      <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
            Loading market prices...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontSize: '0.75rem' }}>
                <th style={{ padding: '8px 4px' }}>Asset</th>
                <th style={{ padding: '8px 4px', textAlign: 'right' }}>Price</th>
                <th style={{ padding: '8px 4px', textAlign: 'right' }}>24h Change</th>
              </tr>
            </thead>
            <tbody>
              {displayAssets.map(asset => {
                const data = prices[asset.symbol] || {};
                const dir = getPriceDirection(asset.symbol, data.price);
                const flashClass = dir === 'up' ? 'flash-up' : dir === 'down' ? 'flash-down' : '';

                return (
                  <tr 
                    key={asset.symbol} 
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.3s' }}
                    className="hover-row"
                  >
                    <td style={{ padding: '10px 4px', display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '700', color: '#fff' }}>{asset.symbol}/USDT</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{asset.name}</span>
                    </td>
                    <td 
                      style={{ padding: '10px 4px', textAlign: 'right', fontWeight: '600', transition: 'color 0.4s' }}
                      className={flashClass}
                    >
                      ${formatNumber(data.price, asset.symbol === 'BTF' || asset.symbol === 'XRP' || asset.symbol === 'ADA' || asset.symbol === 'DOGE' ? 4 : 2)}
                    </td>
                    <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: '600', color: data.change >= 0 ? 'var(--green-500)' : '#ff4d4d' }}>
                      {data.change >= 0 ? '+' : ''}{formatNumber(data.change, 2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Embedded CSS for flash animations */}
      <style>{`
        @keyframes flashGreen {
          0% { color: var(--green-500); }
          50% { color: var(--green-300); }
          100% { color: inherit; }
        }
        @keyframes flashRed {
          0% { color: #ff4d4d; }
          50% { color: #ff8080; }
          100% { color: inherit; }
        }
        .flash-up {
          animation: flashGreen 1s ease-out;
          color: var(--green-500) !important;
        }
        .flash-down {
          animation: flashRed 1s ease-out;
          color: #ff4d4d !important;
        }
        .hover-row:hover {
          background: rgba(255,255,255,0.02);
        }
      `}</style>
    </div>
  );
};

export default LivePrices;
