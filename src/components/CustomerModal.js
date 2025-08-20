// src/components/CustomerModal.js

import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { doc, addDoc, updateDoc, onSnapshot, collection, query, serverTimestamp } from 'firebase/firestore';

const CustomerModal = ({ isOpen, onClose, customer, db, userId, appId, showModal, closeModalAlert }) => {
  const defaultMeasurements = {
    blouseLength: '', halfLength: '', bust: '', underBust: '', bustPoint: '',
    bustLine: '', blouseWaist: '', roundSleeve: '', sleeve: '', shoulder: '',
    waist: '', hip: '', skirtLength: '', dressLength: '', offShoulder: '',
    aip: '', trouserLength: '', trouserHalfLength: '', thigh: '', uRise: '',
    bottom: '', kneel: '', body: '', back: '', cap: '',
  };

  const [form, setForm] = useState(customer || { measurements: defaultMeasurements });
  const [notesHistory, setNotesHistory] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Effect to fetch notes history when the modal opens for an existing customer
  useEffect(() => {
    if (db && userId && form.id) {
      const notesCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'customers', form.id, 'notes');
      const q = query(notesCollectionRef);
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
        setNotesHistory(notesData);
      }, (error) => console.error("Error fetching notes history:", error));
      
      return () => unsubscribe();
    } else {
        setNotesHistory([]);
    }
  }, [db, userId, form.id, appId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleMeasurementChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      measurements: { ...form.measurements, [name]: value },
    });
  };

  const addNewNote = async () => {
    if (!newNote.trim() || !db || !userId || !form.id) return;
    try {
      const notesCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'customers', form.id, 'notes');
      await addDoc(notesCollectionRef, { text: newNote, timestamp: serverTimestamp() });
      setNewNote('');
    } catch (error) {
      console.error("Error adding new note:", error);
      showModal('Error', 'Could not add note. Please try again.', closeModalAlert);
    }
  };
  
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!db) {
      showModal('Error', 'Database not connected.', closeModalAlert);
      return;
    }
    setIsSaving(true);
    const customerData = {
      name: form.name || '',
      phone: form.phone || '',
      notes: form.notes || '',
      measurements: form.measurements || defaultMeasurements,
    };

    try {
      if (form.id) { // Update existing customer
        const customerDocRef = doc(db, 'artifacts', appId, 'users', userId, 'customers', form.id);
        await updateDoc(customerDocRef, customerData);
        showModal('Success', 'Customer updated successfully!', () => { closeModalAlert(); onClose(); });
      } else { // Add new customer
        const customersCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'customers');
        await addDoc(customersCollectionRef, customerData);
        showModal('Success', 'Customer added successfully!', () => { closeModalAlert(); onClose(); });
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      showModal('Error', 'Could not save customer. Please try again.', closeModalAlert);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{form.id ? 'Edit Customer' : 'Add New Customer'}</h2>
        <form onSubmit={handleCustomerSubmit}>
          {/* Main details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <input type="text" name="name" value={form.name || ''} onChange={handleChange} placeholder="Name" required className="w-full p-3 border rounded-lg" />
            <input type="tel" name="phone" value={form.phone || ''} onChange={handleChange} placeholder="Phone" className="w-full p-3 border rounded-lg" />
            <textarea name="notes" value={form.notes || ''} onChange={handleChange} placeholder="General Notes" rows="1" className="w-full p-3 border rounded-lg resize-none"></textarea>
          </div>

          {/* Measurements */}
          <h3 className="text-xl font-bold text-gray-800 mb-4 mt-6">Measurements</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {Object.keys(defaultMeasurements).map((key) => (
              <div key={key}>
                <label className="block text-gray-700 font-semibold mb-2 text-sm" htmlFor={key}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
                <input type="text" id={key} name={key} value={form.measurements[key] || ''} onChange={handleMeasurementChange} className="w-full p-2 border rounded-lg text-sm" />
              </div>
            ))}
          </div>

          {/* Notes History (only for existing customers) */}
          {form.id && (
            <>
              <h3 className="text-xl font-bold text-gray-800 mb-4 mt-6">Notes History</h3>
              <div className="space-y-4 mb-6">
                <div className="flex items-end space-x-2">
                  <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a new historical note..." rows="2" className="w-full p-3 border rounded-lg resize-none" />
                  <button type="button" onClick={addNewNote} className="px-4 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600">
                    <Plus size={20} />
                  </button>
                </div>
                {notesHistory.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto pr-2">
                    {notesHistory.map((note) => (
                      <div key={note.id} className="bg-gray-50 p-4 rounded-lg shadow-sm mb-2">
                        <p className="text-gray-800 whitespace-pre-wrap">{note.text}</p>
                        <p className="text-sm text-gray-500 mt-2">{note.timestamp?.toDate ? note.timestamp.toDate().toLocaleString() : 'Saving...'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No historical notes for this customer.</p>
                )}
              </div>
            </>
          )}

          <button type="submit" disabled={isSaving} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md transition-colors disabled:bg-indigo-300">
            {isSaving ? 'Saving...' : (form.id ? 'Save Changes' : 'Add Customer')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;