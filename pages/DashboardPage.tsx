
import React, { useMemo, useState, useRef } from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import UploadIcon from '../components/icons/UploadIcon';
import DownloadIcon from '../components/icons/DownloadIcon';
import ChartBarIcon from '../components/icons/ChartBarIcon';
import UsersIcon from '../components/icons/UsersIcon';
import { useData } from '../context/DataContext';
import { DispositionModifier } from '../types';

const StatCard: React.FC<{ title: string; value: string; subValue?: string; icon: React.ReactNode; }> = ({ title, value, subValue, icon }) => (
    <div className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-5 flex items-center space-x-4 transition-transform hover:scale-105">
        <div className="bg-brand-red-light/20 text-brand-red dark:bg-brand-red-dark/30 dark:text-brand-red-light rounded-full p-3">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
            {subValue && <p className="text-xs text-gray-500 dark:text-gray-400">{subValue}</p>}
        </div>
    </div>
);


const ActionButton: React.FC<{ title: string; icon: React.ReactNode; onClick: () => void }> = ({ title, icon, onClick }) => (
    <button onClick={onClick} className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-5 flex flex-col items-center justify-center space-y-2 text-center transition-all hover:shadow-xl hover:bg-neutral-50 dark:hover:bg-neutral-700">
        <div className="text-brand-red dark:text-brand-red-light">{icon}</div>
        <p className="font-semibold text-gray-700 dark:text-gray-200">{title}</p>
    </button>
);

