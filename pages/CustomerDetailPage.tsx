
import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { DispositionHistory, DispositionModifier } from '../types';

const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div className="py-1">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{value || 'N/A'}</dd>
    </div>
);

const HistoryTable: React.FC<{ title: string; history: DispositionHistory[]; showAmount?: boolean }> = ({ title, history, showAmount = false }) => {
    const { getDispositionById, getAgentByNumber } = useData();
    const columns = showAmount 
        ? ['Date', 'Disposition', 'Agent', 'Amount', 'Tickets', 'Notes']
        : ['Date', 'Disposition', 'Agent', 'Notes'];

    return (
        <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
            <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                     <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-neutral-700 dark:text-gray-400 sticky top-0">
                        <tr>
                            {columns.map(col => <th key={col} scope="col" className="px-4 py-2">{col}</th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-neutral-800">
                        {history.length > 0 ? [...history].sort((a,b) => new Date(b.dispositionTime).getTime() - new Date(a.dispositionTime).getTime()).map((h, index) => {
                            const disposition = getDispositionById(h.dispositionId);
                            const agent = getAgentByNumber(h.agentNumber);
                            return (
                                <tr key={index} className="border-b dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600">
                                    <td className="px-4 py-2 whitespace-nowrap">{new Date(h.dispositionTime).toLocaleString()}</td>
                                    <td className="px-4 py-2">{disposition?.name || 'Unknown'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{agent ? `${agent.firstName} ${agent.lastName}` : 'Unknown'}</td>
                                    {showAmount && <td className="px-4 py-2">{h.amount ? `$${h.amount.toFixed(2)}` : 'N/A'}</td>}
                                    {showAmount && <td className="px-4 py-2">{h.ticketsAd || 'N/A'}</td>}
                                    <td className="px-4 py-2 truncate" title={h.currentNotes}>{h.currentNotes}</td>
                                </tr>
                            )
                        }) : (
                             <tr><td colSpan={columns.length} className="text-center py-4 text-gray-500">No history found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const CustomerDetailPage: React.FC = () => {
    const { customerId } = useParams<{ customerId: string }>();
    const { customers, deleteCustomer, getShowByNumber, getAssociationById, getDispositionById } = useData();
    const navigate = useNavigate();

    const customer = useMemo(() => customers.find(c => c.id === customerId), [customerId, customers]);

    const salesAndPaymentsHistory = useMemo(() => {
        if (!customer) return [];
        return customer.dispositionHistory.filter(h => {
            const disp = getDispositionById(h.dispositionId);
            return disp?.modifiers.includes(DispositionModifier.Payment) || disp?.modifiers.includes(DispositionModifier.Sale);
        });
    }, [customer, getDispositionById]);

    if (!customer) {
        return (
             <div className="flex-1 flex flex-col">
                <Header title="Customer Not Found" />
                <main className="flex-1 p-6 text-center">
                    <p>The requested customer could not be found.</p>
                    <button onClick={() => navigate('/customers')} className="mt-4 bg-brand-red text-white font-bold py-2 px-4 rounded">Back to Customers</button>
                </main>
            </div>
        )
    }

    const handleDelete = () => {
        if(window.confirm('Are you sure you want to delete this customer?')) {
            deleteCustomer(customer.id);
            navigate('/customers');
        }
    }

    const show = getShowByNumber(customer.showNumber);
    const association = getAssociationById(customer.associationId);
    
    const formattedCustomerType = useMemo(() => {
        if (!customer) return 'N/A';
        const brText = customer.businessResidential?.toUpperCase().startsWith('B') ? 'Business' : 'Residential';
        const cpText = customer.coldPc?.toUpperCase().startsWith('P') ? 'PC' : 'Cold';
        return `${brText} / ${cpText}`;
    }, [customer]);

    return (
        <div className="flex-1 flex flex-col h-screen">
            <Header title={`${customer.firstName} ${customer.lastName}`}>
                <div className="flex items-center space-x-2">
                    <button onClick={() => navigate('/customers')} className="px-4 py-2 bg-gray-200 dark:bg-neutral-600 rounded-md text-sm">Back to List</button>
                    <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm">Delete Customer</button>
                    <Link to={`/customers/${customer.id}/edit`} className="bg-brand-red hover:bg-brand-red-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Edit Customer
                    </Link>
                </div>
            </Header>
            <main className="flex-1 p-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                         <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b dark:border-neutral-700 pb-2">Contact Details</h3>
                            <dl className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                <DetailItem label="Full Name" value={`${customer.title || ''} ${customer.firstName} ${customer.middleName || ''} ${customer.lastName}`} />
                                <DetailItem label="Phone" value={customer.phone} />
                                <DetailItem label="Email" value={customer.email} />
                                <DetailItem label="Website" value={customer.website} />
                                <DetailItem label="Address" value={`${customer.address}, ${customer.city}, ${customer.state} ${customer.zip}`} />
                            </dl>
                        </div>
                        <HistoryTable title="Sales & Payments History" history={salesAndPaymentsHistory} showAmount={true}/>
                    </div>
                    {/* Right Column */}
                     <div className="space-y-6">
                        <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b dark:border-neutral-700 pb-2">Business Details</h3>
                            <dl className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                               <DetailItem label="Type" value={formattedCustomerType} />
                               <DetailItem label="Show" value={show ? `${show.showNumber} - ${show.showName}`: customer.showNumber} />
                               <DetailItem label="Association" value={association?.associationName || customer.associationId} />
                               <DetailItem label="Latest Program" value={customer.program} />
                               <DetailItem label="Latest Lead List" value={customer.leadList} />
                            </dl>
                        </div>
                        <HistoryTable title="Full Disposition History" history={customer.dispositionHistory} />
                    </div>
                </div>

            </main>
        </div>
    );
};

export default CustomerDetailPage;
