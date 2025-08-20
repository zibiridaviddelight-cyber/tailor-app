
import React from 'react';

const Header = ({ userId }) => (
  <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 md:mb-8">
    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-2">DABUBU SIGNATURE</h1>
    <p className="text-lg text-gray-600 text-center">Manage your customer details and measurements with ease.</p>
    {userId && <p className="mt-4 text-sm text-gray-500 text-center">Your User ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{userId}</span></p>}
  </div>
);

export default Header;