const DailyPerformanceChart: React.FC<{ data: { date: string; sales: number; payments: number }[] }> = ({ data }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const svgContainerRef = useRef<HTMLDivElement>(null);

    if (data.length < 2) {
        return <div className="flex items-center justify-center h-72 text-gray-500 dark:text-gray-400">Not enough data to display a chart. At least two data points are needed.</div>;
    }

    const width = 800;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const parsedData = data.map(d => ({
        date: new Date(d.date.replace(/-/g, '/')),
        sales: d.sales,
        payments: d.payments,
    }));

    const minDate = parsedData[0].date;
    const maxDate = parsedData[parsedData.length - 1].date;
    const maxAmount = Math.max(...parsedData.map(d => Math.max(d.sales, d.payments)), 0);

    const xScale = (date: Date) => {
        if (maxDate.getTime() === minDate.getTime()) return 0;
        return ((date.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * innerWidth;
    };

    const yScale = (value: number) => {
        if (maxAmount === 0) return innerHeight;
        return innerHeight - (value / maxAmount) * innerHeight;
    };

    const generatePath = (dataKey: 'sales' | 'payments') => {
        return parsedData.map((d, i) => {
            const x = xScale(d.date);
            const y = yScale(d[dataKey]);
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`;
        }).join(' ');
    };

    const yAxisTicks = 5;
    const yAxisValues = Array.from({ length: yAxisTicks + 1 }, (_, i) => (maxAmount / yAxisTicks) * i);
    
    const xAxisTicks = Math.min(parsedData.length, 7);
    const xAxisIndices = Array.from({ length: xAxisTicks }, (_, i) => Math.floor(i * (parsedData.length - 1) / (xAxisTicks > 1 ? xAxisTicks - 1 : 1)));
    const xAxisValues = [...new Set(xAxisIndices)].map(i => parsedData[i]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!svgContainerRef.current || parsedData.length === 0) return;
    
        const rect = svgContainerRef.current.getBoundingClientRect();
        const svgX = e.clientX - rect.left;
    
        const viewBoxX = (svgX / rect.width) * width;
        const chartX = viewBoxX - margin.left;
    
        if (chartX < 0 || chartX > innerWidth) {
            if (hoveredIndex !== null) setHoveredIndex(null);
            return;
        }
    
        const closestIndex = parsedData.reduce((closest, _, i) => {
            const distA = Math.abs(xScale(parsedData[closest].date) - chartX);
            const distB = Math.abs(xScale(parsedData[i].date) - chartX);
            return distB < distA ? i : closest;
        }, 0);
        
        setHoveredIndex(closestIndex);
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
    };

    const hoveredData = hoveredIndex !== null ? parsedData[hoveredIndex] : null;

    let tooltipX = 0;
    const tooltipY = height / 5;
    if (hoveredData) {
        const pointX = xScale(hoveredData.date);
        tooltipX = pointX > innerWidth / 2 ? pointX - 160 : pointX + 15;
    }

    return (
        <div 
            ref={svgContainerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative"
        >
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Interactive daily sales and payments chart">
                <g transform={`translate(${margin.left}, ${margin.top})`}>
                    {/* Y-axis grid lines and labels */}
                    {yAxisValues.map(value => (
                         <g key={`y-tick-${value}`}>
                             <line
                                 x1={0}
                                 x2={innerWidth}
                                 y1={yScale(value)}
                                 y2={yScale(value)}
                                 strokeDasharray="2,2"
                                 className="stroke-current text-gray-200 dark:text-neutral-700"
                             />
                              <text x={-10} y={yScale(value)} dy="0.32em" textAnchor="end" className="text-xs fill-current text-gray-500 dark:text-gray-400">
                                 ${Math.round(value).toLocaleString()}
                             </text>
                         </g>
                    ))}

                    {/* X-axis labels */}
                     {xAxisValues.map(({ date }) => (
                         <text
                            key={date.toISOString()}
                             x={xScale(date)}
                             y={innerHeight + 20}
                             textAnchor="middle"
                             className="text-xs fill-current text-gray-500 dark:text-gray-400"
                         >
                             {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                         </text>
                     ))}

                    {/* Data Paths */}
                    <path d={generatePath('sales')} fill="none" stroke="#10B981" strokeWidth="2" />
                    <path d={generatePath('payments')} fill="none" stroke="#3B82F6" strokeWidth="2" />

                     {/* Interactive Hover Elements */}
                    {hoveredData && (
                        <g className="pointer-events-none">
                            <line
                                x1={xScale(hoveredData.date)}
                                y1={0}
                                x2={xScale(hoveredData.date)}
                                y2={innerHeight}
                                className="stroke-current text-gray-400 dark:text-gray-500"
                                strokeDasharray="3,3"
                            />
                            <circle cx={xScale(hoveredData.date)} cy={yScale(hoveredData.sales)} r="5" className="fill-green-500 stroke-white dark:stroke-neutral-800" strokeWidth="2" />
                            <circle cx={xScale(hoveredData.date)} cy={yScale(hoveredData.payments)} r="5" className="fill-blue-500 stroke-white dark:stroke-neutral-800" strokeWidth="2" />

                            <g transform={`translate(${tooltipX}, ${tooltipY})`}>
                                <rect
                                    width="145"
                                    height="70"
                                    rx="6"
                                    className="fill-white/95 dark:fill-neutral-900/90 stroke-gray-300 dark:stroke-neutral-600"
                                    style={{ filter: 'drop-shadow(0 4px 6px rgb(0 0 0 / 0.1))' }}
                                />
                                <text x="10" y="20" className="text-sm font-bold fill-current text-gray-900 dark:text-gray-100">
                                    {hoveredData.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </text>
                                <g transform="translate(10, 40)">
                                    <circle cx="0" cy="0" r="4" className="fill-current text-green-500" />
                                    <text x="10" y="4" className="text-xs fill-current text-gray-700 dark:text-gray-300">
                                        Sales: <tspan fontWeight="bold">${hoveredData.sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</tspan>
                                    </text>
                                </g>
                                <g transform="translate(10, 58)">
                                    <circle cx="0" cy="0" r="4" className="fill-current text-blue-500" />
                                    <text x="10" y="4" className="text-xs fill-current text-gray-700 dark:text-gray-300">
                                        Payments: <tspan fontWeight="bold">${hoveredData.payments.toLocaleString(undefined, { minimumFractionDigits: 2 })}</tspan>
                                    </text>
                                </g>
                            </g>
                        </g>
                    )}
                </g>
            </svg>
            <div className="flex justify-center items-center space-x-6 mt-4 text-sm">
                <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-gray-600 dark:text-gray-300">Sales</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                     <span className="text-gray-600 dark:text-gray-300">Payments</span>
                </div>
            </div>
        </div>
    );
};

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { customers, getDispositionById, getAgentByNumber } = useData();

    const mtdStats = useMemo(() => {
        const today = new Date();
        const mtdStart = new Date(today.getFullYear(), today.getMonth(), 1);
        mtdStart.setHours(0, 0, 0, 0);

        let mtdSalesValue = 0;
        let mtdSalesCount = 0;
        let mtdPaymentsValue = 0;
        let mtdPaymentsCount = 0;
        let mtdResSales = 0;
        let mtdBizSales = 0;

        for (const customer of customers) {
            customer.dispositionHistory.forEach(h => {
                const dispTime = new Date(h.dispositionTime);
                if (dispTime >= mtdStart && dispTime <= today) {
                    const disp = getDispositionById(h.dispositionId);
                    if (!disp) return;

                    const isSale = disp.modifiers.includes(DispositionModifier.Sale);
                    const isPayment = disp.modifiers.includes(DispositionModifier.Payment);
                    const amount = h.amount || 0;

                    if (isSale) {
                        mtdSalesValue += amount;
                        mtdSalesCount++;
                        const isResidential = customer.businessResidential?.toUpperCase().startsWith('R');
                        const isBusiness = customer.businessResidential?.toUpperCase().startsWith('B');
                        if (isResidential) mtdResSales += amount;
                        else if (isBusiness) mtdBizSales += amount;
                    }
                    
                    if (isPayment) {
                        mtdPaymentsValue += amount;
                        mtdPaymentsCount++;
                    }
                }
            });
        }
        
        return {
            mtdSales: { value: `$${mtdSalesValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, count: mtdSalesCount },
            mtdPayments: { value: `$${mtdPaymentsValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, count: mtdPaymentsCount },
            mtdResSales: `$${mtdResSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            mtdBizSales: `$${mtdBizSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        };
    }, [customers, getDispositionById]);


    const wtdStats = useMemo(() => {
        // WTD logic: Thursday to Wednesday
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 4=Thu, ... 6=Sat

        let wtdStart = new Date(today);
        const daysToSubtract = (dayOfWeek - 4 + 7) % 7;
        wtdStart.setDate(today.getDate() - daysToSubtract);
        wtdStart.setHours(0, 0, 0, 0);

        let wtdEnd = new Date(wtdStart);
        wtdEnd.setDate(wtdStart.getDate() + 6);
        wtdEnd.setHours(23, 59, 59, 999);

        let wtdSalesValue = 0;
        let wtdSalesCount = 0;
        let wtdPaymentsValue = 0;
        let wtdPaymentsCount = 0;
        let wtdResSales = 0;
        let wtdBizSales = 0;
        let wtdColdSales = 0;
        let wtdPcSales = 0;
        const agentSales: { [agentNum: number]: number } = {};
        const agentPayments: { [agentNum: number]: number } = {};

        for (const customer of customers) {
            customer.dispositionHistory.forEach(h => {
                const dispTime = new Date(h.dispositionTime);
                if (dispTime >= wtdStart && dispTime <= wtdEnd) {
                    const disp = getDispositionById(h.dispositionId);
                    if (!disp) return;

                    const isSale = disp.modifiers.includes(DispositionModifier.Sale);
                    const isPayment = disp.modifiers.includes(DispositionModifier.Payment);
                    const amount = h.amount || 0;
                    
                    if (isSale) {
                        wtdSalesValue += amount;
                        wtdSalesCount++;
                        
                        const isResidential = customer.businessResidential?.toUpperCase().startsWith('R');
                        const isBusiness = customer.businessResidential?.toUpperCase().startsWith('B');
                        const isCold = customer.coldPc?.toUpperCase().startsWith('C');
                        const isPC = customer.coldPc?.toUpperCase().startsWith('P');

                        if (isResidential) wtdResSales += amount;
                        if (isBusiness) wtdBizSales += amount;
                        if (isCold) wtdColdSales += amount;
                        if (isPC) wtdPcSales += amount;
                        
                        agentSales[h.agentNumber] = (agentSales[h.agentNumber] || 0) + amount;
                    }
                    if (isPayment) {
                        wtdPaymentsValue += amount;
                        wtdPaymentsCount++;
                        agentPayments[h.agentNumber] = (agentPayments[h.agentNumber] || 0) + amount;
                    }
                }
            });
        }
        
        return {
            wtdSales: { value: `$${wtdSalesValue.toFixed(2)}`, count: wtdSalesCount },
            wtdPayments: { value: `$${wtdPaymentsValue.toFixed(2)}`, count: wtdPaymentsCount },
            wtdResSales: `$${wtdResSales.toFixed(2)}`,
            wtdBizSales: `$${wtdBizSales.toFixed(2)}`,
            wtdColdSales: `$${wtdColdSales.toFixed(2)}`,
            wtdPcSales: `$${wtdPcSales.toFixed(2)}`,
            agentSales,
            agentPayments,
        };
    }, [customers, getDispositionById]);

    const topAgents = useMemo(() => {
        const allAgentNumbers = new Set([
            ...Object.keys(wtdStats.agentSales).map(Number),
            ...Object.keys(wtdStats.agentPayments).map(Number),
        ]);

        return Array.from(allAgentNumbers)
            .map((agentNum) => ({
                agent: getAgentByNumber(Number(agentNum)),
                sales: wtdStats.agentSales[agentNum] || 0,
                payments: wtdStats.agentPayments[agentNum] || 0,
            }))
            .filter(item => item.agent) 
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);
    }, [wtdStats.agentSales, wtdStats.agentPayments, getAgentByNumber]);
    
    const dailyPerformanceData = useMemo(() => {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        ninetyDaysAgo.setHours(0, 0, 0, 0);

        const dailyMap = new Map<string, { sales: number; payments: number }>();

        for (const customer of customers) {
            for (const h of customer.dispositionHistory) {
                const dispTime = new Date(h.dispositionTime);
                if (dispTime >= ninetyDaysAgo) {
                    const disp = getDispositionById(h.dispositionId);
                    if (!disp) continue;

                    const dateKey = dispTime.toISOString().split('T')[0];
                    if (!dailyMap.has(dateKey)) {
                        dailyMap.set(dateKey, { sales: 0, payments: 0 });
                    }
                    const dayData = dailyMap.get(dateKey)!;

                    const isSale = disp.modifiers.includes(DispositionModifier.Sale);
                    const isPayment = disp.modifiers.includes(DispositionModifier.Payment);
                    const amount = h.amount || 0;

                    if (isSale) {
                        dayData.sales += amount;
                    }
                    if (isPayment) {
                        dayData.payments += amount;
                    }
                }
            }
        }

        return Array.from(dailyMap.entries())
            .map(([date, values]) => ({ date, ...values }))
            .filter(d => d.sales > 0 || d.payments > 0)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    }, [customers, getDispositionById]);


    return (
        <div className="flex-1 flex flex-col h-screen">
            <Header title="Dashboard" />
            <main className="flex-1 p-6 space-y-8 overflow-y-auto bg-gray-50 dark:bg-neutral-900/50">
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <ActionButton title="Add Customer" icon={<UsersIcon className="h-8 w-8" />} onClick={() => navigate('/customers/add')} />
                        <ActionButton title="Import Data" icon={<UploadIcon className="h-8 w-8" />} onClick={() => navigate('/import')} />
                        <ActionButton title="Export Data" icon={<DownloadIcon className="h-8 w-8" />} onClick={() => navigate('/export')} />
                        <ActionButton title="View Reports" icon={<ChartBarIcon className="h-8 w-8" />} onClick={() => navigate('/reports')} />
                    </div>
                </section>
                
                 <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Month-to-Date Performance</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                         <StatCard title="MTD Sales" value={mtdStats.mtdSales.value} subValue={`${mtdStats.mtdSales.count} sales`} icon={<ChartBarIcon className="h-6 w-6" />} />
                         <StatCard title="MTD Payments" value={mtdStats.mtdPayments.value} subValue={`${mtdStats.mtdPayments.count} payments`} icon={<UsersIcon className="h-6 w-6" />} />
                         <StatCard title="MTD Residential Sales" value={mtdStats.mtdResSales} icon={<UsersIcon className="h-6 w-6" />} />
                         <StatCard title="MTD Business Sales" value={mtdStats.mtdBizSales} icon={<UsersIcon className="h-6 w-6" />} />
                     </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Week-to-Date Performance (Thu-Wed)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                        <StatCard title="WTD Sales" value={wtdStats.wtdSales.value} subValue={`${wtdStats.wtdSales.count} sales`} icon={<ChartBarIcon className="h-6 w-6" />} />
                        <StatCard title="WTD Payments" value={wtdStats.wtdPayments.value} subValue={`${wtdStats.wtdPayments.count} payments`} icon={<UsersIcon className="h-6 w-6" />} />
                        <StatCard title="WTD Residential Sales" value={wtdStats.wtdResSales} icon={<UsersIcon className="h-6 w-6" />} />
                        <StatCard title="WTD Business Sales" value={wtdStats.wtdBizSales} icon={<UsersIcon className="h-6 w-6" />} />
                        <StatCard title="WTD Cold Sales" value={wtdStats.wtdColdSales} icon={<UsersIcon className="h-6 w-6" />} />
                        <StatCard title="WTD PC Sales" value={wtdStats.wtdPcSales} icon={<UsersIcon className="h-6 w-6" />} />
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Top Performing Agents (Week-to-Date)</h2>
                    <div className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-neutral-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Rank</th>
                                    <th scope="col" className="px-4 py-3">Agent</th>
                                    <th scope="col" className="px-4 py-3 text-right">Payment Amount</th>
                                    <th scope="col" className="px-4 py-3 text-right">Sales Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topAgents.length > 0 ? topAgents.map((item, index) => (
                                    <tr key={item.agent!.id} className="bg-white dark:bg-neutral-800 border-b dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600">
                                        <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">#{index + 1}</td>
                                        <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">{item.agent!.firstName} {item.agent!.lastName}</td>
                                        <td className="px-4 py-4 text-right font-semibold text-blue-600 dark:text-blue-400">${item.payments.toFixed(2)}</td>
                                        <td className="px-4 py-4 text-right font-semibold text-green-600 dark:text-green-400">${item.sales.toFixed(2)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-10 text-gray-500 dark:text-gray-400">No agent performance data for this week yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Daily Performance (Last 90 Days)</h2>
                    <div className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-4">
                        <DailyPerformanceChart data={dailyPerformanceData} />
                    </div>
                </section>

            </main>
        </div>
    );
};

export default DashboardPage;
