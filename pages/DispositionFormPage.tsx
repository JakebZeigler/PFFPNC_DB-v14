
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { useToast } from '../components/Toast';
import { Disposition, DispositionModifier } from '../types';
import { DISPOSITION_MODIFIERS_INFO } from '../constants';
import Spinner from '../components/Spinner';

const DispositionFormPage: React.FC = () => {
    const { dispositionId } = useParams<{ dispositionId: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { dispositions, addOrUpdateDisposition } = useData();

    const isEditing = Boolean(dispositionId);
    const [disposition, setDisposition] = useState<Partial<Disposition> | null>(null);
    const [name, setName] = useState('');
    const [modifiers, setModifiers] = useState<Set<DispositionModifier>>(new Set());

    // State for modifier parameters
    const [timeOutDays, setTimeOutDays] = useState<number | undefined>();
    const [excludeAfterAttempts, setExcludeAfterAttempts] = useState<number | undefined>();
    const [excludeAction, setExcludeAction] = useState<'None' | 'DNC' | 'TimeOut'>('None');
    const [excludeActionTimeOutDays, setExcludeActionTimeOutDays] = useState<number | undefined>();


    useEffect(() => {
        if (isEditing) {
            const existingDisp = dispositions.find(d => d.id === dispositionId);
            if (existingDisp) {
                setDisposition(existingDisp);
                setName(existingDisp.name);
                setModifiers(new Set(existingDisp.modifiers));
                setTimeOutDays(existingDisp.timeOutDays);
                setExcludeAfterAttempts(existingDisp.excludeAfterAttempts);
                setExcludeAction(existingDisp.excludeAction || 'None');
                setExcludeActionTimeOutDays(existingDisp.excludeActionTimeOutDays);
            }
        } else {
            setDisposition({}); // For new disposition
            setExcludeAction('None');
        }
    }, [dispositionId, dispositions, isEditing]);

    const handleModifierChange = (modifier: DispositionModifier) => {
        setModifiers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(modifier)) {
                newSet.delete(modifier);
                if (modifier === DispositionModifier.TimeOut) {
                    setTimeOutDays(undefined);
                }
                if (modifier === DispositionModifier.ExcludeCount) {
                    setExcludeAfterAttempts(undefined);
                    setExcludeAction('None');
                    setExcludeActionTimeOutDays(undefined);
                }
            } else {
                newSet.add(modifier);
            }
            return newSet;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            addToast('Disposition Name is required.', 'error');
            return;
        }
        
        const newDisposition: Disposition = {
            id: disposition?.id || `disp-custom-${Date.now()}`,
            name,
            modifiers: Array.from(modifiers),
            isDefault: disposition?.isDefault || false,
            timeOutDays: modifiers.has(DispositionModifier.TimeOut) ? timeOutDays : undefined,
            excludeAfterAttempts: modifiers.has(DispositionModifier.ExcludeCount) ? excludeAfterAttempts : undefined,
            excludeAction: modifiers.has(DispositionModifier.ExcludeCount) ? excludeAction : 'None',
            excludeActionTimeOutDays: modifiers.has(DispositionModifier.ExcludeCount) && excludeAction === 'TimeOut' ? excludeActionTimeOutDays : undefined,
        };

        addOrUpdateDisposition(newDisposition);
        addToast(isEditing ? 'Disposition updated successfully' : 'Disposition added successfully', 'success');
        navigate('/dispositions');
    };
    
    if (disposition === null) {
        return <div className="flex-1 flex items-center justify-center"><Spinner /></div>;
    }

    return (
        <div className="flex-1 flex flex-col h-screen">
            <Header title={isEditing ? 'Edit Disposition' : 'Add Disposition'}>
                <div className="flex space-x-2">
                    <button onClick={() => navigate('/dispositions')} className="px-4 py-2 bg-gray-200 dark:bg-neutral-600 rounded-md text-sm">Back to Dispositions</button>
                    {isEditing && <Link to={`/dispositions/${dispositionId}`} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">View Disposition</Link>}
                </div>
            </Header>
            <main className="flex-1 p-6 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Disposition Name</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required disabled={disposition.isDefault}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm disabled:bg-gray-200 dark:disabled:bg-neutral-600" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Modifiers</h4>
                            <div className="mt-2 space-y-2">
                                {DISPOSITION_MODIFIERS_INFO.map(modInfo => (
                                    <div key={modInfo.key}>
                                        <label className="flex items-center">
                                            <input type="checkbox" checked={modifiers.has(modInfo.key)} onChange={() => handleModifierChange(modInfo.key)} disabled={disposition.isDefault}
                                                className="h-4 w-4 text-brand-red border-gray-300 rounded focus:ring-brand-red disabled:bg-gray-200" />
                                            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">{modInfo.name}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg space-y-4">
                             <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Modifier Details</h4>
                             {modifiers.size === 0 && <p className="text-sm text-gray-500">Select a modifier to see its options.</p>}
                             
                             {modifiers.has(DispositionModifier.TimeOut) && (
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium">Timeout Duration (Days)</label>
                                    <input type="number" value={timeOutDays || ''} onChange={e => setTimeOutDays(e.target.value ? parseInt(e.target.value) : undefined)}
                                           className="block w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600" required />
                                </div>
                             )}

                             {modifiers.has(DispositionModifier.ExcludeCount) && (
                                <div className="space-y-4 p-3 border-t dark:border-neutral-700">
                                     <div className="space-y-1">
                                        <label className="block text-sm font-medium">Exclude After (Attempts)</label>
                                        <input type="number" value={excludeAfterAttempts || ''} onChange={e => setExcludeAfterAttempts(e.target.value ? parseInt(e.target.value) : undefined)}
                                               className="block w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600" required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium">Action After Exclusion</label>
                                        <select value={excludeAction} onChange={e => setExcludeAction(e.target.value as any)}
                                                className="block w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600">
                                            <option value="None">None</option>
                                            <option value="DNC">Set to DNC</option>
                                            <option value="TimeOut">Set to TimeOut</option>
                                        </select>
                                    </div>
                                    {excludeAction === 'TimeOut' && (
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium">Post-Exclusion Timeout (Days)</label>
                                            <input type="number" value={excludeActionTimeOutDays || ''} onChange={e => setExcludeActionTimeOutDays(e.target.value ? parseInt(e.target.value) : undefined)}
                                                   className="block w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600" required />
                                        </div>
                                    )}
                                </div>
                             )}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        {!disposition.isDefault && <button type="submit" className="bg-brand-red hover:bg-brand-red-dark text-white font-bold py-2 px-4 rounded-lg">{isEditing ? 'Save Changes' : 'Add Disposition'}</button>}
                    </div>
                </form>
            </main>
        </div>
    );
};

export default DispositionFormPage;