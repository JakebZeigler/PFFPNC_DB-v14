import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ShowForm from '../components/ShowForm';
import { useData } from '../context/DataContext';
import { useToast } from '../components/Toast';
import { Show, DispositionModifier } from '../types';

const StatCard: React.FC<{ label: string; value: string | number; }> = ({ label, value }) => (
    <div className="bg-gray-50 dark:bg-neutral-700/50 p-4 rounded-lg text-center">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
);

const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div className="py-2">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{value || 'N/A'}</dd>
    </div>
);


const ShowDetailPage: React.FC = () => {
    const { showId } = useParams<{ showId: string }>();
    const { customers, getShowById, getDispositionById, addOrUpdateShow } = useData();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const show = useMemo(() => getShowById(showId!), [showId, getShowById]);

    const showStats = useMemo(() => {
        if (!show) return { totalSales: 0, totalPayments: 0, firstSale: null, lastSale: null };
        
        const relevantCustomers = customers.filter(c => c.showNumber === show.showNumber);
        
        const saleHistoryEntries = relevantCustomers.flatMap(c => c.dispositionHistory)
            .filter(h => getDispositionById(h.dispositionId)?.modifiers.includes(DispositionModifier.Sale));

        const paymentHistoryEntries = relevantCustomers.flatMap(c => c.dispositionHistory)
            .filter(h => getDispositionById(h.dispositionId)?.modifiers.includes(DispositionModifier.Payment));
        
        const totalSales = saleHistoryEntries.reduce((sum, h) => sum + (h.amount || 0), 0);
        const totalPayments = paymentHistoryEntries.reduce((sum, h) => sum + (h.amount || 0), 0);

        const saleDates = saleHistoryEntries.map(h => new Date(h.dispositionTime).getTime());
        const firstSale = saleDates.length ? new Date(Math.min(...saleDates)) : null;
        const lastSale = saleDates.length ? new Date(Math.max(...saleDates)) : null;

        return {
            totalSales,
            totalPayments,
            firstSale,
            lastSale
        };
    }, [show, customers, getDispositionById]);


    if (!show) {
        return (
             <div className="flex-1 flex flex-col">
                <Header title="Show Not Found" />
                <main className="flex-1 p-6 text-center">
                    <p>The requested show could not be found.</p>
                    <button onClick={() => navigate('/shows')} className="mt-4 bg-brand-red text-white font-bold py-2 px-4 rounded">Back to Shows</button>
                </main>
            </div>
        )
    }
    
    const handleSave = (showData: Show) => {
        addOrUpdateShow(showData);
        addToast('Show updated successfully', 'success');
        setIsModalOpen(false);
    }
    
    return (
        <div className="flex-1 flex flex-col h-screen">
            <Header title={show.showName}>
                <div>
                     <Link to="/shows" className="bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transition-colors mr-2">
                        Back to Shows
                    </Link>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-brand-red hover:bg-brand-red-dark text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Edit Show
                    </button>
                </div>
            </Header>
            <main className="flex-1 p-6 space-y-6 overflow-y-auto">
                 <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 border-b dark:border-neutral-700 pb-2 mb-4">Show Details</h3>
                    <dl className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
                        <DetailItem label="Show Number" value={show.showNumber} />
                        <DetailItem label="Genre" value={show.genre} />
                        <DetailItem label="Start Date" value={show.startDate ? new Date(show.startDate).toLocaleDateString() : 'N/A'} />
                        <DetailItem label="End Date" value={show.endDate ? new Date(show.endDate).toLocaleDateString() : 'N/A'} />
                    </dl>
                </div>

                <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Show Statistics</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Total Sales" value={`$${showStats.totalSales.toFixed(2)}`} />
                        <StatCard label="Total Payments" value={`$${showStats.totalPayments.toFixed(2)}`} />
                        <StatCard label="First Sale" value={showStats.firstSale ? showStats.firstSale.toLocaleDateString() : 'N/A'} />
                        <StatCard label="Last Sale" value={showStats.lastSale ? showStats.lastSale.toLocaleDateString() : 'N/A'} />
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Venues</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-neutral-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">Letter</th>
                                    <th className="px-6 py-3">Location</th>
                                    <th className="px-6 py-3">Play Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {show.venues.length > 0 ? show.venues.map(venue => (
                                    <tr key={venue.letter} className="border-b dark:border-neutral-700">
                                        <td className="px-6 py-4 font-bold">{venue.letter}</td>
                                        <td className="px-6 py-4">{venue.location}</td>
                                        <td className="px-6 py-4">{venue.playDate ? new Date(venue.playDate).toLocaleDateString() : 'N/A'}</td>
                                    </tr>
                                )) : (
                                     <tr><td colSpan={3} className="text-center py-4 text-gray-500">No venues for this show.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Edit Show: ${show.showName}`}>
                 <ShowForm
                    show={show}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                 />
            </Modal>
        </div>
    );
};

export default ShowDetailPage;