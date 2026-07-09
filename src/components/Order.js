import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux'

import { makeBuyOrder, makeSellOrder } from '../store/interactions'

const Order = () => {
  const [isBuy, setIsBuy] = useState(true)
  const [amount, setAmount] = useState(0)
  const [price, setPrice] = useState(0)

  const provider = useSelector(state => state.provider.connection)
  const tokens = useSelector(state => state.tokens.contracts)
  const exchange = useSelector(state => state.exchange.contract)
  const exchangeBalances = useSelector(state => state.exchange.balances)
  const symbols = useSelector(state => state.tokens.symbols)

  const dispatch = useDispatch()

  const selectTab = (buyState) => {
    setIsBuy(buyState)
  }

  const prefillAmount = (percentage) => {
    if (!exchangeBalances) return;
    
    if (isBuy) {
      if (!price || parseFloat(price) === 0) return;
      const quoteBalance = parseFloat(exchangeBalances[1]);
      const currentPrice = parseFloat(price);
      if (isNaN(quoteBalance) || isNaN(currentPrice)) return;
      const maxBuy = quoteBalance / currentPrice;
      setAmount((maxBuy * percentage).toFixed(4));
    } else {
      const baseBalance = parseFloat(exchangeBalances[0]);
      if (isNaN(baseBalance)) return;
      setAmount((baseBalance * percentage).toFixed(4));
    }
  }

  const buyHandler = (e) => {
    e.preventDefault()
    makeBuyOrder(provider, exchange, tokens, { amount, price }, dispatch)
    setAmount(0)
    setPrice(0)
  }

  const sellHandler = (e) => {
    e.preventDefault()
    makeSellOrder(provider, exchange, tokens, { amount, price }, dispatch)
    setAmount(0)
    setPrice(0)
  }

  const totalCost = (parseFloat(amount) || 0) * (parseFloat(price) || 0);

  if (!tokens || tokens.length < 2 || !tokens[0] || !tokens[1]) {
    return (
      <div className="component exchange__orders">
        <div className='component__header flex-between'>
          <h2>New Order</h2>
        </div>
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--clr-neutral)' }}>
          <p>Please select a supported network and market to place orders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="component exchange__orders">
      <div className='component__header flex-between'>
        <h2>New Order</h2>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--clr-panel-alt)', padding: '2px', borderRadius: 'var(--radius-md)' }}>
          <button 
            onClick={() => selectTab(true)} 
            style={{ 
              padding: '4px 12px', 
              fontSize: '0.7rem', 
              borderRadius: 'var(--radius-sm)', 
              background: isBuy ? 'var(--clr-buy-dim)' : 'transparent', 
              color: isBuy ? 'var(--clr-buy)' : 'var(--clr-text-secondary)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}
          >
            Buy
          </button>
          <button 
            onClick={() => selectTab(false)} 
            style={{ 
              padding: '4px 12px', 
              fontSize: '0.7rem', 
              borderRadius: 'var(--radius-sm)', 
              background: !isBuy ? 'var(--clr-sell-dim)' : 'transparent', 
              color: !isBuy ? 'var(--clr-sell)' : 'var(--clr-text-secondary)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}
          >
            Sell
          </button>
        </div>
      </div>

      <form onSubmit={isBuy ? buyHandler : sellHandler }>
        <div className="input-container">
          <label htmlFor="amount">{isBuy ? 'Buy Amount' : 'Sell Amount'}</label>
          <input
              type="text"
              id='amount'
              placeholder='0.0000'
              value={amount === 0 ? '' : amount}
              onChange={(e) => setAmount(e.target.value)}
          />
          <div className="flex-end" style={{ gap: '6px', marginTop: '6px' }}>
            <button type="button" className="button--sm" onClick={() => prefillAmount(0.25)}>25%</button>
            <button type="button" className="button--sm" onClick={() => prefillAmount(0.50)}>50%</button>
            <button type="button" className="button--sm" onClick={() => prefillAmount(0.75)}>75%</button>
            <button type="button" className="button--sm" onClick={() => prefillAmount(1.00)}>Max</button>
          </div>
        </div>

        <div className="input-container">
          <label htmlFor="price">{isBuy ? 'Buy Price' : 'Sell Price'}</label>
          <input
              type="text"
              id='price'
              placeholder='0.0000'
              value={price === 0 ? '' : price}
              onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="flex-between" style={{ margin: '14px 0 6px', fontSize: '0.85rem', color: 'var(--clr-neutral)', fontWeight: '600' }}>
          <span>Estimated Total:</span>
          <span style={{ color: '#fff', fontFamily: 'Inter, sans-serif' }}>
            {totalCost.toFixed(4)} {symbols && symbols[1]}
          </span>
        </div>

        <button className={`button button--filled ${!isBuy ? 'sell-btn' : ''}`} type='submit'>
          {isBuy ? (
              <span>Buy Order</span>
          ) : (
              <span>Sell Order</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default Order;
