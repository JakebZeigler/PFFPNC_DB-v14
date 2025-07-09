
export enum DispositionModifier {
  DNC = 'DNC',
  Sale = 'Sale',
  Payment = 'Payment',
  Invoice = 'Invoice',
  TimeOut = 'TimeOut',
  ExcludeCount = 'ExcludeCount',
}

export interface Disposition {
  id: string;
  name: string;
  modifiers: DispositionModifier[];
  isDefault?: boolean;
  timeOutDays?: number;
  excludeAfterAttempts?: number;
  excludeAction?: 'None' | 'DNC' | 'TimeOut';
  excludeActionTimeOutDays?: number;
}

export interface Customer {
  id:string;
  phone: string;
  title?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  currentNotes?: string;
  businessResidential: string;
  showNumber: number;
  associationId: string;
  coldPc: string;
  agentNumber: number;
  amount?: number;
  ticketsAd?: number;
  email?: string;
  creditCard?: string;
  expDate?: string;
  ccv?: string;
  routingNumber?: string;
  accountNumber?: string;
  website?: string;
  dispositionId: string;
  dispositionTime: string; // ISO 8601 string
  program?: string;
  leadList?: string;
}

export interface Agent {
    id: string;
    agentNumber: number;
    phone?: string;
    firstName: string;
    lastName: string;
    email?: string;
    isDefault?: boolean;
}

export interface Venue {
    letter: string;
    location: string;
    playDate: string; // ISO 8601 string
}

export interface Show {
    id: string;
    showNumber: number;
    showName: string;
    genre?: string;
    startDate: string; // ISO 8601 string
    endDate: string; // ISO 8601 string
    venues: Venue[];
    isDefault?: boolean;
}

export interface Association {
    id: string;
    associationId: string; // e.g., "PFF"
    associationName: string;
    associatedCity?: string;
    isDefault?: boolean;
}

export interface DispositionHistory {
  dispositionId: string;
  dispositionTime: string; // ISO 8601 string
  agentNumber: number;
  amount?: number;
  ticketsAd?: number;
  currentNotes?: string;
  program?: string;
  leadList?: string;
}

export interface CustomerWithHistory extends Customer {
    dispositionHistory: DispositionHistory[];
}

export interface User {
    id: string;
    email: string;
    password?: string; // Only used for creation/login, not stored in auth state
    firstName: string;
    lastName: string;
    role: 'admin' | 'user';
    status: 'active' | 'pending';
}

export type NavItem = {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

export type ToastMessage = {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
};

export type ToastContextType = {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
};

export type AuthContextType = {
    user: User | null;
    login: (email: string, password?: string) => Promise<boolean>;
    logout: () => void;
    register: (firstName: string, lastName: string, email: string, password?: string) => Promise<boolean>;
    loading: boolean;
};


export type SkippedRow = {
    reason: string;
    data: Record<string, any>;
};

export type ImportHistoryLog = {
    id: number;
    timestamp: string;
    fileName: string;
    totalRecords: number;
    importedCount: number;
    skippedCount: number;
    skippedRows: SkippedRow[];
};


export type DataContextType = {
    customers: CustomerWithHistory[];
    agents: Agent[];
    dispositions: Disposition[];
    shows: Show[];
    associations: Association[];
    users: User[];
    addOrUpdateCustomer: (customer: Customer) => void;
    deleteCustomer: (customerId: string) => void;
    deleteAllCustomers: (verification: string) => boolean;
    bulkAddCustomers: (customers: Customer[]) => void;
    addOrUpdateAgent: (agent: Agent) => void;
    deleteAgent: (id: string, agentNumber: number) => void;
    addOrUpdateDisposition: (disposition: Disposition) => void;
    deleteDisposition: (dispositionId: string) => void;
    addOrUpdateShow: (show: Show) => void;
    deleteShow: (id: string, showNumber: number) => void;
    addOrUpdateAssociation: (association: Association) => void;
    deleteAssociation: (id: string, associationIdString: string) => void;
    addUser: (user: Omit<User, 'id' | 'status'>) => void;
    updateUser: (user: User) => void;
    deleteUser: (userId: string) => void;
    getUserByEmail: (email: string) => User | undefined;
    getDispositionById: (id: string) => Disposition | undefined;
    getDispositionByName: (name: string) => Disposition | undefined;
    getAgentByNumber: (num: number) => Agent | undefined;
    getShowByNumber: (num: number) => Show | undefined;
    getShowById: (id: string) => Show | undefined;
    getAssociationByDbId: (id: string) => Association | undefined;
    getAssociationById: (associationId: string) => Association | undefined;
};