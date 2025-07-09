import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { useToast } from '../components/Toast';
import { Association } from '../types';
import Spinner from '../components/Spinner';

const AssociationFormPage: React.FC = () => {
    const { assocId } = useParams<{ assocId: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { getAssociationByDbId, addOrUpdateAssociation } = useData();

    const isEditing = Boolean(assocId);
    const [formData, setFormData] = useState<Partial<Association>>({});
    const [isLoading, setIsLoading] = useState(isEditing);

    useEffect(() => {
        if (isEditing) {
            const existingAssoc = getAssociationByDbId(assocId!);
            if (existingAssoc) {
                setFormData(existingAssoc);
                setIsLoading(false);
            }
        }
    }, [assocId, getAssociationByDbId, isEditing]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.associationId || !formData.associationName) {
            addToast('ID and Name are required.', 'error');
            return;
        }

        const associationToSave: Association = {
            id: formData.id || `assoc-${Date.now()}`,
            associationId: formData.associationId,
            associationName: formData.associationName,
            associatedCity: formData.associatedCity,
            isDefault: formData.isDefault || false,
        };
        
        addOrUpdateAssociation(associationToSave);
        addToast(isEditing ? 'Association updated successfully' : 'Association added successfully', 'success');
        navigate('/associations');
    };

    if (isLoading) {
        return <div className="flex-1 flex items-center justify-center"><Spinner /></div>;
    }

    return (
        <div className="flex-1 flex flex-col h-screen">
            <Header title={isEditing ? 'Edit Association' : 'Add Association'}>
                <div className="flex space-x-2">
                    <button onClick={() => navigate('/associations')} className="px-4 py-2 bg-gray-200 dark:bg-neutral-600 rounded-md text-sm">Back to List</button>
                    {isEditing && <Link to={`/associations/${assocId}`} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">View Association</Link>}
                </div>
            </Header>
            <main className="flex-1 p-6 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto bg-white dark:bg-neutral-800 p-8 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Association Details</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Association ID (e.g. PFF) *</label>
                            <input name="associationId" value={formData.associationId || ''} onChange={handleChange} required disabled={formData.isDefault}
                            className="mt-1 block w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 disabled:bg-gray-200 dark:disabled:bg-neutral-600"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Association Name *</label>
                            <input name="associationName" value={formData.associationName || ''} onChange={handleChange} required disabled={formData.isDefault}
                            className="mt-1 block w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 disabled:bg-gray-200 dark:disabled:bg-neutral-600"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Associated City</label>
                            <input name="associatedCity" value={formData.associatedCity || ''} onChange={handleChange} disabled={formData.isDefault}
                            className="mt-1 block w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 disabled:bg-gray-200 dark:disabled:bg-neutral-600"/>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        {!formData.isDefault && <button type="submit" className="px-4 py-2 bg-brand-red text-white rounded-md">{isEditing ? 'Save Changes' : 'Add Association'}</button>}
                    </div>
                </form>
            </main>
        </div>
    );
};

export default AssociationFormPage;