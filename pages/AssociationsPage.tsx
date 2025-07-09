import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useToast } from '../components/Toast';
import { Association, DispositionModifier } from '../types';
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

const AssociationsPage: React.FC = () => {
    const { addToast } = useToast();
    const { associations, deleteAssociation } = useData();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;
    
    const sortedAssociations = useMemo(() => {
        return [...associations].sort((a,b) => a.associationId.localeCompare(b.associationId));
    }, [associations]);

    const paginatedAssociations = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedAssociations.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedAssociations, currentPage]);

    const totalPages = Math.ceil(sortedAssociations.length / itemsPerPage);
    
    const handleDelete = (assocToDelete: Association) => {
        if (assocToDelete.isDefault) {
            addToast('Cannot delete default association', 'error');
            return;
        }
        if (window.confirm('Are you sure? This will reassign associated records to "PFF".')) {
            deleteAssociation(assocToDelete.id, assocToDelete.associationId);
            addToast('Association deleted', 'success');
        }
    }
    
    return (
        <div className="flex-1 flex flex-col h-screen">
            <Header title="Associations">
                <button onClick={() => navigate('/associations/add')} className="bg-brand-red hover:bg-brand-red-dark text-white font-bold py-2 px-4 rounded-lg">Add Association</button>
            </Header>
            <main className="flex-1 p-6 overflow-y-auto">
                <div className="overflow-x-auto bg-white dark:bg-neutral-800 shadow-md rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-neutral-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">ID</th>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Associated City</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedAssociations.map(assoc => {
                                return (
                                    <tr key={assoc.id} className="bg-white dark:bg-neutral-800 border-b dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600">
                                        <td className="px-6 py-4 font-bold">{assoc.associationId} {assoc.isDefault && <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 ml-2">Default</span>}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            <Link to={`/associations/${assoc.id}`} className="hover:underline text-blue-600 dark:text-blue-400">
                                                {assoc.associationName}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">{assoc.associatedCity || 'N/A'}</td>
                                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                            <Link to={`/associations/${assoc.id}`} className="font-medium text-green-600 dark:text-green-500 hover:underline">View</Link>
                                            <Link to={`/associations/${assoc.id}/edit`} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</Link>
                                            {!assoc.isDefault && <button onClick={() => handleDelete(assoc)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                 <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-700 dark:text-gray-400">
                        Showing {paginatedAssociations.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to {Math.min(currentPage * itemsPerPage, sortedAssociations.length)} of {sortedAssociations.length} results
                    </span>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </main>
        </div>
    );
};

export default AssociationsPage;