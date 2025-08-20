
import React from 'react';
import { Pencil, Trash } from 'lucide-react';

const CustomerTable = ({ customers, onEdit, onDelete }) => (
  <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
    <div className="p-4 md:p-6 overflow-x-auto">
      {customers.length > 0 ? (
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-4 px-6 text-sm font-semibold text-gray-600">Name</th>
              <th className="py-4 px-6 text-sm font-semibold text-gray-600 hidden md:table-cell">Phone</th>
              <th className="py-4 px-6 text-sm font-semibold text-gray-600">Measurements</th>
              <th className="py-4 px-6 text-sm font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-gray-800 font-medium">{customer.name}</td>
                <td className="py-4 px-6 text-gray-600 hidden md:table-cell">{customer.phone}</td>
                <td className="py-4 px-6 text-gray-600 text-sm">
                  {Object.entries(customer.measurements || {}).filter(([_, value]) => value).map(([key, value]) => (
                    <div key={key}><span className="font-semibold">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span> {value}</div>
                  ))}
                </td>
                <td className="py-4 px-6 text-right space-x-2">
                  <button onClick={() => onEdit(customer)} className="text-indigo-600 hover:text-indigo-800 p-2 rounded-lg hover:bg-indigo-100">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => onDelete(customer.id, customer.name)} className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-100">
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center text-gray-500 py-10">No customers found.</p>
      )}
    </div>
  </div>
);

export default CustomerTable;
