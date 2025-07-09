import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import Header from '../components/Header';
import { useToast } from '../components/Toast';
import { useData } from '../context/DataContext';
import UploadIcon from '../components/icons/UploadIcon';
import Spinner from '../components/Spinner';
import { Customer, ImportHistoryLog, SkippedRow } from '../types';
import { downloadCSV, objectToCsv } from '../utils/csv';

const REQUIRED_FIELDS = ['Phone', 'BusinessResidential', 'ShowNumber', 'AssociationID', 'ColdPC', 'Disposition', 'DispositionTime'];
const CUSTOMER_HEADERS = ['Phone', 'Title', 'First', 'Last', 'Middle', 'Address', 'City', 'State', 'Zip', 'CurrentNotes', 'BusinessResidential', 'ShowNumber', 'AssociationID', 'ColdPC', 'AgentNumber', 'Amount', 'TicketsAd', 'Email', 'CreditCard', 'ExpDate', 'CCV', 'RoutingNumber', 'AccountNumber', 'Website', 'Disposition', 'DispositionTime', 'Program', 'LeadList'];

const ImportPage: React.FC = () => {
    const { addToast } = useToast();
    const { bulkAddCustomers, getDispositionByName, getShowByNumber, getAssociationById, agents } = useData();
    
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [importHistory, setImportHistory] = useState<ImportHistoryLog[]>([]);

    const onDrop = useCallback((acceptedFiles: FileList | null) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const handleDownloadTemplate = () => {
        const sampleCustomer = {
            Phone: '555-123-4567', Title: 'Mr.', First: 'John', Last: 'Doe', Middle: 'Q', Address: '123 Main St', City: 'Anytown', State: 'CA', Zip: '12345', CurrentNotes: 'Sample customer note', BusinessResidential: 'Residential', ShowNumber: 1, AssociationID: 'PFF', ColdPC: 'Cold', AgentNumber: 1, Amount: 50, TicketsAd: 2, Email: 'john.doe@example.com', CreditCard: '', ExpDate: '', CCV: '', RoutingNumber: '', AccountNumber: '', Website: 'https://example.com', Disposition: 'Pledge', DispositionTime: new Date().toISOString(), Program: 'Main Campaign', LeadList: 'List A'
        };
        const csvContent = objectToCsv([sampleCustomer]);
        downloadCSV(csvContent, 'template.csv');
    };

    const handleDownloadSkips = (log: ImportHistoryLog) => {
        if (log.skippedRows.length === 0) {
            addToast("No skipped records to download for this import.", "info");
            return;
        }

        const dataToExport = log.skippedRows.map(row => ({
            'Skip Reason': row.reason,
            'Import Date & Time': new Date(log.timestamp).toLocaleString(),
            ...row.data
        }));

        const csvContent = objectToCsv(dataToExport);
        downloadCSV(csvContent, `skipped_records_${log.id}.csv`);
    };

    const handleImport = () => {
        if (!file) {
            addToast('Please select a file to import.', 'error');
            return;
        }
        setIsImporting(true);
        setProgress(0);

        const validCustomers: Customer[] = [];
        const skippedRows: SkippedRow[] = [];
        let totalRecords = 0;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            step: (results, parser) => {
                totalRecords++;
                const row = results.data as any;
                let skipReason = '';

                // Validate required fields
                for (const field of REQUIRED_FIELDS) {
                    const key = Object.keys(row).find(k => k.toLowerCase() === field.toLowerCase());
                    if (!key || !row[key]) {
                        skipReason = `Missing required field: ${field}`;
                        break;
                    }
                }
                
                // Validate foreign keys if no skip reason yet
                if (!skipReason) {
                    const disposition = getDispositionByName(row.Disposition);
                    if (!disposition) {
                        skipReason = `Disposition "${row.Disposition}" not found.`;
                    } else if (getShowByNumber(parseInt(row.ShowNumber, 10)) === undefined) {
                        skipReason = `Show number "${row.ShowNumber}" not found.`;
                    } else if (getAssociationById(row.AssociationID) === undefined) {
                        skipReason = `Association ID "${row.AssociationID}" not found.`;
                    }
                }

                if (skipReason) {
                    skippedRows.push({ reason: skipReason, data: row });
                } else {
                    const disposition = getDispositionByName(row.Disposition)!;
                    const agentNumber = row.AgentNumber ? parseInt(row.AgentNumber, 10) : agents[0].agentNumber;
                    
                    validCustomers.push({
                        id: '', // Will be generated by DataContext
                        phone: row.Phone,
                        title: row.Title,
                        firstName: row.First,
                        lastName: row.Last,
                        middleName: row.Middle,
                        address: row.Address,
                        city: row.City,
                        state: row.State,
                        zip: row.Zip,
                        currentNotes: row.CurrentNotes,
                        businessResidential: row.BusinessResidential,
                        showNumber: parseInt(row.ShowNumber, 10),
                        associationId: row.AssociationID,
                        coldPc: row.ColdPC,
                        agentNumber: agents.find(a => a.agentNumber === agentNumber) ? agentNumber : agents[0].agentNumber,
                        amount: row.Amount ? parseFloat(row.Amount) : undefined,
                        ticketsAd: row.TicketsAd ? parseInt(row.TicketsAd, 10) : undefined,
                        email: row.Email,
                        creditCard: row.CreditCard,
                        expDate: row.ExpDate,
                        ccv: row.CCV,
                        routingNumber: row.RoutingNumber,
                        accountNumber: row.AccountNumber,
                        website: row.Website,
                        dispositionId: disposition.id,
                        dispositionTime: new Date(row.DispositionTime).toISOString(),
                        program: row.Program,
                        leadList: row.LeadList,
                    });
                }
                setProgress(Math.round((results.meta.cursor / file.size) * 100));
            },
            complete: () => {
                bulkAddCustomers(validCustomers);
                
                const logEntry: ImportHistoryLog = {
                    id: Date.now(),
                    timestamp: new Date().toISOString(),
                    fileName: file.name,
                    totalRecords,
                    importedCount: validCustomers.length,
                    skippedCount: skippedRows.length,
                    skippedRows,
                };
                setImportHistory(prev => [logEntry, ...prev]);

                addToast(`Import finished: ${validCustomers.length} imported, ${skippedRows.length} skipped.`, 'success');
                setIsImporting(false);
                setFile(null);
            },
            error: (error) => {
                addToast(`An error occurred during import: ${error.message}`, 'error');
                setIsImporting(false);
            }
        });
    };

    return (
        <div className="flex-1 flex flex-col h-screen">
            <Header title="Import Data" />
            <main className="flex-1 p-6 space-y-8 overflow-y-auto">

                <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-6 space-y-4">
                     <h2 className="text-xl font-semibold">1. Import Instructions</h2>
                    <p className="text-sm">To import customers, first download the CSV template. Fill it with your customer data, ensuring all required fields are present and the data format matches the template. Then, upload the file below and click "Start Import". The system will validate each row and import valid records. A log of each import session, including any skipped records and the reason they were skipped, will be available below.</p>
                    <button onClick={handleDownloadTemplate} className="w-full md:w-auto text-brand-red hover:text-brand-red-dark font-bold py-2 px-4 rounded border border-brand-red hover:border-brand-red-dark transition-colors">
                        Download CSV Template
                    </button>
                </div>

                <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-semibold">2. CSV Upload Form</h2>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-neutral-600 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-neutral-800 rounded-md font-medium text-brand-red hover:text-brand-red-dark focus-within:outline-none">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={(e) => onDrop(e.target.files)} />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">CSV format only</p>
                        </div>
                    </div>

                    {file && <p className="text-center text-sm text-gray-500 dark:text-gray-400">Selected file: {file.name}</p>}

                    {isImporting && (
                        <div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-neutral-700">
                                <div className="bg-brand-red h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}></div>
                            </div>
                            <p className="text-center text-sm mt-1">{progress}%</p>
                        </div>
                    )}
                    
                    <button
                        onClick={handleImport}
                        disabled={!file || isImporting}
                        className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-red hover:bg-brand-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red-light disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isImporting ? <><Spinner size="sm" /> <span className="ml-2">Importing...</span></> : 'Start Import'}
                    </button>
                </div>

                <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-semibold">3. Import History</h2>
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-neutral-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3">Date & Time</th>
                                    <th className="px-4 py-3">File Name</th>
                                    <th className="px-4 py-3">Imported</th>
                                    <th className="px-4 py-3">Skipped</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {importHistory.length > 0 ? importHistory.map(log => (
                                    <tr key={log.id} className="border-b dark:border-neutral-700">
                                        <td className="px-4 py-2">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="px-4 py-2">{log.fileName}</td>
                                        <td className="px-4 py-2 text-green-600 dark:text-green-400 font-medium">{log.importedCount} / {log.totalRecords}</td>
                                        <td className="px-4 py-2 text-yellow-600 dark:text-yellow-400 font-medium">{log.skippedCount}</td>
                                        <td className="px-4 py-2 text-right">
                                            <button 
                                                onClick={() => handleDownloadSkips(log)} 
                                                disabled={log.skippedCount === 0}
                                                className="font-medium text-blue-600 dark:text-blue-500 hover:underline disabled:text-gray-400 disabled:no-underline"
                                            >
                                                Download Skips
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr className="border-b dark:border-neutral-700">
                                        <td colSpan={5} className="text-center py-5 text-gray-500 dark:text-gray-400">
                                            No import history yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-semibold">4. Required Fields List</h2>
                    <p className="text-sm">Your CSV file must contain columns for the following fields. The column names must match exactly.</p>
                    <ul className="list-disc list-inside text-sm grid grid-cols-2 md:grid-cols-3 gap-2">
                        {REQUIRED_FIELDS.map(f => <li key={f}><strong>{f}</strong></li>)}
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default ImportPage;