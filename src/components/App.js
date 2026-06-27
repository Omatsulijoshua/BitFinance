import { useState, useEffect, useRef } from 'react';
import '../App.css';
import Exchange from './Exchange';

/* ──────────────────────────────────────────────
   DATA
   ────────────────────────────────────────────── */

const stats = [
  { value: '$84M+', label: 'Total Volume' },
  { value: '12K+', label: 'Active Traders' },
  { value: '0.18%', label: 'Avg Swap Fee' },
  { value: '24/7', label: 'Non-Stop Trading' },
];

const features = [
  {
    icon: '⚡',
    iconClass: '',
    title: 'Instant Swaps',
    text: 'Execute token swaps in seconds with deep liquidity pools and optimized routing across multiple DEX aggregators.',
  },
  {
    icon: '🔒',
    iconClass: '',
    title: 'Self-Custody',
    text: 'Your keys, your crypto. Trade directly from your wallet without ever giving up control of your assets.',
  },
  {
    icon: '📊',
    iconClass: 'feature-card__icon--gold',
    title: 'Advanced Charts',
    text: 'Professional-grade candlestick charts, order books, and real-time market data at your fingertips.',
  },
  {
    icon: '🌐',
    iconClass: '',
    title: 'Multi-Chain',
    text: 'Trade across Ethereum, Polygon, Arbitrum, Base, BSC and more — all from a single unified interface.',
  },
  {
    icon: '💰',
    iconClass: 'feature-card__icon--gold',
    title: 'Deep Liquidity',
    text: 'Access aggregated liquidity from top DeFi protocols for minimal slippage on every trade.',
  },
  {
    icon: '🛡️',
    iconClass: '',
    title: 'Battle-Tested',
    text: 'Smart contracts audited by leading security firms. Transparent, open-source, and community-driven.',
  },
];

const steps = [
  {
    number: '1',
    title: 'Connect Wallet',
    text: 'Link your MetaMask, WalletConnect, or any Web3 wallet in one click.',
  },
  {
    number: '2',
    title: 'Choose Tokens',
    text: 'Select the token pair you want to swap and enter the amount.',
  },
  {
    number: '3',
    title: 'Swap & Earn',
    text: 'Confirm the transaction and receive your tokens instantly.',
  },
];

const networks = [
  { name: 'Ethereum', dotClass: 'networks__dot--eth' },
  { name: 'BNB Chain', dotClass: 'networks__dot--bsc' },
  { name: 'Polygon', dotClass: 'networks__dot--poly' },
  { name: 'Arbitrum', dotClass: 'networks__dot--arb' },
  { name: 'Base', dotClass: 'networks__dot--base' },
  { name: 'Optimism', dotClass: 'networks__dot--op' },
];

/* ──────────────────────────────────────────────
   SCROLL ANIMATION HOOK
   ────────────────────────────────────────────── */

function useScrollReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    const children = node.querySelectorAll('.animate-on-scroll');
    children.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ──────────────────────────────────────────────
   APP COMPONENT
   ────────────────────────────────────────────── */

