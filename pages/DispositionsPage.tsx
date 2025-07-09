import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useToast } from '../components/Toast';
import { Disposition, DispositionModifier } from '../types';
import { useData } from '../context/DataContext';

const Pagination: React.FC<{ currentPage: number, totalPages: number, onPageChange: (page: number) => void }> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="space-x-2">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium text-white bg-brand-red rounded-lg hover:bg-brand-red-dark disabled:bg-gray-400">Previous</button>
            <span className="text-sm text-gray-700 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium text-white bg-brand-red rounded-lg hover:bg-brand-red-dark disabled:bg-gray-400">Next</button>
        </div>
    );
};

const formatModifiers = (d: Disposition): React.ReactNode => {
    if (d.modifiers.length === 0) return "None";

    return d.modifiers.map(mod => {
        let text: string = mod;
        if (mod === DispositionModifier.TimeOut && d.timeOutDays) {
            text = `TimeOut (${d.timeOutDays} days)`;
        }
        if (mod === DispositionModifier.ExcludeCount && d.excludeAfterAttempts) {
            let actionText = '';
            if (d.excludeAction === 'DNC') actionText = ' -> DNC';
            if (d.excludeAction === 'TimeOut' && d.excludeActionTimeOutDays) actionText = ` -> TimeOut (${d.excludeActionTimeOutDays} days)`;
            text = `Exclude (${d.excludeAfterAttempts} attempts${actionText})`;
        }
        return (
            <span key={mod} className="text-xs bg-gray-200 dark:bg-neutral-600 text-gray-800 dark:text-gray-200 rounded-full px-2 py-0.5 whitespace-nowrap">{text}</span>
        );
    });
};


const DispositionsPage: React.FC = () => {
    const { addToast } = useToast();
    const { dispositions, customers, deleteDisposition } = useData();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;
    
    const usageCounts = useMemo(() => {
        const counts = new Map<string, number>();
        customers.forEach(c => {
            counts.set(c.dispositionId, (counts.get(c.dispositionId) || 0) + 1);
        });
        return counts;
    }, [customers]);

    const paginatedDispositions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return dispositions.slice(startIndex, startIndex + itemsPerPage);
    }, [dispositions, currentPage]);

    const totalPages = Math.ceil(dispositions.length / itemsPerPage);

    const handleDelete = (disposition: Disposition) => {
         if (disposition.isDefault) {
             addToast('Cannot delete a default system record.', 'error');
             return;
         }
        if (window.confirm('Are you sure? Deleting this will reassign all related customers to "No Disposition".')) {
            deleteDisposition(disposition.id);
            addToast('Disposition deleted successfully', 'success');
        }
    };
    
    return (
        <div className="flex-1 flex flex-col h-screen">
            <Header title="Dispositions">
                <button onClick={() => navigate('/dispositions/add')} className="bg-brand-red hover:bg-brand-red-dark text-white font-bold py-2 px-4 rounded-lg">Add Disposition</button>
            </Header>
            <main className="flex-1 p-6 overflow-y-auto">
                <div className="overflow-x-auto bg-white dark:bg-neutral-800 shadow-md rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-neutral-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Modifiers</th>
                                <th scope="col" className="px-6 py-3">Usage Count</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedDispositions.map(d => (
                                <tr key={d.id} className="bg-white dark:bg-neutral-800 border-b dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        <Link to={`/dispositions/${d.id}`} className="hover:underline text-blue-600 dark:text-blue-400">
                                            {d.name}
                                        </Link>
                                        {d.isDefault && <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 ml-2">System Default</span>}
                                    </td>
                                    <td className="px-6 py-4 flex flex-wrap gap-1">
                                        {formatModifiers(d)}
                                    </td>
                                    <td className="px-6 py-4">{d.isDefault ? 'N/A' : (usageCounts.get(d.id) || 0)}</td>
                                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                        <Link to={`/dispositions/${d.id}`} className="font-medium text-green-600 dark:text-green-500 hover:underline">View</Link>
                                        <Link to={`/dispositions/${d.id}/edit`} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</Link>
                                        {!d.isDefault && <button onClick={() => handleDelete(d)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-between items-center mt-4">
                     <span className="text-sm text-gray-700 dark:text-gray-400">
                        Showing {paginatedDispositions.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to {Math.min(currentPage * itemsPerPage, dispositions.length)} of {dispositions.length} results
                    </span>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </main>
        </div>
    );
};

export default DispositionsPage;