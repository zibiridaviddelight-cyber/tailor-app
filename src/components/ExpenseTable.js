
import React from 'react';
import { Pencil, Trash } from 'lucide-react';

const ExpenseTable = ({ expenses, onEdit, onDelete }) => (
  <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
    <div className="p-4 md:p-6 overflow-x-auto">
      {expenses.length > 0 ? (
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-4 px-6 text-sm font-semibold text-gray-600">Date</th>
              <th className="py-4 px-6 text-sm font-semibold text-gray-600">Description</th>
              <th className="py-4 px-6 text-sm font-semibold text-gray-600">Amount</th>
              <th className="py-4 px-6 text-sm font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(expense => (
              <tr key={expense.id} className="border-b hover:bg-gray-50">
                <td className="py-4 px-6">{expense.date}</td>
                <td className="py-4 px-6">{expense.description}</td>
                <td className="py-4 px-6 font-bold text-red-600">${parseFloat(expense.amount || 0).toFixed(2)}</td>
                <td className="py-4 px-6 text-right space-x-2">
                  <button onClick={() => onEdit(expense)} className="text-indigo-600 p-2 rounded-lg hover:bg-indigo-100"><Pencil size={18} /></button>
                  <button onClick={() => onDelete(expense.id)} className="text-red-600 p-2 rounded-lg hover:bg-red-100"><Trash size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center text-gray-500 py-10">No expenses found.</p>
      )}
    </div>
  </div>
);

export default ExpenseTable;
