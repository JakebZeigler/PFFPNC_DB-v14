
import { Agent, Disposition, Show, Association, CustomerWithHistory, DispositionModifier, User } from '../types';
import { DEFAULT_AGENT, DEFAULT_DISPOSITION, DEFAULT_SHOW, DEFAULT_ASSOCIATION, INITIAL_DISPOSITIONS, INITIAL_ASSOCIATIONS } from '../constants';

const now = new Date();

// Helper to get a date within the current week (Thu-Wed) to ensure dashboard stats populate
const getRecentDateInWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // Sunday = 0, Thursday = 4
    const daysToSubtract = (dayOfWeek + 3) % 7;
    const date = new Date();
    date.setDate(today.getDate() - Math.floor(daysToSubtract/2));
    return date;
}

const oldDate = new Date();
oldDate.setDate(now.getDate() - 45);

// IMPORTANT: Passwords are in plaintext for this mock, frontend-only environment.
// In a production application, these would be securely hashed on a server.
export const initialUsers: User[] = [
    {
        id: 'user-admin-1',
        email: 'jakebpffpnc@gmail.com',
        password: '1024924z',
        firstName: 'Jake',
        lastName: 'Zeigler',
        role: 'admin',
        status: 'active'
    },
    {
        id: 'user-pending-1',
        email: 'pending.user@example.com',
        password: 'password',
        firstName: 'Penny',
        lastName: 'Pending',
        role: 'user',
        status: 'pending'
    },
    {
        id: 'user-active-1',
        email: 'active.user@example.com',
        password: 'password',
        firstName: 'Archie',
        lastName: 'Active',
        role: 'user',
        status: 'active'
    }
];

export const initialAgents: Agent[] = [
    DEFAULT_AGENT,
    { id: 'agent-7', agentNumber: 7, firstName: 'John', lastName: 'Ayala', phone: '555-000-0007', email: 'john.a@example.com', isDefault: false },
    { id: 'agent-16', agentNumber: 16, firstName: 'Nyah', lastName: 'Bell', phone: '555-000-0016', email: 'nyah.b@example.com', isDefault: false },
    { id: 'agent-130', agentNumber: 130, firstName: 'Chris', lastName: 'Stone', phone: '555-000-0130', email: 'chris.s@example.com', isDefault: false },
    { id: 'agent-217', agentNumber: 217, firstName: 'Kevin', lastName: 'Swope', phone: '555-000-0217', email: 'kevin.s@example.com', isDefault: false },
    { id: 'agent-249', agentNumber: 249, firstName: 'Joe', lastName: 'Maldando', phone: '555-000-0249', email: 'joe.m@example.com', isDefault: false },
    { id: 'agent-323', agentNumber: 323, firstName: 'Jay', lastName: 'Bass', phone: '555-000-0323', email: 'jay.b@example.com', isDefault: false },
    { id: 'agent-333', agentNumber: 333, firstName: 'Payton', lastName: 'Gaddy', phone: '555-000-0333', email: 'payton.g@example.com', isDefault: false },
    { id: 'agent-623', agentNumber: 623, firstName: 'Neal', lastName: 'Read', phone: '555-000-0623', email: 'neal.r@example.com', isDefault: false },
    { id: 'agent-908', agentNumber: 908, firstName: 'Jake', lastName: 'Zeigler', phone: '555-000-0908', email: 'jake.z@example.com', isDefault: false },
];

export const initialDispositions: Disposition[] = [
    DEFAULT_DISPOSITION,
    ...INITIAL_DISPOSITIONS.map((d, i) => ({ ...d, id: `disp-init-${i}` }))
];

export const initialShows: Show[] = [
    DEFAULT_SHOW,
    {
        id: 'show-init-64',
        showNumber: 64,
        showName: 'Past Shows',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        venues: [],
        genre: 'Historical'
    },
    {
        id: 'show-init-74',
        showNumber: 74,
        showName: 'Christina Eagle',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        venues: [{letter: 'A', location: 'Raleigh Hall', playDate: new Date().toISOString().split('T')[0] }],
        genre: 'Special Event'
    }
];

export const initialAssociations: Association[] = [
    DEFAULT_ASSOCIATION,
    ...INITIAL_ASSOCIATIONS.map((a, i) => ({ ...a, id: `assoc-init-${i}` }))
];


const dispSaleId = initialDispositions.find(d => d.name === 'Sale')?.id || 'disp-init-12';
const dispCreditId = initialDispositions.find(d => d.name === 'Credit')?.id || 'disp-init-4';
const dispTurndownId = initialDispositions.find(d => d.name === 'Turndown')?.id || 'disp-init-13';
const dispNoAnswerId = initialDispositions.find(d => d.name === 'No Answer')?.id || 'disp-init-27';
const dispRemoveId = initialDispositions.find(d => d.name === 'Remove')?.id || 'disp-init-11';


