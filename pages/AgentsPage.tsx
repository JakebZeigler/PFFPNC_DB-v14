import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { Agent } from '../types';
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

const AgentForm: React.FC<{ agent: Partial<Agent>, onSave: (a: Agent) => void, onClose: () => void }> = ({ agent, onSave, onClose }) => {
    const [formData, setFormData] = useState(agent);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'agentNumber') {
            const numValue = parseInt(value, 10);
            setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? undefined : numValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Agent);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Agent Number</label>
                    <input type="number" name="agentNumber" value={formData.agentNumber ?? ''} onChange={handleChange} required disabled={agent.isDefault}
                        className="mt-1 block w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 disabled:bg-gray-200 dark:disabled:bg-neutral-600"/>
                </div>
                <div>
                    <label className="block text-sm font-medium">First Name</label>
                    <input name="firstName" value={formData.firstName || ''} onChange={handleChange} required disabled={agent.isDefault}
                        className="mt-1 block w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 disabled:bg-gray-200 dark:disabled:bg-neutral-600"/>
                </div>
                <div>
                    <label className="block text-sm font-medium">Last Name</label>
                    <input name="lastName" value={formData.lastName || ''} onChange={handleChange} required disabled={agent.isDefault}
                        className="mt-1 block w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 disabled:bg-gray-200 dark:disabled:bg-neutral-600"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium">Phone</label>
                    <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} disabled={agent.isDefault}
                        className="mt-1 block w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 disabled:bg-gray-200 dark:disabled:bg-neutral-600"/>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Email</label>
                    <input type="email" name="email" value={formData.email || ''} onChange={handleChange} disabled={agent.isDefault}
                        className="mt-1 block w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 disabled:bg-gray-200 dark:disabled:bg-neutral-600"/>
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-neutral-600 rounded-md">Cancel</button>
                {!agent.isDefault && <button type="submit" className="px-4 py-2 bg-brand-red text-white rounded-md">Save</button>}
            </div>
        </form>
    );
};

const AgentsPage: React.FC = () => {
    const { addToast } = useToast();
    const { agents, customers, addOrUpdateAgent, deleteAgent } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Partial<Agent> | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const paginatedAgents = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return agents.slice(startIndex, startIndex + itemsPerPage);
    }, [agents, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(agents.length / itemsPerPage);

    const handleSave = (agent: Agent) => {
        const isNew = !agent.id;
        addOrUpdateAgent(agent);
        addToast(isNew ? 'Agent added' : 'Agent updated', 'success');
        setIsModalOpen(false);
    };

    const handleDelete = (agentToDelete: Agent) => {
        if (agentToDelete.isDefault) {
           addToast('Cannot delete default agent', 'error');
           return;
        }
        if (window.confirm('Are you sure? This will reassign associated records to the default "Office" agent.')) {
            deleteAgent(agentToDelete.id, agentToDelete.agentNumber);
            addToast('Agent deleted', 'success');
        }
    };
    
    const getUsageCount = (agentNumber: number) => {
        return customers.filter(c => c.agentNumber === agentNumber).length;
    };

    return (
        <div className="flex-1 flex flex-col h-screen">
            <Header title="Agents">
                <button onClick={() => { setSelectedAgent({}); setIsModalOpen(true); }} className="bg-brand-red hover:bg-brand-red-dark text-white font-bold py-2 px-4 rounded-lg">Add Agent</button>
            </Header>
            <main className="flex-1 p-6 overflow-y-auto">
                <div className="overflow-x-auto bg-white dark:bg-neutral-800 shadow-md rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-neutral-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Agent #</th>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Phone</th>
                                <th scope="col" className="px-6 py-3">Email</th>
                                <th scope="col" className="px-6 py-3">Usage Count</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedAgents.map(agent => (
                                <tr key={agent.id} className="bg-white dark:bg-neutral-800 border-b dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600">
                                    <td className="px-6 py-4">{agent.agentNumber} {agent.isDefault && <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 ml-2">Default</span>}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{agent.firstName} {agent.lastName}</td>
                                    <td className="px-6 py-4">{agent.phone || 'N/A'}</td>
                                    <td className="px-6 py-4">{agent.email || 'N/A'}</td>
                                    <td className="px-6 py-4">{agent.isDefault ? 'N/A' : getUsageCount(agent.agentNumber)}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => { setSelectedAgent(agent); setIsModalOpen(true); }} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</button>
                                        {!agent.isDefault && <button onClick={() => handleDelete(agent)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="flex justify-between items-center mt-4">
                     <span className="text-sm text-gray-700 dark:text-gray-400">
                        Showing {paginatedAgents.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to {Math.min(currentPage * itemsPerPage, agents.length)} of {agents.length} results
                    </span>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </main>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedAgent?.id ? 'Edit Agent' : 'Add Agent'}>
                {selectedAgent && <AgentForm agent={selectedAgent} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            </Modal>
        </div>
    );
};

export default AgentsPage;