function App() {
  const [view, setView] = useState(() =>
    window.location.hash === '#exchange' ? 'exchange' : 'home'
  );

  const scrollRef = useScrollReveal();

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
    <div className="landing" ref={scrollRef}>
      {/* Background Effects */}
      <div className="grid-overlay" />
      <div className="orb orb--green" />
      <div className="orb orb--gold" />
      <div className="orb orb--teal" />

      {/* ═══ NAVBAR ═══ */}
      <header className="topbar">
        <div className="topbar__inner">
          <button className="topbar__brand" type="button" onClick={openHome}>
            <img src="/crypfinance-logo.png" alt="CrypFinance" />
            <span className="topbar__brand-name">CrypFinance</span>
          </button>

          <nav className="topbar__nav">
            <a href="#features" className="topbar__link">Features</a>
            <a href="#how" className="topbar__link">How It Works</a>
            <a href="#networks" className="topbar__link">Networks</a>
          </nav>

          <button className="topbar__launch" type="button" onClick={openExchange}>
            Launch App
          </button>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="hero">
        <div className="hero__content">
          <div className="hero__badge">Decentralized Exchange — Live</div>

          <h1 className="hero__title">
            <span className="hero__title-line">Trade crypto with</span>
            <span className="hero__title-line text-gradient">precision & confidence.</span>
          </h1>

          <p className="hero__subtitle">
            Swap tokens instantly across multiple chains. Non-custodial, transparent,
            and built for serious DeFi traders who demand premium execution.
          </p>

          <div className="hero__actions">
            <button className="btn-primary" type="button" onClick={openExchange}>
              Start Trading
            </button>
            <a href="#features" className="btn-secondary">
              Explore Features
            </a>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__glow" />
          <div className="swap-widget">
            <div className="swap-widget__header">
              <span className="swap-widget__title">Swap</span>
              <button className="swap-widget__settings" type="button" aria-label="Settings">⚙</button>
            </div>

            <div className="swap-field">
              <div className="swap-field__label">You Pay</div>
              <div className="swap-field__row">
                <span className="swap-field__amount">1.00</span>
                <span className="swap-field__token">
                  <span className="swap-field__token-icon" />
                  ETH
                </span>
              </div>
              <div className="swap-field__usd">≈ $3,847.20</div>
            </div>

            <div className="swap-arrow">
              <button className="swap-arrow__btn" type="button" aria-label="Switch tokens">↓</button>
            </div>

            <div className="swap-field">
              <div className="swap-field__label">You Receive</div>
              <div className="swap-field__row">
                <span className="swap-field__amount">4,231.6</span>
                <span className="swap-field__token">
                  <span className="swap-field__token-icon swap-field__token-icon--gold" />
                  CRYP
                </span>
              </div>
              <div className="swap-field__usd">≈ $3,839.55</div>
            </div>

            <div className="swap-widget__details">
              <span>Slippage Tolerance</span>
              <span>0.5%</span>
            </div>

            <button className="swap-widget__cta" type="button" onClick={openExchange}>
              Connect Wallet
            </button>
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="stats animate-on-scroll">
        <div className="stats__grid">
          {stats.map((s) => (
            <div className="stats__item" key={s.label}>
              <strong className="stats__value">{s.value}</strong>
              <span className="stats__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="features" id="features">
        <div className="animate-on-scroll">
          <span className="section-eyebrow">Why CrypFinance</span>
          <h2 className="section-title">Everything you need to trade DeFi.</h2>
          <p className="section-subtitle">
            From instant swaps to advanced charting — CrypFinance delivers
            a professional trading experience without intermediaries.
          </p>
        </div>
        <div className="features__grid">
          {features.map((f) => (
            <div className="feature-card animate-on-scroll" key={f.title}>
              <div className={`feature-card__icon ${f.iconClass}`}>{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__text">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="how-it-works" id="how">
        <div className="animate-on-scroll">
          <span className="section-eyebrow">Getting Started</span>
          <h2 className="section-title">Start trading in 3 simple steps.</h2>
          <p className="section-subtitle">
            No sign-ups. No KYC. Just connect your wallet and go.
          </p>
        </div>
        <div className="steps">
          {steps.map((s) => (
            <div className="step animate-on-scroll" key={s.number}>
              <div className="step__number">{s.number}</div>
              <h3 className="step__title">{s.title}</h3>
              <p className="step__text">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SUPPORTED NETWORKS ═══ */}
      <section className="networks" id="networks">
        <div className="networks__inner">
          <p className="networks__label">Supported Networks</p>
          <div className="networks__logos">
            {networks.map((n) => (
              <span className="networks__item" key={n.name}>
                <span className={`networks__dot ${n.dotClass}`} />
                {n.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="cta-section">
        <div className="cta-card animate-on-scroll">
          <h2 className="section-title">Ready to trade smarter?</h2>
          <p className="section-subtitle">
            Join thousands of traders already using CrypFinance for fast,
            secure, non-custodial crypto swaps.
          </p>
          <div className="hero__actions">
            <button className="btn-primary" type="button" onClick={openExchange}>
              Launch Exchange
            </button>
            <a
              href="https://docs.crypfinance.com"
              className="btn-secondary"
              target="_blank"
              rel="noreferrer"
            >
              Read Docs
            </a>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="footer">
        <div className="footer__inner">
          <div>
            <div className="footer__brand">
              <img src="/crypfinance-logo.png" alt="CrypFinance" />
              <span>CrypFinance</span>
            </div>
            <p className="footer__desc">
              The next-generation decentralized exchange. Trade, earn, and build
              on the future of open finance.
            </p>
          </div>

          <div>
            <h4 className="footer__col-title">Product</h4>
            <ul className="footer__links">
              <li><a href="#exchange" onClick={openExchange}>Exchange</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#how">How It Works</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer__col-title">Resources</h4>
            <ul className="footer__links">
              <li><a href="https://docs.crypfinance.com" target="_blank" rel="noreferrer">Documentation</a></li>
              <li><a href="https://github.com/crypfinance" target="_blank" rel="noreferrer">GitHub</a></li>
              <li><a href="#networks">Networks</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer__col-title">Community</h4>
            <ul className="footer__links">
              <li><a href="https://twitter.com/crypfinance" target="_blank" rel="noreferrer">Twitter</a></li>
              <li><a href="https://discord.gg/crypfinance" target="_blank" rel="noreferrer">Discord</a></li>
              <li><a href="https://t.me/crypfinance" target="_blank" rel="noreferrer">Telegram</a></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span className="footer__copyright">
            © {new Date().getFullYear()} CrypFinance. All rights reserved.
          </span>
          <div className="footer__socials">
            <a href="https://twitter.com/crypfinance" className="footer__social" target="_blank" rel="noreferrer" aria-label="Twitter">𝕏</a>
            <a href="https://discord.gg/crypfinance" className="footer__social" target="_blank" rel="noreferrer" aria-label="Discord">◆</a>
            <a href="https://t.me/crypfinance" className="footer__social" target="_blank" rel="noreferrer" aria-label="Telegram">✈</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
