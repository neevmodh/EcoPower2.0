import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Check, X, Shield, Zap, Battery, Cpu, Activity, Bot, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';

const PlanActionModal = ({ plan, currentPlan, actionType, isOpen, onClose }) => {
    const { currentUser, setCsvData } = useApp();
    const [isAnnual, setIsAnnual] = useState(false);

    // Form State for initial subscribe
    const [address, setAddress] = useState(currentUser?.address || '');
    const [consumption, setConsumption] = useState('');
    const [roofArea, setRoofArea] = useState(currentUser?.roofArea || '');
    const [date, setDate] = useState('');
    const [timeSlot, setTimeSlot] = useState('');
    const [agreed, setAgreed] = useState(false);

    // Cancellation State
    const [cancelText, setCancelText] = useState('');

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Min date: 7 days from today
    const minDate = format(addDays(new Date(), 7), 'yyyy-MM-dd');

    if (!isOpen || !plan) return null;

    const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;

    // Proration Math (Mocked logic for 30-day billing cycle starting on 1st)
    const today = new Date();
    const daysInMonth = 30;
    const daysRemaining = daysInMonth - (today.getDate() % daysInMonth);
    const oldPrice = parseFloat(currentPlan?.monthlyPrice || 0);
    const newPrice = parseFloat(plan.monthlyPrice || 0);
    const priceDiff = newPrice - oldPrice;
    const unusedCredit = ((oldPrice / daysInMonth) * daysRemaining).toFixed(2);
    const proratedUpgradeCost = ((newPrice / daysInMonth) * daysRemaining - parseFloat(unusedCredit)).toFixed(2);

    const validate = () => {
        const newErrors = {};
        if (actionType === 'subscribe') {
            if (!address.trim()) newErrors.address = 'Service Address is required';
            if (!consumption) newErrors.consumption = 'Average consumption is required';
            if (!roofArea) newErrors.roofArea = 'Roof Area is required';
            if (!date) newErrors.date = 'Installation Date is required';
            if (!timeSlot) newErrors.timeSlot = 'Time Slot is required';
            if (!agreed) newErrors.agreed = 'You must agree to the Terms of Service';
        }
        if (actionType === 'cancel') {
            if (cancelText !== 'CANCEL') newErrors.cancelText = 'Type CANCEL exactly to confirm';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirm = (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);

        setTimeout(() => {
            if (actionType === 'cancel') {
                // Generate automated cancel ticket
                const nextId = `TCK-${Math.floor(8000 + Math.random() * 1000)}`;
                const newTicket = {
                    id: nextId,
                    userId: currentUser.id,
                    type: 'Cancellation',
                    title: 'Subscription Cancellation Request',
                    description: `User requested to cancel their ${currentPlan.name} plan.`,
                    priority: 'High',
                    status: 'Open',
                    createdAt: new Date().toISOString()
                };
                setCsvData(prev => ({
                    ...prev,
                    tickets: [newTicket, ...(prev.tickets || [])]
                }));
                window.dispatchEvent(new CustomEvent('eco-toast', {
                    detail: { message: 'Cancellation requested. Support ticket created.', type: 'info', duration: 4000 }
                }));
            } else {
                // Upgrade/Downgrade/Subscribe
                setCsvData(prev => ({
                    ...prev,
                    users: prev.users.map(u =>
                        u.id === currentUser.id
                            ? { ...u, plan: plan.name, planId: plan.id, roofArea, address, solarKw: plan.solarKw, batteryKwh: plan.batteryKwh }
                            : u
                    ),
                    subscriptions: [
                        {
                            id: `SUB-${Date.now()}`,
                            userId: currentUser.id,
                            planId: plan.id,
                            planName: plan.name,
                            startDate: new Date().toISOString().split('T')[0],
                            endDate: '2026-12-31',
                            status: 'Active'
                        },
                        ...(prev.subscriptions || []).map(sub => sub.userId === currentUser.id ? { ...sub, status: 'Canceled', endDate: new Date().toISOString().split('T')[0] } : sub)
                    ]
                }));

                const actionString = actionType === 'subscribe' ? 'Confirmed' : actionType === 'upgrade' ? 'Upgraded' : 'Downgraded';
                window.dispatchEvent(new CustomEvent('eco-toast', {
                    detail: { message: `Subscription ${actionString}: ${plan.name} 🎉`, type: 'success', duration: 5000 }
                }));
            }

            setIsSubmitting(false);
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in custom-scrollbar">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-[#0a0f0d] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

                <div className={`p-6 border-b border-white/5 flex justify-between items-start ${actionType === 'cancel' ? 'bg-red-500/10' : actionType === 'downgrade' ? 'bg-orange-500/10' : 'bg-[#00C864]/10'}`}>
                    <div>
                        <h2 className="text-2xl font-syne font-bold text-white mb-1">
                            {actionType === 'upgrade' && `Upgrade to ${plan.name}`}
                            {actionType === 'downgrade' && `Downgrade to ${plan.name}`}
                            {actionType === 'subscribe' && `Subscribe to ${plan.name}`}
                            {actionType === 'cancel' && `Cancel Subscription`}
                        </h2>
                        <p className="text-sm text-gray-400">
                            {actionType === 'upgrade' && 'Unlock more power instantly.'}
                            {actionType === 'downgrade' && 'Changes take effect next billing cycle.'}
                            {actionType === 'cancel' && 'We are sorry to see you go.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">

                    {actionType !== 'cancel' && (
                        <div className="mb-6 p-4 rounded-xl border border-white/10 bg-[#0d1512] flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Target Plan</div>
                                <div className="text-lg font-bold text-white">{plan.name} • {plan.solarKw}kW System</div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-ibm-plex font-bold text-white">₹{price}<span className="text-sm text-gray-500 font-jakarta font-normal">/{isAnnual ? 'yr' : 'mo'}</span></div>
                            </div>
                        </div>
                    )}

                    <form id="plan-action-form" onSubmit={handleConfirm} className="space-y-5">

                        {/* UPGRADE LOGIC */}
                        {actionType === 'upgrade' && (
                            <div className="space-y-4">
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-200">
                                    <div className="flex justify-between mb-2">
                                        <span>Current Plan:</span>
                                        <strong>{currentPlan?.name} (₹{oldPrice}/mo)</strong>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span>New Plan:</span>
                                        <strong>{plan.name} (₹{newPrice}/mo)</strong>
                                    </div>
                                    <div className="flex justify-between mb-4 pb-4 border-b border-blue-500/20">
                                        <span>Difference:</span>
                                        <strong className="text-blue-400">+₹{priceDiff} /mo</strong>
                                    </div>

                                    <h4 className="font-bold text-blue-400 mb-2">Immediate Proration (Remaining {daysRemaining} days)</h4>
                                    <div className="flex justify-between mb-1 text-xs">
                                        <span>Credit for unused current plan:</span>
                                        <span>-₹{unusedCredit}</span>
                                    </div>
                                    <div className="flex justify-between mb-1 text-xs">
                                        <span>Charge for new plan ({daysRemaining} days):</span>
                                        <span>+₹{((newPrice / daysInMonth) * daysRemaining).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between mt-2 pt-2 border-t border-blue-500/20 font-bold">
                                        <span>Pay Today To Upgrade:</span>
                                        <span className="text-xl">₹{Math.max(0, proratedUpgradeCost)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DOWNGRADE LOGIC */}
                        {actionType === 'downgrade' && (
                            <div className="space-y-4">
                                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                                        <div className="text-sm text-orange-200 leading-relaxed">
                                            <strong>Downgrade takes effect next billing cycle.</strong><br />
                                            Your current {currentPlan?.name} benefits will remain active until the end of the month (April 1st).
                                        </div>
                                    </div>
                                    <div className="bg-black/40 rounded p-3 text-xs text-gray-400 space-y-2 mt-4">
                                        <div className="font-bold text-gray-300 uppercase tracking-widest mb-1">Features that will be deactivated:</div>
                                        {currentPlan?.solarKw > plan.solarKw && <li>Hardware output capped to {plan.solarKw}kW</li>}
                                        {currentPlan?.smartLoad === 'true' && plan.smartLoad !== 'true' && <li>Smart Load Management</li>}
                                        {currentPlan?.aiAdvisor === 'true' && plan.aiAdvisor !== 'true' && <li>AI Energy Advisor access</li>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CANCEL LOGIC */}
                        {actionType === 'cancel' && (
                            <div className="space-y-4">
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-6 h-6 rounded bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                            <X className="w-4 h-4 text-red-500" />
                                        </div>
                                        <div className="text-sm text-red-200 leading-relaxed">
                                            <strong>Are you sure? Your service continues until end of billing cycle.</strong><br />
                                            Upon cancellation, grid synchronization stops, and your account reverts to read-only historical metrics.
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Type "CANCEL" to confirm</label>
                                    <input
                                        type="text" value={cancelText} onChange={e => { setCancelText(e.target.value); setErrors({ ...errors, cancelText: null }) }}
                                        className={`w-full bg-black/40 border ${errors.cancelText ? 'border-red-500/50' : 'border-red-500/20 focus:border-red-500/50'} rounded-xl px-4 py-3 text-sm text-white focus:outline-none`}
                                        placeholder="CANCEL"
                                    />
                                    {errors.cancelText && <p className="text-red-400 text-xs mt-1">{errors.cancelText}</p>}
                                </div>
                            </div>
                        )}

                        {/* INITIAL SUBSCRIBE LOGIC */}
                        {actionType === 'subscribe' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Service Address *</label>
                                    <textarea
                                        value={address} onChange={e => { setAddress(e.target.value); setErrors({ ...errors, address: null }) }}
                                        className={`w-full bg-black/40 border ${errors.address ? 'border-red-500/50' : 'border-white/10 focus:border-[#00C864]/50'} rounded-xl px-4 py-3 text-sm text-white focus:outline-none resize-none`}
                                        rows="2" placeholder="Full installation address"
                                    />
                                    {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Installation Date *</label>
                                    <input
                                        type="date" min={minDate} value={date} onChange={e => { setDate(e.target.value); setErrors({ ...errors, date: null }) }}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none [color-scheme:dark]"
                                    />
                                    {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Time Slot *</label>
                                    <select value={timeSlot} onChange={e => { setTimeSlot(e.target.value); setErrors({ ...errors, timeSlot: null }) }}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none">
                                        <option value="">Select...</option>
                                        <option value="Morning">Morning</option>
                                        <option value="Afternoon">Afternoon</option>
                                    </select>
                                    {errors.timeSlot && <p className="text-red-400 text-xs mt-1">{errors.timeSlot}</p>}
                                </div>
                                <div className="sm:col-span-2 mt-2">
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-4 cursor-pointer" onClick={() => setAgreed(!agreed)}>
                                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center ${agreed ? 'bg-[#00C864] border-[#00C864]' : 'border-gray-500'}`}>
                                            {agreed && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
                                        </div>
                                        <div className="text-sm text-gray-300">I agree to Terms of Service.</div>
                                    </div>
                                    {errors.agreed && <p className="text-red-400 text-xs">{errors.agreed}</p>}
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className="p-4 sm:px-6 border-t border-white/5 bg-[#050908] flex gap-3 justify-end">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-medium transition-colors">Cancel</button>
                    <button
                        form="plan-action-form" type="submit" disabled={isSubmitting}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-70 ${actionType === 'cancel' ? 'bg-red-500 hover:bg-red-400 text-white' : actionType === 'downgrade' ? 'bg-orange-500 hover:bg-orange-400 text-white' : 'bg-[#00C864] hover:bg-[#00FF85] text-black'}`}
                    >
                        {isSubmitting ? 'Processing...' : actionType.charAt(0).toUpperCase() + actionType.slice(1)}
                    </button>
                </div>
            </div>
        </div>
    );
};


const ServicesPage = () => {
    const { currentUser, csvData } = useApp();
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [modalConfig, setModalConfig] = useState(null); // { plan, actionType: 'upgrade'|'downgrade'|'subscribe'|'cancel' }

    const plans = csvData.plans || [];
    const activePlan = plans.find(p => p.id === currentUser?.planId) || plans[0];

    const getFeatureIcon = (feature) => {
        switch (feature) {
            case 'monitoring': return <Activity className="w-4 h-4" />;
            case 'gridSync': return <Unplug className="w-4 h-4" />;
            case 'prioritySupport': return <Shield className="w-4 h-4" />;
            case 'smartLoad': return <Cpu className="w-4 h-4" />;
            case 'aiAdvisor': return <Bot className="w-4 h-4" />;
            default: return <CheckCircle2 className="w-4 h-4" />;
        }
    };

    const userSubs = useMemo(() => {
        return (csvData.subscriptions || []).filter(s => s.userId === currentUser.id).sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    }, [csvData.subscriptions, currentUser.id]);

    return (
        <div className="space-y-10 animate-fade-in pb-10">

            {/* ─── SECTION 1: Current Plan Banner ────────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#009448] to-[#0d1512] rounded-2xl border border-[#00C864]/30 shadow-[0_0_30px_rgba(0,200,100,0.1)] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CiAgPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+Cjwvc3ZnPg==')] opacity-50 pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#00FF85]/20 blur-[80px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 flex items-center gap-5 focus:outline-none">
                    <div className="w-16 h-16 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center p-3 shadow-xl">
                        <Zap className="w-full h-full text-[#00FF85]" fill="currentColor" />
                    </div>
                    <div>
                        <div className="text-white/70 font-semibold tracking-wider text-xs uppercase mb-1">Your Current Plan</div>
                        <h2 className="text-3xl md:text-4xl font-syne font-bold text-white tracking-tight">{currentUser?.plan || 'Unknown Plan'}</h2>
                    </div>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-5">
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Monthly Cost</p>
                        <p className="text-xl font-ibm-plex font-bold text-white">₹{activePlan?.monthlyPrice || '0'}</p>
                    </div>
                    <div className="hidden sm:block w-px h-10 bg-white/10"></div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Next Renewal</p>
                        <p className="text-sm font-medium text-white">15 April, 2026</p>
                    </div>
                    <button className="sm:ml-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-colors">
                        Manage
                    </button>
                </div>
            </div>

            {/* ─── SECTION 2: Plan Cards ─────────────────────────────────────────── */}
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h3 className="text-2xl font-syne font-bold text-white">Service Tiers</h3>
                        <p className="text-sm text-gray-400 mt-1">Scale your solar setup instantly. Zero hardware costs.</p>
                    </div>

                    {/* Billing Toggle */}
                    <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-[#00C864] text-black shadow-lg shadow-[#00C864]/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('annual')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'annual' ? 'bg-[#00C864] text-black shadow-lg shadow-[#00C864]/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            Annual (Save 20%)
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                        const isCurrent = currentUser?.planId === plan.id;
                        const isUpgrade = parseFloat(plan.monthlyPrice) > parseFloat(activePlan?.monthlyPrice || 0);
                        const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

                        return (
                            <div key={plan.id} className={`flex flex-col bg-[#0d1512] rounded-2xl border transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 ${isCurrent ? 'border-[#00C864] shadow-[0_0_20px_rgba(0,200,100,0.15)] ring-1 ring-[#00C864]/50' : 'border-white/10 hover:border-white/30'}`}>

                                {plan.recommended === 'true' && !isCurrent && (
                                    <div className="absolute top-0 inset-x-0 h-1 bg-blue-500"></div>
                                )}
                                {plan.recommended === 'true' && !isCurrent && (
                                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold tracking-wider uppercase border border-blue-500/20">Recommended</div>
                                )}
                                {isCurrent && (
                                    <div className="absolute top-0 inset-x-0 h-1 bg-[#00C864]"></div>
                                )}

                                <div className="p-6 md:p-8 flex-1">
                                    <h4 className="text-xl font-syne font-bold text-white mb-2">{plan.name}</h4>
                                    <p className="text-xs text-gray-400 h-8 leading-relaxed">{plan.description}</p>

                                    <div className="my-6">
                                        <span className="text-4xl font-ibm-plex font-bold text-white">₹{price}</span>
                                        <span className="text-sm text-gray-500 ml-1 font-jakarta font-medium">/{billingCycle === 'annual' ? 'yr' : 'mo'}</span>
                                    </div>

                                    <ul className="space-y-4 mb-8">
                                        <li className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-[#00C864]/20 flex items-center justify-center flex-shrink-0 mt-0.5"><Zap className="w-3 h-3 text-[#00FF85]" fill="currentColor" /></div>
                                            <div><span className="text-sm font-semibold text-white">{plan.solarKw}kW</span> <span className="text-sm text-gray-400">Solar Array</span></div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5"><Battery className="w-3 h-3 text-purple-400" fill="currentColor" /></div>
                                            <div><span className="text-sm font-semibold text-white">{plan.batteryKwh}kWh</span> <span className="text-sm text-gray-400">Battery Back-up</span></div>
                                        </li>

                                        <div className="h-px bg-white/5 my-4"></div>

                                        <li className="flex items-center gap-3">
                                            <CheckCircle2 className="w-4 h-4 text-[#00FF85] flex-shrink-0" />
                                            <span className="text-sm text-gray-300">Basic Monitoring App</span>
                                        </li>
                                        <li className="flex items-center gap-3 opacity-90">
                                            <CheckCircle2 className="w-4 h-4 text-[#00FF85] flex-shrink-0" />
                                            <span className="text-sm text-gray-300">Grid Synchronization</span>
                                        </li>
                                        <li className={`flex items-center gap-3 ${plan.smartLoad === 'true' ? '' : 'opacity-40 grayscale'}`}>
                                            {plan.smartLoad === 'true' ? <CheckCircle2 className="w-4 h-4 text-[#00FF85] flex-shrink-0" /> : <X className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                                            <span className="text-sm text-gray-300">Smart Load Management</span>
                                        </li>
                                        <li className={`flex items-center gap-3 ${plan.aiAdvisor === 'true' ? '' : 'opacity-40 grayscale'}`}>
                                            {plan.aiAdvisor === 'true' ? <CheckCircle2 className="w-4 h-4 text-[#00FF85] flex-shrink-0" /> : <X className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                                            <span className="text-sm text-gray-300 gap-1 flex items-center">AI Advisor <Bot className="w-3.5 h-3.5 text-purple-400" /></span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="p-6 pt-0 mt-auto">
                                    {isCurrent ? (
                                        <div className="w-full py-3 rounded-xl bg-[#00C864]/10 border border-[#00C864]/30 text-[#00FF85] font-semibold text-sm text-center flex items-center justify-center gap-2">
                                            <Check className="w-4 h-4" /> Current Plan
                                        </div>
                                    ) : isUpgrade ? (
                                        <button onClick={() => setModalConfig({ plan, actionType: 'upgrade' })} className="w-full py-3 rounded-xl bg-[#00C864] hover:bg-[#00FF85] text-black font-bold text-sm transition-colors flex items-center justify-center gap-2 group/btn">
                                            Upgrade to {plan.name.split(' ')[1]} <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    ) : (
                                        <button onClick={() => setModalConfig({ plan, actionType: 'downgrade' })} className="w-full py-3 rounded-xl border border-white/20 hover:bg-white/5 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2">
                                            Downgrade
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── SECTION 3: Plan Comparison Table ──────────────────────────────── */}
            <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-6 md:p-8 overflow-hidden">
                <h3 className="text-xl font-syne font-bold text-white mb-6">Compare Plans</h3>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-[#050908] border-b border-white/10 uppercase tracking-wider text-[10px] text-gray-400 font-semibold sticky top-0">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-lg">Feature</th>
                                {plans.map(p => (
                                    <th key={p.id} className="px-6 py-4 text-center">
                                        <div className={`font-bold ${p.id === currentUser?.planId ? 'text-[#00FF85]' : 'text-white'}`}>{p.name}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-medium text-gray-300">

                            {/* Hardware */}
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">Solar Array Size</td>
                                {plans.map(p => <td key={p.id} className="px-6 py-4 text-center font-ibm-plex">{p.solarKw} kW</td>)}
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">Battery Storage</td>
                                {plans.map(p => <td key={p.id} className="px-6 py-4 text-center font-ibm-plex">{p.batteryKwh} kWh</td>)}
                            </tr>

                            {/* Features */}
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">Monitoring App</td>
                                {plans.map(p => (
                                    <td key={p.id} className="px-6 py-4 text-center text-xs">
                                        <span className={`px-2 py-1 rounded-md ${p.monitoring === 'basic' ? 'bg-gray-500/20 text-gray-300' : p.monitoring === 'advanced' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                            <span className="capitalize">{p.monitoring}</span>
                                        </span>
                                    </td>
                                ))}
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">Grid Synchronization</td>
                                {plans.map(p => (
                                    <td key={p.id} className="px-6 py-4 text-center">
                                        {p.gridSync === 'true' ? <Check className="w-5 h-5 text-[#00C864] mx-auto" /> : <X className="w-5 h-5 text-gray-600 mx-auto" />}
                                    </td>
                                ))}
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">Priority Support (24/7)</td>
                                {plans.map(p => (
                                    <td key={p.id} className="px-6 py-4 text-center">
                                        {p.prioritySupport === 'true' ? <Check className="w-5 h-5 text-[#00C864] mx-auto" /> : <X className="w-5 h-5 text-gray-600 mx-auto" />}
                                    </td>
                                ))}
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">Smart Load Mgmt. IoT</td>
                                {plans.map(p => (
                                    <td key={p.id} className="px-6 py-4 text-center">
                                        {p.smartLoad === 'true' ? <Check className="w-5 h-5 text-[#00C864] mx-auto" /> : <X className="w-5 h-5 text-gray-600 mx-auto" />}
                                    </td>
                                ))}
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">AI Energy Advisor</td>
                                {plans.map(p => (
                                    <td key={p.id} className="px-6 py-4 text-center">
                                        {p.aiAdvisor === 'true' ? <Check className="w-5 h-5 text-[#00C864] mx-auto" /> : <X className="w-5 h-5 text-gray-600 mx-auto" />}
                                    </td>
                                ))}
                            </tr>

                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── SECTION 4: Subscription History Timeline ──────────────────────── */}
            <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-6 md:p-8">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h3 className="text-xl font-syne font-bold text-white mb-1">My Subscription History</h3>
                        <p className="text-xs text-gray-400">Past revisions, downgrades, and upgrades over time.</p>
                    </div>
                </div>

                <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:left-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#00C864] before:via-white/20 before:to-transparent">
                    {userSubs.length === 0 && (
                        <div className="text-gray-500 text-sm py-8"><Zap className="w-5 h-5 mb-2 opacity-50" /> No subscription history found.</div>
                    )}
                    {userSubs.map((sub, idx) => {
                        const isLatest = idx === 0;
                        const isCanceled = sub.status === 'Canceled';
                        return (
                            <div key={sub.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                <div className={`flex items-center justify-center w-6 h-6 rounded-full border-4 border-[#0d1512] absolute left-[-29px] md:left-1/2 md:-translate-x-1/2 shadow flex-shrink-0 ${isLatest && !isCanceled ? 'bg-[#00C864]' : isCanceled ? 'bg-red-500' : 'bg-gray-500'}`}></div>

                                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] bg-white/5 border border-white/10 p-5 rounded-2xl shadow-lg transition-transform hover:-translate-y-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-white">{sub.planName}</h4>
                                        <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${isLatest && !isCanceled ? 'bg-[#00C864]/10 text-[#00FF85] border-[#00C864]/30' : isCanceled ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-white/10 text-gray-400 border-white/20'}`}>
                                            {sub.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Started on <span className="text-gray-300 font-ibm-plex">{sub.startDate}</span>
                                        {sub.endDate && sub.endDate !== '2026-12-31' && (
                                            <span className="block mt-1 text-gray-500">Ended on <span className="font-ibm-plex">{sub.endDate}</span></span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-10 pt-6 border-t border-white/5 mx-auto">
                    <button onClick={() => setModalConfig({ plan: activePlan, actionType: 'cancel' })} className="px-4 py-2 hover:bg-red-500/10 text-red-400 text-xs font-bold rounded-lg border border-transparent hover:border-red-500/30 transition-colors">
                        Cancel Subscription
                    </button>
                </div>
            </div>

            <PlanActionModal
                isOpen={!!modalConfig}
                plan={modalConfig?.plan}
                currentPlan={activePlan}
                actionType={modalConfig?.actionType}
                onClose={() => setModalConfig(null)}
            />

        </div>
    );
};

export default ServicesPage;
