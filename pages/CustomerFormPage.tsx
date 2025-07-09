
import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import CustomerForm from '../components/CustomerForm';
import { useData } from '../context/DataContext';
import { useToast } from '../components/Toast';
import { Customer } from '../types';
import Spinner from '../components/Spinner';

const CustomerFormPage: React.FC = () => {
    const { customerId } = useParams<{ customerId: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { customers, agents, dispositions, shows, associations, addOrUpdateCustomer } = useData();

    const isEditing = Boolean(customerId);
    const customer = useMemo(() => {
        return isEditing ? customers.find(c => c.id === customerId) : null;
    }, [customerId, customers, isEditing]);
    
    const handleSave = (customerData: Customer) => {
        addOrUpdateCustomer(customerData);
        addToast(isEditing ? 'Customer updated successfully' : 'Customer added successfully', 'success');
        
        // If we are adding a new customer, we don't have an ID yet. 
        // We navigate to the main list. If editing, navigate to the detail page.
        if (isEditing) {
            navigate(`/customers/${customerId}`);
        } else {
            navigate('/customers');
        }
    };
    
    if (isEditing && !customer) {
         return (
             <div className="flex-1 flex flex-col items-center justify-center">
                <Spinner />
                <p className="mt-2">Loading customer...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-screen">
            <Header title={isEditing ? `Edit ${customer?.firstName} ${customer?.lastName}` : 'Add New Customer'}>
                 <div className="flex space-x-2">
                    <button onClick={() => navigate('/customers')} className="px-4 py-2 bg-gray-200 dark:bg-neutral-600 rounded-md text-sm">Back to List</button>
                    {isEditing && (
                         <Link to={`/customers/${customerId}`} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">View Customer</Link>
                    )}
                </div>
            </Header>
            <main className="flex-1 p-6 overflow-y-auto">
                 <CustomerForm
                    customer={customer}
                    onSave={handleSave}
                    agents={agents}
                    dispositions={dispositions}
                    shows={shows}
                    associations={associations}
                 />
            </main>
        </div>
    );
};

export default CustomerFormPage;
