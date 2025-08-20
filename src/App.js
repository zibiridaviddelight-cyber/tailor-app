// ==========================================
// FILE: src/App.js (FIXED)
// ==========================================
import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
// CHANGED: Added new auth functions and removed signInAnonymously
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, deleteDoc, onSnapshot, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { getStorage } from "firebase/storage";

// NEW: Import Login component
import Login from './components/Login';
import Header from './components/Header';
import Controls from './components/Controls';
import CustomerTable from './components/CustomerTable';
import OrderTable from './components/OrderTable';
import ExpenseTable from './components/ExpenseTable';
import Dashboard from './components/Dashboard';
import CustomerModal from './components/CustomerModal';
import OrderModal from './components/OrderModal';
import ExpenseModal from './components/ExpenseModal';
import { CustomModal } from './components/CustomModal';

const App = () => {
  const defaultMeasurements = {
    blouseLength: '', halfLength: '', bust: '', underBust: '', bustPoint: '',
    bustLine: '', blouseWaist: '', roundSleeve: '', sleeve: '', shoulder: '',
    waist: '', hip: '', skirtLength: '', dressLength: '', offShoulder: '',
    aip: '', trouserLength: '', trouserHalfLength: '', thigh: '', uRise: '',
    bottom: '', kneel: '', body: '', back: '', cap: '',
  };

  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null); // NEW: State for auth service
  const [storage, setStorage] = useState(null);
  const [user, setUser] = useState(null); // CHANGED: Renamed from userId to user for clarity
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, showCancel: false });

  const appId = 'default-app-id';

  const showModal = (title, message, onConfirm, showCancel = false) => setModal({ isOpen: true, title, message, onConfirm, showCancel });
  const closeModalAlert = () => setModal({ ...modal, isOpen: false });

  useEffect(() => {
    const firebaseConfig = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID,
    };

    if (!firebaseConfig.apiKey) {
      console.warn("Firebase config is missing. Data will not persist.");
      setIsAuthReady(true);
      return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(app);
      const firebaseStorage = getStorage(app);
      const firebaseAuth = getAuth(app);
      
      setDb(firestoreDb);
      setStorage(firebaseStorage);
      setAuth(firebaseAuth); // NEW: Set auth service

      // CHANGED: Updated auth logic to check for a logged-in user
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        setUser(user); // Set the user object, or null if not logged in
        setIsAuthReady(true);
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
    }
  }, []);

  useEffect(() => {
    // CHANGED: Now depends on `user` object instead of `userId`
    if (db && user && isAuthReady) {
      const userId = user.uid;
      const custUnsub = onSnapshot(collection(db, 'artifacts', appId, 'users', userId, 'customers'), (snapshot) => {
        setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const orderUnsub = onSnapshot(collection(db, 'artifacts', appId, 'users', userId, 'orders'), (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const expenseUnsub = onSnapshot(collection(db, 'artifacts', appId, 'users', userId, 'expenses'), (snapshot) => {
        setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => {
        custUnsub();
        orderUnsub();
        expenseUnsub();
      };
    } else {
      // Clear data when user logs out
      setCustomers([]);
      setOrders([]);
      setExpenses([]);
    }
  }, [db, user, isAuthReady, appId]);

  const handleLogout = () => {
    signOut(auth).catch(error => console.error("Error signing out:", error));
  };

  // If auth is ready but there's no user, show the login page
  if (isAuthReady && !user) {
    return <Login auth={auth} />;
  }

  // If auth is not ready yet, show a loading indicator
  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const openNewCustomerModal = () => { setEditingCustomer({ measurements: defaultMeasurements }); setIsCustomerModalOpen(true); };
  const openEditCustomerModal = (customer) => { setEditingCustomer(customer); setIsCustomerModalOpen(true); };
  const closeCustomerModal = () => { setIsCustomerModalOpen(false); setEditingCustomer(null); };

  const openNewOrderModal = () => { setEditingOrder({}); setIsOrderModalOpen(true); };
  const openEditOrderModal = (order) => { setEditingOrder(order); setIsOrderModalOpen(true); };
  const closeOrderModal = () => { setIsOrderModalOpen(false); setEditingOrder(null); };

  const openNewExpenseModal = () => { setEditingExpense({}); setIsExpenseModalOpen(true); };
  const openEditExpenseModal = (expense) => { setEditingExpense(expense); setIsExpenseModalOpen(true); };
  const closeExpenseModal = () => { setIsExpenseModalOpen(false); setEditingExpense(null); };

  const deleteCustomer = (id, name) => {
    showModal('Confirm Deletion', `Are you sure you want to delete ${name}? This will also delete all of their associated orders.`, async () => {
      if (!db) return;
      try {
        const batch = writeBatch(db);
        const notesCollectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'customers', id, 'notes');
        const notesSnapshot = await getDocs(notesCollectionRef);
        notesSnapshot.docs.forEach(d => batch.delete(d.ref));
        const ordersQuery = query(collection(db, 'artifacts', appId, 'users', user.uid, 'orders'), where("customerId", "==", id));
        const ordersSnapshot = await getDocs(ordersQuery);
        ordersSnapshot.docs.forEach(d => batch.delete(d.ref));
        const customerDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'customers', id);
        batch.delete(customerDocRef);
        await batch.commit();
        closeModalAlert();
      } catch (error) {
        console.error("Error deleting customer and associated data:", error);
        showModal('Error', 'Could not delete customer. Please try again.', closeModalAlert);
      }
    }, true);
  };
  
  const deleteOrder = (id) => {
    showModal('Confirm Deletion', 'Are you sure you want to delete this order?', async () => {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'orders', id));
        closeModalAlert();
      } catch (error) {
        console.error("Error deleting order:", error);
        showModal('Error', 'Could not delete order.', closeModalAlert);
      }
    }, true);
  };

  const deleteExpense = (id) => {
    showModal('Confirm Deletion', 'Are you sure you want to delete this expense?', async () => {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'expenses', id));
        closeModalAlert();
      } catch (error) {
        console.error("Error deleting expense:", error);
        showModal('Error', 'Could not delete expense.', closeModalAlert);
      }
    }, true);
  };

  const filteredItems = useMemo(() => {
    if (currentView === 'customers') return customers.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone?.includes(searchQuery));
    if (currentView === 'expenses') return expenses.filter(e => e.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    if (currentView === 'orders') {
        return orders.filter(order => {
            const textMatch = (order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || order.item?.toLowerCase().includes(searchQuery.toLowerCase()));
            const statusMatch = orderStatusFilter === 'All' ? true : order.status === orderStatusFilter;
            return textMatch && statusMatch;
        });
    }
    return [];
  }, [currentView, customers, orders, expenses, searchQuery, orderStatusFilter]);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard customers={customers} orders={orders} expenses={expenses} />;
      case 'customers':
        return <CustomerTable customers={filteredItems} onEdit={openEditCustomerModal} onDelete={deleteCustomer} />;
      case 'orders':
        return <OrderTable orders={filteredItems} onEdit={openEditOrderModal} onDelete={deleteOrder} />;
      case 'expenses':
        return <ExpenseTable expenses={filteredItems} onEdit={openEditExpenseModal} onDelete={deleteExpense} />;
      default:
        return <Dashboard customers={customers} orders={orders} expenses={expenses} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 font-sans p-4 md:p-8">
      {modal.isOpen && <CustomModal {...modal} onCancel={closeModalAlert} />}
      <Header user={user} onLogout={handleLogout} />
      <Controls
        currentView={currentView}
        setCurrentView={setCurrentView}
        openNewCustomerModal={openNewCustomerModal}
        openNewOrderModal={openNewOrderModal}
        openNewExpenseModal={openNewExpenseModal}
        orderStatusFilter={orderStatusFilter}
        setOrderStatusFilter={setOrderStatusFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        customers={customers}
        orders={orders}
        db={db}
        userId={user.uid}
        appId={appId}
        showModal={showModal}
        closeModalAlert={closeModalAlert}
        defaultMeasurements={defaultMeasurements}
        isAuthReady={isAuthReady}
      />
      
      {renderCurrentView()}

      {isCustomerModalOpen && <CustomerModal isOpen={isCustomerModalOpen} onClose={closeCustomerModal} customer={editingCustomer} db={db} userId={user.uid} appId={appId} showModal={showModal} closeModalAlert={closeModalAlert} />}
      {isOrderModalOpen && <OrderModal isOpen={isOrderModalOpen} onClose={closeOrderModal} order={editingOrder} customers={customers} db={db} storage={storage} userId={user.uid} appId={appId} showModal={showModal} closeModalAlert={closeModalAlert} />}
      {isExpenseModalOpen && <ExpenseModal isOpen={isExpenseModalOpen} onClose={closeExpenseModal} expense={editingExpense} db={db} userId={user.uid} appId={appId} showModal={showModal} closeModalAlert={closeModalAlert} />}
    </div>
  );
};

export default App;
