
import React from 'react';
import { Pencil, Trash } from 'lucide-react';

const OrderTable = ({ orders, onEdit, onDelete }) => (
  <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
    <div className="p-4 md:p-6 overflow-x-auto">
      {orders.length > 0 ? (
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-4 px-6 text-sm font-semibold text-gray-600">Customer Name</th>
              <th className="py-4 px-6 text-sm font-semibold text-gray-600">Item</th>
              <th className="py-4 px-6 text-sm font-semibold text-gray-600 hidden md:table-cell">Status</th>
              <th className="py-4 px-6 text-sm font-semibold text-gray-600 hidden md:table-cell">Due Date</th>
              <th className="py-4 px-6 text-sm font-semibold text-gray-600 hidden lg:table-cell">Balance Due</th>
              <th className="py-4 px-6 text-sm font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-gray-800 font-medium">{order.customerName}</td>
                <td className="py-4 px-6 text-gray-600">{order.item}</td>
                <td className="py-4 px-6 text-gray-600 hidden md:table-cell">{order.status}</td>
                <td className="py-4 px-6 text-gray-600 hidden md:table-cell">{order.dueDate}</td>
                <td className="py-4 px-6 text-red-500 font-bold hidden lg:table-cell">${order.balanceDue}</td>
                <td className="py-4 px-6 text-right space-x-2">
                  <button onClick={() => onEdit(order)} className="text-indigo-600 hover:text-indigo-800 p-2 rounded-lg hover:bg-indigo-100">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => onDelete(order.id)} className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-100">
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center text-gray-500 py-10">No orders found.</p>
      )}
    </div>
  </div>
);

export default OrderTable;