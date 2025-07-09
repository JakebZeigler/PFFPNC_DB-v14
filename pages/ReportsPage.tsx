
import React, { useState, useMemo, FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { CustomerWithHistory, Agent, Disposition, Show, Association, DispositionModifier, DispositionHistory } from '../types';
import { downloadCSV, objectToCsv } from '../utils/csv';
import DownloadIcon from '../components/icons/DownloadIcon';
import { useToast } from '../components/Toast';

type AugmentedHistoryRecord = DispositionHistory & { customer: CustomerWithHistory };

// --- SHARED COMPONENTS WITHIN REPORTS ---

const Pagination: FC<{ currentPage: number, totalPages: number, onPageChange: (page: number) => void }> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (
        <div className="flex items-center space-x-1">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 text-sm font-medium text-white bg-brand-red rounded-md hover:bg-brand-red-dark disabled:bg-gray-400 disabled:cursor-not-allowed">Prev</button>
            <span className="text-sm px-2 text-gray-600 dark:text-gray-400">{`Page ${currentPage} of ${totalPages}`}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 text-sm font-medium text-white bg-brand-red rounded-md hover:bg-brand-red-dark disabled:bg-gray-400 disabled:cursor-not-allowed">Next</button>
        </div>
    );
};

const ReportStatCard: FC<{ label: string; value: string | number; subValue?: string; className?: string }> = ({ label, value, subValue, className = '' }) => (
    <div className={`bg-gray-50 dark:bg-neutral-700/50 p-4 rounded-lg text-center ${className}`}>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
        {subValue && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subValue}</p>}
    </div>
);

const BarChart: FC<{ data: { label: string; value: number; color?: string }[]; height?: number }> = ({ data, height = 200 }) => {
    const maxValue = Math.max(...data.map(d => d.value), 0);
    if (maxValue === 0) return <div style={{ height }} className="flex items-center justify-center text-gray-500">No data to display.</div>;
    return (
        <div className="flex items-end space-x-2" style={{ height }}>
            {data.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center justify-end">
                    <div className="text-xs font-bold text-gray-700 dark:text-gray-200">{item.value}</div>
                    <div
                        className="w-full rounded-t-md"
                        style={{ height: `${(item.value / maxValue) * 80}%`, backgroundColor: item.color || '#B91C1C' }}
                        title={`${item.label}: ${item.value}`}
                    ></div>
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">{item.label}</div>
                </div>
            ))}
        </div>
    );
};

// --- REPORT TYPE COMPONENTS ---

