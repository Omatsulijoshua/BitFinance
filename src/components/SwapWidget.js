import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ethers } from 'ethers';
import { getEthereumProvider, transferTokens, fillOrder, loadBalances } from '../store/interactions';
import ethLogo from '../assets/eth.svg';
import btfLogo from '../assets/logo.png';

const SwapWidget = () => {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [rate, setRate] = useState(12.5); // Mock base rate: 1 WETH = 12.5 BTF
  const [swapInProgress, setSwapInProgress] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const dispatch = useDispatch();

  const provider = useSelector(state => state.provider.connection);
  const account = useSelector(state => state.provider.account);
  const chainId = useSelector(state => state.provider.chainId);

  const exchange = useSelector(state => state.exchange.contract);
  const allOrders = useSelector(state => state.exchange.allOrders.data || []);
  const filledOrders = useSelector(state => state.exchange.filledOrders.data || []);
  const cancelledOrders = useSelector(state => state.exchange.cancelledOrders.data || []);

  const tokens = useSelector(state => state.tokens.contracts);
  const tokenBalances = useSelector(state => state.tokens.balances);
  const exchangeBalances = useSelector(state => state.exchange.balances);

  // Calculate rate based on recent trades if available, else default
  useEffect(() => {
    if (filledOrders.length > 0) {
      // Find latest WETH/BTF trade
      const latestTrade = filledOrders[0];
      if (latestTrade) {
        const price = parseFloat(latestTrade.tokenPrice || 12.5);
        if (price > 0) {
          setRate(price);
        }
      }
    }
  }, [filledOrders]);

  const handleFromChange = (val) => {
    setFromAmount(val);
    if (!val || isNaN(val)) {
      setToAmount('');
      return;
    }
    setToAmount((parseFloat(val) * rate).toFixed(4));
  };

  const handleToChange = (val) => {
    setToAmount(val);
    if (!val || isNaN(val)) {
      setFromAmount('');
      return;
    }
    setFromAmount((parseFloat(val) / rate).toFixed(4));
  };

  const addBtfToMetaMask = async () => {
    const ethereumProvider = getEthereumProvider();
    if (!ethereumProvider) {
      alert('MetaMask is not installed.');
      return;
    }

    if (!tokens || !tokens[0]) {
      alert('Token contract not loaded.');
      return;
    }

    try {
      const tokenAddress = tokens[0].target;
      await ethereumProvider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: 'BTF',
            decimals: 18,
            image: window.location.origin + '/logo.png',
          },
        },
      });
      setSuccessMsg('BTF Token added to MetaMask!');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to add token to MetaMask.');
    }
  };

  const executeSwap = async (e) => {
    e.preventDefault();
    if (!account) {
      setErrorMsg('Please connect your wallet.');
      return;
    }
    if (!fromAmount || isNaN(fromAmount) || parseFloat(fromAmount) <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setSwapInProgress(true);

    try {
      const wethToken = tokens[1];
      const btfToken = tokens[0];

      if (!wethToken || !btfToken || !exchange) {
        throw new Error('Contracts not loaded. Connect wallet and select market first.');
      }

      // Check WETH wallet balance
      const wethWalletBal = parseFloat(tokenBalances[1] || '0');
      const wethExchangeBal = parseFloat(exchangeBalances[1] || '0');
      const amountNeeded = parseFloat(fromAmount);

      // If user doesn't have enough deposited WETH, deposit it
      if (wethExchangeBal < amountNeeded) {
        const depositAmt = amountNeeded - wethExchangeBal;
        if (wethWalletBal < depositAmt) {
          throw new Error(`Insufficient WETH balance. You need ${amountNeeded.toFixed(4)} WETH but only have ${wethWalletBal.toFixed(4)} in wallet.`);
        }
        
        setSuccessMsg(`Depositing WETH to Exchange...`);
        await transferTokens(provider, exchange, 'Deposit', wethToken, depositAmt.toString(), dispatch);
      }

      // Find matching BTF sell orders to fill
      const openOrders = allOrders.filter(order => {
        const isCancelled = cancelledOrders.some(c => c.id.toString() === order.id.toString());
        const isFilled = filledOrders.some(f => f.id.toString() === order.id.toString());
        const isBtfSell = order.tokenGive.toLowerCase() === btfToken.target.toLowerCase() && 
                          order.tokenGet.toLowerCase() === wethToken.target.toLowerCase();
        return !isCancelled && !isFilled && isBtfSell;
      });

      const sortedSellOrders = openOrders.sort((a, b) => {
        const priceA = parseFloat(ethers.formatUnits(a.amountGet, 18)) / parseFloat(ethers.formatUnits(a.amountGive, 18));
        const priceB = parseFloat(ethers.formatUnits(b.amountGet, 18)) / parseFloat(ethers.formatUnits(b.amountGive, 18));
        return priceA - priceB;
      });

      if (sortedSellOrders.length === 0) {
        if (chainId === 31337n) {
          setSuccessMsg('No matching orders. Submitting swap order directly...');
          const signer = await provider.getSigner();
          const tokenGet = btfToken.target;
          const amountGet = ethers.parseUnits(toAmount.toString(), 18);
          const tokenGive = wethToken.target;
          const amountGive = ethers.parseUnits(fromAmount.toString(), 18);
          const transaction = await exchange.connect(signer).makeOrder(tokenGet, amountGet, tokenGive, amountGive);
          await transaction.wait();
          setSuccessMsg('Swap order created! Waiting for match...');
        } else {
          throw new Error('No selling liquidity found for BTF/WETH. Please check the Order Book.');
        }
      } else {
        const bestOrder = sortedSellOrders[0];
        setSuccessMsg(`Swapping: Filling Order #${bestOrder.id.toString()}...`);
        await fillOrder(provider, exchange, { id: bestOrder.id }, dispatch);
        setSuccessMsg('Swap executed successfully!');
      }

      await loadBalances(exchange, tokens, account, dispatch);
      setFromAmount('');
      setToAmount('');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Swap transaction failed.');
    } finally {
      setSwapInProgress(false);
    }
  };

  return (
    <div className="swap-container flex-center" style={{ padding: '40px 20px', minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="swap-widget" style={{ width: '100%', maxWidth: '460px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.5)' }}>
        
        {/* Header */}
        <div className="swap-widget__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>Swap BTF</h2>
          <button 
            type="button" 
            onClick={addBtfToMetaMask} 
            className="button--sm"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--gold-400)',
              cursor: 'pointer'
            }}
          >
            🦊 Add BTF
          </button>
        </div>

        <form onSubmit={executeSwap}>
          {/* Pay field */}
          <div className="swap-field" style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>
              <span>You Pay</span>
              <span>Balance: {tokenBalances && tokenBalances[1] ? parseFloat(tokenBalances[1]).toFixed(4) : '0.0000'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="0.0"
                step="any"
                value={fromAmount}
                onChange={(e) => handleFromChange(e.target.value)}
                disabled={swapInProgress}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', fontWeight: '600', width: '70%', outline: 'none' }}
              />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.07)', padding: '6px 12px', borderRadius: '12px', fontWeight: '600', color: '#fff' }}>
                <img src={ethLogo} alt="ETH" style={{ width: '18px', height: '18px' }} />
                WETH
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '-12px 0' }}>
            <div style={{ background: 'var(--bg-surface)', border: '4px solid var(--bg-base)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-400)', zIndex: '2' }}>
              ↓
            </div>
          </div>

          {/* Receive field */}
          <div className="swap-field" style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)', marginTop: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>
              <span>You Receive</span>
              <span>Balance: {tokenBalances && tokenBalances[0] ? parseFloat(tokenBalances[0]).toFixed(4) : '0.0000'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="0.0"
                step="any"
                value={toAmount}
                onChange={(e) => handleToChange(e.target.value)}
                disabled={swapInProgress}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', fontWeight: '600', width: '70%', outline: 'none' }}
              />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.07)', padding: '6px 12px', borderRadius: '12px', fontWeight: '600', color: '#fff' }}>
                <img src={btfLogo} alt="BTF" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
                BTF
              </span>
            </div>
          </div>

          {/* Swap Rate Details */}
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '0 8px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Exchange Rate</span>
            <span>1 WETH ≈ {rate.toFixed(4)} BTF</span>
          </div>

          {/* Error / Success Messages */}
          {errorMsg && (
            <div style={{ color: '#ff4d4d', background: 'rgba(255,77,77,0.1)', padding: '12px', borderRadius: '12px', fontSize: '0.88rem', marginBottom: '16px', border: '1px solid rgba(255,77,77,0.2)' }}>
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div style={{ color: 'var(--green-400)', background: 'rgba(74,232,138,0.1)', padding: '12px', borderRadius: '12px', fontSize: '0.88rem', marginBottom: '16px', border: '1px solid rgba(74,232,138,0.2)' }}>
              ✓ {successMsg}
            </div>
          )}

          {/* CTA */}
          {account ? (
            <button
              type="submit"
              disabled={swapInProgress}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                background: 'var(--gradient-primary)',
                color: '#fff',
                fontWeight: '700',
                fontSize: '1rem',
                border: 'none',
                boxShadow: '0 4px 12px rgba(30,215,96,0.3)',
                cursor: swapInProgress ? 'not-allowed' : 'pointer',
                opacity: swapInProgress ? 0.75 : 1
              }}
            >
              {swapInProgress ? 'Swapping...' : 'Swap'}
            </button>
          ) : (
            <button
              type="button"
              disabled
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '1rem',
                border: '1px solid var(--border)',
                cursor: 'not-allowed'
              }}
            >
              Connect Wallet to Swap
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default SwapWidget;
