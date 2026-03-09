import { useApp } from '../context/AppContext';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
    const { currentUser, isLoading } = useApp();

    if (isLoading) return null; // Avoid flicker while hydrating
    if (!currentUser) return <Navigate to="/login" replace />;

    return <Outlet />;
};

export const AdminRoute = () => {
    const { currentUser, isLoading } = useApp();

    if (isLoading) return null;
    if (!currentUser) return <Navigate to="/login" replace />;

    if (currentUser.role !== 'admin') {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
                    <p className="text-gray-400">You do not have permission to view the Admin Console.</p>
                </div>
            </div>
        );
    }

    return <Outlet />;
};
