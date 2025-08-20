
import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { doc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';

// CHANGED: Moved initialFormState outside the component to make it a stable reference
const initialFormState = {
  customerId: '', customerName: '', item: '', status: 'In Progress', dueDate: '',
  totalCost: '', amountPaid: '', balanceDue: '0.00', photos: []
};

const OrderModal = ({ isOpen, onClose, order, customers, db, storage, userId, appId, showModal, closeModalAlert }) => {
  const [orderForm, setOrderForm] = useState(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // CHANGED: Added initialFormState to the dependency array
  useEffect(() => {
    setOrderForm(order && order.id ? { ...initialFormState, ...order } : initialFormState);
  }, [order, initialFormState]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !storage || !userId) return;

    setIsUploading(true);
    const imageRef = ref(storage, `${userId}/${uuidv4()}-${file.name}`);
    
    try {
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setOrderForm(prev => ({ ...prev, photos: [...(prev.photos || []), { url: downloadURL, path: snapshot.ref.fullPath }] }));
    } catch (error) {
      console.error("Error uploading image:", error);
      showModal('Upload Failed', 'Could not upload the image.', closeModalAlert);
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async (photoToDelete) => {
    try {
      const imageRef = ref(storage, photoToDelete.path);
      await deleteObject(imageRef);
      setOrderForm(prev => ({ ...prev, photos: prev.photos.filter(p => p.path !== photoToDelete.path) }));
    } catch (error) {
      console.error("Error deleting image:", error);
      showModal('Delete Failed', 'Could not delete the image.', closeModalAlert);
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    const customer = customers.find(c => c.id === orderForm.customerId);
    const customerEmail = customer ? customer.email : null;

    const { id, ...orderData } = orderForm;

    try {
      let orderId = orderForm.id;
      if (orderId) {
        await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'orders', orderId), orderData);
      } else {
        const newOrder = await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'orders'), { ...orderData, createdAt: serverTimestamp() });
        orderId = newOrder.id;
      }

      if (customerEmail) {
        const mailCollection = collection(db, 'mail');
        if (!orderForm.id) {
          await addDoc(mailCollection, {
            to: customerEmail,
            subject: 'Your Order has been Placed!',
            html: `<h1>Order Confirmation</h1><p>Hi ${orderData.customerName},</p><p>This is a confirmation that your order for a <strong>${orderData.item}</strong> has been placed.</p><p>Thank you for your business!</p>`,
          });
        } else if (orderData.status === 'Ready for Pickup') {
            await addDoc(mailCollection, {
            to: customerEmail,
            subject: 'Your Order is Ready for Pickup!',
            html: `<h1>Your Order is Ready!</h1><p>Hi ${orderData.customerName},</p><p>Your <strong>${orderData.item}</strong> is ready for pickup.</p>`,
          });
        }
      }

      showModal('Success', `Order ${orderForm.id ? 'updated' : 'added'} successfully!`, () => { closeModalAlert(); onClose(); });
    } catch (error) {
      console.error("Error saving order:", error);
      showModal('Error', 'Could not save order.', closeModalAlert);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOrderChange = (e) => {
    const { name, value } = e.target;
    let updatedForm = { ...orderForm, [name]: value };

    if (name === 'totalCost' || name === 'amountPaid') {
      const total = parseFloat(updatedForm.totalCost) || 0;
      const paid = parseFloat(updatedForm.amountPaid) || 0;
      updatedForm.balanceDue = (total - paid).toFixed(2);
    }
    setOrderForm(updatedForm);
  };

  const handleCustomerChange = (e) => {
    const selectedCustomerId = e.target.value;
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    setOrderForm({
        ...orderForm,
        customerId: selectedCustomerId,
        customerName: selectedCustomer ? selectedCustomer.name : '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500"><X size={24} /></button>
        <h2 className="text-2xl font-bold mb-6">{orderForm.id ? 'Edit Order' : 'Add New Order'}</h2>
        <form onSubmit={handleOrderSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block font-semibold mb-2" htmlFor="customerId">Customer</label>
              <select id="customerId" name="customerId" value={orderForm.customerId} onChange={handleCustomerChange} required className="w-full p-3 border rounded-lg">
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-2" htmlFor="item">Item</label>
              <input type="text" id="item" name="item" value={orderForm.item || ''} onChange={handleOrderChange} required className="w-full p-3 border rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
                <label className="block font-semibold mb-2" htmlFor="status">Status</label>
                <select id="status" name="status" value={orderForm.status} onChange={handleOrderChange} className="w-full p-3 border rounded-lg">
                    <option>In Progress</option>
                    <option>Ready for Pickup</option>
                    <option>Completed</option>
                    <option>Canceled</option>
                </select>
            </div>
            <div>
                <label className="block font-semibold mb-2" htmlFor="dueDate">Due Date</label>
                <input type="date" id="dueDate" name="dueDate" value={orderForm.dueDate || ''} onChange={handleOrderChange} className="w-full p-3 border rounded-lg" />
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mb-4 mt-6">Payment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <input type="number" name="totalCost" value={orderForm.totalCost || ''} onChange={handleOrderChange} placeholder="Total Cost ($)" className="w-full p-3 border rounded-lg" />
            <input type="number" name="amountPaid" value={orderForm.amountPaid || ''} onChange={handleOrderChange} placeholder="Amount Paid ($)" className="w-full p-3 border rounded-lg" />
            <input type="text" name="balanceDue" value={orderForm.balanceDue || '0.00'} disabled className="w-full p-3 border rounded-lg bg-gray-100" />
          </div>
          
          <h3 className="text-xl font-bold mt-6 mb-4">Photo Gallery</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
            {(orderForm.photos || []).map((photo, index) => (
              <div key={index} className="relative group">
                <img src={photo.url} alt={`Order ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                <button type="button" onClick={() => deletePhoto(photo)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <label className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
              {isUploading ? (
                <p>Uploading...</p>
              ) : (
                <>
                  <Upload size={32} className="text-gray-400" />
                  <span className="text-sm text-gray-500 mt-2">Add Photo</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={isUploading} />
            </label>
          </div>

          <button type="submit" disabled={isSaving || isUploading} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-6 disabled:bg-indigo-300">
            {isSaving ? 'Saving...' : (orderForm.id ? 'Save Changes' : 'Add Order')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;


