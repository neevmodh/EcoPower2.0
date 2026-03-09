import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export const ToastProvider = () => {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handleToast = (e) => {
            const { message, type = 'info', duration = 3000 } = e.detail;
            const id = Date.now();

            setToasts((prev) => [...prev, { id, message, type }]);

            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        };

        window.addEventListener('eco-toast', handleToast);
        return () => window.removeEventListener('eco-toast', handleToast);
    }, []);

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
            {toasts.map((toast) => {
                const isSuccess = toast.type === 'success';
                const isError = toast.type === 'error';

                return (
                    <div
                        key={toast.id}
                        className={`flex items-start gap-3 p-4 rounded-xl shadow-2xl shadow-black/50 border backdrop-blur-md animate-fade-in w-80 
              ${isSuccess ? 'bg-[#00C864]/10 border-[#00C864]/30 text-[#00FF85]' :
                                isError ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                    'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}
                    >
                        <div className="mt-0.5 flex-shrink-0">
                            {isSuccess ? <CheckCircle className="w-5 h-5" /> :
                                isError ? <AlertCircle className="w-5 h-5" /> :
                                    <Info className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 text-sm font-medium">{toast.message}</div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="mt-0.5 opacity-50 hover:opacity-100 transition-opacity"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