const CustomerBreakdownReport: FC<{ data: AugmentedHistoryRecord[] }> = ({ data }) => {
    const { getDispositionById, getAgentByNumber, getAssociationById, getShowByNumber } = useData();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const stats = useMemo(() => {
        let saleCount = 0, paymentCount = 0, totalSales = 0, totalPayments = 0;
        let bizSales = 0, resSales = 0, coldSales = 0, pcSales = 0;

        data.forEach(h => {
            const disp = getDispositionById(h.dispositionId);
            if (!disp) return;

            const isSale = disp.modifiers.includes(DispositionModifier.Sale);
            const isPayment = disp.modifiers.includes(DispositionModifier.Payment);
            const amount = h.amount || 0;

            if (isSale) {
                saleCount++;
                totalSales += amount;
                
                const isBusiness = h.customer.businessResidential?.toUpperCase().startsWith('B');
                const isResidential = h.customer.businessResidential?.toUpperCase().startsWith('R');
                if (isBusiness) {
                    bizSales += amount;
                } else if (isResidential) {
                    resSales += amount;
                }
                
                const isCold = h.customer.coldPc?.toUpperCase().startsWith('C');
                const isPC = h.customer.coldPc?.toUpperCase().startsWith('P');
                if (isCold) {
                    coldSales += amount;
                } else if (isPC) {
                    pcSales += amount;
                }
            }
            if (isPayment) {
                paymentCount++;
                totalPayments += amount;
            }
        });
        
        return {
            saleCount, paymentCount, totalSales, totalPayments,
            avgSale: saleCount > 0 ? totalSales / saleCount : 0,
            avgPayment: paymentCount > 0 ? totalPayments / paymentCount : 0,
            bizSales, resSales, coldSales, pcSales,
        };
    }, [data, getDispositionById]);
    
    const customerDataForTable = useMemo(() => {
        const customerMap = new Map<string, { customer: CustomerWithHistory, lastHistory: AugmentedHistoryRecord }>();
        data.forEach(h => {
            const existing = customerMap.get(h.customer.id);
            if (!existing || new Date(h.dispositionTime) > new Date(existing.lastHistory.dispositionTime)) {
                customerMap.set(h.customer.id, { customer: h.customer, lastHistory: h });
            }
        });
        return Array.from(customerMap.values()).map(({ customer, lastHistory }) => ({
            ...customer,
            dispositionId: lastHistory.dispositionId,
            dispositionTime: lastHistory.dispositionTime,
            agentNumber: lastHistory.agentNumber,
            amount: lastHistory.amount,
        }));
    }, [data]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return customerDataForTable.slice(startIndex, startIndex + itemsPerPage);
    }, [customerDataForTable, currentPage]);

    const totalPages = Math.ceil(customerDataForTable.length / itemsPerPage);

    const handleExport = () => {
        const dataToExport = customerDataForTable.map(c => ({
            Name: `${c.firstName} ${c.lastName}`,
            Phone: c.phone,
            BusinessResidential: c.businessResidential,
            'Cold/PC': c.coldPc,
            'Last Disposition': getDispositionById(c.dispositionId)?.name,
            'Last Disposition Time': new Date(c.dispositionTime).toLocaleString(),
            Agent: getAgentByNumber(c.agentNumber)?.firstName,
            Amount: c.amount,
            Association: getAssociationById(c.associationId)?.associationName,
            Show: getShowByNumber(c.showNumber)?.showName,
        }));
        downloadCSV(objectToCsv(dataToExport), 'customer_breakdown.csv');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                 <ReportStatCard label="Total Sales" value={`$${stats.totalSales.toFixed(2)}`} subValue={`${stats.saleCount} sales`} />
                 <ReportStatCard label="Total Payments" value={`$${stats.totalPayments.toFixed(2)}`} subValue={`${stats.paymentCount} payments`} />
                 <ReportStatCard label="Avg Sale" value={`$${stats.avgSale.toFixed(2)}`} />
                 <ReportStatCard label="Avg Payment" value={`$${stats.avgPayment.toFixed(2)}`} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BarChart data={[
                    { label: 'Business', value: stats.bizSales, color: '#DC2626' },
                    { label: 'Residential', value: stats.resSales, color: '#F87171' }
                ]} />
                <BarChart data={[
                    { label: 'Cold', value: stats.coldSales, color: '#0EA5E9' },
                    { label: 'PC', value: stats.pcSales, color: '#67E8F9' }
                ]} />
            </div>
            <div className="overflow-x-auto bg-white dark:bg-neutral-800 shadow-md rounded-lg">
                <div className="p-4 flex justify-between items-center">
                    <h3 className="font-semibold">Customer Details</h3>
                    <button onClick={handleExport} className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <DownloadIcon className="h-4 w-4" />
                        <span>Export CSV</span>
                    </button>
                </div>
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-neutral-700 dark:text-gray-400">
                        <tr>
                            {['Name', 'Phone', 'Type', 'Last Disposition', 'Disp. Time', 'Agent', 'Amount', 'Association', 'Show'].map(h => <th key={h} className="px-4 py-2">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                         {paginatedData.map(c => (
                            <tr key={c.id} className="border-b dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600">
                                <td className="px-4 py-2">{c.firstName} {c.lastName}</td>
                                <td className="px-4 py-2">{c.phone}</td>
                                <td className="px-4 py-2">{c.businessResidential}/{c.coldPc}</td>
                                <td className="px-4 py-2">{getDispositionById(c.dispositionId)?.name}</td>
                                <td className="px-4 py-2">{new Date(c.dispositionTime).toLocaleString()}</td>
                                <td className="px-4 py-2">{getAgentByNumber(c.agentNumber)?.firstName}</td>
                                <td className="px-4 py-2">{c.amount ? `$${c.amount.toFixed(2)}` : ''}</td>
                                <td className="px-4 py-2">{getAssociationById(c.associationId)?.associationName}</td>
                                <td className="px-4 py-2">{getShowByNumber(c.showNumber)?.showName}</td>
                            </tr>
                         ))}
                         {paginatedData.length === 0 && <tr><td colSpan={9} className="text-center py-8">No matching customer data.</td></tr>}
                    </tbody>
                </table>
                {totalPages > 1 && <div className="p-4 flex justify-end"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>}
            </div>
        </div>
    );
};

const AgentPerformanceReport: FC<{ data: AugmentedHistoryRecord[] }> = ({ data }) => {
    const { getAgentByNumber, getDispositionById } = useData();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    const agentStats = useMemo(() => {
        const statsByAgent: Record<number, {
            agentNumber: number;
            agent: Agent;
            saleAmount: number;
            paymentAmount: number;
            saleCount: number;
            paymentCount: number;
            resColdSales: number;
            resPcSales: number;
            bizColdSales: number;
            bizPcSales: number;
        }> = {};

        data.forEach(h => {
            const agentNum = h.agentNumber;
            const agent = getAgentByNumber(agentNum);
            if (!agent) return; // Skip records with unknown agents

            if (!statsByAgent[agentNum]) {
                statsByAgent[agentNum] = {
                    agentNumber: agentNum,
                    agent: agent,
                    saleAmount: 0, paymentAmount: 0, saleCount: 0, paymentCount: 0,
                    resColdSales: 0, resPcSales: 0, bizColdSales: 0, bizPcSales: 0,
                };
            }

            const stat = statsByAgent[agentNum];
            const disp = getDispositionById(h.dispositionId);
            if (!disp) return;
            const amount = h.amount || 0;

            if (disp.modifiers.includes(DispositionModifier.Sale)) {
                stat.saleAmount += amount;
                stat.saleCount++;

                const isResidential = h.customer.businessResidential?.toUpperCase().startsWith('R');
                const isBusiness = h.customer.businessResidential?.toUpperCase().startsWith('B');
                const isCold = h.customer.coldPc?.toUpperCase().startsWith('C');
                const isPC = h.customer.coldPc?.toUpperCase().startsWith('P');

                if (isResidential) {
                    if (isCold) {
                        stat.resColdSales += amount;
                    } else if (isPC) {
                        stat.resPcSales += amount;
                    }
                } else if (isBusiness) {
                    if (isCold) {
                        stat.bizColdSales += amount;
                    } else if (isPC) {
                        stat.bizPcSales += amount;
                    }
                }
            }
            if (disp.modifiers.includes(DispositionModifier.Payment)) {
                stat.paymentAmount += amount;
                stat.paymentCount++;
            }
        });

        return Object.values(statsByAgent).sort((a, b) => b.saleAmount - a.saleAmount);

    }, [data, getAgentByNumber, getDispositionById]);
    
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return agentStats.slice(startIndex, startIndex + itemsPerPage);
    }, [agentStats, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(agentStats.length / itemsPerPage);

    const handleExport = () => {
        if (agentStats.length === 0) {
            alert('No data to export.');
            return;
        }
        const dataToExport = agentStats.map((s, index) => ({
            'Rank': index + 1,
            'Agent': `${s.agent.firstName} ${s.agent.lastName} (#${s.agent.agentNumber})`,
            'Total Sales ($)': s.saleAmount.toFixed(2),
            'Total Payments ($)': s.paymentAmount.toFixed(2),
            'Res. Cold ($)': s.resColdSales.toFixed(2),
            'Res. PC ($)': s.resPcSales.toFixed(2),
            'Biz. Cold ($)': s.bizColdSales.toFixed(2),
            'Biz. PC ($)': s.bizPcSales.toFixed(2),
            'Sale Count': s.saleCount,
            'Payment Count': s.paymentCount,
        }));
        downloadCSV(objectToCsv(dataToExport), 'agent_performance_report.csv');
    };
    
    const overallStats = useMemo(() => {
        return agentStats.reduce((acc, curr) => ({
            totalSales: acc.totalSales + curr.saleAmount,
            totalPayments: acc.totalPayments + curr.paymentAmount,
            totalSaleCount: acc.totalSaleCount + curr.saleCount,
        }), { totalSales: 0, totalPayments: 0, totalSaleCount: 0 });
    }, [agentStats]);

    const getRank = (index: number) => {
        return (currentPage - 1) * itemsPerPage + index + 1;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <ReportStatCard label="Total Sales" value={`$${overallStats.totalSales.toFixed(2)}`} subValue={`${overallStats.totalSaleCount} sales`} />
                 <ReportStatCard label="Total Payments" value={`$${overallStats.totalPayments.toFixed(2)}`} />
                 <ReportStatCard label="Active Agents" value={agentStats.length} subValue="in filtered period"/>
            </div>
            
            <div className="overflow-x-auto bg-white dark:bg-neutral-800 shadow-md rounded-lg">
                <div className="p-4 flex justify-between items-center">
                    <h3 className="font-semibold">Agent Performance Details</h3>
                    <button onClick={handleExport} className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <DownloadIcon className="h-4 w-4" />
                        <span>Export CSV</span>
                    </button>
                </div>
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-neutral-700 dark:text-gray-400">
                        <tr>
                            <th className="px-2 py-2">Rank</th>
                            <th className="px-2 py-2">Agent</th>
                            <th className="px-2 py-2 text-right">Total Sales</th>
                            <th className="px-2 py-2 text-right">Total Payments</th>
                            <th className="px-2 py-2 text-right">Res Cold</th>
                            <th className="px-2 py-2 text-right">Res PC</th>
                            <th className="px-2 py-2 text-right">Biz Cold</th>
                            <th className="px-2 py-2 text-right">Biz PC</th>
                            <th className="px-2 py-2 text-right"># Sales</th>
                        </tr>
                    </thead>
                    <tbody>
                         {paginatedData.map((s, index) => (
                            <tr key={s.agentNumber} className="border-b dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600">
                                <td className="px-2 py-2 font-bold">#{getRank(index)}</td>
                                <td className="px-2 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap">{s.agent.firstName} {s.agent.lastName}</td>
                                <td className="px-2 py-2 text-right font-semibold text-green-600 dark:text-green-400">${s.saleAmount.toFixed(2)}</td>
                                <td className="px-2 py-2 text-right font-semibold text-blue-600 dark:text-blue-400">${s.paymentAmount.toFixed(2)}</td>
                                <td className="px-2 py-2 text-right">${s.resColdSales.toFixed(2)}</td>
                                <td className="px-2 py-2 text-right">${s.resPcSales.toFixed(2)}</td>
                                <td className="px-2 py-2 text-right">${s.bizColdSales.toFixed(2)}</td>
                                <td className="px-2 py-2 text-right">${s.bizPcSales.toFixed(2)}</td>
                                <td className="px-2 py-2 text-right">{s.saleCount}</td>
                            </tr>
                         ))}
                         {agentStats.length === 0 && <tr><td colSpan={9} className="text-center py-8">No agent performance data for the selected filters.</td></tr>}
                    </tbody>
                </table>
                {totalPages > 1 && <div className="p-4 flex justify-end"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>}
            </div>
        </div>
    );
};

const DispositionAnalysisReport: FC<{ data: AugmentedHistoryRecord[] }> = ({ data }) => {
    const { getDispositionById, getDispositionByName } = useData();
    const { addToast } = useToast();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    const dispositionStats = useMemo(() => {
        const stats: Record<string, {
            disposition: Disposition;
            count: number;
            totalAmount: number;
            firstUsed: number | null;
            lastUsed: number | null;
        }> = {};

        data.forEach(h => {
            const disp = getDispositionById(h.dispositionId);
            if (!disp) return;

            if (!stats[disp.id]) {
                stats[disp.id] = {
                    disposition: disp,
                    count: 0,
                    totalAmount: 0,
                    firstUsed: null,
                    lastUsed: null,
                };
            }
            const stat = stats[disp.id];
            stat.count++;
            stat.totalAmount += h.amount || 0;
            const dispTime = new Date(h.dispositionTime).getTime();
            if (!stat.firstUsed || dispTime < stat.firstUsed) {
                stat.firstUsed = dispTime;
            }
            if (!stat.lastUsed || dispTime > stat.lastUsed) {
                stat.lastUsed = dispTime;
            }
        });

        return Object.values(stats).sort((a, b) => b.count - a.count);

    }, [data, getDispositionById]);

    const modifierBreakdown = useMemo(() => {
        let saleCount = 0;
        let paymentCount = 0;
        let totalCount = data.length;

        dispositionStats.forEach(stat => {
            if (stat.disposition.modifiers.includes(DispositionModifier.Sale)) {
                saleCount += stat.count;
            }
            if (stat.disposition.modifiers.includes(DispositionModifier.Payment)) {
                paymentCount += stat.count;
            }
        });
        
        return {
            saleCount,
            paymentCount,
            salePercentage: totalCount > 0 ? (saleCount / totalCount) * 100 : 0,
            paymentPercentage: totalCount > 0 ? (paymentCount / totalCount) * 100 : 0,
        };
    }, [dispositionStats, data]);

    const keyDispositionCounts = useMemo(() => {
        const keys = ["Turndown", "Remove", "Processed", "Credit", "Sale"];
        const counts: { label: string, value: number, color?: string }[] = [];
        const colors = ['#EF4444', '#F97316', '#84CC16', '#22C55E', '#3B82F6'];
        
        keys.forEach((key, index) => {
            const disp = getDispositionByName(key);
            let count = 0;
            if (disp) {
                const stat = dispositionStats.find(s => s.disposition.id === disp.id);
                if (stat) {
                    count = stat.count;
                }
            }
            counts.push({ label: key, value: count, color: colors[index] });
        });
        return counts;

    }, [dispositionStats, getDispositionByName]);
    
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return dispositionStats.slice(startIndex, startIndex + itemsPerPage);
    }, [dispositionStats, currentPage]);

    const totalPages = Math.ceil(dispositionStats.length / itemsPerPage);

    const handleExport = () => {
        if (dispositionStats.length === 0) {
            addToast('No data to export.', 'info');
            return;
        }
        const dataToExport = dispositionStats.map(s => ({
            'Disposition Name': s.disposition.name,
            'Modifiers': s.disposition.modifiers.join(', '),
            'Count': s.count,
            'Total Amount ($)': s.totalAmount.toFixed(2),
            'First Used': s.firstUsed ? new Date(s.firstUsed).toLocaleString() : 'N/A',
            'Last Used': s.lastUsed ? new Date(s.lastUsed).toLocaleString() : 'N/A',
        }));
        downloadCSV(objectToCsv(dataToExport), 'disposition_analysis.csv');
    };
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Key Disposition Counts</h3>
                    <BarChart data={keyDispositionCounts} height={250} />
                </div>
                <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-4 flex flex-col justify-center">
                    <h3 className="font-semibold mb-4">Sale vs. Payment Modifiers</h3>
                    <div className="space-y-4">
                        <ReportStatCard 
                            label="Dispositions with 'Sale' Modifier" 
                            value={modifierBreakdown.saleCount} 
                            subValue={`${modifierBreakdown.salePercentage.toFixed(1)}% of total filtered`}
                        />
                        <ReportStatCard 
                            label="Dispositions with 'Payment' Modifier" 
                            value={modifierBreakdown.paymentCount} 
                            subValue={`${modifierBreakdown.paymentPercentage.toFixed(1)}% of total filtered`}
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-neutral-800 shadow-md rounded-lg">
                <div className="p-4 flex justify-between items-center">
                    <h3 className="font-semibold">Disposition Usage Details</h3>
                    <button onClick={handleExport} className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <DownloadIcon className="h-4 w-4" />
                        <span>Export CSV</span>
                    </button>
                </div>
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-neutral-700 dark:text-gray-400">
                        <tr>
                            <th className="px-4 py-2">Disposition Name</th>
                            <th className="px-4 py-2">Modifiers</th>
                            <th className="px-4 py-2 text-right">Count</th>
                            <th className="px-4 py-2 text-right">Total Amount</th>
                            <th className="px-4 py-2">First Used</th>
                            <th className="px-4 py-2">Last Used</th>
                        </tr>
                    </thead>
                    <tbody>
                         {paginatedData.map(s => (
                            <tr key={s.disposition.id} className="border-b dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600">
                                <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{s.disposition.name}</td>
                                <td className="px-4 py-2 flex flex-wrap gap-1">
                                    {s.disposition.modifiers.length > 0
                                        ? s.disposition.modifiers.map(mod => <span key={mod} className="text-xs bg-gray-200 dark:bg-neutral-600 rounded-full px-2 py-0.5">{mod}</span>)
                                        : <span className="text-xs text-gray-500">None</span>
                                    }
                                </td>
                                <td className="px-4 py-2 text-right font-semibold">{s.count}</td>
                                <td className="px-4 py-2 text-right">${s.totalAmount.toFixed(2)}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{s.firstUsed ? new Date(s.firstUsed).toLocaleDateString() : 'N/A'}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{s.lastUsed ? new Date(s.lastUsed).toLocaleDateString() : 'N/A'}</td>
                            </tr>
                         ))}
                         {paginatedData.length === 0 && <tr><td colSpan={6} className="text-center py-8">No matching disposition data.</td></tr>}
                    </tbody>
                </table>
                {totalPages > 1 && <div className="p-4 flex justify-end"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>}
            </div>
        </div>
    );
};