export const initialCustomers: CustomerWithHistory[] = [
    {
        id: 'cust-1', phone: '919-555-0101', firstName: 'Alice', lastName: 'Wonder', businessResidential: 'Residential', showNumber: 74, associationId: 'RAL', coldPc: 'PC',
        agentNumber: 7, amount: 100, dispositionId: dispSaleId, dispositionTime: getRecentDateInWeek().toISOString(), currentNotes: 'Pledged for 2 tickets.',
        dispositionHistory: [
            { dispositionId: dispNoAnswerId, dispositionTime: new Date(new Date().setDate(now.getDate() - 10)).toISOString(), agentNumber: 7 },
            { dispositionId: dispSaleId, dispositionTime: getRecentDateInWeek().toISOString(), agentNumber: 7, amount: 100, ticketsAd: 2, currentNotes: 'Pledged for 2 tickets.' },
        ]
    },
    {
        id: 'cust-2', phone: '704-555-0102', firstName: 'Bob', lastName: 'Builder', businessResidential: 'Business', showNumber: 74, associationId: 'CHA', coldPc: 'Cold',
        agentNumber: 16, amount: 250, dispositionId: dispCreditId, dispositionTime: new Date(new Date().setDate(now.getDate() - 2)).toISOString(), currentNotes: 'Paid for ad sponsorship.',
        dispositionHistory: [
            { dispositionId: dispSaleId, dispositionTime: new Date(new Date().setDate(now.getDate() - 35)).toISOString(), agentNumber: 16, amount: 250 },
            { dispositionId: dispCreditId, dispositionTime: new Date(new Date().setDate(now.getDate() - 2)).toISOString(), agentNumber: 16, amount: 250, currentNotes: 'Paid for ad sponsorship.' },
        ]
    },
    {
        id: 'cust-3', phone: '336-555-0103', firstName: 'Charlie', lastName: 'Chocolate', businessResidential: 'Residential', showNumber: 64, associationId: 'WSF', coldPc: 'PC',
        agentNumber: 130, amount: 0, dispositionId: dispTurndownId, dispositionTime: new Date(new Date().setDate(now.getDate() - 5)).toISOString(), currentNotes: 'Not interested this year.',
        dispositionHistory: [
            { dispositionId: dispTurndownId, dispositionTime: new Date(new Date().setDate(now.getDate() - 5)).toISOString(), agentNumber: 130, currentNotes: 'Not interested this year.' },
        ]
    },
     {
        id: 'cust-4', phone: '828-555-0104', firstName: 'Diana', lastName: 'Prince', businessResidential: 'Business', showNumber: 74, associationId: 'ASH', coldPc: 'PC',
        agentNumber: 7, amount: 50, dispositionId: dispSaleId, dispositionTime: new Date(new Date().setDate(getRecentDateInWeek().getDate() - 1)).toISOString(), currentNotes: 'Small pledge.',
        dispositionHistory: [
            { dispositionId: dispSaleId, dispositionTime: new Date(new Date().setDate(getRecentDateInWeek().getDate() - 1)).toISOString(), agentNumber: 7, amount: 50, ticketsAd: 1, currentNotes: 'Small pledge.' },
        ]
    },
    {
        id: 'cust-5', phone: '910-555-0105', firstName: 'Ethan', lastName: 'Hunt', businessResidential: 'Residential', showNumber: 64, associationId: 'FAY', coldPc: 'Cold',
        agentNumber: 16, amount: 0, dispositionId: dispRemoveId, dispositionTime: new Date(new Date().setDate(now.getDate() - 50)).toISOString(), currentNotes: 'Asked to be removed.',
        dispositionHistory: [
            { dispositionId: dispRemoveId, dispositionTime: new Date(new Date().setDate(now.getDate() - 50)).toISOString(), agentNumber: 16, currentNotes: 'Asked to be removed.' },
        ]
    },
    {
        id: 'cust-6', phone: '919-555-0106', firstName: 'Fiona', lastName: 'Shrek', businessResidential: 'Residential', showNumber: 74, associationId: 'DUR', coldPc: 'Cold',
        agentNumber: 217, amount: 150, dispositionId: dispCreditId, dispositionTime: getRecentDateInWeek().toISOString(), currentNotes: 'Paid immediately.',
        dispositionHistory: [
             { dispositionId: dispCreditId, dispositionTime: getRecentDateInWeek().toISOString(), agentNumber: 217, amount: 150, ticketsAd: 3, currentNotes: 'Paid immediately.' },
        ]
    }
];