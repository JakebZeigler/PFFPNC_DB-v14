import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthLayout: React.FC<{ adminOnly?: boolean }> = ({ adminOnly = false }) => {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (adminOnly && user.role !== 'admin') {
        // Redirect non-admins from admin-only pages to the dashboard
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default AuthLayout;