const RevenueReport: FC<{ data: AugmentedHistoryRecord[] }> = ({ data }) => {
    // Implementation would go here
    return (
         <div className="text-center py-20 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold">Report Not Implemented</h3>
            <p className="text-gray-500 mt-2">This report type is under construction.</p>
         </div>
    );
};


// --- MAIN PAGE COMPONENT ---

const ReportSidebar: FC<{ activeReport: string }> = ({ activeReport }) => {
    const navigate = useNavigate();
    const reports = [
        { key: 'customers', label: 'Customer Breakdown' },
        { key: 'agents', label: 'Agent Performance' },
        { key: 'dispositions', label: 'Disposition Analysis' },
        { key: 'revenue', label: 'Revenue Reports' },
    ];
    
    const baseClasses = "block w-full text-left px-4 py-2 text-sm rounded-md transition-colors";
    const activeClasses = "bg-brand-red text-white font-semibold shadow-md";
    const inactiveClasses = "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700";

    return (
        <aside className="w-64 flex-shrink-0 p-4 bg-white dark:bg-neutral-800 border-r dark:border-neutral-700">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Report Types</h2>
            <nav className="space-y-2">
                {reports.map(report => (
                     <button
                        key={report.key}
                        onClick={() => navigate(`/reports/${report.key}`)}
                        className={`${baseClasses} ${activeReport === report.key ? activeClasses : inactiveClasses}`}
                    >
                        {report.label}
                    </button>
                ))}
            </nav>
        </aside>
    );
};

