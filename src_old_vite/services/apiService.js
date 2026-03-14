const API_URL = 'http://localhost:5005/api';

export const apiService = {
    // Health Check
    checkHealth: async () => {
        const response = await fetch(`${API_URL}/health`);
        return response.json();
    },

    // Users
    getUser: async (userId) => {
        const response = await fetch(`${API_URL}/users/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch user');
        return response.json();
    },

    // Devices
    getDevices: async (userId) => {
        const response = await fetch(`${API_URL}/devices/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch devices');
        return response.json();
    },

    // Energy Readings
    getEnergyReadings: async (userId) => {
        const response = await fetch(`${API_URL}/energy-readings/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch energy readings');
        return response.json();
    },

    // Invoices
    getInvoices: async (userId) => {
        const response = await fetch(`${API_URL}/invoices/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch invoices');
        return response.json();
    },

    // Notifications
    getNotifications: async (userId) => {
        const response = await fetch(`${API_URL}/notifications/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch notifications');
        return response.json();
    },

    // Support Tickets
    getSupportTickets: async (userId) => {
        const response = await fetch(`${API_URL}/support-tickets/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch support tickets');
        return response.json();
    },
    createSupportTicket: async (ticketData) => {
        const response = await fetch(`${API_URL}/support-tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticketData),
        });
        if (!response.ok) throw new Error('Failed to create support ticket');
        return response.json();
    },
    updateSupportTicket: async (id, ticketData) => {
        const response = await fetch(`${API_URL}/support-tickets/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticketData),
        });
        if (!response.ok) throw new Error('Failed to update support ticket');
        return response.json();
    },

    // Grid Transactions
    getGridTransactions: async (userId) => {
        const response = await fetch(`${API_URL}/grid-transactions/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch grid transactions');
        return response.json();
    },

    // Mutations
    markNotificationRead: async (id) => {
        const response = await fetch(`${API_URL}/notifications/${id}/read`, { method: 'PUT' });
        if (!response.ok) throw new Error('Failed to mark read');
        return response.json();
    },
    markAllNotificationsRead: async (userId) => {
        const response = await fetch(`${API_URL}/notifications/user/${userId}/read-all`, { method: 'PUT' });
        if (!response.ok) throw new Error('Failed to mark all read');
        return response.json();
    },
    addInvoice: async (invoice) => {
        const response = await fetch(`${API_URL}/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoice),
        });
        if (!response.ok) throw new Error('Failed to create invoice');
        return response.json();
    },
    updateInvoice: async (id, fields) => {
        const response = await fetch(`${API_URL}/invoices/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fields),
        });
        if (!response.ok) throw new Error('Failed to update invoice');
        return response.json();
    },
    toggleDevice: async (id) => {
        const response = await fetch(`${API_URL}/devices/${id}/toggle`, { method: 'PUT' });
        if (!response.ok) throw new Error('Failed to toggle device');
        return response.json();
    }
};
