
import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import Spinner from '../components/Spinner';
import { DispositionModifier } from '../types';

const DetailItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{children}</dd>
    </div>
);

const LineChart: React.FC<{ data: { date: Date; value: number }[]; height?: number; width?: number }> = ({ data, height = 200, width = 500 }) => {
    if (data.length < 2) {
        return <div style={{height}} className="flex items-center justify-center text-gray-500">Not enough data for chart</div>;
    }
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const maxX = Math.max(...data.map(d => d.date.getTime()));
    const minX = Math.min(...data.map(d => d.date.getTime()));
    const maxY = Math.max(...data.map(d => d.value));
    
    const getX = (date: Date) => ((date.getTime() - minX) / (maxX - minX)) * chartWidth + padding;
    const getY = (value: number) => chartHeight - (value / maxY) * chartHeight + padding;

    const path = data.map((d, i) => {
        const x = getX(d.date);
        const y = getY(d.value);
        return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Line chart of disposition usage over 30 days">
            {/* Y Axis */}
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#9ca3af" />
            <text x="10" y={padding} fontSize="12" fill="#6b7280">{maxY}</text>
            <text x="10" y={height - padding} fontSize="12" fill="#6b7280">0</text>

             {/* X Axis */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#9ca3af" />
             <text x={padding} y={height - padding + 15} fontSize="12" fill="#6b7280">{new Date(minX).toLocaleDateString()}</text>
             <text x={width - padding} y={height - padding + 15} textAnchor="end" fontSize="12" fill="#6b7280">{new Date(maxX).toLocaleDateString()}</text>

            <path d={path} fill="none" stroke="#B91C1C" strokeWidth="2" />
        </svg>
    );
};


const DispositionDetailPage: React.FC = () => {
    const { dispositionId } = useParams<{ dispositionId: string }>();
    const navigate = useNavigate();
    const { dispositions, customers } = useData();

    const disposition = useMemo(() => dispositions.find(d => d.id === dispositionId), [dispositionId, dispositions]);
    
    const stats = useMemo(() => {
        if (!disposition) return { totalUsage: 0, firstUsed: null, lastUsed: null, dailyUsage: [] };
        
        const relevantHistory = customers.flatMap(c => c.dispositionHistory.filter(h => h.dispositionId === disposition.id));
        const totalUsage = relevantHistory.length;
        
        if (totalUsage === 0) return { totalUsage: 0, firstUsed: null, lastUsed: null, dailyUsage: [] };

        const timestamps = relevantHistory.map(h => new Date(h.dispositionTime).getTime());
        const firstUsed = new Date(Math.min(...timestamps));
        const lastUsed = new Date(Math.max(...timestamps));

        const dailyUsageMap = new Map<string, number>();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        relevantHistory.forEach(h => {
            const date = new Date(h.dispositionTime);
            if (date >= thirtyDaysAgo) {
                const dateString = date.toISOString().split('T')[0];
                dailyUsageMap.set(dateString, (dailyUsageMap.get(dateString) || 0) + 1);
            }
        });

        const dailyUsage = Array.from(dailyUsageMap.entries())
            .map(([date, value]) => ({ date: new Date(date), value }))
            .sort((a,b) => a.date.getTime() - b.date.getTime());

        return { totalUsage, firstUsed, lastUsed, dailyUsage };

    }, [disposition, customers]);

    if (!disposition) {
        return <div className="flex-1 flex items-center justify-center"><Spinner /> <p className="ml-2">Loading disposition...</p></div>;
    }

    return (
        <div className="flex-1 flex flex-col h-screen">
            <Header title={`Disposition: ${disposition.name}`}>
                <div className="flex space-x-2">
                    <button onClick={() => navigate('/dispositions')} className="px-4 py-2 bg-gray-200 dark:bg-neutral-600 rounded-md text-sm">Back to List</button>
                    {!disposition.isDefault && <Link to={`/dispositions/${disposition.id}/edit`} className="bg-brand-red hover:bg-brand-red-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">Edit Disposition</Link>}
                </div>
            </Header>
            <main className="flex-1 p-6 overflow-y-auto space-y-6">
                 <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 border-b dark:border-neutral-700 pb-2 mb-4">Details & Configuration</h3>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <DetailItem label="Disposition Name">
                            <span className="font-bold">{disposition.name}</span>
                        </DetailItem>
                         <DetailItem label="Active Modifiers">
                            <div className="flex flex-wrap gap-2">
                                {disposition.modifiers.length > 0 ? disposition.modifiers.map(mod => (
                                    <span key={mod} className="text-xs bg-gray-200 dark:bg-neutral-600 text-gray-800 dark:text-gray-200 rounded-full px-3 py-1 font-semibold">{mod}</span>
                                )) : "None"}
                            </div>
                        </DetailItem>
                         {disposition.modifiers.includes(DispositionModifier.TimeOut) && (
                            <DetailItem label="Timeout Duration">
                                <span className="font-bold">{disposition.timeOutDays || 'Not set'} days</span>
                            </DetailItem>
                        )}
                        {disposition.modifiers.includes(DispositionModifier.ExcludeCount) && (
                            <>
                                <DetailItem label="Exclude After">
                                    <span className="font-bold">{disposition.excludeAfterAttempts || 'Not set'} attempts</span>
                                </DetailItem>
                                <DetailItem label="Action After Exclusion">
                                    <span className="font-bold">{disposition.excludeAction || 'None'}</span>
                                    {disposition.excludeAction === 'TimeOut' && (
                                        <span className="ml-2">({disposition.excludeActionTimeOutDays || 'Not set'} days)</span>
                                    )}
                                </DetailItem>
                            </>
                        )}
                    </dl>
                 </div>
                 
                <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Usage Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="bg-gray-50 dark:bg-neutral-700/50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Usage Count</p>
                            <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">{stats.totalUsage}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-neutral-700/50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">First Used</p>
                            <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">{stats.firstUsed ? stats.firstUsed.toLocaleDateString() : 'N/A'}</p>
                        </div>
                         <div className="bg-gray-50 dark:bg-neutral-700/50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Used</p>
                            <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">{stats.lastUsed ? stats.lastUsed.toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                 </div>

                 <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">30-Day Daily Usage</h3>
                     <div className="mt-4">
                        <LineChart data={stats.dailyUsage} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DispositionDetailPage;