const ReportFilters: FC<{
    filters: any;
    setFilters: React.Dispatch<React.SetStateAction<any>>;
    availableAgents: Agent[];
    availableDispositions: Disposition[];
    availableShows: Show[];
    availableAssociations: Association[];
}> = ({ filters, setFilters, availableAgents, availableDispositions, availableShows, availableAssociations }) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters((prev: any) => ({ ...prev, [name]: value }));
    };

    return (
         <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-sm mb-6">
             <h3 className="font-semibold text-lg mb-4">Filters</h3>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                    <label className="text-xs text-gray-500">From</label>
                    <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600" />
                </div>
                <div>
                    <label className="text-xs text-gray-500">To</label>
                    <input type="date" name="dateTo" value={filters.dateTo} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600" />
                </div>
                <select name="agentNumber" value={filters.agentNumber} onChange={handleChange} className="p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 self-end">
                    <option value="">All Agents</option>
                    {availableAgents.map(a => <option key={a.id} value={a.agentNumber}>{a.firstName} {a.lastName}</option>)}
                </select>
                <select name="dispositionId" value={filters.dispositionId} onChange={handleChange} className="p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 self-end">
                    <option value="">All Dispositions</option>
                    {availableDispositions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <select name="showNumber" value={filters.showNumber} onChange={handleChange} className="p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 self-end">
                    <option value="">All Shows</option>
                    {availableShows.map(s => <option key={s.id} value={s.showNumber}>{s.showName}</option>)}
                </select>
                 <select name="associationId" value={filters.associationId} onChange={handleChange} className="p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 self-end">
                    <option value="">All Associations</option>
                    {availableAssociations.map(a => <option key={a.id} value={a.associationId}>{a.associationName}</option>)}
                </select>
                 <select name="businessResidential" value={filters.businessResidential} onChange={handleChange} className="p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 self-end">
                    <option value="">All Types</option>
                    <option value="Business">Business</option>
                    <option value="Residential">Residential</option>
                </select>
                 <select name="coldPc" value={filters.coldPc} onChange={handleChange} className="p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 self-end">
                    <option value="">All Sources</option>
                    <option value="Cold">Cold</option>
                    <option value="PC">PC</option>
                </select>
             </div>
         </div>
    )
};

