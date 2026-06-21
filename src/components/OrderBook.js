import { useDispatch, useSelector } from 'react-redux'

// Import Assets
import sort from '../assets/sort.svg'

// Import Selectors
import { orderBookSelector } from '../store/selectors'

// Import Interactions
import { fillOrder } from '../store/interactions';

const OrderBook = () => {
  const provider = useSelector(state => state.provider.connection)
  const exchange = useSelector(state => state.exchange.contract)
  const symbols = useSelector(state => state.tokens.symbols)
  const orderBook = useSelector(orderBookSelector)

  const dispatch = useDispatch()

  const fillOrderHandler = (order) => {
    fillOrder(provider, exchange, order, dispatch)
  }

  // Calculate max volume to size depth bars
  const maxVolume = orderBook ? Math.max(
    ...orderBook.sellOrders.map(o => parseFloat(o.token0Amount) || 0),
    ...orderBook.buyOrders.map(o => parseFloat(o.token0Amount) || 0),
    1
  ) : 1;

  return (
    <div className="component exchange__orderbook">
      <div className='component__header flex-between'>
        <h2>Order Book</h2>
      </div>

      <div className="flex" style={{ gap: '16px' }}>

        {!orderBook || orderBook.sellOrders.length === 0 ? (
          <p className='flex-center'>No Sell Orders</p>
        ) : (
          <table className='exchange__orderbook--sell'>
            <caption>Selling</caption>
            <thead>
              <tr>
                <th>{symbols && symbols[0]}<img src={sort} alt="Sort" /></th>
                <th>{symbols && symbols[0]}/{symbols && symbols[1]}<img src={sort} alt="Sort" /></th>
                <th>{symbols && symbols[1]}<img src={sort} alt="Sort" /></th>
              </tr>
            </thead>
            <tbody>

              {/* MAPPING OF SELL ORDERS WITH DEPTH BARS */}

              {orderBook && orderBook.sellOrders.map((order, index) => {
                const percent = ((parseFloat(order.token0Amount) || 0) / maxVolume) * 100;
                return(
                <tr 
                  key={index} 
                  onClick={() => fillOrderHandler(order)}
                  style={{
                    background: `linear-gradient(to left, rgba(255, 56, 96, 0.08) ${percent}%, transparent ${percent}%)`
                  }}
                >
                  <td>{order.token0Amount}</td>
                  <td style={{ color: `${order.orderTypeClass}` }}>{order.tokenPrice}</td>
                  <td>{order.token1Amount}</td>
                </tr>
                )
              })}

            </tbody>
          </table>
        )}

        <div className='divider'></div>

       {!orderBook || orderBook.buyOrders.length === 0 ? (
          <p className='flex-center'>No Buy Orders</p>
        ) : (
          <table className='exchange__orderbook--buy'>
            <caption>Buying</caption>
            <thead>
              <tr>
                <th>{symbols && symbols[0]}<img src={sort} alt="Sort" /></th>
                <th>{symbols && symbols[0]}/{symbols && symbols[1]}<img src={sort} alt="Sort" /></th>
                <th>{symbols && symbols[1]}<img src={sort} alt="Sort" /></th>
              </tr>
            </thead>
            <tbody>

              {/* MAPPING OF BUY ORDERS WITH DEPTH BARS */}

              {orderBook && orderBook.buyOrders.map((order, index) => {
                const percent = ((parseFloat(order.token0Amount) || 0) / maxVolume) * 100;
                return (
                  <tr 
                    key={index} 
                    onClick={() => fillOrderHandler(order)}
                    style={{
                      background: `linear-gradient(to right, rgba(0, 245, 160, 0.08) ${percent}%, transparent ${percent}%)`
                    }}
                  >
                    <td>{order.token0Amount}</td>
                    <td style={{ color: `${order.orderTypeClass}` }}>{order.tokenPrice}</td>
                    <td>{order.token1Amount}</td>
                  </tr>
                )
              })}

            </tbody>
          </table>
        )}

      </div>
    </div>
  );
}

export default OrderBook;
