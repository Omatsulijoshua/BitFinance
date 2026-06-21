import { useState } from 'react';
import { useSelector } from 'react-redux';
import { maxBy, minBy, groupBy } from 'lodash';
import moment from 'moment';

import Chart from 'react-apexcharts';

import arrowDown from '../assets/down-arrow.svg';
import arrowUp from '../assets/up-arrow.svg';

import { options, defaultSeries } from './PriceChart.config';

import { priceChartSelector } from '../store/selectors';

import Banner from './Banner';

const buildGraphDataForTimeframe = (orders, timeframe) => {
  let grouped = {};
  
  if (timeframe === '1m') {
    grouped = groupBy(orders, (o) => moment.unix(Number(o.timestamp)).startOf('minute').format());
  } else if (timeframe === '5m') {
    grouped = groupBy(orders, (o) => {
      const time = moment.unix(Number(o.timestamp));
      const m = Math.floor(time.minutes() / 5) * 5;
      return time.minutes(m).seconds(0).milliseconds(0).format();
    });
  } else if (timeframe === '15m') {
    grouped = groupBy(orders, (o) => {
      const time = moment.unix(Number(o.timestamp));
      const m = Math.floor(time.minutes() / 15) * 15;
      return time.minutes(m).seconds(0).milliseconds(0).format();
    });
  } else if (timeframe === '1h') {
    grouped = groupBy(orders, (o) => moment.unix(Number(o.timestamp)).startOf('hour').format());
  } else if (timeframe === '1d') {
    grouped = groupBy(orders, (o) => moment.unix(Number(o.timestamp)).startOf('day').format());
  } else if (timeframe === '1w') {
    grouped = groupBy(orders, (o) => moment.unix(Number(o.timestamp)).startOf('week').format());
  } else {
    grouped = groupBy(orders, (o) => moment.unix(Number(o.timestamp)).startOf('hour').format());
  }

  const keys = Object.keys(grouped);

  return keys.map((key) => {
    const group = grouped[key];
    const open = group[0];
    const high = maxBy(group, 'tokenPrice');
    const low = minBy(group, 'tokenPrice');
    const close = group[group.length - 1];

    return {
      x: new Date(key),
      y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice]
    };
  });
};

const PriceChart = () => {
  const [timeframe, setTimeframe] = useState('1h');

  const account = useSelector(state => state.provider.account)
  const symbols = useSelector(state => state.tokens.symbols)
  const priceChart = useSelector(priceChartSelector)

  let series = defaultSeries;
  if (priceChart && priceChart.orders && priceChart.orders.length > 0) {
    series = [{
      data: buildGraphDataForTimeframe(priceChart.orders, timeframe)
    }];
  }

  return (
    <div className="component exchange__chart">
      <div className='component__header flex-between'>
        <div className='flex'>

          <h2>{symbols && `${symbols[0]}/${symbols[1]}`}</h2>

          {priceChart && (

            <div className='flex'>

              {priceChart.lastPriceChange === '+' ? (
                <img src={arrowUp} alt="Arrow up" />
              ): (
                <img src={arrowDown} alt="Arrow down" />
              )}

              <span className='up'>{priceChart.lastPrice}</span>
            </div>

          )}

        </div>

        {account && (
          <div className='tabs'>
            <button onClick={() => setTimeframe('1m')} className={timeframe === '1m' ? 'tab tab--active' : 'tab'}>1m</button>
            <button onClick={() => setTimeframe('5m')} className={timeframe === '5m' ? 'tab tab--active' : 'tab'}>5m</button>
            <button onClick={() => setTimeframe('15m')} className={timeframe === '15m' ? 'tab tab--active' : 'tab'}>15m</button>
            <button onClick={() => setTimeframe('1h')} className={timeframe === '1h' ? 'tab tab--active' : 'tab'}>1h</button>
            <button onClick={() => setTimeframe('1d')} className={timeframe === '1d' ? 'tab tab--active' : 'tab'}>1d</button>
            <button onClick={() => setTimeframe('1w')} className={timeframe === '1w' ? 'tab tab--active' : 'tab'}>1w</button>
          </div>
        )}
      </div>

      {!account ? (
        <Banner text={'Please connect with Metamask'} />
      ) : (
        <Chart
          type="candlestick"
          options={options}
          series={series}
          width="100%"
          height="100%"
        />
      )}

    </div>
  );
}

export default PriceChart;
