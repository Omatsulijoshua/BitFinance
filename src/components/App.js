import { useState } from 'react';
import '../App.css';
import Exchange from './Exchange';

const stats = [
  { value: '$84M+', label: 'routed liquidity' },
  { value: '0.18%', label: 'average swap spread' },
  { value: '24/7', label: 'self-custody access' },
];

const features = [
  'Non-custodial token swaps',
  'Transparent market routing',
  'Portfolio-first trade flow',
];

function App() {
  const [view, setView] = useState(() =>
    window.location.hash === '#exchange' ? 'exchange' : 'home'
  );

  const openExchange = () => {
    window.location.hash = 'exchange';
    setView('exchange');
  };

  const openHome = () => {
    window.location.hash = '';
    setView('home');
  };

  if (view === 'exchange') {
    return <Exchange onBack={openHome} />;
  }

  return (
    <main className="site-shell">
      <nav className="nav-bar" aria-label="Primary navigation">
        <button className="brand-mark" type="button" onClick={openHome}>
          <img src="/crypfinance-logo.png" alt="Crypfinance logo" />
          <span>Crypfinance</span>
        </button>
        <button className="nav-cta" type="button" onClick={openExchange}>
          Launch Exchange
        </button>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Decentralized Exchange</p>
          <h1>Trade crypto with sharp routing and clean self-custody control.</h1>
          <p className="hero-text">
            Crypfinance brings gold-grade market confidence to a deep-green DeFi
            experience built for fast swaps, clear balances, and direct wallet
            ownership.
          </p>

          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={openExchange}>
              Go to Exchange
            </button>
            <a className="secondary-link" href="#liquidity">
              View liquidity
            </a>
          </div>
        </div>

        <div className="hero-visual" aria-label="Crypfinance exchange dashboard preview">
          <div className="logo-orbit">
            <img src="/crypfinance-logo.png" alt="" />
          </div>
          <div className="market-card swap-card">
            <span>Swap Route</span>
            <strong>ETH / CRYP</strong>
            <small>Best route active</small>
          </div>
          <div className="market-card yield-card">
            <span>Liquidity</span>
            <strong>+18.6%</strong>
            <small>30 day volume</small>
          </div>
        </div>
      </section>

      <section className="stats-band" id="liquidity" aria-label="Exchange statistics">
        {stats.map((item) => (
          <article key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </section>

      <section className="feature-section">
        <div>
          <p className="eyebrow">Built for DeFi traders</p>
          <h2>Move from wallet to market without the noise.</h2>
        </div>
        <div className="feature-list">
          {features.map((feature) => (
            <div className="feature-item" key={feature}>
              <span aria-hidden="true" />
              <p>{feature}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
