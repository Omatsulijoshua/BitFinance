import { useRef, useEffect } from 'react'
import { useSelector } from 'react-redux';

import { myEventsSelector } from '../store/selectors';

import config from '../config.json';

const Alert = () => {
  const alertRef = useRef(null)

  const network = useSelector(state => state.provider.network)
  const account = useSelector(state => state.provider.account)
  const isPending = useSelector(state => state.exchange.transaction.isPending)
  const isError = useSelector(state => state.exchange.transaction.isError)
  const events = useSelector(myEventsSelector)

  const removeHandler = async (e) => {
    alertRef.current.className = 'alert--remove'
  }

  useEffect(() => {
    if((events[0] || isPending || isError) && account) {
      alertRef.current.className = 'alert'
    }
  }, [events, isPending, isError, account])

  return (
    <div>
        {isPending ? (

          <div className="alert alert--remove" onClick={removeHandler} ref={alertRef}>
            <h1>Transaction Pending...</h1>
            <div className="spinner"></div>
          </div>

        ) : isError ? (

          <div className="alert alert--remove" onClick={removeHandler} ref={alertRef}>
            <h1>Transaction Will Fail</h1>
          </div>

        ) : !isPending && events[0] ? (

          <div className="alert alert--remove" onClick={removeHandler} ref={alertRef}>
            <h1>Transaction Successful</h1>
              <a
                href={config[network] && (events[0].transactionHash || events[0].log?.transactionHash) ? `${config[network].explorerURL}/tx/${events[0].transactionHash || events[0].log?.transactionHash}` : '#'}
                target='_blank'
                rel='noreferrer'
              >
                {(() => {
                  const txHash = events[0].transactionHash || events[0].log?.transactionHash || '';
                  return txHash ? (txHash.slice(0, 6) + '...' + txHash.slice(60, 66)) : 'View Transaction';
                })()}
              </a>
          </div>

        ) : (
          <div className="alert alert--remove" onClick={removeHandler} ref={alertRef}></div>
        )}
    </div>
  );
}

export default Alert;