const MemoCustomerBreakdownReport = React.memo(CustomerBreakdownReport);
const MemoAgentPerformanceReport = React.memo(AgentPerformanceReport);
const MemoDispositionAnalysisReport = React.memo(DispositionAnalysisReport);
const MemoRevenueReport = React.memo(RevenueReport);

const getWtdDateRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // Sunday = 0, Thursday = 4
    const wtdStart = new Date(today);
    const daysToSubtract = (dayOfWeek - 4 + 7) % 7; // days to subtract to get to last Thursday
    wtdStart.setDate(today.getDate() - daysToSubtract);
    
    const wtdEnd = new Date(wtdStart);
    wtdEnd.setDate(wtdStart.getDate() + 6); // Wednesday is 6 days after Thursday

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    return {
        start: formatDate(wtdStart),
        end: formatDate(wtdEnd),
    };
};


const ReportsPage: React.FC = () => {
    const { reportType = 'customers' } = useParams<{ reportType: string }>();
    const { customers, agents, dispositions, shows, associations } = useData();
    
    const [filters, setFilters] = useState(() => {
        const { start, end } = getWtdDateRange();
        return {
            dateFrom: start,
            dateTo: end,
            agentNumber: '',
            dispositionId: '',
            showNumber: '',
            associationId: '',
            businessResidential: '',
            coldPc: '',
        };
    });

    const filteredHistoryRecords = useMemo((): AugmentedHistoryRecord[] => {
        const allHistoryRecords = customers.flatMap(c => 
            c.dispositionHistory.map(h => ({ ...h, customer: c }))
        );

        // Correctly create date boundaries in the user's local timezone.
        // new Date('YYYY-MM-DD') creates a date at UTC midnight, which causes issues.
        // new Date('YYYY/MM/DD') creates a date at local midnight.
        const startDate = filters.dateFrom ? new Date(filters.dateFrom.replace(/-/g, '/')) : null;
        if (startDate) {
            startDate.setHours(0, 0, 0, 0);
        }

        const endDate = filters.dateTo ? new Date(filters.dateTo.replace(/-/g, '/')) : null;
        if (endDate) {
            endDate.setHours(23, 59, 59, 999);
        }

        return allHistoryRecords.filter(h => {
            const dispTime = new Date(h.dispositionTime).getTime();

            if (startDate && dispTime < startDate.getTime()) return false;
            if (endDate && dispTime > endDate.getTime()) return false;

            if (filters.agentNumber && h.agentNumber !== Number(filters.agentNumber)) return false;
            if (filters.dispositionId && h.dispositionId !== filters.dispositionId) return false;

            if (filters.showNumber && h.customer.showNumber !== Number(filters.showNumber)) return false;
            if (filters.associationId && h.customer.associationId !== filters.associationId) return false;
            if (filters.businessResidential && h.customer.businessResidential !== filters.businessResidential) return false;
            if (filters.coldPc && h.customer.coldPc !== filters.coldPc) return false;
            
            return true;
        });
    }, [customers, filters]);

    const renderReport = () => {
        switch(reportType) {
            case 'customers':
                return <MemoCustomerBreakdownReport data={filteredHistoryRecords} />;
            case 'agents':
                 return <MemoAgentPerformanceReport data={filteredHistoryRecords} />;
            case 'dispositions':
                 return <MemoDispositionAnalysisReport data={filteredHistoryRecords} />;
            case 'revenue':
                 return <MemoRevenueReport data={filteredHistoryRecords} />;
            default:
                return <div>Unknown report type. Please select one from the sidebar.</div>;
        }
    };

    return (
        <div className="flex-1 flex flex-row h-screen">
            <ReportSidebar activeReport={reportType} />
            <div className="flex-1 flex flex-col">
                <Header title="Reports" />
                <main className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-50 dark:bg-neutral-900/50">
                     <ReportFilters 
                        filters={filters}
                        setFilters={setFilters}
                        availableAgents={agents}
                        availableDispositions={dispositions}
                        availableShows={shows}
                        availableAssociations={associations}
                     />
                    {renderReport()}
                </main>
            </div>
        </div>
    );
};

export default ReportsPage;
