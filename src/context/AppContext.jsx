import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadCSV, updateCache } from '../services/csvService';
import { getCurrentUser } from '../services/authService';

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
        solarGen: 0,
        consumption: 0,
        gridImport: 0,
        gridExport: 0,
        batteryLevel: 65,
        voltage: 230,
        frequency: 50,
    });

    const [unreadCount, setUnreadCount] = useState(0);

    // Load all data on mount
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            setCurrentUser(getCurrentUser());
            await refreshData();
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

    const refreshData = async () => {
        try {
            const [
                users,
                readings,
                invoices,
                tickets,
                transactions,
                notifications,
                devices,
                plans,
                weather,
                subscriptions,
            ] = await Promise.all([
                loadCSV('users.csv'),
                loadCSV('energy_readings.csv'),
                loadCSV('invoices.csv'),
                loadCSV('support_tickets.csv'),
                loadCSV('grid_transactions.csv'),
                loadCSV('notifications.csv'),
                loadCSV('devices.csv'),
                loadCSV('plans.csv'),
                loadCSV('weather_forecast.csv'),
                loadCSV('subscriptions.csv'),
            ]);

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
            console.error('[AppContext] Failed to load CSV data', err);
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
        updateCache(filename, newData);

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

    const addTicket = (ticketData) => {
        const updated = [...csvData.tickets, ticketData];
        applyUpdate('tickets', 'support_tickets.csv', updated);
    };

    const updateTicket = (id, fields) => {
        const updated = csvData.tickets.map((t) => (t.id === id ? { ...t, ...fields } : t));
        applyUpdate('tickets', 'support_tickets.csv', updated);
    };

    const markNotificationRead = (id) => {
        const updated = csvData.notifications.map((n) =>
            n.id === id ? { ...n, isRead: 'true' } : n
        );
        applyUpdate('notifications', 'notifications.csv', updated);
    };

    const markAllRead = (userId) => {
        const updated = csvData.notifications.map((n) =>
            n.userId === userId ? { ...n, isRead: 'true' } : n
        );
        applyUpdate('notifications', 'notifications.csv', updated);
    };

    const addInvoiceRow = (invoice) => {
        const updated = [...csvData.invoices, invoice];
        applyUpdate('invoices', 'invoices.csv', updated);
    };

    const updateInvoice = (id, fields) => {
        const updated = csvData.invoices.map((i) => (i.id === id ? { ...i, ...fields } : i));
        applyUpdate('invoices', 'invoices.csv', updated);
    };

    const toggleDevice = (deviceId) => {
        const updated = csvData.devices.map((d) =>
            d.id === deviceId ? { ...d, status: d.status === 'on' ? 'off' : 'on' } : d
        );
        applyUpdate('devices', 'devices.csv', updated);
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
