import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Ticket, Search, CheckCircle2, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const AdminTickets = () => {
    const { csvData, updateTicket, showToast } = useApp();
    const [searchTerm, setSearchTerm] = useState('');

    const stats = useMemo(() => {
        let open = 0, progress = 0, resolved = 0;
        csvData.tickets.forEach(t => {
            if (t.status === 'open') open++;
            else if (t.status === 'in_progress') progress++;
            else if (t.status === 'resolved') resolved++;
        });
        return { total: csvData.tickets.length, open, progress, resolved };
    }, [csvData.tickets]);

    const filteredTickets = useMemo(() => {
        return csvData.tickets.filter(t =>
            t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.title.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [csvData.tickets, searchTerm]);

    const getPriorityColor = (p) => {
        if (p === 'High') return 'text-red-400 border-red-500/30 bg-red-500/10';
        if (p === 'Medium') return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
        return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    };

    const handleStatusChange = (id, newStatus) => {
        updateTicket(id, { status: newStatus, updatedAt: new Date().toISOString() });
        showToast(`Ticket ${id} marked as ${newStatus}`, 'success');
    };

    return (
        <div className="p-6 lg:p-8 space-y-6 animate-fade-in custom-scrollbar">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-syne font-bold text-white flex items-center gap-3">
                        <Ticket className="w-8 h-8 text-blue-500" /> Support Queue
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Platform-wide customer support and ticket triage.</p>
                </div>

                <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2 w-full md:w-64">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search tickets..." className="bg-transparent text-sm text-white outline-none placeholder:text-gray-500 w-full" />
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0c1020] border border-blue-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 blur-xl rounded-full"></div>
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-2 mb-2">Total Tickets</span>
                    <span className="text-3xl font-ibm-plex font-bold text-white">{stats.total}</span>
                </div>
                <div className="bg-[#0c1020] border border-red-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 blur-xl rounded-full"></div>
                    <span className="text-xs font-semibold text-red-400 flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4" /> Open</span>
                    <span className="text-3xl font-ibm-plex font-bold text-red-500">{stats.open}</span>
                </div>
                <div className="bg-[#0c1020] border border-yellow-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 blur-xl rounded-full"></div>
                    <span className="text-xs font-semibold text-yellow-400 flex items-center gap-2 mb-2"><Clock className="w-4 h-4" /> In Progress</span>
                    <span className="text-3xl font-ibm-plex font-bold text-yellow-500">{stats.progress}</span>
                </div>
                <div className="bg-[#0c1020] border border-[#00C864]/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#00C864]/10 blur-xl rounded-full"></div>
                    <span className="text-xs font-semibold text-[#00C864] flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4" /> Resolved</span>
                    <span className="text-3xl font-ibm-plex font-bold text-[#00FF85]">{stats.resolved}</span>
                </div>
            </div>

            {/* Tickets List */}
            <div className="space-y-4">
                {filteredTickets.map(ticket => (
                    <div key={ticket.id} className="bg-[#0c1020] border border-blue-500/20 rounded-2xl p-5 flex flex-col lg:flex-row justify-between gap-4 transition-all hover:bg-white/5 shadow-lg">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-sm font-ibm-plex text-white font-bold">{ticket.id}</span>
                                <span className="text-xs text-gray-500">|</span>
                                <span className="text-xs text-gray-400 uppercase tracking-widest">{ticket.userId}</span>
                                <span className="text-xs text-gray-500">|</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                                {ticket.status === 'open' && <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase">Open</span>}
                                {ticket.status === 'in_progress' && <span className="px-2 py-0.5 rounded bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold uppercase">In Progress</span>}
                                {ticket.status === 'resolved' && <span className="px-2 py-0.5 rounded bg-[#00C864]/20 border border-[#00C864]/30 text-[#00FF85] text-[10px] font-bold uppercase">Resolved</span>}
                            </div>
                            <h3 className="text-lg font-syne font-semibold text-white mb-2">{ticket.title}</h3>
                            <p className="text-sm text-gray-400 font-jakarta line-clamp-2 pr-8">{ticket.description}</p>
                            <div className="flex items-center gap-4 mt-4 text-[10px] text-gray-500 font-ibm-plex uppercase tracking-widest">
                                <span>Created: {format(parseISO(ticket.createdAt), 'dd MMM yyyy, HH:mm')}</span>
                                <span>Type: {ticket.type}</span>
                            </div>
                        </div>

                        <div className="flex flex-col justify-end gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6 min-w-[200px]">
                            {ticket.status !== 'resolved' ? (
                                <>
                                    <button onClick={() => handleStatusChange(ticket.id, 'resolved')} className="w-full py-2 bg-[#00C864]/10 hover:bg-[#00C864]/20 border border-[#00C864]/30 rounded-lg text-xs font-bold text-[#00FF85] flex justify-center items-center gap-2 transition-all">
                                        <CheckCircle2 className="w-4 h-4" /> Mark Resolved
                                    </button>
                                    {ticket.status === 'open' && (
                                        <button onClick={() => handleStatusChange(ticket.id, 'in_progress')} className="w-full py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-xs font-bold text-yellow-400 transition-all">
                                            Start Work
                                        </button>
                                    )}
                                    <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white transition-all flex justify-center items-center gap-1">
                                        View Log <ChevronRight className="w-3 h-3" />
                                    </button>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-[#00C864]">
                                    <CheckCircle2 className="w-8 h-8 mb-2 opacity-80" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Ticket Closed</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {filteredTickets.length === 0 && (
                    <div className="p-8 text-center bg-[#0c1020] border border-white/5 rounded-2xl">
                        <p className="text-sm text-gray-400">No tickets found.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default AdminTickets;
