import React from 'react';

const AdminSettings = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8">
            <h1 className="text-3xl font-syne font-bold text-white mb-4">Platform Configuration</h1>
            <p className="text-gray-400">System settings, API connectors, and Admin SSO parameters are locked for Demo Mode.</p>
            <span className="mt-8 px-4 py-1.5 bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(249,115,22,0.2)]">Protected Route</span>
        </div>
    );
};

export default AdminSettings;
