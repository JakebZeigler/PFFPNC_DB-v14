import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
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

const CustomersPage: React.FC = () => {
    const { addToast } = useToast();
    const { customers, agents, dispositions, getDispositionById, getAssociationById, deleteCustomer, deleteAllCustomers } = useData();
    const navigate = useNavigate();
    
    const [isDeleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;
    
    const [filters, setFilters] = useState({
        searchTerm: '',
        agentNumbers: new Set<number>(),
        dispositionIds: new Set<string>(),
        dateFrom: '',
        dateTo: '',
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const handleMultiSelectChange = (type: 'agentNumbers' | 'dispositionIds', id: number | string) => {
        setFilters(prev => {
            if (type === 'agentNumbers' && typeof id === 'number') {
                const newSet = new Set(prev.agentNumbers);
                if (newSet.has(id)) {
                    newSet.delete(id);
                } else {
                    newSet.add(id);
                }
                return { ...prev, agentNumbers: newSet };
            }
            if (type === 'dispositionIds' && typeof id === 'string') {
                const newSet = new Set(prev.dispositionIds);
                if (newSet.has(id)) {
                    newSet.delete(id);
                } else {
                    newSet.add(id);
                }
                return { ...prev, dispositionIds: newSet };
            }
            return prev;
        });
        setCurrentPage(1);
    };

    const formatCustomerType = (br?: string, cp?: string) => {
        const brText = br?.toUpperCase().startsWith('B') ? 'Business' : 'Residential';
        const cpText = cp?.toUpperCase().startsWith('P') ? 'PC' : 'Cold';
        return `${brText} / ${cpText}`;
    };

    const filteredCustomers = useMemo(() => {
        const startDate = filters.dateFrom ? new Date(filters.dateFrom.replace(/-/g, '/')) : null;
        if (startDate) {
            startDate.setHours(0, 0, 0, 0);
        }

        const endDate = filters.dateTo ? new Date(filters.dateTo.replace(/-/g, '/')) : null;
        if (endDate) {
            endDate.setHours(23, 59, 59, 999);
        }

        return customers.filter(customer => {
            const term = filters.searchTerm.toLowerCase();
            if (term && !(
                `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(term) ||
                customer.phone.toLowerCase().includes(term) ||
                customer.email?.toLowerCase().includes(term) ||
                customer.address?.toLowerCase().includes(term) ||
                customer.city?.toLowerCase().includes(term) ||
                customer.website?.toLowerCase().includes(term)
            )) {
                return false;
            }

            if (filters.agentNumbers.size > 0 && !filters.agentNumbers.has(customer.agentNumber)) {
                return false;
            }
            
            if (filters.dispositionIds.size > 0 && !filters.dispositionIds.has(customer.dispositionId)) {
                return false;
            }
            
            const dispTime = new Date(customer.dispositionTime).getTime();
            if (startDate && dispTime < startDate.getTime()) {
                return false;
            }
            if (endDate && dispTime > endDate.getTime()) {
                return false;
            }
            
            return true;
        });
    }, [customers, filters]);

    const paginatedCustomers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredCustomers, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            deleteCustomer(id);
            addToast('Customer deleted successfully', 'success');
        }
    };
    
    const handleConfirmDeleteAll = () => {
        const success = deleteAllCustomers(deleteConfirmText);
        if (success) {
            addToast('All customers have been deleted.', 'success');
            setDeleteAllModalOpen(false);
            setDeleteConfirmText('');
            setCurrentPage(1);
        } else {
            addToast('Verification failed. Customers not deleted.', 'error');
        }
    };

    return (
        <div className="flex-1 flex flex-col h-screen">
            <Header title="Customers">
                 <div className="flex space-x-2">
                    <button
                        onClick={() => setDeleteAllModalOpen(true)}
                        className="bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Delete All Customers
                    </button>
                    <button
                        onClick={() => navigate('/customers/add')}
                        className="bg-brand-red hover:bg-brand-red-dark text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Add Customer
                    </button>
                </div>
            </Header>
            <main className="flex-1 p-6 space-y-4 overflow-y-auto">
                <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Filter Customers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <input
                            type="text"
                            name="searchTerm"
                            placeholder="Search name, phone, email, address..."
                            value={filters.searchTerm}
                            onChange={handleFilterChange}
                            className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 lg:col-span-2"
                        />
                         <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600" title="From Date"/>
                         <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600" title="To Date"/>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                            <h4 className="font-semibold text-sm">Agents</h4>
                            {agents.map(agent => (
                                <label key={agent.id} className="flex items-center text-sm">
                                    <input type="checkbox" checked={filters.agentNumbers.has(agent.agentNumber)} onChange={() => handleMultiSelectChange('agentNumbers', agent.agentNumber)} className="mr-2"/>
                                    {agent.firstName} {agent.lastName}
                                </label>
                            ))}
                        </div>
                         <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                            <h4 className="font-semibold text-sm">Dispositions</h4>
                            {dispositions.map(disp => (
                                <label key={disp.id} className="flex items-center text-sm">
                                    <input type="checkbox" checked={filters.dispositionIds.has(disp.id)} onChange={() => handleMultiSelectChange('dispositionIds', disp.id)} className="mr-2"/>
                                    {disp.name}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto bg-white dark:bg-neutral-800 shadow-md rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-neutral-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">City</th>
                                <th scope="col" className="px-6 py-3">Contact</th>
                                <th scope="col" className="px-6 py-3">Type</th>
                                <th scope="col" className="px-6 py-3">Association</th>
                                <th scope="col" className="px-6 py-3">Disposition</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCustomers.map(customer => (
                                <tr key={customer.id} className="bg-white dark:bg-neutral-800 border-b dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        <Link to={`/customers/${customer.id}`} className="hover:underline text-blue-600 dark:text-blue-400">
                                          {customer.firstName} {customer.lastName}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">{customer.city || 'N/A'}</td>
                                    <td className="px-6 py-4">{customer.phone}<br/>{customer.email}</td>
                                    <td className="px-6 py-4">{formatCustomerType(customer.businessResidential, customer.coldPc)}</td>
                                    <td className="px-6 py-4">{getAssociationById(customer.associationId)?.associationName || customer.associationId}</td>
                                    <td className="px-6 py-4">{getDispositionById(customer.dispositionId)?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                        <Link to={`/customers/${customer.id}/edit`} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</Link>
                                        <button onClick={() => handleDelete(customer.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                             {paginatedCustomers.length === 0 && (
                                <tr className="bg-white dark:bg-neutral-800 border-b dark:border-neutral-700">
                                    <td colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">No customers found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-700 dark:text-gray-400">
                        Showing {paginatedCustomers.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} results
                    </span>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </main>
            <Modal isOpen={isDeleteAllModalOpen} onClose={() => {setDeleteAllModalOpen(false); setDeleteConfirmText('');}} title="Confirm Delete All Customers">
                <div className="space-y-4">
                    <p className="text-red-500 font-bold">This is a permanent action and cannot be undone. All customer records will be deleted.</p>
                    <p>Please type <strong className="text-red-500 dark:text-red-400">DELETE ALL</strong> below to confirm.</p>
                    <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"
                        aria-label="Confirm delete by typing DELETE ALL"
                    />
                    <div className="flex justify-end space-x-2 pt-2">
                        <button onClick={() => {setDeleteAllModalOpen(false); setDeleteConfirmText('');}} className="px-4 py-2 bg-gray-200 dark:bg-neutral-600 rounded-md">Cancel</button>
                        <button
                            onClick={handleConfirmDeleteAll}
                            disabled={deleteConfirmText !== 'DELETE ALL'}
                            className="px-4 py-2 bg-red-600 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Delete All Customers
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CustomersPage;