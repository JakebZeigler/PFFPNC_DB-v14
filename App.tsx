
import React from 'react';
import { HashRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { ToastProvider } from './components/Toast';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthLayout from './components/AuthLayout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import CustomerFormPage from './pages/CustomerFormPage';
import ReportsPage from './pages/ReportsPage';
import ImportPage from './pages/ImportPage';
import ExportPage from './pages/ExportPage';
import AgentsPage from './pages/AgentsPage';
import DispositionsPage from './pages/DispositionsPage';
import DispositionFormPage from './pages/DispositionFormPage';
import DispositionDetailPage from './pages/DispositionDetailPage';
import ShowsPage from './pages/ShowsPage';
import ShowDetailPage from './pages/ShowDetailPage';
import AssociationsPage from './pages/AssociationsPage';
import AssociationDetailPage from './pages/AssociationDetailPage';
import AssociationFormPage from './pages/AssociationFormPage';
import UsersPage from './pages/UsersPage';

const AppContainer: React.FC = () => {
    const { user } = useAuth();
    
    // If user is logged in, show the main app layout. Otherwise, show public routes.
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected Routes */}
            <Route element={<AuthLayout />}>
                 <Route path="/" element={<MainLayout />}>
                    <Route index element={<DashboardPage />} />
                    
                    <Route path="customers" element={<CustomersPage />} />
                    <Route path="customers/add" element={<CustomerFormPage />} />
                    <Route path="customers/:customerId" element={<CustomerDetailPage />} />
                    <Route path="customers/:customerId/edit" element={<CustomerFormPage />} />
                    
                    <Route path="reports" element={<Navigate to="/reports/customers" />} />
                    <Route path="reports/:reportType" element={<ReportsPage />} />

                    <Route path="import" element={<ImportPage />} />
                    <Route path="export" element={<ExportPage />} />
                    
                    <Route path="agents" element={<AgentsPage />} />
                    
                    <Route path="dispositions" element={<DispositionsPage />} />
                    <Route path="dispositions/add" element={<DispositionFormPage />} />
                    <Route path="dispositions/:dispositionId" element={<DispositionDetailPage />} />
                    <Route path="dispositions/:dispositionId/edit" element={<DispositionFormPage />} />

                    <Route path="shows" element={<ShowsPage />} />
                    <Route path="shows/:showId" element={<ShowDetailPage />} />
                    
                    <Route path="associations" element={<AssociationsPage />} />
                    <Route path="associations/add" element={<AssociationFormPage />} />
                    <Route path="associations/:assocId" element={<AssociationDetailPage />} />
                    <Route path="associations/:assocId/edit" element={<AssociationFormPage />} />
                    
                    {/* Admin Only Route */}
                    <Route element={<AuthLayout adminOnly={true} />}>
                       <Route path="users" element={<UsersPage />} />
                    </Route>
                 </Route>
            </Route>
            {/* Fallback for any other path */}
            <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Routes>
    )
}

const MainLayout: React.FC = () => (
    <div className="flex h-screen bg-gray-100 dark:bg-neutral-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* The Header is no longer part of the Outlet, it's defined per-page */}
            <Outlet />
        </div>
    </div>
);

const App: React.FC = () => {
    return (
        <ToastProvider>
            <DataProvider>
                <AuthProvider>
                    <HashRouter>
                        <AppContainer />
                    </HashRouter>
                </AuthProvider>
            </DataProvider>
        </ToastProvider>
    );
};

export default App;
