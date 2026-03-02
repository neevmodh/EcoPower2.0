import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { updateInCSV, appendToCSV } from '../../services/csvService';
import {
    LifeBuoy, Plus, AlertTriangle, Activity, Settings, PhoneCall,
    MessageSquare, Clock, CheckCircle2, X, Zap
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const ISSUE_TYPES = [
    { id: 'Power Cut', icon: <Activity className="w-4 h-4 text-red-400" /> },
    { id: 'Low Voltage', icon: <AlertTriangle className="w-4 h-4 text-yellow-500" /> },
    { id: 'Meter Fault', icon: <Settings className="w-4 h-4 text-blue-400" /> },
    { id: 'Billing Issue', icon: <MessageSquare className="w-4 h-4 text-purple-400" /> },
    { id: 'Inverter Problem', icon: <Activity className="w-4 h-4 text-orange-400" /> },
    { id: 'Maintenance', icon: <Settings className="w-4 h-4 text-gray-400" /> },
    { id: 'Other', icon: <LifeBuoy className="w-4 h-4 text-white" /> }
];

const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
        case 'high': return 'bg-red-500/10 text-red-400 border-red-500/30';
        case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
        case 'low': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
        default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
};

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'open': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
        case 'in progress': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
        case 'resolved': return 'bg-green-500/10 text-[#00C864] border-[#00C864]/30';
        case 'closed': return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
        default: return 'bg-white/5 text-gray-300 border-white/10';
    }
};


