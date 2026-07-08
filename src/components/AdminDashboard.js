import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ethers } from 'ethers';
import { loadBalances } from '../store/interactions';

const AdminDashboard = () => {
  const [feePercent, setFeePercent] = useState('');
  const [feeAccount, setFeeAccount] = useState('');
  const [currentFeePercent, setCurrentFeePercent] = useState('0');
  const [currentFeeAccount, setCurrentFeeAccount] = useState('0x0000000000000000000000000000000000000000');
  const [contractOwner, setContractOwner] = useState('0x0000000000000000000000000000000000000000');
  const [orderCount, setOrderCount] = useState('0');
  const [btfContractBalance, setBtfContractBalance] = useState('0');
  const [wethContractBalance, setWethContractBalance] = useState('0');
  const [faucetAddress, setFaucetAddress] = useState('');
  const [faucetAmount, setFaucetAmount] = useState('5000');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const dispatch = useDispatch();

  const provider = useSelector(state => state.provider.connection);
  const account = useSelector(state => state.provider.account);
  const chainId = useSelector(state => state.provider.chainId);

  const exchange = useSelector(state => state.exchange.contract);
  const tokens = useSelector(state => state.tokens.contracts);

  const isOwner = account && contractOwner && account.toLowerCase() === contractOwner.toLowerCase();

  const loadAdminData = async () => {
    if (!exchange || !tokens || tokens.length < 2) return;

    try {
      // 1. Get owner
      const ownerAddr = await exchange.owner();
      setContractOwner(ownerAddr);

      // 2. Get fee account
      const feeAcc = await exchange.feeAccount();
      setCurrentFeeAccount(feeAcc);

      // 3. Get fee percent
      const feePerc = await exchange.feePercent();
      setCurrentFeePercent(feePerc.toString());

      // 4. Get order count
      const oCount = await exchange.orderCount();
      setOrderCount(oCount.toString());

      // 5. Get contract balances
      const btfToken = tokens[0];
      const wethToken = tokens[1];

      const btfBal = await btfToken.balanceOf(exchange.target);
      setBtfContractBalance(ethers.formatUnits(btfBal, 18));

      const wethBal = await wethToken.balanceOf(exchange.target);
      setWethContractBalance(ethers.formatUnits(wethBal, 18));

    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
    }
  };

  useEffect(() => {
    loadAdminData();
    if (account && !faucetAddress) {
      setFaucetAddress(account);
    }
  }, [exchange, tokens, account]);

  const handleUpdateFeePercent = async (e) => {
    e.preventDefault();
    if (!exchange || !provider) return;
    if (!feePercent || isNaN(feePercent)) {
      setErrorMsg("Please enter a valid fee percent.");
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const signer = await provider.getSigner();
      const tx = await exchange.connect(signer).setFeePercent(feePercent);
      setSuccessMsg("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      setSuccessMsg(`Fee percent updated to ${feePercent}%!`);
      setFeePercent('');
      await loadAdminData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.reason || err.message || "Transaction failed. Are you the contract owner?");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFeeAccount = async (e) => {
    e.preventDefault();
    if (!exchange || !provider) return;
    if (!ethers.isAddress(feeAccount)) {
      setErrorMsg("Please enter a valid Ethereum address.");
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const signer = await provider.getSigner();
      const tx = await exchange.connect(signer).setFeeAccount(feeAccount);
      setSuccessMsg("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      setSuccessMsg(`Fee account updated to ${feeAccount}!`);
      setFeeAccount('');
      await loadAdminData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.reason || err.message || "Transaction failed. Are you the contract owner?");
    } finally {
      setLoading(false);
    }
  };

  const handleFaucet = async (e, tokenIndex) => {
    e.preventDefault();
    if (!tokens || tokens.length === 0 || !provider) return;
    if (!ethers.isAddress(faucetAddress)) {
      setErrorMsg("Please enter a valid recipient address.");
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const selectedToken = tokens[tokenIndex];
      const symbol = tokenIndex === 0 ? "BTF" : "WETH";
      const signer = await provider.getSigner();

      // In local hardhat node, we can transfer from our own balance if we are the deployer
      // Deployer starts with 21M BTF and 100M WETH
      const amountToTransfer = ethers.parseUnits(faucetAmount, 18);
      
      setSuccessMsg(`Transferring ${faucetAmount} ${symbol} from connected wallet...`);
      const tx = await selectedToken.connect(signer).transfer(faucetAddress, amountToTransfer);
      await tx.wait();

      setSuccessMsg(`Transferred ${faucetAmount} ${symbol} successfully to ${faucetAddress}!`);
      
      // Reload balances
      if (account) {
        await loadBalances(exchange, tokens, account, dispatch);
      }
      await loadAdminData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.reason || err.message || "Faucet transfer failed. Make sure you have enough token balance in your connected wallet to distribute.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container" style={{ padding: '30px', color: '#fff' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '24px', color: 'var(--gold-400)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        Admin Dashboard
      </h2>

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '30px' }}>
        
        {/* Contract Info & Stats */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '16px', color: '#fff' }}>Contract Stats</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Exchange Address:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{exchange ? exchange.target : 'Not Loaded'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Contract Owner:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: isOwner ? 'var(--green-400)' : '#fff' }}>
                {contractOwner} {isOwner && '(You)'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Fee Account:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{currentFeeAccount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Current Fee:</span>
              <span>{parseFloat(currentFeePercent) / 2}% (maker/taker combined)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Orders Made:</span>
              <span>{orderCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>BTF Balance in Contract:</span>
              <span>{parseFloat(btfContractBalance).toLocaleString()} BTF</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>WETH Balance in Contract:</span>
              <span>{parseFloat(wethContractBalance).toLocaleString()} WETH</span>
            </div>
          </div>
        </div>

        {/* Edit Parameters Form */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '16px', color: '#fff' }}>Modify Settings</h3>
          
          {/* Fee Percent Form */}
          <form onSubmit={handleUpdateFeePercent} style={{ marginBottom: '20px' }}>
            <div className="input-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <label htmlFor="feePercent" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>New Fee Percent (1 = 0.5% combined fee)</label>
              <input
                id="feePercent"
                type="number"
                placeholder="e.g. 1"
                value={feePercent}
                onChange={(e) => setFeePercent(e.target.value)}
                disabled={loading || !isOwner}
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !isOwner}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: isOwner ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                color: isOwner ? '#fff' : 'var(--text-muted)',
                fontWeight: '600',
                cursor: (loading || !isOwner) ? 'not-allowed' : 'pointer',
                border: 'none'
              }}
            >
              Update Fee Percent
            </button>
          </form>

          {/* Fee Account Form */}
          <form onSubmit={handleUpdateFeeAccount}>
            <div className="input-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <label htmlFor="feeAccount" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>New Fee Account Address</label>
              <input
                id="feeAccount"
                type="text"
                placeholder="0x..."
                value={feeAccount}
                onChange={(e) => setFeeAccount(e.target.value)}
                disabled={loading || !isOwner}
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none', fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !isOwner}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: isOwner ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                color: isOwner ? '#fff' : 'var(--text-muted)',
                fontWeight: '600',
                cursor: (loading || !isOwner) ? 'not-allowed' : 'pointer',
                border: 'none'
              }}
            >
              Update Fee Account
            </button>
          </form>

          {!isOwner && (
            <p style={{ fontSize: '0.78rem', color: 'var(--gold-400)', marginTop: '12px', textAlign: 'center' }}>
              ⚠️ You must connect the Contract Owner account ({contractOwner.slice(0,6)}...) to modify settings.
            </p>
          )}
        </div>

      </div>

      {/* Faucet Utility */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px', color: 'var(--gold-400)' }}>Token Faucet</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Distribute test tokens to any address. Note: This transfers tokens from your active wallet balance (ideal if you are connected as the Deployer who holds the initial supply).
        </p>

        <form style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Recipient Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={faucetAddress}
              onChange={(e) => setFaucetAddress(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none', fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Amount to Send</label>
            <input
              type="number"
              placeholder="5000"
              value={faucetAmount}
              onChange={(e) => setFaucetAmount(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={(e) => handleFaucet(e, 0)}
              disabled={loading}
              style={{
                flex: '1',
                padding: '12px',
                borderRadius: '8px',
                background: 'var(--gradient-gold)',
                color: '#050A08',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none'
              }}
            >
              Get BTF
            </button>
            
            <button
              onClick={(e) => handleFaucet(e, 1)}
              disabled={loading}
              style={{
                flex: '1',
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.07)',
                color: '#fff',
                fontWeight: '700',
                border: '1px solid var(--border)',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Get WETH
            </button>
          </div>
        </form>

        {/* Localhost Help */}
        {chainId === 31337n && (
          <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(201, 168, 76, 0.05)', border: '1px solid rgba(201, 168, 76, 0.15)', borderRadius: '8px', fontSize: '0.78rem' }}>
            <span style={{ fontWeight: '600', color: 'var(--gold-400)' }}>Local Host Testing Tip:</span> To distribute tokens, connect MetaMask to Localhost 8545 and import the Hardhat Account #0 private key: 
            <code style={{ display: 'block', padding: '6px', background: '#000', margin: '6px 0', borderRadius: '4px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
              0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
            </code>
            This account holds the initial 21,000,000 BTF and 100,000,000 WETH and can distribute them to your other test wallets!
          </div>
        )}
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div style={{ color: '#ff4d4d', background: 'rgba(255,77,77,0.1)', padding: '12px', borderRadius: '12px', fontSize: '0.88rem', border: '1px solid rgba(255,77,77,0.2)', marginBottom: '10px' }}>
          ⚠️ {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ color: 'var(--green-400)', background: 'rgba(74,232,138,0.1)', padding: '12px', borderRadius: '12px', fontSize: '0.88rem', border: '1px solid rgba(74,232,138,0.2)', marginBottom: '10px' }}>
          ✓ {successMsg}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
