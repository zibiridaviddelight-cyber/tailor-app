
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { doc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';

const initialFormState = { date: '', description: '', amount: '' };

const ExpenseModal = ({ isOpen, onClose, expense, db, userId, appId, showModal, closeModalAlert }) => {
  const [form, setForm] = useState(initialFormState);
  const [isSaving, setIsSaving] = useState(false);

  // CHANGED: Removed unnecessary dependency to fix build error
  useEffect(() => {
    setForm(expense && expense.id ? expense : initialFormState);
  }, [expense]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const { id, ...expenseData } = form;

    try {
      if (form.id) {
        await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'expenses', form.id), expenseData);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'expenses'), { ...expenseData, createdAt: serverTimestamp() });
      }
      showModal('Success', `Expense ${form.id ? 'updated' : 'added'}!`, () => { closeModalAlert(); onClose(); });
    } catch (error) {
      console.error("Error saving expense:", error);
      showModal('Error', 'Could not save expense.', closeModalAlert);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500"><X size={24} /></button>
        <h2 className="text-2xl font-bold mb-6">{form.id ? 'Edit Expense' : 'Add New Expense'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="date" name="date" value={form.date} onChange={handleChange} required className="w-full p-3 border rounded-lg" />
          <input type="text" name="description" value={form.description} onChange={handleChange} placeholder="Description (e.g., Fabric, Thread)" required className="w-full p-3 border rounded-lg" />
          <input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="Amount ($)" required className="w-full p-3 border rounded-lg" />
          <button type="submit" disabled={isSaving} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl disabled:bg-indigo-300">
            {isSaving ? 'Saving...' : (form.id ? 'Save Changes' : 'Add Expense')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;

