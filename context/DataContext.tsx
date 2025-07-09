import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Customer, CustomerWithHistory, Agent, Disposition, Show, Association, DataContextType, DispositionHistory, User } from '../types';
import { initialAgents, initialCustomers, initialDispositions, initialShows, initialAssociations, initialUsers } from '../data/mockData';
import { DEFAULT_AGENT, DEFAULT_DISPOSITION, DEFAULT_SHOW, DEFAULT_ASSOCIATION } from '../constants';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

// --- Local Storage Persistence Hook ---
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                return JSON.parse(item);
            }
            // If no item, set the initial value in localStorage for the next load.
            window.localStorage.setItem(key, JSON.stringify(initialValue));
            return initialValue;
        } catch (error) {
            console.error(`Error reading from localStorage key “${key}”:`, error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            const valueToStore = storedValue instanceof Function ? storedValue(storedValue) : storedValue;
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
};


export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [customers, setCustomers] = useLocalStorage<CustomerWithHistory[]>('pffpnc-customers', initialCustomers);
    const [agents, setAgents] = useLocalStorage<Agent[]>('pffpnc-agents', initialAgents);
    const [dispositions, setDispositions] = useLocalStorage<Disposition[]>('pffpnc-dispositions', initialDispositions);
    const [shows, setShows] = useLocalStorage<Show[]>('pffpnc-shows', initialShows);
    const [associations, setAssociations] = useLocalStorage<Association[]>('pffpnc-associations', initialAssociations);
    const [users, setUsers] = useLocalStorage<User[]>('pffpnc-users', initialUsers);

    // --- User Actions ---
    const addUser = useCallback((user: Omit<User, 'id' | 'status'>) => {
        const newUser: User = {
            ...user,
            id: `user-${Date.now()}`,
            status: 'pending',
        };
        setUsers(prev => [...prev, newUser]);
    }, [setUsers]);

    const updateUser = useCallback((updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    }, [setUsers]);

    const deleteUser = useCallback((userId: string) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
    }, [setUsers]);

    const getUserByEmail = useCallback((email: string) => users.find(u => u.email.toLowerCase() === email.toLowerCase()), [users]);

    // --- Customer Actions ---
    const addOrUpdateCustomer = useCallback((customer: Customer) => {
        setCustomers(prev => {
            const newHistoryEntry: DispositionHistory = {
                dispositionId: customer.dispositionId,
                dispositionTime: new Date(customer.dispositionTime).toISOString(),
                agentNumber: customer.agentNumber,
                amount: customer.amount,
                ticketsAd: customer.ticketsAd,
                currentNotes: customer.currentNotes,
                program: customer.program,
                leadList: customer.leadList,
            };

            const existing = prev.find(c => c.id === customer.id);
            if (existing) {
                 // Check for meaningful change to avoid duplicate history on simple re-saves
                const lastHistory = existing.dispositionHistory[existing.dispositionHistory.length - 1];
                const hasMeaningfulChange = !lastHistory ||
                    lastHistory.dispositionId !== newHistoryEntry.dispositionId ||
                    new Date(lastHistory.dispositionTime).getTime() !== new Date(newHistoryEntry.dispositionTime).getTime() ||
                    lastHistory.amount !== newHistoryEntry.amount ||
                    existing.currentNotes !== customer.currentNotes;

                const updatedHistory = hasMeaningfulChange
                    ? [...existing.dispositionHistory, newHistoryEntry]
                    : existing.dispositionHistory;

                const customerWithHistory = { ...customer, dispositionHistory: updatedHistory };
                return prev.map(c => c.id === customer.id ? customerWithHistory : c);
            } else {
                // Add new customer
                const newCustomer: CustomerWithHistory = {
                    ...customer,
                    id: `cust-${Date.now()}`,
                    dispositionHistory: [newHistoryEntry]
                };
                return [newCustomer, ...prev];
            }
        });
    }, [setCustomers]);
    
    const deleteCustomer = useCallback((customerId: string) => {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
    }, [setCustomers]);

    const deleteAllCustomers = useCallback((verification: string): boolean => {
        if (verification !== 'DELETE ALL') {
            console.error("Delete all verification failed.");
            return false;
        }
        setCustomers([]);
        return true;
    }, [setCustomers]);

    const bulkAddCustomers = useCallback((newCustomers: Customer[]) => {
        setCustomers(prev => {
            const customerMap = new Map<string, CustomerWithHistory>(prev.map(c => [c.phone, c]));
    
            for (const importedCustomer of newCustomers) {
                if (!importedCustomer.phone) continue; // Skip records without a phone number

                const newHistoryEntry: DispositionHistory = {
                    dispositionId: importedCustomer.dispositionId,
                    dispositionTime: new Date(importedCustomer.dispositionTime).toISOString(),
                    agentNumber: importedCustomer.agentNumber,
                    amount: importedCustomer.amount,
                    ticketsAd: importedCustomer.ticketsAd,
                    currentNotes: importedCustomer.currentNotes,
                    program: importedCustomer.program,
                    leadList: importedCustomer.leadList,
                };
    
                const existingCustomer = customerMap.get(importedCustomer.phone);
    
                if (existingCustomer) {
                    // UPDATE existing customer
                    const newHistoryTime = new Date(newHistoryEntry.dispositionTime).getTime();
                    const historyExists = existingCustomer.dispositionHistory.some(
                        h => new Date(h.dispositionTime).getTime() === newHistoryTime
                    );
    
                    // Update base info (name, address, etc.) and add history if it's new
                    const updatedCustomer: CustomerWithHistory = {
                        ...existingCustomer,
                        ...importedCustomer,
                        id: existingCustomer.id, // Keep original ID
                        dispositionHistory: historyExists 
                            ? existingCustomer.dispositionHistory 
                            : [...existingCustomer.dispositionHistory, newHistoryEntry],
                    };
                    customerMap.set(importedCustomer.phone, updatedCustomer);
                } else {
                    // CREATE new customer
                    const newCustomerWithHistory: CustomerWithHistory = {
                        ...importedCustomer,
                        id: `cust-${Date.now()}-${Math.random()}`,
                        dispositionHistory: [newHistoryEntry],
                    };
                    customerMap.set(newCustomerWithHistory.phone, newCustomerWithHistory);
                }
            }
            
            // After all updates, ensure the top-level disposition for each customer is correct.
            const finalCustomers = Array.from(customerMap.values()).map(customer => {
                 if (customer.dispositionHistory.length > 0) {
                     const latestHistory = [...customer.dispositionHistory].sort((a,b) => new Date(b.dispositionTime).getTime() - new Date(a.dispositionTime).getTime())[0];
                     return {
                         ...customer,
                         dispositionId: latestHistory.dispositionId,
                         dispositionTime: latestHistory.dispositionTime,
                         agentNumber: latestHistory.agentNumber,
                         amount: latestHistory.amount,
                         ticketsAd: latestHistory.ticketsAd,
                         currentNotes: latestHistory.currentNotes,
                         program: latestHistory.program,
                         leadList: latestHistory.leadList,
                     };
                 }
                 return customer;
            });
    
            return finalCustomers;
        });
    }, [setCustomers]);


    // --- Agent Actions ---
    const addOrUpdateAgent = useCallback((agent: Agent) => {
        setAgents(prev => {
            const exists = prev.some(a => a.id === agent.id);
            if (exists) {
                return prev.map(a => a.id === agent.id ? agent : a);
            }
            return [...prev, { ...agent, id: `agent-${Date.now()}` }];
        });
    }, [setAgents]);

    const deleteAgent = useCallback((id: string, agentNumber: number) => {
        setAgents(prev => prev.filter(a => a.id !== id));
        setCustomers(prev => prev.map(c =>
            c.agentNumber === agentNumber
                ? { ...c, agentNumber: DEFAULT_AGENT.agentNumber }
                : c
        ));
    }, [setAgents, setCustomers]);

    // --- Disposition Actions ---
    const addOrUpdateDisposition = useCallback((disposition: Disposition) => {
         setDispositions(prev => {
            const exists = prev.some(d => d.id === disposition.id);
            if (exists) {
                return prev.map(d => d.id === disposition.id ? disposition : d);
            }
            return [{ ...disposition, id: `disp-custom-${Date.now()}` }, ...prev];
        });
    }, [setDispositions]);
    
    const deleteDisposition = useCallback((dispositionId: string) => {
        setDispositions(prev => prev.filter(d => d.id !== dispositionId));
        setCustomers(prev => prev.map(c =>
            c.dispositionId === dispositionId
                ? { ...c, dispositionId: DEFAULT_DISPOSITION.id }
                : c
        ));
    }, [setDispositions, setCustomers]);

    // --- Show Actions ---
    const addOrUpdateShow = useCallback((show: Show) => {
        setShows(prev => {
            const exists = prev.some(s => s.id === show.id);
            if(exists) {
                return prev.map(s => s.id === show.id ? show : s);
            }
            return [...prev, {...show, id: `show-${Date.now()}`}];
        });
    }, [setShows]);

    const deleteShow = useCallback((id: string, showNumber: number) => {
        setShows(prev => prev.filter(s => s.id !== id));
        setCustomers(prev => prev.map(c =>
            c.showNumber === showNumber
                ? { ...c, showNumber: DEFAULT_SHOW.showNumber }
                : c
        ));
    }, [setShows, setCustomers]);
    
    // --- Association Actions ---
    const addOrUpdateAssociation = useCallback((association: Association) => {
        setAssociations(prev => {
            const exists = prev.some(a => a.id === association.id);
            if(exists) {
                return prev.map(a => a.id === association.id ? association : a);
            }
            return [...prev, {...association, id: `assoc-${Date.now()}`}];
        });
    }, [setAssociations]);

    const deleteAssociation = useCallback((id: string, associationIdString: string) => {
        setAssociations(prev => prev.filter(a => a.id !== id));
        setCustomers(prev => prev.map(c =>
            c.associationId === associationIdString
                ? { ...c, associationId: DEFAULT_ASSOCIATION.associationId }
                : c
        ));
    }, [setAssociations, setCustomers]);

    // --- Getter Functions ---
    const getDispositionById = useCallback((id: string) => dispositions.find(d => d.id === id), [dispositions]);
    const getDispositionByName = useCallback((name: string) => dispositions.find(d => d.name.toLowerCase() === name.toLowerCase()), [dispositions]);
    const getAgentByNumber = useCallback((num: number) => agents.find(a => a.agentNumber === num), [agents]);
    const getShowByNumber = useCallback((num: number) => shows.find(s => s.showNumber === num), [shows]);
    const getShowById = useCallback((id: string) => shows.find(s => s.id === id), [shows]);
    const getAssociationByDbId = useCallback((id: string) => associations.find(a => a.id === id), [associations]);
    const getAssociationById = useCallback((associationId: string) => associations.find(a => a.associationId === associationId), [associations]);


    const value: DataContextType = {
        customers,
        agents,
        dispositions,
        shows,
        associations,
        users,
        addOrUpdateCustomer,
        deleteCustomer,
        deleteAllCustomers,
        bulkAddCustomers,
        addOrUpdateAgent,
        deleteAgent,
        addOrUpdateDisposition,
        deleteDisposition,
        addOrUpdateShow,
        deleteShow,
        addOrUpdateAssociation,
        deleteAssociation,
        addUser,
        updateUser,
        deleteUser,
        getUserByEmail,
        getDispositionById,
        getDispositionByName,
        getAgentByNumber,
        getShowByNumber,
        getShowById,
        getAssociationByDbId,
        getAssociationById,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
