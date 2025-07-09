import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { Show } from '../types';
import { useData } from '../context/DataContext';
import ShowForm from '../components/ShowForm';

const ShowsPage: React.FC = () => {
    const { addToast } = useToast();
    const { shows, addOrUpdateShow, deleteShow } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedShow, setSelectedShow] = useState<Partial<Show> | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const sortedShows = useMemo(() => {
        return [...shows].sort((a, b) => a.showNumber - b.showNumber);
    }, [shows]);

    const paginatedShows = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedShows.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedShows, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(shows.length / itemsPerPage);
    
    const handleAdd = () => {
        setSelectedShow({});
        setIsModalOpen(true);
    };

    const handleEdit = (show: Show) => {
        setSelectedShow(show);
        setIsModalOpen(true);
    };

    const handleSave = (show: Show) => {
        const isNew = !show.id || !shows.some(s => s.id === show.id);
        addOrUpdateShow(show);
        addToast(isNew ? 'Show added' : 'Show updated', 'success');
        setIsModalOpen(false);
        setSelectedShow(null);
    };

    const handleDelete = (showToDelete: Show) => {
        if (showToDelete.isDefault) {
           addToast('Cannot delete default show', 'error');
           return;
        }
        if (window.confirm('Are you sure? This will reassign associated records to "No Show".')) {
            deleteShow(showToDelete.id, showToDelete.showNumber);
            addToast('Show deleted', 'success');
        }
    };
    
    return (
        <div className="flex-1 flex flex-col h-screen">
            <Header title="Shows">
                <button onClick={handleAdd} className="bg-brand-red hover:bg-brand-red-dark text-white font-bold py-2 px-4 rounded-lg">Add Show</button>
            </Header>
            <main className="flex-1 p-6 overflow-y-auto">
                 <div className="overflow-x-auto bg-white dark:bg-neutral-800 shadow-md rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-neutral-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Show #</th>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Genre</th>
                                <th scope="col" className="px-6 py-3">Start Date</th>
                                <th scope="col" className="px-6 py-3">End Date</th>
                                <th scope="col" className="px-6 py-3">Venues</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedShows.map(show => (
                                <tr key={show.id} className="bg-white dark:bg-neutral-800 border-b dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600">
                                    <td className="px-6 py-4">{show.showNumber} {show.isDefault && <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 ml-2">Default</span>}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        <Link to={`/shows/${show.id}`} className="hover:underline text-blue-600 dark:text-blue-400">
                                            {show.showName}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">{show.genre || 'N/A'}</td>
                                    <td className="px-6 py-4">{show.startDate || 'N/A'}</td>
                                    <td className="px-6 py-4">{show.endDate || 'N/A'}</td>
                                    <td className="px-6 py-4">{show.venues.length}</td>
                                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                        <Link to={`/shows/${show.id}`} className="font-medium text-green-600 dark:text-green-500 hover:underline">View</Link>
                                        <button onClick={() => handleEdit(show)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</button>
                                        {!show.isDefault && <button onClick={() => handleDelete(show)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {/* Pagination Controls */}
                 {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-gray-700 dark:text-gray-400">
                            Showing {paginatedShows.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to {Math.min(currentPage * itemsPerPage, sortedShows.length)} of {sortedShows.length} results
                        </span>
                        <div className="space-x-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium text-white bg-brand-red rounded-lg hover:bg-brand-red-dark disabled:bg-gray-400">Previous</button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium text-white bg-brand-red rounded-lg hover:bg-brand-red-dark disabled:bg-gray-400">Next</button>
                        </div>
                    </div>
                 )}
            </main>
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedShow(null); }} title={selectedShow?.id ? 'Edit Show' : 'Add Show'}>
                {selectedShow && <ShowForm show={selectedShow} onSave={handleSave} onClose={() => { setIsModalOpen(false); setSelectedShow(null); }} />}
            </Modal>
        </div>
    );
};

export default ShowsPage;