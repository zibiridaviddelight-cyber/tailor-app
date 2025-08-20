
import React from 'react';
import { Users, Briefcase, DollarSign, Clock } from 'lucide-react';

const Dashboard = ({ customers, orders, expenses }) => {
  const totalCustomers = customers.length;
  const activeOrders = orders.filter(o => o.status === 'In Progress' || o.status === 'Ready for Pickup').length;
  const totalRevenue = orders.reduce((acc, order) => acc + (parseFloat(order.totalCost) || 0), 0);
  const totalExpenses = expenses.reduce((acc, expense) => acc + (parseFloat(expense.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  const upcomingOrders = orders
    .filter(o => o.dueDate && new Date(o.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-full"><Users className="text-blue-600" size={28} /></div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Customers</p>
            <p className="text-3xl font-bold text-gray-800">{totalCustomers}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center space-x-4">
          <div className="bg-yellow-100 p-3 rounded-full"><Briefcase className="text-yellow-600" size={28} /></div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Active Orders</p>
            <p className="text-3xl font-bold text-gray-800">{activeOrders}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center space-x-4">
          <div className="bg-green-100 p-3 rounded-full"><DollarSign className="text-green-600" size={28} /></div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Net Profit</p>
            <p className="text-3xl font-bold text-gray-800">${netProfit.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><Clock size={22} className="mr-2" /> Upcoming Deadlines</h3>
        {upcomingOrders.length > 0 ? (
          <ul className="space-y-3">
            {upcomingOrders.map(order => (
              <li key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-700">{order.item} for {order.customerName}</p>
                  <p className="text-sm text-gray-500">Due: {new Date(order.dueDate).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-bold text-indigo-600">{order.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 py-6">No upcoming deadlines.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

