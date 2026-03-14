import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { generateInvoicePDF } from '../../services/invoiceService';
import {
    CreditCard, Smartphone, Building2, Wallet, ShieldCheck, ArrowRight,
    CheckCircle2, XCircle, AlertCircle, Download, Eye, Check, X
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

// ─── UTILS ────────────────────────────────────────────────────────────────
const luhnCheck = (val) => {
    let sum = 0;
    for (let i = 0; i < val.length; i++) {
        let intVal = parseInt(val.substr(i, 1));
        if (i % 2 === 0) {
            intVal *= 2;
            if (intVal > 9) intVal = 1 + (intVal % 10);
        }
        sum += intVal;
    }
    return (sum % 10) === 0;
};

const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
        parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
        return parts.join(' ');
    } else {
        return value;
    }
};

// ─── PAYMENT MODAL COMPONENT ──────────────────────────────────────────────
const PaymentModal = ({ invoice, isOpen, onClose, onSuccess }) => {
    const [tab, setTab] = useState('card');
    const [step, setStep] = useState('input'); // input, processing, success, fail

    // Card state
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardError, setCardError] = useState('');

    // UPI State
    const [upiId, setUpiId] = useState('');
    const [upiTimer, setUpiTimer] = useState(299);

    // Progress
    const [progress, setProgress] = useState(0);
    const [failReason, setFailReason] = useState('');
    const [txId, setTxId] = useState('');

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setStep('input');
            setTab('card');
            setCardNumber(''); setCardName(''); setExpiry(''); setCvv(''); setCardError('');
            setUpiId(''); setUpiTimer(299); setProgress(0);
            setTxId(`ECO-${Math.floor(10000000 + Math.random() * 90000000)}`);
        }
    }, [isOpen]);

    // UPI Timer
    useEffect(() => {
        let interval;
        if (isOpen && tab === 'upi' && step === 'input' && upiTimer > 0) {
            interval = setInterval(() => setUpiTimer(t => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isOpen, tab, step, upiTimer]);

    if (!isOpen || !invoice) return null;

    const handlePay = (method, isFail = false) => {
        if (tab === 'card') {
            const rawNum = cardNumber.replace(/\s/g, '');
            if (rawNum.length !== 16 || !luhnCheck(rawNum)) {
                setCardError('Invalid card number');
                return;
            }
            if (!cardName || !expiry || !cvv) {
                setCardError('Please fill all fields');
                return;
            }
            setCardError('');
        }

        if (tab === 'upi') {
            if (upiId === 'fail@razorpay') isFail = true;
        }

        setStep('processing');
        setProgress(0);

        // Simulate 2.5s processing
        const interval = setInterval(() => setProgress(p => p + 4), 100);
        setTimeout(() => {
            clearInterval(interval);
            if (isFail) {
                setFailReason('Payment declined by your bank or invalid credentials.');
                setStep('fail');
            } else {
                setStep('success');
                onSuccess(method, txId);
            }
        }, 2500);
    };

    const amount = parseFloat(invoice.totalAmount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in custom-scrollbar">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => step === 'input' && onClose()} />

            <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col text-gray-800 font-jakarta">

                {/* Header - Razorpay styled */}
                <div className="bg-[#02040A] p-5 flex items-center justify-between text-white border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-[#338bf3] to-[#2b76cd] flex items-center justify-center shadow-lg">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold tracking-wide text-sm">Secure Checkout</h3>
                            <p className="text-xs text-blue-300 opacity-80 font-ibm-plex">{txId}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-400 mb-0.5 uppercase tracking-wider">Amount Payable</div>
                        <div className="text-xl font-bold font-ibm-plex text-[#00C864]">{amount}</div>
                    </div>
                </div>

                {/* ─── INPUT STEP ─── */}
                {step === 'input' && (
                    <div className="flex flex-col md:flex-row h-[420px]">

                        {/* Left Tabs */}
                        <div className="w-full md:w-48 bg-gray-50 border-r border-gray-200 p-2 space-y-1">
                            <button onClick={() => setTab('card')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${tab === 'card' ? 'bg-white shadow-sm border border-gray-200 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
                                <CreditCard className="w-4 h-4" /> Card
                            </button>
                            <button onClick={() => setTab('net')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${tab === 'net' ? 'bg-white shadow-sm border border-gray-200 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
                                <Building2 className="w-4 h-4" /> Net Banking
                            </button>
                            <button onClick={() => setTab('upi')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${tab === 'upi' ? 'bg-white shadow-sm border border-gray-200 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
                                <Smartphone className="w-4 h-4" /> UPI
                            </button>
                            <button onClick={() => setTab('wallet')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${tab === 'wallet' ? 'bg-white shadow-sm border border-gray-200 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
                                <Wallet className="w-4 h-4" /> Wallet
                            </button>
                        </div>

                        {/* Right Content */}
                        <div className="flex-1 p-6 overflow-y-auto">

                            {tab === 'card' && (
                                <div className="space-y-4 animate-fade-in">
                                    <h4 className="font-semibold text-gray-800 mb-4">Pay via Credit / Debit Card</h4>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Card Number</label>
                                        <input
                                            type="text" maxLength="19" value={cardNumber}
                                            onChange={e => { setCardNumber(formatCardNumber(e.target.value)); setCardError(''); }}
                                            className={`w-full border ${cardError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-ibm-plex tracking-widest`}
                                            placeholder="YYYY YYYY YYYY YYYY"
                                        />
                                        {cardError && <p className="text-red-500 text-xs mt-1">{cardError}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Name on Card</label>
                                        <input
                                            type="text" value={cardName} onChange={e => setCardName(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Expiry</label>
                                            <input
                                                type="text" maxLength="5" value={expiry} onChange={e => setExpiry(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-ibm-plex"
                                                placeholder="MM/YY"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">CVV</label>
                                            <input
                                                type="password" maxLength="4" value={cvv} onChange={e => setCvv(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-ibm-plex tracking-[0.3em]"
                                                placeholder="•••"
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 p-2.5 rounded text-[10px] text-blue-600 font-medium">
                                        Test Card: <span className="font-ibm-plex">4111 1111 1111 1111</span> / 12/28 / 123
                                    </div>
                                    <button onClick={() => handlePay('Card')} className="w-full mt-2 py-3 bg-[#338bf3] hover:bg-[#2b76cd] text-white font-bold rounded-lg shadow-md transition-colors flex justify-center items-center gap-2">
                                        Pay {amount} <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {tab === 'net' && (
                                <div className="space-y-4 animate-fade-in flex flex-col h-full">
                                    <h4 className="font-semibold text-gray-800 mb-2">Select Bank</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'Yes Bank'].map(bank => (
                                            <button key={bank} onClick={() => handlePay(`NetBanking - ${bank}`)} className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center gap-2 transition-colors">
                                                <Building2 className="w-6 h-6 text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-600 text-center">{bank}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Other Banks</label>
                                        <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
                                            <option>Select Bank...</option>
                                            <option>Bank of Baroda</option>
                                            <option>Punjab National Bank</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {tab === 'upi' && (
                                <div className="space-y-4 animate-fade-in flex flex-col items-center justify-center h-full">
                                    {/* SVG QR Placeholder */}
                                    <div className="p-2 border-2 border-dashed border-gray-300 rounded-xl relative group">
                                        <svg className="w-32 h-32 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M3 3h8v8H3zm2 2v4h4V5zm8-2h8v8h-8zm2 2v4h4V5zM3 13h8v8H3zm2 2v4h4v-4zm13-2h2v2h-2zm-2 2h2v2h-2zm2 2h2v2h-2zm-4 0h2v2h-2zm2 2h2v2h-2zm-4 0h2v4h-2v-4z" />
                                        </svg>
                                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                            <span className="text-xs font-bold text-gray-800 bg-white px-2 py-1 rounded shadow">Scan to Pay</span>
                                        </div>
                                    </div>
                                    <div className="font-ibm-plex text-sm text-red-500 font-bold mb-2">
                                        QR expires in {Math.floor(upiTimer / 60)}:{(upiTimer % 60).toString().padStart(2, '0')}
                                    </div>

                                    <div className="w-full flex items-center gap-4 my-2">
                                        <div className="flex-1 h-px bg-gray-200"></div>
                                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">OR</span>
                                        <div className="flex-1 h-px bg-gray-200"></div>
                                    </div>

                                    <div className="w-full">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Enter UPI ID</label>
                                        <input
                                            type="text" value={upiId} onChange={e => setUpiId(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                                            placeholder="username@bank"
                                        />
                                        <div className="bg-gray-50 p-2 mt-2 rounded text-[10px] text-gray-500 flex justify-between">
                                            <span>success: <code className="text-green-600">success@razorpay</code></span>
                                            <span>fail: <code className="text-red-500">fail@razorpay</code></span>
                                        </div>
                                        <button onClick={() => handlePay('UPI')} disabled={!upiId} className="w-full mt-3 py-3 bg-[#338bf3] hover:bg-[#2b76cd] text-white font-bold rounded-lg shadow-md transition-colors disabled:opacity-50">
                                            Verify & Pay
                                        </button>
                                    </div>
                                </div>
                            )}

                            {tab === 'wallet' && (
                                <div className="space-y-4 animate-fade-in flex flex-col h-full">
                                    <h4 className="font-semibold text-gray-800 mb-2">Pay via Wallet</h4>
                                    <div className="grid grid-cols-2 flex-1 gap-3 content-start">
                                        {['Paytm', 'PhonePe', 'Google Pay', 'Amazon Pay'].map(wallet => (
                                            <button key={wallet} onClick={() => handlePay(`Wallet - ${wallet}`)} className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex items-center gap-3 transition-colors text-left">
                                                <Wallet className="w-5 h-5 text-gray-400" />
                                                <span className="text-sm font-bold text-gray-700">{wallet}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-auto bg-green-50 p-3 rounded-lg border border-green-200 flex justify-between items-center">
                                        <span className="text-xs text-green-700 font-bold">Simulated Balance:</span>
                                        <span className="text-sm font-ibm-plex font-bold text-green-700">₹1,247.80</span>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {/* ─── PROCESSING STEP ─── */}
                {step === 'processing' && (
                    <div className="h-[420px] flex flex-col items-center justify-center p-8 bg-[#02040A] text-white">
                        <div className="w-16 h-16 border-4 border-gray-700 border-t-[#00C864] rounded-full animate-spin mb-6"></div>
                        <h3 className="text-xl font-bold font-syne tracking-wide mb-2">Processing Payment...</h3>
                        <p className="text-sm text-gray-400 mb-8">Please do not close or refresh this window.</p>
                        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-[#00C864] transition-all duration-100 ease-linear" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                {/* ─── SUCCESS STEP ─── */}
                {step === 'success' && (
                    <div className="h-[420px] flex flex-col items-center justify-center p-8 bg-white relative overflow-hidden">
                        {/* CSS Confetti would go here if implemented, using simple emojis for now */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-4xl opacity-20 user-select-none animate-[pulse_1s_ease-in-out_infinite]">
                            ✨ 🎉 ⚡ 🎊
                        </div>

                        <div className="w-20 h-20 rounded-full bg-green-100 border-4 border-green-500 flex items-center justify-center mb-6 relative z-10 animate-scale-in">
                            <Check className="w-10 h-10 text-green-600 stroke-[3]" />
                        </div>

                        <h3 className="text-2xl font-bold text-gray-800 mb-1 z-10">Payment Successful!</h3>
                        <p className="text-sm text-gray-500 mb-6 font-ibm-plex z-10">{txId}</p>

                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 w-full max-w-sm mb-6 z-10">
                            <div className="flex justify-between text-sm mb-2"><span className="text-gray-500">Amount</span><span className="font-bold font-ibm-plex text-gray-800">{amount}</span></div>
                            <div className="flex justify-between text-sm mb-2"><span className="text-gray-500">Method</span><span className="font-bold text-gray-800 capitalize">{tab}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Time</span><span className="font-medium text-gray-800">{new Date().toLocaleTimeString()}</span></div>
                        </div>

                        <div className="flex gap-4 w-full max-w-sm z-10">
                            <button onClick={onClose} className="flex-1 py-3 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                                Back to Billing
                            </button>
                            <button className="flex-1 py-3 bg-[#00C864] rounded-lg text-sm font-bold text-black shadow-lg hover:bg-[#00a855] transition-colors flex items-center justify-center gap-2">
                                <Download className="w-4 h-4" /> Receipt
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── FAIL STEP ─── */}
                {step === 'fail' && (
                    <div className="h-[420px] flex flex-col items-center justify-center p-8 bg-white">
                        <div className="w-20 h-20 rounded-full bg-red-50 border-4 border-red-500 flex items-center justify-center mb-6 animate-shake">
                            <X className="w-10 h-10 text-red-600 stroke-[3]" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h3>
                        <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded mb-8 text-center">{failReason}</p>

                        <div className="flex gap-4 w-full max-w-sm">
                            <button onClick={onClose} className="flex-1 py-3 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={() => { setStep('input'); setUpiId(''); }} className="flex-1 py-3 bg-red-600 rounded-lg text-sm font-bold text-white shadow-lg hover:bg-red-700 transition-colors">
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};


// ─── MAIN COMPONENT ───────────────────────────────────────────────────────
const BillingPage = () => {
    const { currentUser, csvData, refreshData, setCsvData } = useApp();
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Get all user invoices, sorted by date DESC
    const userInvoices = useMemo(() => {
        return csvData.invoices
            .filter(i => i.userId === currentUser.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [csvData.invoices, currentUser.id]);

    // Find latest pending
    const latestPending = useMemo(() => {
        return userInvoices.find(i => i.status === 'pending');
    }, [userInvoices]);

    const dueDate = latestPending ? new Date(latestPending.dueDate) : null;
    const daysLeft = dueDate ? differenceInDays(dueDate, new Date()) : 0;
    const isOverdue = daysLeft < 0;

    const handlePaymentSuccess = (method, txId) => {
        if (!latestPending) return;

        const updatedInv = {
            ...latestPending,
            status: 'paid',
            paidDate: new Date().toISOString().split('T')[0],
            paymentMethod: method
        };

        // Update context
        setCsvData(prev => ({
            ...prev,
            invoices: prev.invoices.map(i => i.id === updatedInv.id ? updatedInv : i),
            transactions: [
                { id: `TXN_${Date.now()}`, invoiceId: updatedInv.id, userId: currentUser.id, amount: updatedInv.totalAmount, date: updatedInv.paidDate, method, txId, status: 'success' },
                ...prev.transactions
            ]
        }));

        // Generate PDF receipt after short delay
        setTimeout(() => {
            generateInvoicePDF(updatedInv, currentUser);
        }, 1000);

        // Simulated refresh purely to update memory maps via backend simulation if needed
        // refreshData();
        window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: `Payment for ${updatedInv.id} successful.`, type: 'success' } }));
    };

    const handleExportCSV = () => {
        if (userInvoices.length === 0) return;
        const header = "id,period,totalAmount,status,paidDate\n";
        const rows = userInvoices.map(i => `${i.id},${i.period},${i.totalAmount},${i.status},${i.paidDate||''}`).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: `Exported invoices successfully`, type: 'success' } }));
    };

    return (
        <div className="space-y-10 animate-fade-in pb-10">

            {/* ─── SECTION 1: Current Bill Card ──────────────────────────────────── */}
            <div>
                <h2 className="text-2xl font-syne font-bold text-white mb-6">Current Bill</h2>

                {latestPending ? (
                    <div className="bg-[#0d1512] border border-[#00C864]/30 rounded-2xl p-6 lg:p-8 relative overflow-hidden flex flex-col lg:flex-row gap-8 shadow-[0_0_20px_rgba(0,200,100,0.05)]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-3xl pointer-events-none rounded-full"></div>

                        {/* Left Info */}
                        <div className="flex-1 relative z-10 border-r border-white/10 lg:pr-8 border-b lg:border-b-0 pb-6 lg:pb-0">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="px-2 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold uppercase rounded">Pending</span>
                                    <span className="text-gray-400 text-sm font-medium">{latestPending.period}</span>
                                </div>
                                <div className="text-gray-400 font-ibm-plex text-sm">#{latestPending.id}</div>
                            </div>

                            <h3 className="text-5xl font-ibm-plex font-bold text-white tracking-tight mb-2">
                                ₹{parseFloat(latestPending.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </h3>

                            <div className={`inline-flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-lg mt-2 ${isOverdue ? 'bg-red-500/20 text-red-500 border border-red-500/30' : daysLeft <= 5 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/10 text-gray-300'}`}>
                                <AlertCircle className="w-4 h-4" />
                                {isOverdue ? `Overdue by ${Math.abs(daysLeft)} days` : `Due in ${daysLeft} days (${latestPending.dueDate})`}
                            </div>

                            <div className="mt-8">
                                <button
                                    onClick={() => setSelectedInvoice(latestPending)}
                                    className="w-full lg:w-auto px-8 py-3 bg-[#00C864] hover:bg-[#00FF85] text-black font-bold rounded-xl shadow-lg shadow-[#00C864]/20 transition-all flex items-center justify-center gap-2 font-ibm-plex text-lg"
                                >
                                    Pay Now <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Right Itemized */}
                        <div className="flex-1 relative z-10 font-ibm-plex text-sm flex flex-col justify-center">
                            <h4 className="text-gray-400 mb-4 font-jakarta font-semibold uppercase tracking-wider text-xs">Itemized Breakdown</h4>

                            {/* Simulated Breakdown for UI */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-gray-300 border-b border-white/5 pb-2">
                                    <span>Solar Service Fee (Base)</span>
                                    <span>₹2,999.00</span>
                                </div>
                                <div className="flex justify-between text-blue-400 border-b border-white/5 pb-2">
                                    <span>Grid Import (10.2 kWh × ₹8.00)</span>
                                    <span>₹81.60</span>
                                </div>
                                <div className="flex justify-between text-[#00FF85] border-b border-white/5 pb-2">
                                    <span>Grid Export Credit (45.1 kWh × ₹5.00)</span>
                                    <span>-₹225.50</span>
                                </div>
                                <div className="flex justify-between text-gray-300 pt-2">
                                    <span>Sub-total</span>
                                    <span>₹2,855.10</span>
                                </div>
                                <div className="flex justify-between text-gray-400 text-xs">
                                    <span>Service Tax (18%)</span>
                                    <span>₹514.00</span>
                                </div>

                                <div className="flex justify-between text-white font-bold text-lg pt-4 border-t border-dashed border-white/20 mt-4">
                                    <span>TOTAL PAYABLE</span>
                                    <span>₹{parseFloat(latestPending.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#00C864]/10 border border-[#00C864]/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(0,200,100,0.1)] py-16">
                        <div className="w-20 h-20 bg-[#00C864] rounded-full flex items-center justify-center mb-6 shadow-xl shadow-[#00C864]/30">
                            <CheckCircle2 className="w-12 h-12 text-black" />
                        </div>
                        <h3 className="text-3xl font-syne font-bold text-white mb-2">You're all paid up!</h3>
                        <p className="text-gray-400 max-w-sm">No pending invoices found for your account. Enjoy your clean, self-sufficient energy.</p>
                    </div>
                )}
            </div>

            {/* ─── NEW SECTION: ROI & Financial Forecasting ───────────────────────── */}
            <div className="bg-[#050908] border border-blue-500/30 rounded-2xl overflow-hidden relative shadow-[0_0_40px_rgba(59,130,246,0.05)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-[#00C864]"></div>
                
                <div className="p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5">
                    <div>
                        <h3 className="text-xl font-syne font-bold text-white flex items-center gap-2 mb-2">
                            <Building2 className="w-5 h-5 text-blue-400" /> CapEx vs OpEx ROI Calculator
                        </h3>
                        <p className="text-sm text-gray-400">Estimate how long a new solar array takes to pay for itself vs paying the grid (OpEx).</p>
                    </div>
                </div>

                <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Interactive Controls */}
                    <div className="space-y-6">
                        <div className="bg-black/40 border border-white/5 rounded-xl p-5 space-y-5">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">New System Size</label>
                                    <span className="text-[#00FF85] font-ibm-plex font-bold">50 kW</span>
                                </div>
                                <input type="range" min="10" max="500" defaultValue="50" className="w-full accent-[#00C864]" />
                            </div>
                            
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Upfront CapEx (₹)</label>
                                    <span className="text-white font-ibm-plex font-bold">₹22,50,000</span>
                                </div>
                                <input type="range" min="500000" max="10000000" step="100000" defaultValue="2250000" className="w-full accent-blue-500" />
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Monthly Grid Bill (OpEx)</label>
                                    <span className="text-orange-400 font-ibm-plex font-bold">₹45,000 / mo</span>
                                </div>
                                <input type="range" min="5000" max="500000" step="5000" defaultValue="45000" className="w-full accent-orange-500" />
                            </div>
                        </div>
                        
                        <div className="flex gap-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <Info className="w-5 h-5 text-blue-400 shrink-0" />
                            <p className="text-xs text-blue-300 leading-relaxed">
                                By switching 50kW to solar, your monthly OpEx drops entirely. The system pays for itself in just under 4.1 years. After that, energy is virtually free.
                            </p>
                        </div>
                    </div>

                    {/* Right: Visualization & Metrics */}
                    <div className="flex flex-col justify-center">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-[#0d1512] border border-white/5 rounded-xl p-4">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Payback Period</span>
                                <div className="text-3xl font-ibm-plex font-bold text-[#00FF85]">4.1<span className="text-sm font-normal text-gray-400 ml-1">Years</span></div>
                            </div>
                            <div className="bg-[#0d1512] border border-white/5 rounded-xl p-4">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">10-Year Savings</span>
                                <div className="text-3xl font-ibm-plex font-bold text-white">₹31.5<span className="text-sm font-normal text-gray-400 ml-1">Lakhs</span></div>
                            </div>
                        </div>

                        {/* Visual graph mockup */}
                        <div className="bg-[#0d1512] border border-white/5 rounded-xl p-5 h-48 relative flex items-end">
                            <div className="absolute top-4 left-4 text-xs text-gray-500 uppercase font-bold tracking-widest">10 Year Projection</div>
                            
                            {/* Grid OpEx Line (Steep upward) */}
                            <div className="absolute bottom-0 left-0 w-full h-[80%] border-t-2 border-dashed border-orange-500/50 pointer-events-none transform -skew-y-12 origin-bottom-left"></div>
                            
                            {/* Solar CapEx + Maintenance Line (Flat/Slow upward) */}
                            <div className="absolute bottom-6 left-0 w-full h-[40%] border-t-2 border-[#00C864] pointer-events-none transform -skew-y-3 origin-bottom-left shadow-[0_-5px_15px_rgba(0,200,100,0.2)]"></div>
                            
                            {/* Break-even point marker */}
                            <div className="absolute bottom-[35%] left-[41%] w-3 h-3 bg-white rounded-full border-2 border-blue-500 shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10"></div>
                            <div className="absolute bottom-[42%] left-[38%] text-[10px] bg-blue-500 text-white px-2 py-1 rounded font-bold uppercase tracking-widest z-10">Break Even</div>
                            
                            {/* Legend */}
                            <div className="absolute bottom-4 right-4 flex flex-col gap-1 text-[10px] uppercase font-bold text-gray-400 text-right">
                                <span className="flex items-center gap-1 justify-end"><span className="w-2 h-2 rounded-full bg-orange-500 text-right"></span> Grid OpEx</span>
                                <span className="flex items-center gap-1 justify-end"><span className="w-2 h-2 rounded-full bg-[#00C864] text-right"></span> Solar CapEx</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── SECTION 2: Invoice History ────────────────────────────────────── */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-syne font-bold text-white">Invoice History</h2>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors"
                    >
                        <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export CSV</span>
                    </button>
                </div>

                <div className="bg-[#0d1512] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-[#050908] border-b border-white/10 uppercase tracking-wider text-[10px] text-gray-400 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Invoice No</th>
                                    <th className="px-6 py-4">Period</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Paid On</th>
                                    <th className="px-6 py-4">Method</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-medium text-gray-300">
                                {userInvoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-ibm-plex text-gray-400">{inv.id}</td>
                                        <td className="px-6 py-4">{inv.period}</td>
                                        <td className="px-6 py-4 font-ibm-plex">₹{parseFloat(inv.totalAmount).toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            {inv.status === 'paid' ? (
                                                <span className="px-2 py-1 bg-[#00C864]/10 text-[#00FF85] border border-[#00C864]/20 rounded text-xs font-bold uppercase flex items-center gap-1 w-fit">
                                                    <Check className="w-3 h-3" /> Paid
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded text-xs font-bold uppercase w-fit">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 font-ibm-plex text-xs">{inv.paidDate || '-'}</td>
                                        <td className="px-6 py-4 text-gray-400 capitalize text-xs">{inv.paymentMethod || '-'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => generateInvoicePDF(inv, currentUser)}
                                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                title="Download PDF"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {userInvoices.length === 0 && (
                                    <tr><td colSpan="7" className="text-center py-8 text-gray-500">No invoices found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <PaymentModal
                isOpen={!!selectedInvoice}
                invoice={selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
                onSuccess={handlePaymentSuccess}
            />

        </div>
    );
};

export default BillingPage;
