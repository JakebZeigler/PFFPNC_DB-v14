
import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_LINKS } from '../constants';
import { NavItem } from '../types';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const baseLinkClasses = "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-150";
  const inactiveLinkClasses = "text-red-100 hover:bg-brand-red-dark hover:text-white";
  const activeLinkClasses = "bg-white text-brand-red font-bold";

  const availableNavLinks = NAV_LINKS.filter(link => {
    return !link.adminOnly || (link.adminOnly && user?.role === 'admin');
  });

  return (
    <aside className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-brand-red">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-2xl font-bold text-white tracking-wider">PFFPNC DB</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {availableNavLinks.map((item: NavItem) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`
                  }
                >
                  <item.icon className="mr-3 flex-shrink-0 h-6 w-6" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;