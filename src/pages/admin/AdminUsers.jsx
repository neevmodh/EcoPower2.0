import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { updateInCSV, appendToCSV } from '../../services/csvService';
import {
    Search, Filter, Plus, Edit2, Shield, UserX, UserCheck,
    Download, ChevronLeft, ChevronRight, Zap, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

const AdminUsers = () => {
    const { csvData, refreshData } = useApp();

    // ─── STATE ─────────────────────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterPlan, setFilterPlan] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const [selectedIds, setSelectedIds] = useState([]);

    // Modals
    const [editingUser, setEditingUser] = useState(null);
    const [addingUser, setAddingUser] = useState(false);

    // ─── FILTER & SORT LOGIC ───────────────────────────────────────────────
    const processedUsers = useMemo(() => {
        let result = [...csvData.users];

        // Filters
        if (filterRole !== 'all') result = result.filter(u => (u.role || 'customer') === filterRole);
        if (filterPlan !== 'all') result = result.filter(u => u.plan === filterPlan);
        if (filterStatus !== 'all') result = result.filter(u => (u.status || 'Active') === filterStatus);

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(u =>
                u.name?.toLowerCase().includes(term) ||
                u.email?.toLowerCase().includes(term) ||
                u.city?.toLowerCase().includes(term)
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA = a[sortConfig.key] || '';
            let valB = b[sortConfig.key] || '';
            if (sortConfig.key === 'id') {
                valA = parseInt(valA.replace(/\D/g, '')) || 0;
                valB = parseInt(valB.replace(/\D/g, '')) || 0;
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [csvData.users, filterRole, filterPlan, filterStatus, searchTerm, sortConfig]);

    // Pagination
    const totalPages = Math.ceil(processedUsers.length / itemsPerPage);
    const paginatedUsers = processedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    // ─── BULK ACTIONS ──────────────────────────────────────────────────────
    const toggleSelectAll = (e) => setSelectedIds(e.target.checked ? paginatedUsers.map(u => u.id) : []);
    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const handleBulkExport = () => {
        if (selectedIds.length === 0) return;
        const targets = processedUsers.filter(u => selectedIds.includes(u.id));
        const headers = Object.keys(targets[0]).join(',');
        const rows = targets.map(obj => Object.values(obj).map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','));
        const csvContent = [headers, ...rows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `EcoPower_Users_${format(new Date(), 'yyyyMMdd')}.csv`);
        window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: `Exported ${targets.length} users.`, type: 'success' } }));
    };

    const handleBulkPlanChange = async (e) => {
        const newPlan = e.target.value;
        if (!newPlan || selectedIds.length === 0) return;
        try {
            for (const id of selectedIds) {
                await updateInCSV('users.csv', id, { plan: newPlan });
            }
            refreshData();
            setSelectedIds([]);
            e.target.value = '';
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: `Updated plans for ${selectedIds.length} users.`, type: 'success' } }));
        } catch (err) {
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Bulk update failed.', type: 'error' } }));
        }
    };


    // ─── EDIT MODAL ────────────────────────────────────────────────────────
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            await updateInCSV('users.csv', editingUser.id, editingUser);
            refreshData();
            setEditingUser(null);
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: `User ${editingUser.name} updated.`, type: 'success' } }));
        } catch (err) {
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Update failed', type: 'error' } }));
        }
    };

    const handleSuspendToggle = async (user) => {
        const newStatus = user.status === 'Suspended' ? 'Active' : 'Suspended';
        try {
            await updateInCSV('users.csv', user.id, { status: newStatus });
            refreshData();
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: `User ${user.name} marked as ${newStatus}.`, type: 'info' } }));
        } catch (err) {
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Status change failed', type: 'error' } }));
        }
    };

    // ─── ADD MODAL ─────────────────────────────────────────────────────────
    const [newUser, setNewUser] = useState({ name: '', email: '', password: 'Password123!', role: 'customer', plan: 'Solar Basic', status: 'Active', city: '' });
    const handleAddUser = async (e) => {
        e.preventDefault();
        const nextIdNo = Math.max(...csvData.users.map(u => parseInt(u.id.replace('USR', '')) || 0)) + 1;
        const nextId = `USR${String(nextIdNo).padStart(3, '0')}`;

        const fullUser = {
            id: nextId,
            ...newUser,
            joinDate: new Date().toISOString().split('T')[0],
            connectionId: `CONN${Math.floor(10000 + Math.random() * 90000)}`,
            meterNo: `MTR-${Math.floor(1000 + Math.random() * 9000)}`,
            solarKw: newUser.plan.includes('Pro') ? 10 : newUser.plan.includes('Premium') ? 6 : 4,
            batteryKwh: newUser.plan.includes('Pro') ? 15 : newUser.plan.includes('Premium') ? 5 : 0
        };

        try {
            await appendToCSV('users.csv', fullUser);
            refreshData();
            setAddingUser(false);
            setNewUser({ name: '', email: '', password: 'Password123!', role: 'customer', plan: 'Solar Basic', status: 'Active', city: '' });
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: `Created user ${nextId}.`, type: 'success' } }));
        } catch (err) {
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Failed to create user', type: 'error' } }));
        }
    };

    // Helper Th Render
    const SortableTh = ({ label, sortKey }) => (
        <th className="px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors select-none group" onClick={() => requestSort(sortKey)}>
            <div className="flex items-center gap-1">
                {label}
                <span className="text-gray-600 group-hover:text-blue-400 transition-colors opacity-50 text-[10px]">
                    {sortConfig.key === sortKey ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                </span>
            </div>
        </th>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-10">

            {/* ─── HEADER ──────────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-syne font-bold text-white mb-2">User Registry</h2>
                    <p className="text-sm text-gray-400">Manage all {csvData.users.length} cross-platform identities.</p>
                </div>
                <button onClick={() => setAddingUser(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add User
                </button>
            </div>

            {/* ─── TOOLBAR ─────────────────────────────────────────────────────── */}
            <div className="bg-[#0c1020] border border-[#3b82f6]/15 rounded-2xl p-4 flex flex-col lg:flex-row gap-4 justify-between items-center z-20 relative">

                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                        <input
                            type="text" placeholder="Search accounts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-[#060810] border border-[#3b82f6]/20 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <div className="flex gap-2">
                        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-[#060810] border border-[#3b82f6]/20 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none">
                            <option value="all">Roles (All)</option>
                            <option value="customer">Customers</option>
                            <option value="admin">Administrators</option>
                        </select>
                        <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} className="bg-[#060810] border border-[#3b82f6]/20 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none hidden sm:block">
                            <option value="all">Plans (All)</option>
                            <option value="Solar Basic">Solar Basic</option>
                            <option value="Solar Premium">Solar Premium</option>
                            <option value="Solar Pro">Solar Pro</option>
                        </select>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-[#060810] border border-[#3b82f6]/20 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none hidden md:block">
                            <option value="all">Status (All)</option>
                            <option value="Active">Active</option>
                            <option value="Suspended">Suspended</option>
                        </select>
                    </div>
                </div>

                {/* Bulk Actions (Conditional) */}
                <div className="flex gap-3 w-full lg:w-auto h-9">
                    {selectedIds.length > 0 && (
                        <>
                            <select onChange={handleBulkPlanChange} className="bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg px-3 text-sm font-bold outline-none flex-1 lg:flex-none">
                                <option value="">⚙️ Bulk Change Plan...</option>
                                <option value="Solar Basic">Set: Solar Basic</option>
                                <option value="Solar Premium">Set: Solar Premium</option>
                                <option value="Solar Pro">Set: Solar Pro</option>
                            </select>
                            <button onClick={handleBulkExport} className="px-3 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm border border-white/10 font-bold transition-colors flex items-center justify-center gap-2">
                                <Download className="w-4 h-4" /> Export {selectedIds.length}
                            </button>
                        </>
                    )}
                </div>

            </div>

            {/* ─── DATA TABLE ──────────────────────────────────────────────────── */}
            <div className="bg-[#0c1020] border border-[#3b82f6]/15 rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <div className="overflow-x-auto w-full custom-scrollbar">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-[#3b82f6]/5 border-b border-[#3b82f6]/10 text-[10px] uppercase tracking-widest font-bold text-gray-400">
                            <tr>
                                <th className="px-4 py-3 w-10 text-center">
                                    <input type="checkbox" onChange={toggleSelectAll}
                                        checked={selectedIds.length === paginatedUsers.length && paginatedUsers.length > 0}
                                        className="accent-blue-500" />
                                </th>
                                <SortableTh label="ID" sortKey="id" />
                                <SortableTh label="User Profile" sortKey="name" />
                                <SortableTh label="Location" sortKey="city" />
                                <SortableTh label="Role" sortKey="role" />
                                <SortableTh label="Plan Tier" sortKey="plan" />
                                <SortableTh label="Status" sortKey="status" />
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3b82f6]/5 text-sm">
                            {paginatedUsers.length === 0 && (
                                <tr><td colSpan="8" className="py-8 text-center text-gray-500">No users found matching filters.</td></tr>
                            )}
                            {paginatedUsers.map((u, i) => {
                                const isSelected = selectedIds.includes(u.id);
                                const isSuspended = u.status === 'Suspended';
                                const isAdmin = u.role === 'admin';

                                return (
                                    <tr key={u.id} className={`hover:bg-blue-500/5 transition-colors ${isSelected ? 'bg-blue-500/10' : ''} ${isSuspended ? 'opacity-60' : ''}`}>
                                        <td className="px-4 py-3 text-center">
                                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(u.id)} className="accent-blue-500" />
                                        </td>
                                        <td className="px-4 py-3 font-ibm-plex text-gray-400">{u.id}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-white">{u.name}</div>
                                            <div className="text-xs text-gray-500">{u.email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-300">{u.city || '-'} <span className="text-[10px] text-gray-600 block">{u.state || ''}</span></td>
                                        <td className="px-4 py-3">
                                            {isAdmin ? (
                                                <span className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-[#3b82f6] uppercase border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-2 py-0.5 rounded w-max"><Shield className="w-3 h-3" /> Admin</span>
                                            ) : (
                                                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Customer</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isAdmin ? '-' : (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest border ${u.plan === 'Solar Premium' ? 'bg-[#00C864]/10 border-[#00C864]/30 text-[#00C864]' : u.plan === 'Solar Pro' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]'}`}>
                                                    {u.plan}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`flex items-center gap-1 w-max ${isSuspended ? 'text-red-400' : 'text-green-400'}`}>
                                                <span className={`w-2 h-2 rounded-full ${isSuspended ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                                {isSuspended ? 'Suspended' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            {/* Inline Admin Actions */}
                                            <button onClick={() => setEditingUser(u)} className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-md transition-colors tooltip-trigger relative group">
                                                <Edit2 className="w-4 h-4" />
                                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Edit</span>
                                            </button>

                                            <button onClick={() => handleSuspendToggle(u)} className={`p-1.5 hover:bg-white/10 rounded-md transition-colors tooltip-trigger relative group ${isSuspended ? 'text-green-400' : 'text-red-400 hover:text-red-300'}`}>
                                                {isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{isSuspended ? 'Reactivate' : 'Suspend'}</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer Pagination */}
                <div className="bg-[#0a0d1a] border-t border-[#3b82f6]/10 px-4 py-3 flex items-center justify-between text-xs text-gray-500">
                    <div>
                        Showing {(currentPage - 1) * itemsPerPage + 1} to Math.min(currentPage*itemsPerPage, processedUsers.length) of {processedUsers.length} entries
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-7 h-7 flex items-center justify-center rounded border border-[#3b82f6]/20 disabled:opacity-30 hover:bg-white/5 disabled:hover:bg-transparent"><ChevronLeft className="w-4 h-4" /></button>
                        <div className="w-7 h-7 flex items-center justify-center font-ibm-plex text-white font-bold">{currentPage}</div>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-7 h-7 flex items-center justify-center rounded border border-[#3b82f6]/20 disabled:opacity-30 hover:bg-white/5 disabled:hover:bg-transparent"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>


            {/* ─── ADD / EDIT MODALS ────────────────────────────────────────────── */}

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 bg-[#060810]/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#0c1020] border border-[#3b82f6]/30 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(59,130,246,0.1)] overflow-hidden">
                        <div className="p-5 border-b border-[#3b82f6]/10 flex justify-between items-center bg-[#3b82f6]/5">
                            <h3 className="text-lg font-syne font-bold text-white">Edit User: {editingUser.id}</h3>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white"><UserX className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-sm">

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Full Name</label>
                                    <input type="text" value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} className="w-full bg-[#060810] border border-[#3b82f6]/20 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Email</label>
                                    <input type="email" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} className="w-full bg-[#060810] border border-[#3b82f6]/20 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">City</label>
                                    <input type="text" value={editingUser.city || ''} onChange={e => setEditingUser({ ...editingUser, city: e.target.value })} className="w-full bg-[#060810] border border-[#3b82f6]/20 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Raw Password Override</label>
                                    <input type="text" value={editingUser.password} onChange={e => setEditingUser({ ...editingUser, password: e.target.value })} className="w-full bg-[#060810] border border-red-500/30 rounded-lg px-3 py-2 text-red-400 outline-none focus:border-red-500 font-ibm-plex text-xs" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[#3b82f6]/10 mt-4">
                                <div>
                                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Role</label>
                                    <select value={editingUser.role || 'customer'} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })} className="w-full bg-[#060810] border border-[#3b82f6]/20 rounded-lg px-2 py-2 text-white outline-none">
                                        <option value="customer">Customer</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Plan</label>
                                    <select disabled={editingUser.role === 'admin'} value={editingUser.plan} onChange={e => setEditingUser({ ...editingUser, plan: e.target.value })} className="w-full bg-[#060810] border border-[#3b82f6]/20 rounded-lg px-2 py-2 text-white outline-none disabled:opacity-50">
                                        <option value="Solar Basic">Solar Basic</option>
                                        <option value="Solar Premium">Solar Premium</option>
                                        <option value="Solar Pro">Solar Pro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Status</label>
                                    <select value={editingUser.status || 'Active'} onChange={e => setEditingUser({ ...editingUser, status: e.target.value })} className={`w-full bg-[#060810] border rounded-lg px-2 py-2 outline-none font-bold ${editingUser.status === 'Suspended' ? 'text-red-400 border-red-500/50' : 'text-green-400 border-green-500/50'}`}>
                                        <option value="Active">Active</option>
                                        <option value="Suspended">Suspended</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <button type="button" onClick={() => setEditingUser(null)} className="px-5 py-2 text-gray-400 hover:text-white font-bold transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg transition-colors flex items-center gap-2"><Check className="w-4 h-4" /> Save Mutated State</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {addingUser && (
                <div className="fixed inset-0 z-50 bg-[#060810]/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#0c1020] border border-[#3b82f6]/30 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(59,130,246,0.1)] overflow-hidden">
                        <div className="p-5 border-b border-[#3b82f6]/10 flex justify-between items-center bg-[#3b82f6]/5">
                            <h3 className="text-lg font-syne font-bold text-white flex items-center gap-2"><Plus className="w-5 h-5" /> Provision New User</h3>
                            <button onClick={() => setAddingUser(false)} className="text-gray-400 hover:text-white"><UserX className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleAddUser} className="p-5 space-y-4 text-sm">

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Full Name</label>
                                    <input type="text" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="w-full bg-[#060810] border border-[#3b82f6]/20 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500" required placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Email</label>
                                    <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full bg-[#060810] border border-[#3b82f6]/20 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500" required placeholder="user@domain.com" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">City</label>
                                    <input type="text" value={newUser.city} onChange={e => setNewUser({ ...newUser, city: e.target.value })} className="w-full bg-[#060810] border border-[#3b82f6]/20 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500" required placeholder="Ahmedabad" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Temporary Password</label>
                                    <input type="text" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="w-full bg-[#060810] border border-[#3b82f6]/20 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 font-ibm-plex text-xs" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#3b82f6]/10 mt-4">
                                <div>
                                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Role Type</label>
                                    <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="w-full bg-[#060810] border border-[#3b82f6]/20 rounded-lg px-2 py-2 text-white outline-none">
                                        <option value="customer">Customer</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Initial Plan (Customer Only)</label>
                                    <select disabled={newUser.role === 'admin'} value={newUser.plan} onChange={e => setNewUser({ ...newUser, plan: e.target.value })} className="w-full bg-[#060810] border border-[#3b82f6]/20 rounded-lg px-2 py-2 text-white outline-none disabled:opacity-50">
                                        <option value="Solar Basic">Solar Basic</option>
                                        <option value="Solar Premium">Solar Premium</option>
                                        <option value="Solar Pro">Solar Pro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <button type="button" onClick={() => setAddingUser(false)} className="px-5 py-2 text-gray-400 hover:text-white font-bold transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-[#00C864] hover:bg-[#00FF85] text-black rounded-lg font-bold shadow-lg transition-colors flex items-center gap-2">Create Identity</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminUsers;
