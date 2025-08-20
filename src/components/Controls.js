
import React from 'react';
import { Plus, FileInput, FileText, Briefcase, Filter } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';

const ORDER_STATUSES = ['All', 'In Progress', 'Ready for Pickup', 'Completed', 'Canceled'];

const Controls = ({ currentView, setCurrentView, openNewCustomerModal, openNewOrderModal, orderStatusFilter, setOrderStatusFilter, searchQuery, setSearchQuery, customers, orders, db, userId, appId, showModal, closeModalAlert, defaultMeasurements }) => {

  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0] || {}).filter(key => key !== 'id');
    const csvRows = [headers.join(','), ...data.map(item => headers.map(header => `"${(item[header] || '').toString().replace(/"/g, '""')}"`).join(','))];
    return csvRows.join('\n');
  };

  const handleExportCSV = () => {
    const dataToExport = currentView === 'customers' ? customers : orders;
    if (dataToExport.length === 0) {
      showModal('No Data', `No ${currentView} to export.`, closeModalAlert);
      return;
    }
    const csv = convertToCSV(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `tailor_${currentView}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CHANGED: Updated CSV import logic to be more robust and handle data structure
  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvString = event.target.result;
      const lines = csvString.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        showModal('Import Failed', 'CSV file is empty or invalid.', closeModalAlert);
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const newItems = lines.slice(1).map(line => {
        // Use a regex to handle commas inside quoted fields
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/"/g, ''));
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index] || '';
          return obj;
        }, {});
      });

      try {
        const measurementKeys = Object.keys(defaultMeasurements);

        for (const item of newItems) {
          if (currentView === 'customers') {
            const customerCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'customers');
            const customerData = {
              name: item.name || '',
              phone: item.phone || '',
              notes: item.notes || '',
              measurements: { ...defaultMeasurements }
            };

            // Separate measurement fields from main fields and put them in the measurements object
            for (const key in item) {
              if (measurementKeys.includes(key)) {
                customerData.measurements[key] = item[key];
              }
            }
            await addDoc(customerCollectionRef, customerData);
          } else {
            // Handle order import (if you create that functionality)
            const orderCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'orders');
            await addDoc(orderCollectionRef, item);
          }
        }
        showModal('Success', `Imported ${newItems.length} items successfully.`, closeModalAlert);
      } catch (error) {
        console.error("Error importing CSV:", error);
        showModal('Error', 'Failed to import CSV data. Please check the file format.', closeModalAlert);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };


  return (
    <>
      <div className="flex justify-center mb-6">
        <button onClick={() => setCurrentView('customers')} className={`px-6 py-3 rounded-t-xl text-lg font-semibold transition-colors flex items-center space-x-2 ${currentView === 'customers' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600'}`}>
          <Briefcase size={20} />
          <span>Customers</span>
        </button>
        <button onClick={() => setCurrentView('orders')} className={`px-6 py-3 rounded-t-xl text-lg font-semibold transition-colors flex items-center space-x-2 ${currentView === 'orders' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600'}`}>
          <Briefcase size={20} />
          <span>Orders</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between mb-6 md:mb-8 space-y-4 md:space-y-0 md:space-x-4">
        {currentView === 'customers' ? (
          <button onClick={openNewCustomerModal} className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2">
            <Plus size={20} />
            <span>Add New Customer</span>
          </button>
        ) : (
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
            <button onClick={openNewOrderModal} className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2">
              <Plus size={20} />
              <span>Add New Order</span>
            </button>
            <div className="flex flex-wrap items-center gap-2 bg-white rounded-xl border border-indigo-200 p-2 shadow-md">
              <Filter size={18} className="text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-700">Status:</span>
              {ORDER_STATUSES.map((st) => (
                <button key={st} onClick={() => setOrderStatusFilter(st)} className={`px-3 py-1 text-sm rounded-lg border transition-colors ${orderStatusFilter === st ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'}`}>
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative w-full md:w-1/3">
          <input type="text" placeholder={`Search ${currentView}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-3 pl-10 pr-4 rounded-xl shadow-inner border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>

        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
          <label htmlFor="import-csv" className="cursor-pointer w-full md:w-auto px-6 py-3 bg-white text-indigo-600 rounded-xl shadow-md border border-indigo-200 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
            <FileInput size={20} />
            <span>Import CSV</span>
            <input id="import-csv" type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
          <button onClick={handleExportCSV} className="w-full md:w-auto px-6 py-3 bg-white text-indigo-600 rounded-xl shadow-md border border-indigo-200 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
            <FileText size={20} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Controls;
