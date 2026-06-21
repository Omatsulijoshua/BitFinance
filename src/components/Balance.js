import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import logo from '../assets/logo.png';
import eth from '../assets/eth.svg';

import {
  loadBalances,
  transferTokens
} from '../store/interactions';

const Balance = () => {
  const [isDeposit, setIsDeposit] = useState(true)
  const [token1TransferAmount, setToken1TransferAmount] = useState(0)
  const [token2TransferAmount, setToken2TransferAmount] = useState(0)

  const dispatch = useDispatch()

  const provider = useSelector(state => state.provider.connection)
  const account = useSelector(state => state.provider.account)

  const exchange = useSelector(state => state.exchange.contract)
  const exchangeBalances = useSelector(state => state.exchange.balances)
  const transferInProgress = useSelector(state => state.exchange.transferInProgress)

  const tokens = useSelector(state => state.tokens.contracts)
  const symbols = useSelector(state => state.tokens.symbols)
  const tokenBalances = useSelector(state => state.tokens.balances)

  const depositRef = useRef(null)
  const withdrawRef = useRef(null)

  const tabHandler = (e) => {
    if(e.target.className !== depositRef.current.className) {
      e.target.className = 'tab tab--active'
      depositRef.current.className = 'tab'
      setIsDeposit(false)
    } else {
      e.target.className = 'tab tab--active'
      withdrawRef.current.className = 'tab'
      setIsDeposit(true)
    }
  }

  const amountHandler = (e, token) => {
    if (token.target === tokens[0].target) {
      setToken1TransferAmount(e.target.value)
    } else {
      setToken2TransferAmount(e.target.value)
    }
  }

  const prefillAmount = (tokenIndex, percentage) => {
    const balanceSource = isDeposit ? tokenBalances : exchangeBalances;
    if (!balanceSource || balanceSource[tokenIndex] === undefined) return;
    
    const maxVal = parseFloat(balanceSource[tokenIndex]);
    if (isNaN(maxVal)) return;

    const val = maxVal * percentage;
    if (tokenIndex === 0) {
      setToken1TransferAmount(val === 0 ? '' : val.toFixed(4));
    } else {
      setToken2TransferAmount(val === 0 ? '' : val.toFixed(4));
    }
  }

  const depositHandler = (e, token) => {
    e.preventDefault()

    if (token.target === tokens[0].target) {
      transferTokens(provider, exchange, 'Deposit', token, token1TransferAmount, dispatch)
      setToken1TransferAmount(0)
    } else {
      transferTokens(provider, exchange, 'Deposit', token, token2TransferAmount, dispatch)
      setToken2TransferAmount(0)
    }
  }

  const withdrawHandler = (e, token) => {
    e.preventDefault()

    if (token.target === tokens[0].target) {
      transferTokens(provider, exchange, 'Withdraw', token, token1TransferAmount, dispatch)
      setToken1TransferAmount(0)
    } else {
      transferTokens(provider, exchange, 'Withdraw', token, token2TransferAmount, dispatch)
      setToken2TransferAmount(0)
    }
  }

  useEffect(() => {
    if(exchange && tokens[0] && tokens[1] && account) {
      loadBalances(exchange, tokens, account, dispatch)
    }
  }, [exchange, tokens, account, transferInProgress, dispatch])

  if (!tokens || tokens.length < 2 || !tokens[0] || !tokens[1]) {
    return (
      <div className='component exchange__transfers'>
        <div className='component__header flex-between'>
          <h2>Balance</h2>
        </div>
        <div className='exchange__transfers--form' style={{ padding: '24px', textAlign: 'center', color: 'var(--clr-neutral)' }}>
          <p>Please select a supported network and market to view balances.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='component exchange__transfers'>
      <div className='component__header flex-between'>
        <h2>Balance</h2>
        <div className='tabs'>
          <button onClick={tabHandler} ref={depositRef} className='tab tab--active'>Deposit</button>
          <button onClick={tabHandler} ref={withdrawRef} className='tab'>Withdraw</button>
        </div>
      </div>

      {/* Deposit/Withdraw Component 1 (DApp) */}

      <div className='exchange__transfers--form'>
        <div className='flex-between'>
          <p><small>Token</small><img src={logo} alt="Token Logo" />{symbols && symbols[0]}</p>
          <p><small>Wallet</small>{tokenBalances && tokenBalances[0]}</p>
          <p><small>Exchange</small>{exchangeBalances && exchangeBalances[0]}</p>
        </div>

        <form onSubmit={isDeposit ? (e) => depositHandler(e, tokens[0]) : (e) => withdrawHandler(e, tokens[0])}>
          <div className="input-container">
            <label htmlFor="token0">{symbols && symbols[0]} Amount</label>
            <input
              type="text"
              id='token0'
              placeholder='0.0000'
              value={token1TransferAmount === 0 ? '' : token1TransferAmount}
              onChange={(e) => amountHandler(e, tokens[0])}/>
            <div className="flex-end" style={{ gap: '6px', marginTop: '6px' }}>
              <button type="button" className="button--sm" onClick={() => prefillAmount(0, 0.25)}>25%</button>
              <button type="button" className="button--sm" onClick={() => prefillAmount(0, 0.50)}>50%</button>
              <button type="button" className="button--sm" onClick={() => prefillAmount(0, 0.75)}>75%</button>
              <button type="button" className="button--sm" onClick={() => prefillAmount(0, 1.00)}>Max</button>
            </div>
          </div>

          <button className='button' type='submit'>
            {isDeposit ? (
                <span>Deposit</span>
            ) : (
                <span>Withdraw</span>
            )}
          </button>
        </form>
      </div>

      <hr />

      {/* Deposit/Withdraw Component 2 (mETH) */}

      <div className='exchange__transfers--form'>
        <div className='flex-between'>
          <p><small>Token</small><img src={eth} alt="Token Logo" />{symbols && symbols[1]}</p>
          <p><small>Wallet</small>{tokenBalances && tokenBalances[1]}</p>
          <p><small>Exchange</small>{exchangeBalances && exchangeBalances[1]}</p>
        </div>

        <form onSubmit={isDeposit ? (e) => depositHandler(e, tokens[1]) : (e) => withdrawHandler(e, tokens[1])}>
          <div className="input-container">
            <label htmlFor="token1">{symbols && symbols[1]} Amount</label>
            <input
              type="text"
              id='token1'
              placeholder='0.0000'
              value={token2TransferAmount === 0 ? '' : token2TransferAmount}
              onChange={(e) => amountHandler(e, tokens[1])}
            />
            <div className="flex-end" style={{ gap: '6px', marginTop: '6px' }}>
              <button type="button" className="button--sm" onClick={() => prefillAmount(1, 0.25)}>25%</button>
              <button type="button" className="button--sm" onClick={() => prefillAmount(1, 0.50)}>50%</button>
              <button type="button" className="button--sm" onClick={() => prefillAmount(1, 0.75)}>75%</button>
              <button type="button" className="button--sm" onClick={() => prefillAmount(1, 1.00)}>Max</button>
            </div>
          </div>

          <button className='button' type='submit'>
            {isDeposit ? (
                <span>Deposit</span>
            ) : (
                <span>Withdraw</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Balance;
