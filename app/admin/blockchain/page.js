'use client';
import { useState, useEffect, useRef } from 'react';
import { Shield, Hash, CheckCircle, Clock, RefreshCw, Search, Sparkles, Link } from 'lucide-react';
import Modal from '@/components/Modal';
import AIAdvisor from '@/components/AIAdvisor';
import { groqChat } from '@/lib/groqClient';

const generateHash = () => Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
const generateBlock = (index, prevHash) => ({
  index,
  hash: generateHash(),
  prevHash: prevHash || generateHash(),
  timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
  transactions: Math.floor(Math.random() * 8) + 1,
  energyKwh: (Math.random() * 50 + 5).toFixed(2),
  validator: `NODE-${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`,
  status: 'Verified',
  merkleRoot: generateHash().slice(0, 32),
});

const INITIAL_BLOCKS = Array.from({ length: 8 }, (_, i) => generateBlock(1000 + i, i > 0 ? null : '0'.repeat(64)));

export default function BlockchainLedger() {
  const [blocks, setBlocks] = useState(INITIAL_BLOCKS);
  const [search, setSearch] = useState('');
  const [verifyModal, setVerifyModal] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [liveMode, setLiveMode] = useState(true);
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (liveMode) {
      intervalRef.current = setInterval(() => {
        setBlocks(prev => {
          const latest = prev[prev.length - 1];
          const newBlock = generateBlock(latest.index + 1, latest.hash);
          return [...prev.slice(-19), newBlock];
        });
      }, 4000);
    }
    return () => clearInterval(intervalRef.current);
  }, [liveMode]);

  const verifyTransaction = async (block) => {
    setVerifyModal(block);
    setVerifyResult(null);
    setVerifying(true);
    // Simulate cryptographic verification
    await new Promise(r => setTimeout(r, 1500));
    const valid = Math.random() > 0.05; // 95% valid
    setVerifyResult({ valid, block, checkedAt: new Date().toISOString(), signature: generateHash().slice(0, 32), consensusNodes: Math.floor(Math.random() * 5) + 15 });
    setVerifying(false);
  };

  const getAIInsights = async () => {
    setAiLoading(true);
    try {
      const totalEnergy = blocks.reduce((s, b) => s + parseFloat(b.energyKwh), 0);
      const totalTx = blocks.reduce((s, b) => s + b.transactions, 0);
      const reply = await groqChat({
        messages: [{ role: 'user', content: `Analyze this blockchain energy ledger data and provide insights on transaction patterns, energy trading efficiency, and security: Total blocks: ${blocks.length}, Total transactions: ${totalTx}, Total energy traded: ${totalEnergy.toFixed(2)} kWh, All blocks verified. Latest block: #${blocks[blocks.length - 1]?.index}` }],
        mode: 'analytics'
      });
      setAiInsight(reply || 'No insights available.');
    } catch (err) { setAiInsight(`Error: ${err.message}`); } finally { setAiLoading(false); }
  };

  const filtered = blocks.filter(b => b.hash.includes(search) || b.validator.includes(search) || String(b.index).includes(search));
  const totalEnergy = blocks.reduce((s, b) => s + parseFloat(b.energyKwh), 0);
  const totalTx = blocks.reduce((s, b) => s + b.transactions, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Blockchain Energy Ledger</h1>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>Immutable energy transaction records</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={getAIInsights} disabled={aiLoading} style={{ padding: '0.6rem 1.2rem', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={16} />{aiLoading ? 'Analyzing...' : 'AI Insights'}</button>
          <button onClick={() => setLiveMode(!liveMode)} style={{ padding: '0.6rem 1.2rem', background: liveMode ? '#DCFCE7' : '#F1F5F9', color: liveMode ? '#16A34A' : '#374151', border: `1.5px solid ${liveMode ? '#BBF7D0' : '#E2E8F0'}`, borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: liveMode ? '#22C55E' : '#94A3B8', animation: liveMode ? 'pulse 2s infinite' : 'none' }} />
            {liveMode ? 'Live' : 'Paused'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Blocks', value: blocks.length, color: '#3B82F6', icon: Link },
          { label: 'Transactions', value: totalTx, color: '#22C55E', icon: CheckCircle },
          { label: 'Energy Traded', value: `${totalEnergy.toFixed(1)} kWh`, color: '#F59E0B', icon: Shield },
          { label: 'Latest Block', value: `#${blocks[blocks.length - 1]?.index}`, color: '#8B5CF6', icon: Hash },
        ].map(m => (
          <div key={m.label} style={{ background: '#fff', padding: '1.25rem', borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><m.icon size={22} color={m.color} /></div>
            <div><div style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>{m.label}</div><div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>{m.value}</div></div>
          </div>
        ))}
      </div>

      {aiInsight && (
        <div style={{ background: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)', border: '1px solid #DDD6FE', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Sparkles size={16} color="#7C3AED" /><span style={{ fontWeight: 700, color: '#7C3AED', fontSize: '0.875rem' }}>AI Blockchain Analysis</span></div>
          <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiInsight}</p>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by block #, hash, or validator..." style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: 10, border: '1.5px solid #E2E8F0', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: '#0F172A', background: '#F8FAFC', boxSizing: 'border-box' }} />
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              {['Block #', 'Hash', 'Transactions', 'Energy (kWh)', 'Validator', 'Timestamp', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice().reverse().map(block => (
              <tr key={block.index} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '1rem', fontWeight: 800, color: '#0F172A', fontSize: '0.875rem' }}>#{block.index}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748B', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{block.hash}</div>
                </td>
                <td style={{ padding: '1rem', fontWeight: 700, color: '#0F172A' }}>{block.transactions}</td>
                <td style={{ padding: '1rem', fontWeight: 700, color: '#22C55E' }}>{block.energyKwh}</td>
                <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>{block.validator}</td>
                <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#64748B' }}>{new Date(block.timestamp).toLocaleTimeString()}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}><CheckCircle size={12} />Verified</span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <button onClick={() => verifyTransaction(block)} style={{ padding: '0.4rem 0.9rem', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><Shield size={13} />Verify</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!verifyModal} onClose={() => { setVerifyModal(null); setVerifyResult(null); }} title={`Verify Block #${verifyModal?.index}`} width={520}>
        {verifyModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {verifying ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <RefreshCw size={32} color="#3B82F6" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                <div style={{ fontWeight: 600, color: '#374151' }}>Verifying cryptographic signature...</div>
                <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: 4 }}>Checking consensus across nodes</div>
              </div>
            ) : verifyResult ? (
              <>
                <div style={{ padding: '1.25rem', background: verifyResult.valid ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${verifyResult.valid ? '#BBF7D0' : '#FECACA'}`, borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>{verifyResult.valid ? '✅' : '❌'}</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: verifyResult.valid ? '#16A34A' : '#EF4444' }}>{verifyResult.valid ? 'Block Verified' : 'Verification Failed'}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 4 }}>{verifyResult.consensusNodes} consensus nodes confirmed</div>
                </div>
                {[['Block Index', `#${verifyResult.block.index}`], ['Hash', verifyResult.block.hash.slice(0, 32) + '...'], ['Merkle Root', verifyResult.block.merkleRoot], ['Signature', verifyResult.signature], ['Verified At', new Date(verifyResult.checkedAt).toLocaleString()], ['Transactions', verifyResult.block.transactions], ['Energy', `${verifyResult.block.energyKwh} kWh`]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: 10 }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>{k}</span>
                    <span style={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 700, fontFamily: k === 'Hash' || k === 'Signature' || k === 'Merkle Root' ? 'monospace' : 'inherit', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                  </div>
                ))}
              </>
            ) : null}
          </div>
        )}
      </Modal>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      <AIAdvisor mode="admin" title="Blockchain AI Advisor" context={`Ledger: ${blocks.length} blocks, ${totalTx} transactions, ${totalEnergy.toFixed(1)} kWh energy traded`} />
    </div>
  );
}
