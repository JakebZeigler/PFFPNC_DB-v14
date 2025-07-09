
import React, { useState, useEffect } from 'react';
import { Show, Venue } from '../types';

interface ShowFormProps {
    show: Partial<Show>;
    onSave: (s: Show) => void;
    onClose: () => void;
}

const ShowForm: React.FC<ShowFormProps> = ({ show, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<Show>>({ venues: [], ...show });

    useEffect(() => {
        setFormData({ venues: [], ...show });
    }, [show]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'showNumber') {
            const numValue = parseInt(value, 10);
            setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? undefined : numValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleVenueChange = (index: number, field: keyof Venue, value: string) => {
        const newVenues = [...(formData.venues || [])];
        newVenues[index] = { ...newVenues[index], [field]: value };
        setFormData(prev => ({ ...prev, venues: newVenues }));
    };

    const addVenue = () => {
        const newVenue: Venue = {
            letter: String.fromCharCode(65 + (formData.venues?.length || 0)), // A, B, C...
            location: '',
            playDate: ''
        };
        setFormData(prev => ({ ...prev, venues: [...(prev.venues || []), newVenue] }));
    };

    const removeVenue = (index: number) => {
        const newVenues = (formData.venues || []).filter((_, i) => i !== index);
        // Re-letter venues
        const reletteredVenues = newVenues.map((v, i) => ({ ...v, letter: String.fromCharCode(65 + i) }));
        setFormData(prev => ({ ...prev, venues: reletteredVenues }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            id: formData.id || `show-${Date.now()}`,
        } as Show);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Show Details Section */}
            <fieldset>
                <legend className="text-lg font-medium text-gray-900 dark:text-gray-100">Show Details</legend>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Show Number *</label>
                        <input type="number" name="showNumber" value={formData.showNumber ?? ''} onChange={handleChange} required disabled={show.isDefault}
                            className="mt-1 block w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 disabled:bg-gray-200 dark:disabled:bg-neutral-600"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Show Name *</label>
                        <input name="showName" value={formData.showName || ''} onChange={handleChange} required disabled={show.isDefault}
                            className="mt-1 block w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 disabled:bg-gray-200 dark:disabled:bg-neutral-600"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Genre</label>
                        <input name="genre" value={formData.genre || ''} onChange={handleChange} disabled={show.isDefault}
                            className="mt-1 block w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 disabled:bg-gray-200 dark:disabled:bg-neutral-600"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Start Date</label>
                        <input type="date" name="startDate" value={formData.startDate || ''} onChange={handleChange} disabled={show.isDefault}
                            className="mt-1 block w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 disabled:bg-gray-200 dark:disabled:bg-neutral-600"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">End Date</label>
                        <input type="date" name="endDate" value={formData.endDate || ''} onChange={handleChange} disabled={show.isDefault}
                            className="mt-1 block w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 disabled:bg-gray-200 dark:disabled:bg-neutral-600"/>
                    </div>
                </div>
            </fieldset>

            {/* Venues Section */}
            {!show.isDefault && (
                <fieldset>
                    <legend className="text-lg font-medium text-gray-900 dark:text-gray-100">Venues</legend>
                    <div className="mt-4 space-y-4">
                        {(formData.venues || []).map((venue, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_auto] gap-3 items-center p-3 border rounded-md dark:border-neutral-700">
                                <span className="font-bold">{venue.letter}</span>
                                <input type="text" placeholder="Location" value={venue.location} onChange={e => handleVenueChange(index, 'location', e.target.value)} required disabled={show.isDefault}
                                    className="block w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 disabled:bg-gray-200"/>
                                <input type="date" placeholder="Play Date" value={venue.playDate} onChange={e => handleVenueChange(index, 'playDate', e.target.value)} required disabled={show.isDefault}
                                    className="block w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 disabled:bg-gray-200"/>
                                {!show.isDefault && (
                                    <button type="button" onClick={() => removeVenue(index)} className="text-red-500 hover:text-red-700">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={addVenue} className="mt-2 text-sm font-medium text-brand-red hover:text-brand-red-dark">
                            + Add Venue
                        </button>
                    </div>
                </fieldset>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-neutral-600 rounded-md">Cancel</button>
                {!show.isDefault && <button type="submit" className="px-4 py-2 bg-brand-red text-white rounded-md">Save Show</button>}
            </div>
        </form>
    );
};

export default ShowForm;