import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Spinner from '../components/Spinner';

const RegisterPage: React.FC = () => {
    const { register } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            addToast('Passwords do not match.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            await register(formData.firstName, formData.lastName, formData.email, formData.password);
            addToast('Registration successful!', 'success');
            setIsRegistered(true);
        } catch (error: any) {
            addToast(error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isRegistered) {
        return (
             <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h1 className="mt-6 text-center text-4xl font-extrabold text-brand-red">PFFPNC DB</h1>
                    <div className="mt-8 bg-white dark:bg-neutral-800 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Request Sent</h2>
                        <p className="mt-4 text-gray-600 dark:text-gray-300">
                            Your account registration has been submitted. An administrator has been notified and will review your request for approval. You will not be able to log in until your account is activated.
                        </p>
                        <div className="mt-6">
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-red hover:bg-brand-red-dark focus:outline-none"
                            >
                                Back to Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h1 className="mt-6 text-center text-4xl font-extrabold text-brand-red">PFFPNC DB</h1>
                <h2 className="mt-2 text-center text-xl text-gray-900 dark:text-gray-200">
                    Request an account
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-neutral-800 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-4">
                            <input name="firstName" placeholder="First Name" required value={formData.firstName} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600" />
                            <input name="lastName" placeholder="Last Name" required value={formData.lastName} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600" />
                        </div>
                        <input name="email" type="email" placeholder="Email Address" required value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600" />
                        <input name="password" type="password" placeholder="Password" required value={formData.password} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600" />
                        <input name="confirmPassword" type="password" placeholder="Confirm Password" required value={formData.confirmPassword} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600" />
                        
                        <div>
                            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-red hover:bg-brand-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red-light disabled:bg-gray-400">
                                {isLoading ? <Spinner size="sm" /> : 'Register'}
                            </button>
                        </div>
                    </form>
                     <div className="mt-6 text-center">
                        <Link to="/login" className="font-medium text-brand-red hover:text-brand-red-dark">
                            Already have an account? Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
