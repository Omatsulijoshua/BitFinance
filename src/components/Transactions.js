import { useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { myOpenOrdersSelector, myFilledOrdersSelector } from '../store/selectors'
import sort from '../assets/sort.svg';
import { cancelOrder } from '../store/interactions'
import Banner from './Banner';

const Transactions = () => {
  const [showMyOrders, setShowMyOrders] = useState(true)

  const provider = useSelector(state => state.provider.connection)
  const exchange = useSelector(state => state.exchange.contract)
  const symbols = useSelector(state => state.tokens.symbols)
  const myOpenOrders = useSelector(myOpenOrdersSelector)
  const myFilledOrders = useSelector(myFilledOrdersSelector)

  const dispatch = useDispatch()

  const tradeRef = useRef(null)
  const orderRef = useRef(null)

  const tabHandler = (e) => {
    if (e.target.className !== orderRef.current.className) {
      e.target.className = 'tab tab--active'
      orderRef.current.className = 'tab'
      setShowMyOrders(false)
    } else {
      e.target.className = 'tab tab--active'
      tradeRef.current.className = 'tab'
      setShowMyOrders(true)
    }
  }

  const cancelHandler = (order) => {
    cancelOrder(provider, exchange, order, dispatch)
  }

  return (
    <div className="component exchange__transactions">
      {showMyOrders ? (
        <div>
          <div className='component__header flex-between'>
            <h2>My Orders</h2>

            <div className='tabs'>
              <button onClick={tabHandler} ref={orderRef} className='tab tab--active'>Orders</button>
              <button onClick={tabHandler} ref={tradeRef} className='tab'>Trades</button>
            </div>
          </div>

          {!myOpenOrders || myOpenOrders.length === 0 ? (
            <Banner text='No Open Orders'/>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{symbols && symbols[0]}<img src={sort} alt="Sort" /></th>
                  <th>{symbols && symbols[0]}/{symbols && symbols[1]}<img src={sort} alt="Sort" /></th>
                  <th style={{ textAlign: 'center' }}>Type</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>

                {myOpenOrders && myOpenOrders.map((order, index) => {
                  return(
                    <tr key={index}>
                      <td style={{ color: `${order.orderTypeClass}` }}>{order.token0Amount}</td>
                      <td>{order.tokenPrice}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          color: `${order.orderTypeClass}`, 
                          background: `${order.orderType === 'buy' ? 'rgba(0, 245, 160, 0.15)' : 'rgba(255, 56, 96, 0.15)'}`,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.02em',
                          display: 'inline-block'
                        }}>
                          {order.orderType}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className='button--sm' onClick={() => cancelHandler(order)}>Cancel</button>
                      </td>
                    </tr>
                  )
                })}

              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div>
          <div className='component__header flex-between'>
            <h2>My Transactions</h2>

            <div className='tabs'>
              <button onClick={tabHandler} ref={orderRef} className='tab tab--active'>Orders</button>
              <button onClick={tabHandler} ref={tradeRef} className='tab'>Trades</button>
            </div>
          </div>

          {!myFilledOrders || myFilledOrders.length === 0 ? (
            <Banner text='No Transactions'/>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Time<img src={sort} alt="Sort" /></th>
                  <th>{symbols && symbols[0]}<img src={sort} alt="Sort" /></th>
                  <th>{symbols && symbols[0]}/{symbols && symbols[1]}<img src={sort} alt="Sort" /></th>
                  <th style={{ textAlign: 'center' }}>Type</th>
                </tr>
              </thead>
              <tbody>

                {myFilledOrders && myFilledOrders.map((order, index) => {
                  return(
                    <tr key={index}>
                      <td>{order.formattedTimestamp}</td>
                      <td style={{ color: `${order.orderClass}` }}>{order.orderSign}{order.token0Amount}</td>
                      <td>{order.tokenPrice}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          color: `${order.orderClass}`, 
                          background: `${order.orderType === 'buy' ? 'rgba(0, 245, 160, 0.15)' : 'rgba(255, 56, 96, 0.15)'}`,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.02em',
                          display: 'inline-block'
                        }}>
                          {order.orderType}
                        </span>
                      </td>
                    </tr>
                  )
                })}

              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default Transactions;
