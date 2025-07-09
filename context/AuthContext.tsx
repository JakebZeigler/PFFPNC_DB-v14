import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useData } from './DataContext';
import { AuthContextType, User } from '../types';
import Spinner from '../components/Spinner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within a AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { getUserByEmail, addUser } = useData();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for a logged-in user in session storage on initial load
        try {
            const storedUser = sessionStorage.getItem('pffpnc-user');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                // Re-validate user against data source
                const validatedUser = getUserByEmail(parsedUser.email);
                if (validatedUser && validatedUser.status === 'active') {
                    setUser(validatedUser);
                }
            }
        } catch (error) {
            console.error("Failed to parse user from session storage", error);
            sessionStorage.removeItem('pffpnc-user');
        } finally {
            setLoading(false);
        }
    }, [getUserByEmail]);

    const login = useCallback(async (email: string, password?: string): Promise<boolean> => {
        const foundUser = getUserByEmail(email);

        if (foundUser && foundUser.password === password) {
            if (foundUser.status === 'pending') {
                throw new Error("Your account is pending approval by an administrator.");
            }
            if (foundUser.status === 'active') {
                const { password, ...userToStore } = foundUser;
                setUser(userToStore);
                sessionStorage.setItem('pffpnc-user', JSON.stringify(userToStore));
                return true;
            }
        }
        throw new Error("Invalid email or password.");
    }, [getUserByEmail]);

    const logout = useCallback(() => {
        setUser(null);
        sessionStorage.removeItem('pffpnc-user');
    }, []);
    
    const register = useCallback(async (firstName: string, lastName: string, email: string, password?: string): Promise<boolean> => {
        const existingUser = getUserByEmail(email);
        if(existingUser) {
            throw new Error("A user with this email address already exists.");
        }
        
        addUser({
            firstName,
            lastName,
            email,
            password,
            role: 'user' // All new registrations are 'user' role by default
        });
        
        return true;
    }, [getUserByEmail, addUser]);

    const value = { user, loading, login, logout, register };
    
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen w-screen bg-neutral-100 dark:bg-neutral-900">
                <div className="flex flex-col items-center">
                    <Spinner size="lg" />
                    <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">Loading Application...</p>
                </div>
            </div>
        )
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
