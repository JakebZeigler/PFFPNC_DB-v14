
import React, { useState, useEffect } from 'react';
import { Customer, Agent, Disposition, Show, Association } from '../types';

interface CustomerFormProps {
    customer: Partial<Customer> | null;
    agents: Agent[];
    dispositions: Disposition[];
    shows: Show[];
    associations: Association[];
    onSave: (customer: Customer) => void;
    onClose?: () => void; // Make onClose optional for page-based forms
}

const FormField: React.FC<{ label: string; children: React.ReactNode; className?: string; required?: boolean }> = ({ label, children, className = 'sm:col-span-1', required }) => (
    <div className={className}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="mt-1">{children}</div>
    </div>
);

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, agents, dispositions, shows, associations, onSave }) => {
    const [formData, setFormData] = useState<Partial<Customer>>({});

    useEffect(() => {
        if (customer) {
            let br = customer.businessResidential;
            if (br?.toUpperCase().startsWith('R')) {
                br = 'Residential';
            } else if (br?.toUpperCase().startsWith('B')) {
                br = 'Business';
            }

            let cp = customer.coldPc;
            if (cp?.toUpperCase().startsWith('C')) {
                cp = 'Cold';
            } else if (cp?.toUpperCase().startsWith('P')) {
                cp = 'PC';
            }
            
            setFormData({
                ...customer,
                businessResidential: br,
                coldPc: cp,
                dispositionTime: customer.dispositionTime ? new Date(customer.dispositionTime).toISOString().substring(0, 16) : new Date().toISOString().substring(0, 16)
            });
        } else {
             setFormData({
                id: undefined,
                businessResidential: 'Residential',
                coldPc: 'Cold',
                dispositionTime: new Date().toISOString().substring(0, 16),
                agentNumber: agents.find(a => a.isDefault)?.agentNumber ?? agents[0]?.agentNumber,
                showNumber: shows.find(s => s.isDefault)?.showNumber ?? shows[0]?.showNumber,
                associationId: associations.find(a => a.isDefault)?.associationId ?? associations[0]?.associationId,
                dispositionId: dispositions.find(d => d.isDefault)?.id ?? dispositions[0]?.id,
             });
        }
    }, [customer, agents, shows, dispositions, associations]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['amount', 'ticketsAd', 'agentNumber', 'showNumber'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumeric ? (value ? Number(value) : undefined) : value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            dispositionTime: new Date(formData.dispositionTime!).toISOString(), // Ensure it's full ISO string
        } as Customer);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-8">
                    {/* Basic Info */}
                    <section>
                        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">Basic Information</h3>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                            <FormField label="Phone" required>
                                <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} required className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                            </FormField>
                             <FormField label="Title">
                                <input type="text" name="title" value={formData.title || ''} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                            </FormField>
                            <FormField label="First Name" required>
                                <input type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} required className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                            </FormField>
                            <FormField label="Last Name" required>
                                <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} required className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                            </FormField>
                            <FormField label="Middle Name">
                                <input type="text" name="middleName" value={formData.middleName || ''} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                            </FormField>
                            <FormField label="Email" className="sm:col-span-2">
                                <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                            </FormField>
                        </div>
                    </section>
                    {/* Business Details */}
                    <section>
                         <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">Business Details</h3>
                         <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                            <FormField label="Business/Residential" required>
                                <select name="businessResidential" value={formData.businessResidential || ''} onChange={handleChange} required className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600">
                                    <option value="Residential">Residential</option>
                                    <option value="Business">Business</option>
                                </select>
                            </FormField>
                             <FormField label="Cold/PC" required>
                                <select name="coldPc" value={formData.coldPc || ''} onChange={handleChange} required className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600">
                                    <option value="Cold">Cold</option>
                                    <option value="PC">PC</option>
                                </select>
                            </FormField>
                            <FormField label="Show" required>
                                <select name="showNumber" value={formData.showNumber || ''} onChange={handleChange} required className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600">
                                    {shows.map(s => <option key={s.id} value={s.showNumber}>{s.showNumber} - {s.showName}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Association" required>
                                <select name="associationId" value={formData.associationId || ''} onChange={handleChange} required className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600">
                                    {associations.map(a => <option key={a.id} value={a.associationId}>{a.associationId} - {a.associationName}</option>)}
                                </select>
                            </FormField>
                             <FormField label="Website" className="sm:col-span-2">
                                <input type="url" name="website" value={formData.website || ''} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                            </FormField>
                         </div>
                    </section>
                </div>
                {/* Right Column */}
                <div className="space-y-8">
                    {/* Address */}
                    <section>
                         <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">Address</h3>
                         <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                             <FormField label="Address" className="sm:col-span-2">
                                <input type="text" name="address" value={formData.address || ''} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                            </FormField>
                            <FormField label="City">
                                <input type="text" name="city" value={formData.city || ''} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                            </FormField>
                            <FormField label="State">
                                <input type="text" name="state" value={formData.state || ''} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                            </FormField>
                             <FormField label="Zip Code" className="sm:col-span-2">
                                <input type="text" name="zip" value={formData.zip || ''} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                            </FormField>
                         </div>
                    </section>
                    {/* Payment */}
                     <section>
                         <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">Payment Information</h3>
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                              <FormField label="Credit Card Number" className="sm:col-span-2">
                                <input type="text" name="creditCard" value={formData.creditCard || ''} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                            </FormField>
                            <FormField label="Expiry Date (MM/YY)">
                                <input type="text" name="expDate" value={formData.expDate || ''} onChange={handleChange} placeholder="MM/YY" className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                            </FormField>
                            <FormField label="CCV">
                                <input type="text" name="ccv" value={formData.ccv || ''} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                            </FormField>
                            <FormField label="Routing Number">
                                <input type="text" name="routingNumber" value={formData.routingNumber || ''} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                            </FormField>
                            <FormField label="Account Number">
                                <input type="text" name="accountNumber" value={formData.accountNumber || ''} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                            </FormField>
                          </div>
                     </section>
                </div>
            </div>

            {/* Disposition Section - Full Width */}
            <section>
                 <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">Disposition</h3>
                 <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
                    <FormField label="Agent" required>
                        <select name="agentNumber" value={formData.agentNumber || ''} onChange={handleChange} required className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600">
                            {agents.map(a => <option key={a.id} value={a.agentNumber}>{a.firstName} {a.lastName} (#{a.agentNumber})</option>)}
                        </select>
                    </FormField>
                    <FormField label="Disposition" required>
                        <select name="dispositionId" value={formData.dispositionId || ''} onChange={handleChange} required className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600">
                            {dispositions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </FormField>
                    <FormField label="Amount">
                        <input type="number" name="amount" value={formData.amount || ''} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600" step="0.01"/>
                    </FormField>
                    <FormField label="Tickets/Ad">
                        <input type="number" name="ticketsAd" value={formData.ticketsAd || ''} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                    </FormField>
                    <FormField label="Disposition Time" required className="sm:col-span-2 md:col-span-1 lg:col-span-1">
                        <input type="datetime-local" name="dispositionTime" value={formData.dispositionTime || ''} onChange={handleChange} required className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                    </FormField>
                    <FormField label="Program">
                         <input type="text" name="program" value={formData.program || ''} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                    </FormField>
                    <FormField label="Lead List">
                        <input type="text" name="leadList" value={formData.leadList || ''} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"/>
                    </FormField>
                     <FormField label="Current Notes" className="sm:col-span-full">
                        <textarea name="currentNotes" value={formData.currentNotes || ''} onChange={handleChange} rows={3} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600"></textarea>
                    </FormField>
                 </div>
            </section>
            
            <div className="pt-5 sticky bottom-0 bg-white dark:bg-neutral-800 py-4">
                <div className="flex justify-end space-x-3">
                    <button type="submit" className="bg-brand-red hover:bg-brand-red-dark text-white font-bold py-2 px-4 rounded-lg">
                        {customer?.id ? 'Save Customer' : 'Add Customer'}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default CustomerForm;
