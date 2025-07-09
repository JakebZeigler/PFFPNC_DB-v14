
import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import Spinner from '../components/Spinner';
import { DispositionModifier } from '../types';

const DetailItem: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{value || 'N/A'}</dd>
    </div>
);

const StatCard: React.FC<{ label: string; value: string | number; }> = ({ label, value }) => (
    <div className="bg-gray-50 dark:bg-neutral-700/50 p-4 rounded-lg text-center">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
);


const AssociationDetailPage: React.FC = () => {
    const { assocId } = useParams<{ assocId: string }>();
    const navigate = useNavigate();
    const { getAssociationByDbId, customers, getDispositionById } = useData();
    
    const association = useMemo(() => getAssociationByDbId(assocId!), [assocId, getAssociationByDbId]);

    const stats = useMemo(() => {
        if (!association) return { memberCount: 0, totalSales: 0, totalPayments: 0 };
        
        const relevantCustomers = customers.filter(c => c.associationId === association.associationId);
        let totalSales = 0;
        let totalPayments = 0;

        relevantCustomers.forEach(c => {
            c.dispositionHistory.forEach(h => {
                const disp = getDispositionById(h.dispositionId);
                if(disp?.modifiers.includes(DispositionModifier.Sale)) {
                    totalSales += h.amount || 0;
                }
                if(disp?.modifiers.includes(DispositionModifier.Payment)) {
                    totalPayments += h.amount || 0;
                }
            });
        });
        
        return {
            memberCount: relevantCustomers.length,
            totalSales,
            totalPayments
        };
    }, [association, customers, getDispositionById]);

    if (!association) {
        return <div className="flex-1 flex items-center justify-center"><Spinner /> <p className="ml-2">Loading association...</p></div>;
    }

    return (
        <div className="flex-1 flex flex-col h-screen">
            <Header title={association.associationName}>
                <div className="flex space-x-2">
                    <button onClick={() => navigate('/associations')} className="px-4 py-2 bg-gray-200 dark:bg-neutral-600 rounded-md text-sm">Back to List</button>
                    {!association.isDefault && <Link to={`/associations/${association.id}/edit`} className="bg-brand-red hover:bg-brand-red-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">Edit Association</Link>}
                </div>
            </Header>
            <main className="flex-1 p-6 overflow-y-auto space-y-6">
                <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 border-b dark:border-neutral-700 pb-2 mb-4">Details</h3>
                    <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
                        <DetailItem label="Association ID" value={association.associationId} />
                        <DetailItem label="Association Name" value={association.associationName} />
                        <DetailItem label="Associated City" value={association.associatedCity} />
                    </dl>
                </div>

                <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard label="Total Members" value={stats.memberCount} />
                        <StatCard label="Total Sales Amount" value={`$${stats.totalSales.toFixed(2)}`} />
                        <StatCard label="Total Payment Amount" value={`$${stats.totalPayments.toFixed(2)}`} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AssociationDetailPage;
