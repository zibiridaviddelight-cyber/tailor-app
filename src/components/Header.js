
import React from 'react';
import { LogOut } from 'lucide-react';

const Header = ({ user, onLogout }) => (
  <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 md:mb-8 relative">
    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-2">DABUBU SIGNATURE</h1>
    <p className="text-lg text-gray-600 text-center">Manage your customer details and measurements with ease.</p>
    {user && (
      <div className="text-center mt-4">
        <p className="text-sm text-gray-500">
          Signed in as: <span className="font-semibold">{user.email}</span>
        </p>
        <button 
          onClick={onLogout}
          className="absolute top-4 right-4 text-gray-500 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    )}
  </div>
);

export default Header;
