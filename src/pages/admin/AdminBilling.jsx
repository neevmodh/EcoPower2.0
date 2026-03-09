import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CreditCard, Download, Search, CheckCircle2, AlertCircle, FileText as FileTextIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const AdminBilling = () => {
    const { csvData } = useApp();

    const stats = useMemo(() => {
        let totalRev = 0;
        let pendingRev = 0;
        const paidCount = csvData.invoices.filter(i => {
            if (i.status === 'paid') totalRev += parseFloat(i.totalAmount || 0);
            if (i.status === 'pending') pendingRev += parseFloat(i.totalAmount || 0);
            return i.status === 'paid';
        }).length;

        return {
            totalRev: totalRev.toFixed(0),
            pendingRev: pendingRev.toFixed(0),
            paidCount,
            pendingCount: csvData.invoices.length - paidCount
        }
    }, [csvData.invoices]);

    return (
        <div className="p-6 lg:p-8 space-y-6 animate-fade-in custom-scrollbar">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-syne font-bold text-white flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-blue-500" /> Revenue & Billing
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Platform-wide invoice tracking and settlement records.</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#0c1020] border border-blue-500/20 rounded-2xl p-5 shadow-lg">
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-2 mb-2">Total Revenue Received</span>
                    <span className="text-3xl font-ibm-plex font-bold text-[#00FF85]">₹{Number(stats.totalRev).toLocaleString()}</span>
                </div>
                <div className="bg-[#0c1020] border border-blue-500/20 rounded-2xl p-5 shadow-lg">
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-2 mb-2">Pending Payments</span>
                    <span className="text-3xl font-ibm-plex font-bold text-orange-400">₹{Number(stats.pendingRev).toLocaleString()}</span>
                </div>
                <div className="bg-[#0c1020] border border-blue-500/20 rounded-2xl p-5 shadow-lg flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-gray-400 flex items-center gap-2 mb-2">Paid Invoices</span>
                        <span className="text-3xl font-ibm-plex font-bold text-white">{stats.paidCount}</span>
                    </div>
                    <div className="w-12 h-12 bg-[#00C864]/10 rounded-full flex items-center justify-center border border-[#00C864]/30">
                        <CheckCircle2 className="w-6 h-6 text-[#00FF85]" />
                    </div>
                </div>
                <div className="bg-[#0c1020] border border-blue-500/20 rounded-2xl p-5 shadow-lg flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-gray-400 flex items-center gap-2 mb-2">Unpaid Invoices</span>
                        <span className="text-3xl font-ibm-plex font-bold text-white">{stats.pendingCount}</span>
                    </div>
                    <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/30">
                        <AlertCircle className="w-6 h-6 text-orange-400" />
                    </div>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-[#0c1020] border border-blue-500/20 rounded-2xl overflow-hidden shadow-xl mt-6">
                <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-blue-900/10">
                    <h3 className="font-bold text-white">All Platform Invoices</h3>
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 w-full sm:w-auto">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Search Invoice ID or User..." className="bg-transparent text-sm text-white outline-none placeholder:text-gray-500 w-full" />
                    </div>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="border-b border-white/5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                <th className="py-4 px-6">Invoice ID</th>
                                <th className="py-4 px-6">User ID</th>
                                <th className="py-4 px-6">Date</th>
                                <th className="py-4 px-6">Due Date</th>
                                <th className="py-4 px-6 text-right">Amount</th>
                                <th className="py-4 px-6 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-ibm-plex">
                            {csvData.invoices.map(invoice => (
                                <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-4 px-6 text-white font-medium flex items-center gap-2">
                                        <FileTextIcon className="w-4 h-4 text-blue-400" /> {invoice.id}
                                    </td>
                                    <td className="py-4 px-6 text-gray-300">{invoice.userId}</td>
                                    <td className="py-4 px-6 text-gray-400">{invoice.date ? format(parseISO(invoice.date), 'dd MMM yyyy') : '-'}</td>
                                    <td className="py-4 px-6 text-gray-400">{invoice.dueDate ? format(parseISO(invoice.dueDate), 'dd MMM yyyy') : '-'}</td>
                                    <td className="py-4 px-6 text-right font-bold text-white">₹{parseFloat(invoice.totalAmount || 0).toLocaleString()}</td>
                                    <td className="py-4 px-6 text-center">
                                        {invoice.status === 'paid' ? (
                                            <span className="px-2 py-1 bg-[#00C864]/20 border border-[#00C864]/30 text-[#00FF85] rounded text-xs uppercase font-bold tracking-wider">Paid</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded text-xs uppercase font-bold tracking-wider">Pending</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

// FileText already imported from lucide
export default AdminBilling;
