import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '../services/authService';
import { apiService } from '../services/apiService';

const AppContext = createContext(null);

export function AppProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [csvData, setCsvData] = useState({
        users: [],
        energyReadings: [],
        invoices: [],
        tickets: [],
        transactions: [],
        notifications: [],
        devices: [],
        plans: [],
        weather: [],
        subscriptions: [],
    });

    const [liveReading, setLiveReading] = useState({
        solarGen: 8.5,
        consumption: 4.2,
        gridImport: 0.1,
        gridExport: 4.3,
        batteryLevel: 65.5,
        voltage: 230.1,
        frequency: 50.1,
    });

    const [unreadCount, setUnreadCount] = useState(0);

    // Load all data on mount
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            const user = getCurrentUser();
            setCurrentUser(user);
            await refreshData(user);
            setIsLoading(false);
        };
        init();
    }, []);

    // Calculate unread notifications when data or user changes
    useEffect(() => {
        if (currentUser && csvData.notifications.length > 0) {
            const count = csvData.notifications.filter(
                (n) => n.userId === currentUser.id && String(n.isRead).toLowerCase() !== 'true'
            ).length;
            setUnreadCount(count);
        }
    }, [csvData.notifications, currentUser]);

    const refreshData = async (userParam) => {
        const user = userParam || getCurrentUser();
        try {
            const plans = [
                { id: '1', name: 'Solar Basic', price: '0', description: 'Standard Monitoring', co2Offset: '10' },
                { id: '2', name: 'Solar Premium', price: '29', description: 'Advanced AI Analytics', co2Offset: '50' },
                { id: '3', name: 'Solar Pro', price: '99', description: 'Enterprise Command Center', co2Offset: '200' }
            ];
            const weather = [
                { date: new Date().toISOString().split('T')[0], temp: 28, condition: 'Sunny', irradiance: 850 }
            ];
            const subscriptions = [];

            let users = [], readings = [], invoices = [], tickets = [], transactions = [], notifications = [], devices = [];
            
            if (user && user.id) {
                const targetId = user.role === 'admin' ? 'all' : user.id;
                [
                    users,
                    readings,
                    invoices,
                    tickets,
                    transactions,
                    notifications,
                    devices
                ] = await Promise.all([
                    apiService.getUser(targetId).then(u => Array.isArray(u) ? u : [u]).catch(() => []),
                    apiService.getEnergyReadings(targetId).then(res => res.map(r => {
                        const d = new Date(r.timestamp);
                        return { ...r, solarGen: r.production, date: d.toISOString().split('T')[0], hour: d.getHours().toString().padStart(2, '0') };
                    })).catch(() => []),
                    apiService.getInvoices(targetId).then(res => res.map(i => {
                        const d = i.date ? new Date(i.date).toISOString().split('T')[0] : '';
                        const due = i.dueDate ? new Date(i.dueDate).toISOString().split('T')[0] : '';
                        let statusStr = i.status;
                        if (statusStr === 'unpaid') statusStr = 'Pending';
                        if (statusStr === 'paid') statusStr = 'Paid';
                        return { ...i, date: d, dueDate: due, totalAmount: i.amount, status: statusStr };
                    })).catch(() => []),
                    apiService.getSupportTickets(targetId).then(res => res.map(t => ({
                        ...t, title: t.subject || t.title, issueType: t.category || t.issueType, date: new Date(t.createdAt).toISOString().split('T')[0]
                    }))).catch(() => []),
                    apiService.getGridTransactions(targetId).then(res => res.map(t => {
                        const d = new Date(t.timestamp);
                        return { ...t, date: d.toISOString().split('T')[0], time: `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}` };
                    })).catch(() => []),
                    apiService.getNotifications(targetId).then(res => res.map(n => {
                        const d = new Date(n.timestamp);
                        return { ...n, isRead: n.read ? 'true' : 'false', date: d.toISOString() };
                    })).catch(() => []),
                    apiService.getDevices(targetId).catch(() => []),
                ]);
            }

            setCsvData({
                users,
                energyReadings: readings,
                invoices,
                tickets,
                transactions,
                notifications,
                devices,
                plans,
                weather,
                subscriptions,
            });
            return true;
        } catch (err) {
            console.error('[AppContext] Failed to load data', err);
            return false;
        }
    };

    // ─── DATA ACCESSOR METHODS ──────────────────────────────────────────────

    const getUserReadings = useCallback(
        (userId) => csvData.energyReadings.filter((r) => r.userId === userId),
        [csvData.energyReadings]
    );

    const getTodayReadings = useCallback(
        (userId) => {
            const today = new Date().toISOString().split('T')[0];
            return csvData.energyReadings.filter((r) => r.userId === userId && r.date === today);
        },
        [csvData.energyReadings]
    );

    const getUnreadCount = useCallback(
        (userId) => {
            return csvData.notifications.filter(
                (n) => n.userId === userId && String(n.isRead).toLowerCase() !== 'true'
            ).length;
        },
        [csvData.notifications]
    );

    // ─── MUTATION METHODS (In-Memory Updates) ───────────────────────────────

    // Shared helper to update state, sync to cache, and show toast
    const applyUpdate = (key, filename, newData) => {
        setCsvData((prev) => ({ ...prev, [key]: newData }));

        // Dispatch custom event for global toast notification
        window.dispatchEvent(
            new CustomEvent('eco-toast', {
                detail: {
                    message: 'Changes saved to memory. Click Export to download updated CSV.',
                    type: 'success',
                },
            })
        );
    };

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        window.dispatchEvent(
            new CustomEvent('eco-toast', {
                detail: { message, type, duration },
            })
        );
    }, []);

    const addTicket = async (ticketData) => {
        const tempId = `TKT_${Date.now()}`;
        const newTicket = { ...ticketData, id: ticketData.id || tempId };
        setCsvData((prev) => ({ ...prev, tickets: [newTicket, ...prev.tickets] }));
        try {
            await apiService.createSupportTicket(newTicket);
        } catch (err) {
            console.error(err);
        }
    };

    const updateTicket = async (id, fields) => {
        setCsvData((prev) => ({
            ...prev,
            tickets: prev.tickets.map((t) => (t.id === id ? { ...t, ...fields } : t))
        }));
        try {
            await apiService.updateSupportTicket(id, fields);
        } catch (err) {
            console.error(err);
        }
    };

    const markNotificationRead = async (id) => {
        setCsvData((prev) => ({
            ...prev,
            notifications: prev.notifications.map((n) => (n.id === id ? { ...n, isRead: 'true' } : n))
        }));
        try {
            await apiService.markNotificationRead(id);
        } catch (err) {
            console.error(err);
        }
    };

    const markAllRead = async (userId) => {
        setCsvData((prev) => ({
            ...prev,
            notifications: prev.notifications.map((n) => (n.userId === userId ? { ...n, isRead: 'true' } : n))
        }));
        try {
            await apiService.markAllNotificationsRead(userId);
        } catch (err) {
            console.error(err);
        }
    };

    const addInvoiceRow = async (invoice) => {
        setCsvData((prev) => ({ ...prev, invoices: [invoice, ...prev.invoices] }));
        try {
            await apiService.addInvoice(invoice);
        } catch (err) {
            console.error(err);
        }
    };

    const updateInvoice = async (id, fields) => {
        setCsvData((prev) => ({
            ...prev,
            invoices: prev.invoices.map((i) => (i.id === id ? { ...i, ...fields } : i))
        }));
        try {
            await apiService.updateInvoice(id, fields);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleDevice = async (deviceId) => {
        setCsvData((prev) => ({
            ...prev,
            devices: prev.devices.map((d) => (d.id === deviceId ? { ...d, status: d.status === 'on' ? 'off' : 'on' } : d))
        }));
        try {
            await apiService.toggleDevice(deviceId);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <AppContext.Provider
            value={{
                currentUser,
                setCurrentUser,
                isLoading,
                csvData,
                setCsvData,
                liveReading,
                setLiveReading,
                unreadCount,
                refreshData,
                getUserReadings,
                getTodayReadings,
                getUnreadCount,
                addTicket,
                updateTicket,
                markNotificationRead,
                markAllRead,
                addInvoiceRow,
                updateInvoice,
                toggleDevice,
                showToast,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
