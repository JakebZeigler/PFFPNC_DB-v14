import React from 'react';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { User } from '../types';

const UsersPage: React.FC = () => {
    const { users, updateUser, deleteUser } = useData();
    const { user: currentUser } = useAuth();
    const { addToast } = useToast();

    const handleApprove = (userToApprove: User) => {
        updateUser({ ...userToApprove, status: 'active' });
        addToast(`${userToApprove.firstName}'s account has been approved.`, 'success');
        // In a real application, an email would be sent to the user here.
    };
    
    const handleRoleChange = (userToUpdate: User) => {
        const newRole = userToUpdate.role === 'admin' ? 'user' : 'admin';
        updateUser({ ...userToUpdate, role: newRole });
        addToast(`${userToUpdate.firstName}'s role changed to ${newRole}.`, 'success');
    };

    const handleDelete = (userToDelete: User) => {
        if(window.confirm(`Are you sure you want to delete the user ${userToDelete.firstName} ${userToDelete.lastName}? This action cannot be undone.`)) {
            deleteUser(userToDelete.id);
            addToast('User deleted successfully.', 'success');
        }
    };

    const getStatusChip = (status: 'active' | 'pending') => {
        const baseClasses = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
        if (status === 'active') {
            return <span className={`${baseClasses} bg-green-100 text-green-800`}>Active</span>;
        }
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending Approval</span>
    };

    return (
        <div className="flex-1 flex flex-col h-screen">
            <Header title="User Management" />
            <main className="flex-1 p-6 overflow-y-auto">
                <div className="overflow-x-auto bg-white dark:bg-neutral-800 shadow-md rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-neutral-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Email</th>
                                <th scope="col" className="px-6 py-3">Role</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="bg-white dark:bg-neutral-800 border-b dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                        {user.firstName} {user.lastName}
                                        {user.id === currentUser?.id && <span className="text-xs text-blue-500 ml-2">(You)</span>}
                                    </td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4 capitalize">{user.role}</td>
                                    <td className="px-6 py-4">{getStatusChip(user.status)}</td>
                                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                        {user.status === 'pending' && (
                                            <button onClick={() => handleApprove(user)} className="font-medium text-green-600 dark:text-green-500 hover:underline">Approve</button>
                                        )}
                                        {user.id !== currentUser?.id && (
                                            <>
                                                <button onClick={() => handleRoleChange(user)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                                                    {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                                                </button>
                                                <button onClick={() => handleDelete(user)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default UsersPage;
