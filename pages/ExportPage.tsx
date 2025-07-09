
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useToast } from '../components/Toast';
import { useData } from '../context/DataContext';
import { Customer, CustomerWithHistory, DispositionModifier } from '../types';
import { downloadCSV, objectToCsv } from '../utils/csv';

interface ExportHistoryItem {
    id: number;
    type: string;
    timestamp: string;
    recordCount: number;
    dateRange: string;
    fileName: string;
    csvContent: string;
}

interface ExportCardProps {
    title: string;
    description: string;
    defaultDateRange: string;
    onExport: (title: string, from: string, to: string, options?: any) => void;
    defaultDateFrom: string;
    defaultDateTo: string;
}

const ExportCard: React.FC<ExportCardProps> = ({ title, description, defaultDateRange, onExport, defaultDateFrom, defaultDateTo }) => {
    const [dateFrom, setDateFrom] = useState(defaultDateFrom);
    const [dateTo, setDateTo] = useState(defaultDateTo);
    const [pcCustomerType, setPcCustomerType] = useState('Both');

    useEffect(() => {
        setDateFrom(defaultDateFrom);
        setDateTo(defaultDateTo);
    }, [defaultDateFrom, defaultDateTo]);

    const handleExportClick = () => {
        let options = {};
        if (title === 'PCs') {
            options = { pcCustomerType };
        }
        onExport(title, dateFrom, dateTo, options);
    };

    return (
        <div className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-6 flex flex-col space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400 flex-grow">{description}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Default Range: <span className="font-medium">{defaultDateRange}</span></p>
            
            {title === 'PCs' && (
                <div className="space-y-1">
                    <label htmlFor={`pc-type-select-${title}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Type</label>
                    <select
                        id={`pc-type-select-${title}`}
                        value={pcCustomerType}
                        onChange={e => setPcCustomerType(e.target.value)}
                        className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"
                    >
                        <option value="Both">Both</option>
                        <option value="Business">Business</option>
                        <option value="Residential">Residential</option>
                    </select>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600" />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600" />
            </div>
            <button
                onClick={handleExportClick}
                className="w-full bg-brand-red hover:bg-brand-red-dark text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                Export {title}
            </button>
        </div>
    );
};


export default function ExportPage(): React.ReactElement {
    const { addToast } = useToast();
    const { customers, dispositions, getDispositionById } = useData();
    const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const getInvoiceDates = (history: ExportHistoryItem[]) => {
        const lastInvoiceExport = history
            .filter(h => h.type === 'Invoices')
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        let fromDate: Date;
        if (lastInvoiceExport) {
            const lastExportToDateStr = lastInvoiceExport.dateRange.split(' to ')[1];
            fromDate = new Date(lastExportToDateStr.replace(/-/g, '/'));
            fromDate.setDate(fromDate.getDate() + 1);
        } else {
            fromDate = new Date();
            fromDate.setDate(1); // Default to start of current month
        }

        return { from: formatDate(fromDate), to: formatDate(yesterday) };
    };

    const getResetDates = () => {
        const today = new Date();
        const toDate = new Date();
        toDate.setDate(today.getDate() - 21);
        const fromDate = new Date();
        fromDate.setDate(today.getDate() - 90);
        return { from: formatDate(fromDate), to: formatDate(toDate) };
    };

    const getPcDates = () => {
        const today = new Date();
        const toDate = new Date();
        toDate.setDate(today.getDate() - 150);
        const fromDate = new Date();
        fromDate.setFullYear(today.getFullYear() - 3);
        return { from: formatDate(fromDate), to: formatDate(toDate) };
    };

    const handleExport = (title: string, from: string, to: string, options?: { pcCustomerType?: string }) => {
        const isCustomerExportable = (customer: CustomerWithHistory): boolean => {
            const historyByTimeDesc = [...customer.dispositionHistory].sort((a, b) => new Date(b.dispositionTime).getTime() - new Date(a.dispositionTime).getTime());
            
            const dncDispositions = new Set<string>();
            dispositions.forEach(d => {
                if (d.modifiers.includes(DispositionModifier.DNC)) {
                    dncDispositions.add(d.id);
                }
                if (d.modifiers.includes(DispositionModifier.ExcludeCount) && d.excludeAction === 'DNC' && d.excludeAfterAttempts) {
                    const attempts = historyByTimeDesc.filter(h => h.dispositionId === d.id).length;
                    if (attempts >= d.excludeAfterAttempts) {
                        dncDispositions.add(d.id);
                    }
                }
            });
    
            if (historyByTimeDesc.some(h => dncDispositions.has(h.dispositionId))) {
                return false;
            }
    
            const latestHistory = historyByTimeDesc[0];
            if (!latestHistory) return true;
    
            const latestDisposition = getDispositionById(latestHistory.dispositionId);
            if (!latestDisposition) return true;
    
            if (latestDisposition.modifiers.includes(DispositionModifier.TimeOut) && latestDisposition.timeOutDays) {
                const dispositionTime = new Date(latestHistory.dispositionTime).getTime();
                const timeoutPeriod = latestDisposition.timeOutDays * 24 * 60 * 60 * 1000;
                if (Date.now() < dispositionTime + timeoutPeriod) {
                    return false;
                }
            }
    
            if (latestDisposition.modifiers.includes(DispositionModifier.ExcludeCount) && latestDisposition.excludeAfterAttempts) {
                const attempts = historyByTimeDesc.filter(h => h.dispositionId === latestDisposition.id).length;
                if (attempts >= latestDisposition.excludeAfterAttempts) {
                    if (latestDisposition.excludeAction === 'TimeOut' && latestDisposition.excludeActionTimeOutDays) {
                        const timeoutPeriod = latestDisposition.excludeActionTimeOutDays * 24 * 60 * 60 * 1000;
                        if (Date.now() < new Date(latestHistory.dispositionTime).getTime() + timeoutPeriod) {
                            return false;
                        }
                    } else if (latestDisposition.excludeAction === 'None') {
                        return false;
                    }
                }
            }
            
            return true;
        };
        
        let finalFrom: string;
        let finalTo: string;
        let recordsToExport: CustomerWithHistory[] = [];

        if (title === 'Invoices') {
            const defaultDates = getInvoiceDates(exportHistory);
            finalFrom = from || defaultDates.from;
            finalTo = to || defaultDates.to;
        } else if (title === 'Resets') {
            const defaultDates = getResetDates();
            finalFrom = from || defaultDates.from;
            finalTo = to || defaultDates.to;
        } else if (title === 'PCs') {
            const defaultDates = getPcDates();
            finalFrom = from || defaultDates.from;
            finalTo = to || defaultDates.to;
        } else {
             const defaultDates = getInvoiceDates(exportHistory);
             finalFrom = from || defaultDates.from;
             finalTo = to || defaultDates.to;
        }


        const startTime = new Date(finalFrom.replace(/-/g, '/'));
        startTime.setHours(0,0,0,0);
        const endTime = new Date(finalTo.replace(/-/g, '/'));
        endTime.setHours(23,59,59,999);

        if (title === 'Invoices') {
            recordsToExport = customers.filter(customer => {
                if (!isCustomerExportable(customer)) return false;

                return customer.dispositionHistory.some(h => {
                    const disp = getDispositionById(h.dispositionId);
                    if (!disp || !disp.modifiers.includes(DispositionModifier.Invoice)) {
                        return false;
                    }
                    const dispTime = new Date(h.dispositionTime).getTime();
                    return dispTime >= startTime.getTime() && dispTime <= endTime.getTime();
                });
            });
        } else if (title === 'Resets') {
            recordsToExport = customers.filter(c => {
                if (!isCustomerExportable(c)) return false;

                if (c.dispositionHistory.length === 0) return false;
                
                const latestHistory = [...c.dispositionHistory].sort((a, b) => new Date(b.dispositionTime).getTime() - new Date(a.dispositionTime).getTime())[0];
                
                if (!latestHistory) return false;
                
                const latestDisposition = getDispositionById(latestHistory.dispositionId);
                if (!latestDisposition) return false;

                const hasSaleModifier = latestDisposition.modifiers.includes(DispositionModifier.Sale);
                const hasPaymentModifier = latestDisposition.modifiers.includes(DispositionModifier.Payment);

                // Only include if it's a sale and NOT a payment.
                if (!hasSaleModifier || hasPaymentModifier) {
                    return false;
                }

                const dispTime = new Date(latestHistory.dispositionTime);
                return dispTime.getTime() >= startTime.getTime() && dispTime.getTime() <= endTime.getTime();
            });
        } else if (title === 'PCs') {
            recordsToExport = customers.filter(c => {
                if (!isCustomerExportable(c)) return false;
        
                // Condition 1: Must have a 'Sale' or 'Payment' disposition within the date range.
                const hasQualifyingDispositionInRange = c.dispositionHistory.some(h => {
                    const dispTime = new Date(h.dispositionTime).getTime();
                    if (dispTime < startTime.getTime() || dispTime > endTime.getTime()) {
                        return false;
                    }
                    const disposition = getDispositionById(h.dispositionId);
                    if (!disposition) return false;
                    return disposition.modifiers.includes(DispositionModifier.Sale) ||
                           disposition.modifiers.includes(DispositionModifier.Payment);
                });
        
                if (!hasQualifyingDispositionInRange) {
                    return false; // Does not meet the first condition.
                }
        
                // Condition 2: Must NOT have a 'Sale' or 'Payment' disposition after the date range.
                const hasDisqualifyingDispositionAfterRange = c.dispositionHistory.some(h => {
                    const dispTime = new Date(h.dispositionTime).getTime();
                    if (dispTime <= endTime.getTime()) { // Only look at dispositions AFTER the end time
                        return false;
                    }
                    const disposition = getDispositionById(h.dispositionId);
                    if (!disposition) return false;
                    return disposition.modifiers.includes(DispositionModifier.Sale) ||
                           disposition.modifiers.includes(DispositionModifier.Payment);
                });
        
                if (hasDisqualifyingDispositionAfterRange) {
                    return false;
                }

                // Condition 3: Filter by customer type
                if (options?.pcCustomerType && options.pcCustomerType !== 'Both') {
                    const customerType = (c.businessResidential || '').toUpperCase();
                    if (options.pcCustomerType === 'Business' && !customerType.startsWith('B')) {
                        return false;
                    }
                    if (options.pcCustomerType === 'Residential' && !customerType.startsWith('R')) {
                        return false;
                    }
                }
        
                return true;
            });
        }
        
        if (recordsToExport.length === 0) {
            addToast('No records found for the selected criteria.', 'info');
            return;
        }

        const dataToExport = recordsToExport.map(({ dispositionHistory, ...customerData }) => {
            const { dispositionId, ...rest } = customerData;
            return {
                ...rest,
                disposition: getDispositionById(dispositionId)?.name || 'Unknown',
            };
        });
        
        const csv = objectToCsv(dataToExport);
        let fileName = `${title.replace(/ /g, '_')}_${finalFrom}_to_${finalTo}.csv`;
        if (title === 'PCs' && options?.pcCustomerType && options.pcCustomerType !== 'Both') {
            fileName = `${title.replace(/ /g, '_')}_${options.pcCustomerType}_${finalFrom}_to_${finalTo}.csv`;
        }

        downloadCSV(csv, fileName);
        
        const newHistoryItem: ExportHistoryItem = {
            id: Date.now(),
            type: title,
            timestamp: new Date().toISOString(),
            recordCount: recordsToExport.length,
            dateRange: `${finalFrom} to ${finalTo}`,
            fileName,
            csvContent: csv
        };
        
        setExportHistory(prev => [newHistoryItem, ...prev]);
        addToast(`${recordsToExport.length} records exported successfully!`, 'success');
    };

    const invoiceDates = getInvoiceDates(exportHistory);
    const resetDates = getResetDates();
    const pcDates = getPcDates();

    return (
        <div className="flex-1 flex flex-col h-screen">
            <Header title="Export Data" />
            <main className="flex-1 p-6 space-y-8 overflow-y-auto bg-gray-50 dark:bg-neutral-900/50">
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Standard Exports</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        <ExportCard 
                            title="Invoices"
                            description="Export customers who have a disposition with the 'Invoice' modifier within the selected date range. Ideal for generating billing documents."
                            defaultDateRange="Last export to yesterday"
                            onExport={handleExport}
                            defaultDateFrom={invoiceDates.from}
                            defaultDateTo={invoiceDates.to}
                        />
                        <ExportCard 
                            title="Resets"
                            description="Export customers whose last disposition was a sale (but not a payment), within a specific timeframe (default 21-90 days ago). Useful for re-engagement campaigns."
                            defaultDateRange="21-90 days ago"
                            onExport={handleExport}
                            defaultDateFrom={resetDates.from}
                            defaultDateTo={resetDates.to}
                        />
                        <ExportCard 
                            title="PCs"
                            description="Exports customers with a 'Sale' or 'Payment' in the date range, who have not contributed since. Ideal for targeting past donors for re-engagement."
                            defaultDateRange="150 days - 3 years ago"
                            onExport={handleExport}
                            defaultDateFrom={pcDates.from}
                            defaultDateTo={pcDates.to}
                        />
                    </div>
                </section>
                
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Export History</h2>
                    <div className="overflow-x-auto bg-white dark:bg-neutral-800 shadow-md rounded-lg">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                             <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-neutral-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Date & Time</th>
                                    <th className="px-4 py-3">Date Range</th>
                                    <th className="px-4 py-3">Records</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exportHistory.length > 0 ? exportHistory.map(item => (
                                    <tr key={item.id} className="border-b dark:border-neutral-700">
                                        <td className="px-4 py-2 font-medium">{item.type}</td>
                                        <td className="px-4 py-2">{new Date(item.timestamp).toLocaleString()}</td>
                                        <td className="px-4 py-2">{item.dateRange}</td>
                                        <td className="px-4 py-2">{item.recordCount}</td>
                                        <td className="px-4 py-2 text-right">
                                            <button 
                                                onClick={() => downloadCSV(item.csvContent, item.fileName)}
                                                className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                                            >
                                                Re-download
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr className="border-b dark:border-neutral-700">
                                        <td colSpan={5} className="text-center py-5 text-gray-500 dark:text-gray-400">
                                            No exports have been run in this session.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}
