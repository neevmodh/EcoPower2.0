import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Database, Download, Upload, Copy, Save, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { updateCache } from '../../services/csvService';

const CSV_FILES = [
    'users.csv', 'plans.csv', 'energy_readings.csv', 'invoices.csv',
    'support_tickets.csv', 'grid_transactions.csv', 'notifications.csv',
    'devices.csv', 'weather_forecast.csv', 'subscriptions.csv'
];

const AdminDataManager = () => {
    const { csvData, setCsvData, refreshData } = useApp();
    const [selectedFile, setSelectedFile] = useState('users');
    const [activeData, setActiveData] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editState, setEditState] = useState(null);

    useEffect(() => {
        if (csvData[selectedFile]) {
            setActiveData(csvData[selectedFile]);
        }
    }, [selectedFile, csvData]);

    const handleExport = () => {
        if (!activeData || activeData.length === 0) return;
        const header = Object.keys(activeData[0]).join(',');
        const rows = activeData.map(obj => Object.values(obj).map(v => `"${v}"`).join(',')).join('\n');
        const csvContent = `${header}\n${rows}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${selectedFile}_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: `Exported ${selectedFile}.csv successfully`, type: 'success' } }));
    };

    const handleCellEdit = (rowIndex, key, value) => {
        const newData = [...editState];
        newData[rowIndex] = { ...newData[rowIndex], [key]: value };
        setEditState(newData);
    };

    const handleSave = async () => {
        try {
            // Map back to the appropriate csv mapping filename
            const csvNameMapping = {
                'users': 'users.csv',
                'energyReadings': 'energy_readings.csv',
                'invoices': 'invoices.csv',
                'tickets': 'support_tickets.csv',
                'transactions': 'grid_transactions.csv',
                'notifications': 'notifications.csv',
                'devices': 'devices.csv',
                'plans': 'plans.csv',
                'weather': 'weather_forecast.csv',
                'subscriptions': 'subscriptions.csv'
            };

            const fileName = csvNameMapping[selectedFile];
            setCsvData(prev => ({ ...prev, [selectedFile]: editState }));
            await updateCache(fileName, editState);

            setActiveData(editState);
            setIsEditing(false);
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: `Saved changes to ${fileName}`, type: 'success' } }));
        } catch (e) {
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: `Failed to save changes`, type: 'error' } }));
        }
    };

    if (!activeData || activeData.length === 0) return (
        <div className="flex h-full items-center justify-center p-8 bg-[#0a0f0d] rounded-2xl border border-white/5 mx-6 my-6">
            No Data Available.
        </div>
    );

    const columns = Object.keys(activeData[0] || {});

    return (
        <div className="p-6 lg:p-8 space-y-6 animate-fade-in custom-scrollbar">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-syne font-bold text-white flex items-center gap-3">
                        <Database className="w-8 h-8 text-blue-500" /> Data Manager
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Directly edit and manage underlying CSV Context stores.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={handleExport} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-bold text-sm transition-all flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    {isEditing ? (
                        <button onClick={handleSave} className="px-4 py-2 bg-[#00C864] hover:bg-[#00FF85] text-black font-bold rounded-lg text-sm transition-all shadow-lg shadow-[#00C864]/20 flex items-center gap-2">
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    ) : (
                        <button onClick={() => { setEditState(JSON.parse(JSON.stringify(activeData))); setIsEditing(true); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-all shadow-lg flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4" /> Edit Inline
                        </button>
                    )}
                </div>
            </div>

            {/* Database Selector Row */}
            <div className="flex flex-wrap gap-2 mb-6">
                {Object.keys(csvData).filter(key => key !== 'transactions').map(key => (
                    <button
                        key={key}
                        onClick={() => { setSelectedFile(key); setIsEditing(false); }}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors border ${selectedFile === key
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-lg'
                            : 'bg-[#0c1020] text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        {key}
                    </button>
                ))}
            </div>

            {/* Data Grid */}
            <div className="bg-[#0c1020] border border-blue-500/20 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-blue-900/10 border-b border-blue-500/20">
                                <th className="py-3 px-4 w-12 text-center text-xs font-bold text-blue-400 uppercase">#</th>
                                {columns.map(col => (
                                    <th key={col} className="py-3 px-4 text-xs font-bold text-gray-300 uppercase tracking-wider border-l border-white/5">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="text-sm font-ibm-plex">
                            {(isEditing ? editState : activeData).map((row, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-2 px-4 text-center text-gray-500 border-r border-white/5">{i + 1}</td>
                                    {columns.map(col => (
                                        <td key={col} className="py-2 px-4 text-gray-300 border-r border-white/5">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={row[col] || ''}
                                                    onChange={(e) => handleCellEdit(i, col, e.target.value)}
                                                    className="w-full bg-black/40 border border-blue-500/30 rounded px-2 py-1 text-white outline-none focus:border-[#00C864]"
                                                />
                                            ) : (
                                                <span className="truncate max-w-[200px] block">{row[col]}</span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDataManager;
