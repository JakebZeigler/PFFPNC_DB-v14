import React from 'react';

const UserCogIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.4 19.4a1 1 0 01-1.414 0l-1.06-1.06a1 1 0 010-1.414l1.06-1.06a1 1 0 011.414 1.414l-1.06 1.06a1 1 0 010 1.414zM19.4 19.4L21 21m-1.6-1.6a1 1 0 00-1.414 0l-1.06 1.06a1 1 0 000 1.414l1.06 1.06a1 1 0 001.414-1.414l-1.06-1.06a1 1 0 000-1.414zM19.4 19.4a1 1 0 011.414 0l1.06-1.06a1 1 0 010-1.414l-1.06-1.06a1 1 0 01-1.414 1.414l1.06 1.06a1 1 0 010 1.414z" />
  </svg>
);
export default UserCogIcon;