// ─── TICKET MODAL COMPONENT (FOR VIEW / EDIT) ────────────────────────────────
const TicketDetailModal = ({ isOpen, onClose, ticket, onUpdateStatus }) => {
    const [replyText, setReplyText] = useState('');

    if (!isOpen || !ticket) return null;

    const handleReply = async () => {
        if (!replyText.trim()) return;
        const currentDesc = ticket.description;
        const stamp = `\n\n--- Reply on ${format(new Date(), 'dd MMM HH:mm')} ---\n${replyText}`;

        await onUpdateStatus(ticket.id, { description: currentDesc + stamp, status: 'Open' }); // Reset to open if user replies
        setReplyText('');
        onClose();
        window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Reply added successfully.', type: 'success' } }));
    };

    const handleEscalate = () => {
        onUpdateStatus(ticket.id, { priority: 'High' });
        onClose();
        window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Ticket escalated to High Priority.', type: 'warning' } }));
    };

    const isResolved = ticket.status.toLowerCase() === 'resolved' || ticket.status.toLowerCase() === 'closed';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in custom-scrollbar">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-[#0d1512] border border-white/10 rounded-2xl shadow-2xl flex flex-col p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">

                <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-ibm-plex font-bold text-white">{ticket.title}</h2>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(ticket.status)}`}>{ticket.status}</span>
                        </div>
                        <div className="text-xs text-gray-400 font-ibm-plex">{ticket.id} • Assigned to: {ticket.assignedTo || 'Unassigned'}</div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
                </div>

                <div className="grid grid-cols-2 bg-black/40 rounded-xl border border-white/5 mb-6 p-4 gap-4">
                    <div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Type</span>
                        <div className="text-sm text-gray-200 mt-1">{ticket.issueType}</div>
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Priority</span>
                        <div className={`text-sm mt-1 inline-flex px-2 py-0.5 rounded border font-bold ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</div>
                    </div>
                </div>

                <div className="mb-6 bg-white/5 rounded-xl p-5 border border-white/10 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {ticket.description}
                </div>

                {/* Timeline Mock */}
                <div className="mb-8">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Activity Timeline</h4>
                    <div className="space-y-4 pl-4 border-l-2 border-[#00C864]/30 relative">
                        <div className="relative">
                            <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#00C864]"></span>
                            <div className="text-xs text-gray-400">{format(parseISO(ticket.createdAt), 'dd MMM yyyy HH:mm')}</div>
                            <div className="text-sm text-gray-200 font-medium">Ticket Created</div>
                        </div>
                        {!isResolved && ticket.assignedTo && (
                            <div className="relative">
                                <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-yellow-500"></span>
                                <div className="text-xs text-gray-400">{format(new Date(), 'dd MMM yyyy')}</div>
                                <div className="text-sm text-gray-200 font-medium">Investigating - Assigned to {ticket.assignedTo}</div>
                            </div>
                        )}
                        {isResolved && (
                            <div className="relative">
                                <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-gray-500"></span>
                                <div className="text-xs text-gray-400">{ticket.updatedAt ? format(parseISO(ticket.updatedAt), 'dd MMM yyyy') : ''}</div>
                                <div className="text-sm text-gray-200 font-medium">Ticket Resolved</div>
                            </div>
                        )}
                    </div>
                </div>

                {!isResolved ? (
                    <div className="mt-auto">
                        <textarea
                            value={replyText} onChange={e => setReplyText(e.target.value)}
                            placeholder="Add a reply or extra information..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white mb-4 outline-none focus:border-[#00C864]/50 resize-y min-h-[100px]"
                        />
                        <div className="flex justify-between items-center gap-4">
                            <div className="flex gap-2">
                                <button onClick={handleEscalate} disabled={ticket.priority === 'High'} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 transition-colors disabled:opacity-50">Escalate Priority</button>
                                <button onClick={() => onUpdateStatus(ticket.id, { status: 'Resolved' })} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/10 transition-colors">Mark Resolved</button>
                            </div>
                            <button onClick={handleReply} disabled={!replyText.trim()} className="px-6 py-2 bg-[#00C864] hover:bg-[#00FF85] text-black text-xs font-bold rounded-lg transition-colors disabled:opacity-50">Post Reply</button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-auto p-4 bg-[#00C864]/10 border border-[#00C864]/30 rounded-xl text-center text-sm text-[#00C864] font-medium flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> This ticket is closed. If you still have issues, please open a new ticket.
                    </div>
                )}
            </div>
        </div>
    );
};


// ─── NEW TICKET MODAL ────────────────────────────────────────────────────────
const NewTicketModal = ({ isOpen, onClose, initialForm = {} }) => {
    const { currentUser, refreshData } = useApp();
    const [formData, setFormData] = useState({
        issueType: initialForm.type || 'Other',
        title: '',
        description: '',
        priority: initialForm.priority || 'Low'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update initial form values if they change (from quick actions)
    // Need custom reset when initialForm props change while modal is open (rare but safe to cover)
    React.useEffect(() => {
        if (isOpen) {
            setFormData({
                issueType: initialForm.type || 'Other',
                title: '',
                description: '',
                priority: initialForm.priority || 'Low'
            });
        }
    }, [isOpen, initialForm]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.description.length < 20) {
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Description must be at least 20 characters.', type: 'warning' } }));
            return;
        }

        setIsSubmitting(true);
        const newId = `#TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const newTicket = {
            id: newId,
            userId: currentUser.id,
            ticketNo: newId,
            title: formData.title,
            description: formData.description,
            issueType: formData.issueType,
            priority: formData.priority,
            status: 'Open',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            await appendToCSV('tickets.csv', newTicket);

            // Also post a notification if valid context 
            await appendToCSV('notifications.csv', {
                id: `NOTIF_${Date.now()}`, userId: currentUser.id,
                message: `Ticket ${newId} raised successfully`, type: 'info',
                date: new Date().toISOString(), isRead: 'false'
            });

            refreshData();
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: `Ticket ${newId} submitted. We'll respond within 4 hours.`, type: 'success' } }));
            onClose();
        } catch (err) {
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Failed to create ticket.', type: 'error' } }));
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in custom-scrollbar">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-[#0d1512] border border-white/10 rounded-2xl shadow-2xl flex flex-col p-6">
                <h2 className="text-xl font-syne font-bold text-white mb-6">Raise New Ticket</h2>
                <form onSubmit={handleSubmit} className="space-y-4">

                    <div>
                        <label className="block text-xs text-gray-400 mb-1 font-bold tracking-widest uppercase">Issue Category</label>
                        <div className="relative">
                            <select value={formData.issueType} onChange={e => setFormData({ ...formData, issueType: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-3 py-3 text-white outline-none focus:border-[#00C864]/50 appearance-none">
                                {ISSUE_TYPES.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
                            </select>
                            <div className="absolute left-3 top-3.5 pointer-events-none">
                                {ISSUE_TYPES.find(t => t.id === formData.issueType)?.icon || <LifeBuoy className="w-4 h-4 text-white" />}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1 font-bold tracking-widest uppercase">Title</label>
                        <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#00C864]/50" placeholder="Brief subject of the issue" />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1 font-bold tracking-widest uppercase flex justify-between">
                            Description
                            <span className={formData.description.length < 20 ? 'text-red-400' : 'text-[#00C864]'}>{formData.description.length} chars</span>
                        </label>
                        <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#00C864]/50 min-h-[120px] resize-y" placeholder="Please provide detailed information about what went wrong..." />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-2 font-bold tracking-widest uppercase">Priority</label>
                        <div className="flex gap-2">
                            {['Low', 'Medium', 'High'].map(p => (
                                <button
                                    key={p} type="button" onClick={() => setFormData({ ...formData, priority: p })}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${formData.priority === p ? getPriorityColor(p) : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 border-t border-white/5 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-white/10 rounded-lg text-sm font-bold text-gray-300 hover:bg-white/5 transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-[#00C864] hover:bg-[#00FF85] rounded-lg text-sm font-bold text-black flex items-center gap-2">
                            {isSubmitting ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></span> : 'Submit Ticket'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
const SupportPage = () => {
    const { currentUser, csvData, refreshData } = useApp();

    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [quickActionInitial, setQuickActionInitial] = useState({});

    // Parse Tickets
    const userTickets = useMemo(() => {
        return csvData.tickets
            .filter(t => t.userId === currentUser.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [csvData.tickets, currentUser.id]);

    const stats = useMemo(() => {
        let open = 0; let inProg = 0; let resolved = 0;
        userTickets.forEach(t => {
            const s = t.status?.toLowerCase();
            if (s === 'open') open++;
            else if (s === 'in progress') inProg++;
            else if (s === 'resolved' || s === 'closed') resolved++;
        });
        return { total: userTickets.length, open, inProg, resolved };
    }, [userTickets]);

    const handleUpdateStatus = async (id, fields) => {
        try {
            await updateInCSV('tickets.csv', id, { ...fields, updatedAt: new Date().toISOString() });
            refreshData(); // Re-fetch context
        } catch (err) {
            console.error("Failed to upate ticket:", err);
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Error updating ticket status.', type: 'error' } }));
        }
    };

    const openQuickAction = (type, priority) => {
        setQuickActionInitial({ type, priority });
        setIsNewModalOpen(true);
    };

    // Keep selectedTicket updated if context refreshes by re-finding it
    React.useEffect(() => {
        if (selectedTicket) {
            const updated = userTickets.find(t => t.id === selectedTicket.id);
            if (updated) setSelectedTicket(updated);
        }
    }, [userTickets, selectedTicket]);

    return (
        <div className="space-y-8 animate-fade-in pb-10">

            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-syne font-bold text-white mb-2">Help & Support</h2>
                    <p className="text-sm text-gray-400">Manage your active service requests or report an outage.</p>
                </div>
                <button
                    onClick={() => openQuickAction('Other', 'Low')}
                    className="px-4 py-2 bg-[#00C864] hover:bg-[#00FF85] text-black text-sm font-bold rounded-lg shadow-lg shadow-[#00C864]/20 transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> New Ticket
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">

                {/* ─── LEFT COLUMN: TICKETS ────────────────────────────────────── */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-[#0d1512] border border-white/5 rounded-xl p-4 flex flex-col items-center">
                            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Total</span>
                            <span className="text-2xl font-ibm-plex font-bold text-white">{stats.total}</span>
                        </div>
                        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex flex-col items-center">
                            <span className="text-xs text-red-500/70 uppercase tracking-widest font-bold mb-1">Open</span>
                            <span className="text-2xl font-ibm-plex font-bold text-red-400">{stats.open}</span>
                        </div>
                        <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4 flex flex-col items-center">
                            <span className="text-xs text-yellow-500/70 uppercase tracking-widest font-bold mb-1">In Progress</span>
                            <span className="text-2xl font-ibm-plex font-bold text-yellow-400">{stats.inProg}</span>
                        </div>
                        <div className="bg-[#00C864]/5 border border-[#00C864]/10 rounded-xl p-4 flex flex-col items-center">
                            <span className="text-xs text-[#00C864]/70 uppercase tracking-widest font-bold mb-1">Resolved</span>
                            <span className="text-2xl font-ibm-plex font-bold text-[#00C864]">{stats.resolved}</span>
                        </div>
                    </div>

                    {/* Ticket List */}
                    <div className="flex flex-col gap-4">
                        {userTickets.length === 0 ? (
                            <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                                    <CheckCircle2 className="w-8 h-8 text-[#00C864]" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">No Active Tickets</h3>
                                <p className="text-sm text-gray-400">Everything looks good on our end. Need help?</p>
                            </div>
                        ) : (
                            userTickets.map(ticket => {
                                let borderColor = 'border-white/5 hover:border-white/20';
                                if (ticket.priority === 'High' && ticket.status !== 'Resolved') borderColor = 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]';

                                return (
                                    <div key={ticket.id} className={`bg-[#0d1512] border rounded-2xl p-5 transition-all ${borderColor} relative overflow-hidden group`}>

                                        {/* Priority color edge identifier */}
                                        <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${ticket.priority === 'High' ? 'bg-red-500' : ticket.priority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'} opacity-80`}></div>

                                        <div className="pl-3">
                                            {/* Header */}
                                            <div className="flex flex-wrap lg:flex-nowrap justify-between items-start gap-3 mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-ibm-plex font-bold text-white">{ticket.ticketNo || ticket.id}</span>
                                                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-300 flex items-center gap-1 font-semibold uppercase tracking-wider">
                                                        {ISSUE_TYPES.find(t => t.id === ticket.issueType)?.icon} {ticket.issueType}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest border ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest border ${getStatusColor(ticket.status)}`}>{ticket.status}</span>
                                                </div>
                                            </div>

                                            {/* Content preview */}
                                            <h4 className="font-bold text-gray-200 text-base mb-1">{ticket.title}</h4>
                                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">{ticket.description}</p>

                                            {/* Footer Actions */}
                                            <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-widest font-semibold border-t border-white/5 pt-3">
                                                <div className="flex items-center gap-4">
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(parseISO(ticket.createdAt), 'dd MMM')}</span>
                                                    {ticket.assignedTo && <span className="hidden sm:inline">Assigned: {ticket.assignedTo}</span>}
                                                </div>
                                                <div className="flex gap-2">
                                                    {ticket.status.toLowerCase() !== 'resolved' && ticket.status.toLowerCase() !== 'closed' && (
                                                        <button onClick={() => handleUpdateStatus(ticket.id, { status: 'Resolved' })} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors hidden sm:block">Resolve</button>
                                                    )}
                                                    <button onClick={() => setSelectedTicket(ticket)} className="px-3 py-1 bg-[#00C864]/10 hover:bg-[#00C864]/20 border border-[#00C864]/30 text-[#00C864] rounded transition-colors">View Details</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                </div>

                {/* ─── RIGHT COLUMN: QUICK ACTIONS ──────────────────────────────── */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    <div className="bg-[#050908] border border-[#00C864]/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(0,200,100,0.05)]">
                        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest flex items-center gap-2"><Zap className="w-4 h-4 text-[#00C864]" /> Quick Actions</h3>

                        <div className="space-y-3">
                            <button onClick={() => openQuickAction('Power Cut', 'High')} className="w-full flex items-center justify-between p-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-colors group text-left">
                                <span className="flex items-center gap-3 text-sm font-bold text-red-400"><Activity className="w-5 h-5" /> Report Outage</span>
                                <div className="bg-red-500/20 px-2 py-0.5 rounded text-[10px] text-red-500 uppercase">High Prio</div>
                            </button>

                            <button onClick={() => openQuickAction('Meter Fault', 'Medium')} className="w-full flex items-center justify-between p-3 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-xl transition-colors group text-left">
                                <span className="flex items-center gap-3 text-sm font-bold text-blue-400"><Settings className="w-5 h-5" /> Meter Issue</span>
                            </button>

                            <button onClick={() => openQuickAction('Maintenance', 'Low')} className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group text-left">
                                <span className="flex items-center gap-3 text-sm font-bold text-gray-300"><Clock className="w-5 h-5" /> Schedule Service</span>
                            </button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                            <p className="text-xs text-gray-400">Prefer speaking to a human? Our lines are open 24/7 for emergency dispatch.</p>
                            <div className="flex items-center justify-center gap-3 p-4 bg-black/40 border border-white/10 rounded-xl">
                                <PhoneCall className="w-5 h-5 text-[#00C864]" />
                                <span className="text-lg font-ibm-plex font-bold text-white tracking-widest">1800-ECO-0000</span>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            <NewTicketModal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} initialForm={quickActionInitial} />
            <TicketDetailModal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} ticket={selectedTicket} onUpdateStatus={handleUpdateStatus} />

        </div>
    );
};

export default SupportPage;
