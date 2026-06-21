import { useSelector } from 'react-redux'

import sort from '../assets/sort.svg'

import { filledOrdersSelector } from '../store/selectors'

import Banner from './Banner'

const Trades = () => {
  const symbols = useSelector(state => state.tokens.symbols)
  const filledOrders = useSelector(filledOrdersSelector)

  return (
    <div className="component exchange__trades">
      <div className='component__header flex-between'>
        <h2>Market Trades</h2>
      </div>

      {!filledOrders || filledOrders.length === 0 ? (
        <Banner text='No Transactions' />
      ): (
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

            {/* MAPPING OF ORDERS */}

            {filledOrders && filledOrders.map((order, index) => {
              return(
                <tr key={index}>
                  <td>{order.formattedTimestamp}</td>
                  <td style={{ color: `${order.tokenPriceClass}` }}>{order.token0Amount}</td>
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
                </tr>
              )
            })}

          </tbody>
        </table>
      )}
    </div>
  );
}

export default Trades;
