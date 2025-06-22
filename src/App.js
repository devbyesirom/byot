/* global __firebase_config, __app_id, __initial_auth_token */

// ==================================================
// 1. SETUP & CONFIGURATION
// ==================================================
import React, { useState, useEffect, useMemo, useRef, useContext, createContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Disclosure } from '@headlessui/react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, signInAnonymously, signInWithCustomToken } from "firebase/auth";
import { getFirestore, collection, onSnapshot, addDoc, doc, deleteDoc, writeBatch, setDoc, query } from "firebase/firestore";

// ** Constants **
const DELIVERY_OPTIONS = { 'Kingston (10, 11)': 700, 'Portmore': 800 };
const KNUTSFORD_FEE = 500;
const KNUTSFORD_LOCATIONS = ["Angels (Spanish Town)", "Drax Hall", "Falmouth", "Gutters", "Harbour View", "New Kingston", "Luana", "Lucea", "Mandeville", "May Pen", "Montego Bay (Pier 1)", "Montego Bay Airport", "Negril", "Ocho Rios", "Port Antonio", "Port Maria", "Portmore", "Savanna-La-Mar", "Washington Boulevard"];
const PICKUP_TIMES = ["10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM", "12:00 PM - 1:00 PM", "1:00 PM - 2:00 PM", "2:00 PM - 3:00 PM", "3:00 PM - 4:00 PM"];
const COLLECTION_NAMES = {
    products: "Product",
    coupons: "Coupon",
    orders: "Order",
    inventory: "Inventory",
};

// ** Firebase Configuration **
const firebaseConfig = typeof __firebase_config !== 'undefined'
    ? JSON.parse(__firebase_config)
    : {
        apiKey: "AIzaSyCBv6J7ZInJ2-CX57ksZDjpmLqvO8sgJuQ", 
        authDomain: "byot-40fe2.firebaseapp.com",
        projectId: "byot-40fe2",
        storageBucket: "byot-40fe2.appspot.com",
        messagingSenderId: "643015540811",
        appId: "1:643015540811:web:f8b609d7b2e6408607cdce",
        measurementId: "G-S8QD6WWN90"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'byot-40fe2';


// ==================================================
// 2. CONTEXT PROVIDERS
// ==================================================
const AuthContext = createContext(null);
const AppContext = createContext(null);
const DataContext = createContext(null);
const CartContext = createContext(null);
const ModalContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setIsAdminMode(!!currentUser && !currentUser.isAnonymous);
            if (!isAuthReady) {
                if (!currentUser) {
                    try {
                        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                            await signInWithCustomToken(auth, __initial_auth_token);
                        } else {
                            await signInAnonymously(auth);
                        }
                    } catch (error) {
                        console.error("Authentication failed:", error);
                    }
                }
                setIsAuthReady(true);
            }
        });
        return () => unsubscribe();
    }, [isAuthReady]);

    const handleLogin = async (email, password, showToast) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showToast("Logged in as admin!");
        } catch (error) {
            showToast(`Login Failed: ${error.code}`, 'error');
        }
    };

    const handleLogout = async (setView) => {
        await signOut(auth);
        setView('shop');
        try {
            await signInAnonymously(auth);
        } catch (error) {
            console.error("Anonymous sign-in after logout failed:", error);
        }
    };

    const value = { user, isAdminMode, isAuthReady, handleLogin, handleLogout };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const AppProvider = ({ children }) => {
    const [view, setView] = useState('shop');
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [orderData, setOrderData] = useState(null);
    
    const showToast = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const value = { view, setView, toastMessage, toastType, showToast, orderData, setOrderData };
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const DataProvider = ({ children }) => {
    const { user, isAuthReady } = useContext(AuthContext);
    const { showToast } = useContext(AppContext);
    
    const [products, setProducts] = useState([]);
    const [inventory, setInventory] = useState({});
    const [inventoryLoaded, setInventoryLoaded] = useState(false);
    const [coupons, setCoupons] = useState([]);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (!isAuthReady) return;

        const createSubscription = (collectionName, setter) => {
            const q = query(collection(db, `artifacts/${appId}/public/data/${collectionName}`));
            return onSnapshot(q, (snapshot) => {
                setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, (error) => {
                console.error(`Error fetching ${collectionName}: `, error);
                showToast(`Could not load ${collectionName}. Check Firestore rules/connection.`, "error");
            });
        };

        const unsubscribes = [
            createSubscription('products', setProducts),
            createSubscription('coupons', setCoupons),
            createSubscription('inventory', (snapshot) => {
                 const invData = {};
                snapshot.forEach(doc => { invData[doc.id] = doc.data(); });
                setInventory(invData);
                setInventoryLoaded(true);
            }),
        ];
        
        // Only subscribe to orders if the user is an admin
        if (user && !user.isAnonymous) {
             unsubscribes.push(createSubscription('orders', setOrders));
        } else {
            setOrders([]); // Clear orders if not admin
        }

        return () => unsubscribes.forEach(unsub => unsub && unsub());
    }, [isAuthReady, user, showToast]);

    const value = { products, inventory, inventoryLoaded, coupons, orders };
    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// ... (Other providers like CartContext, ModalContext would go here, unchanged)
const CartProvider = ({ children }) => {
    const { setView, showToast, setOrderData } = useContext(AppContext);
    const [cart, setCart] = useState({});
    const { inventory } = useContext(DataContext);
    const subtotal = useMemo(() => Object.values(cart).reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
    const cartCount = useMemo(() => Object.values(cart).reduce((s, i) => s + i.quantity, 0), [cart]);

    const addToCart = (product, quantity) => { 
        setCart(p => ({ ...p, [product.id]: { ...product, quantity: (p[product.id]?.quantity || 0) + quantity } })); 
        showToast(`${quantity} x ${product.name} added!`); 
    };
    
    const buyNow = (product, quantity) => { 
        setCart({ [product.id]: { ...product, quantity } }); 
        setView('checkout'); 
    };

    const updateCartQuantity = (id, q) => { 
        if (q < 1) { 
            removeFromCart(id); 
            return; 
        } 
        setCart(p => ({...p, [id]: {...p[id], quantity: q}})); 
    };

    const removeFromCart = (id) => { 
        setCart(p => { const n = {...p}; delete n[id]; return n; }); 
    };
    
    const placeOrder = async (order) => {
        const orderId = doc(collection(db, '_')).id;
        const newOrderRef = doc(db, `artifacts/${appId}/public/data/orders`, orderId);

        const newOrder = {
            id: orderId,
            ...order,
            createdAt: new Date().toISOString(),
            paymentStatus: 'Pending',
            fulfillmentStatus: 'Pending'
        };

        const batch = writeBatch(db);
        batch.set(newOrderRef, newOrder);
        
        for (const item of Object.values(order.items)) {
            if (item.id && item.quantity > 0) {
                const currentProductInv = inventory[item.id];
                if (currentProductInv && Array.isArray(currentProductInv.batches)) {
                    let remainingToDeduct = item.quantity;
                    const updatedBatches = [...currentProductInv.batches].sort((a, b) => new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0));

                    for (let i = 0; i < updatedBatches.length && remainingToDeduct > 0; i++) {
                        let batchEntry = updatedBatches[i];
                        const deductibleFromBatch = Math.min(remainingToDeduct, batchEntry.unengraved);
                        batchEntry.unengraved -= deductibleFromBatch;
                        remainingToDeduct -= deductibleFromBatch;
                    }

                    const newBatches = updatedBatches.filter(b => b.unengraved > 0 || b.engraved > 0 || b.defective > 0);
                    const productDocRef = doc(db, `artifacts/${appId}/public/data/inventory`, item.id);
                    batch.set(productDocRef, { batches: newBatches }, { merge: true });
                }
            }
        }
        try {
            await batch.commit();
            setOrderData({ ...newOrder, id: orderId }); 
            showToast("Order placed and inventory updated!", "success");

            if (order.paymentMethod === 'credit_card') {
                setView('payment');
            } else {
                setView('confirmation');
            }
            setCart({});
        } catch (error) {
            console.error("Failed to place order:", error);
            showToast('Failed to place order. ' + error.message, 'error');
        }
    };

    const value = { cart, cartCount, subtotal, addToCart, buyNow, updateCartQuantity, removeFromCart, placeOrder };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

const ModalProvider = ({ children }) => {
    const [modalState, setModalState] = useState({ isOpen: false, message: '', onConfirm: () => {} });

    const showModal = (message, onConfirm) => {
        setModalState({ isOpen: true, message, onConfirm });
    };

    const handleConfirm = () => {
        modalState.onConfirm();
        setModalState({ isOpen: false, message: '', onConfirm: () => {} });
    };

    const handleCancel = () => {
        setModalState({ isOpen: false, message: '', onConfirm: () => {} });
    };

    return (
        <ModalContext.Provider value={showModal}>
            {children}
            {modalState.isOpen && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-[100]">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
                        <p className="mb-6">{modalState.message}</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={handleCancel} className="px-6 py-2 bg-gray-200 rounded-md">Cancel</button>
                            <button onClick={handleConfirm} className="px-6 py-2 bg-red-600 text-white rounded-md">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    );
};

// ==================================================
// 3. HELPER FUNCTIONS & UTILITIES
// ==================================================
// (These are unchanged)
// Firestore CRUD Handlers
const handleUpdateFirestore = async (collectionName, docId, data, showToast) => {
    try {
        await setDoc(doc(db, `artifacts/${appId}/public/data/${collectionName}`, docId), data, { merge: true });
        showToast(`${COLLECTION_NAMES[collectionName] || 'Item'} updated!`);
    } 
    catch (error) {
        console.error(`Error updating ${collectionName}:`, error);
        showToast(`Error updating ${COLLECTION_NAMES[collectionName] || 'item'}`, 'error');
    }
};

const handleAddFirestore = async (collectionName, data, showToast) => {
    try {
        const docRef = await addDoc(collection(db, `artifacts/${appId}/public/data/${collectionName}`), data);
        showToast(`${COLLECTION_NAMES[collectionName] || 'Item'} added!`);
        return docRef;
    } catch (error) {
        console.error(`Error adding ${collectionName}:`, error);
        showToast(`Error adding ${COLLECTION_NAMES[collectionName] || 'item'}`, 'error');
    }
};

const handleDeleteFirestore = async (collectionName, docId, showToast, showModal, skipModal = false) => {
    const performDelete = async () => {
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/${collectionName}`, docId));
            showToast(`${COLLECTION_NAMES[collectionName] || 'Item'} deleted!`);
        } catch(error) {
            console.error(`Error deleting ${collectionName}:`, error);
            showToast(`Error deleting ${COLLECTION_NAMES[collectionName] || 'item'}`, 'error');
        }
    };

    if (skipModal) {
      await performDelete();
    } else {
      showModal(`Are you sure you want to delete this ${COLLECTION_NAMES[collectionName] || 'item'}?`, performDelete);
    }
};

const handleBatchUpdate = async (updates, showToast) => {
    if (updates.length === 0) return;
    const batch = writeBatch(db);
    updates.forEach(({collectionName, docId, data}) => {
        const docRef = doc(db, `artifacts/${appId}/public/data/${collectionName}`, docId);
        batch.update(docRef, data);
    });
    try {
        await batch.commit();
        showToast('Batch update successful!');
    } catch (error) {
        console.error('Batch update failed:', error);
        showToast('Batch update failed.', 'error');
    }
};

// ==================================================
// 4. ICON COMPONENTS
// ==================================================
// (No changes to the icons themselves)


// ==================================================
// 5. UI COMPONENTS (CUSTOMER FACING)
// ==================================================
const ShopView = () => {
    const { products, inventory, inventoryLoaded } = useContext(DataContext);
    const { addToCart, buyNow } = useContext(CartContext);
    const { showToast } = useContext(AppContext);

    const sortedProducts = useMemo(() => [...products].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)), [products]);
    const feedRef = useRef(null);

    const ProductCard = React.memo(({ product, onAddToCart, onBuyNow, inventory, inventoryLoaded }) => {
        const [quantity, setQuantity] = useState(1);
        const availableStock = useMemo(() => {
            if (!inventoryLoaded) return 0;
            const productInventory = inventory[product.id];
            if (!productInventory || !Array.isArray(productInventory.batches)) return 0;
            return productInventory.batches.reduce((sum, batch) => sum + (batch.unengraved || 0), 0);
        }, [product.id, inventory, inventoryLoaded]);

        const handleQuantityInputChange = (e) => {
            let newQuantity = parseInt(e.target.value) || 0;
            newQuantity = Math.max(1, Math.min(newQuantity, availableStock));
            setQuantity(newQuantity);
        };

        const handleQuantityStepperChange = (change) => {
            setQuantity(prevQuantity => {
                const newQuantity = prevQuantity + change;
                return Math.max(1, Math.min(newQuantity, availableStock));
            });
        };

        const handleAddToCartClick = () => {
            if (quantity === 0) {
                showToast("Please select a quantity greater than 0.", "error");
                return;
            }
            if (quantity > availableStock) {
                showToast(`Only ${availableStock} of ${product.name} are available. Adding max available to cart.`, "error");
                onAddToCart(product, availableStock);
            } else {
                onAddToCart(product, quantity);
            }
        };

        const handleBuyNowClick = () => {
            if (quantity === 0) {
                showToast("Please select a quantity greater than 0.", "error");
                return;
            }
            if (quantity > availableStock) {
                showToast(`Only ${availableStock} of ${product.name} are available. Proceeding with max available.`, "error");
                onBuyNow(product, availableStock);
            } else {
                onBuyNow(product, quantity);
            }
        };

        return (
            <div className="card" style={{backgroundImage: `url('${product.image}')`}}>
                <div className="card-content">
                    <h2 className="text-3xl font-bold">{product.name}</h2>
                    <p className="text-lg font-medium text-gray-200">J${product.price.toLocaleString()}</p>
                    {!inventoryLoaded ? (
                        <p className="text-sm text-yellow-300 font-semibold mt-1">Loading stock...</p>
                    ) : availableStock === 0 ? (
                        <p className="text-sm text-red-400 font-semibold mt-1">Out of Stock!</p>
                    ) : availableStock <= 15 && (
                        <p className="text-sm text-yellow-300 font-semibold mt-1">Low stock! Only {availableStock} left.</p>
                    )}
                    <div className="flex items-center bg-white/20 rounded-lg mt-4 w-fit">
                        <button onClick={() => handleQuantityStepperChange(-1)} className="p-2 text-white" disabled={quantity <= 1 || availableStock === 0}>-</button>
                        <input
                            type="number"
                            className="w-12 bg-transparent text-white text-center font-bold"
                            value={quantity}
                            onChange={handleQuantityInputChange}
                            min="1"
                            max={availableStock}
                            disabled={availableStock === 0}
                        />
                        <button onClick={() => handleQuantityStepperChange(1)} className="p-2 text-white" disabled={quantity >= availableStock}>+</button>
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                        <button
                            onClick={handleAddToCartClick}
                            className="w-full bg-white/30 backdrop-blur-sm text-white font-bold py-3 rounded-lg text-lg disabled:bg-gray-500/50 disabled:cursor-not-allowed"
                            disabled={availableStock === 0 || quantity === 0}
                        >
                            Add to Cart
                        </button>
                        <button
                            onClick={handleBuyNowClick}
                            className={`w-full bg-white text-gray-800 font-bold py-3 rounded-lg text-lg shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed`}
                            disabled={availableStock === 0 || quantity === 0}
                        >
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>
        );
    });

    return(
        <main ref={feedRef} className="feed">
            <div className="card justify-center text-center" style={{backgroundImage: `url('https://esirom.com/wp-content/uploads/2025/06/byot-hero-new-rob.png')`}} data-color-start="#111827" data-color-end="#374151">
                <div className="card-content">
                    <h1 className="text-4xl font-extrabold text-white drop-shadow-md whitespace-nowrap">Bring Yuh Owna Tings</h1>
                    <p className="text-lg text-gray-200 mt-2">Reusable Utensil Sets for Everyday Use</p>
                </div>
                 {sortedProducts.length > 0 && <button
                    className="scroll-arrow text-white"
                    onClick={() => {
                        if (feedRef.current) {
                            feedRef.current.scrollTo({
                                top: feedRef.current.clientHeight,
                                behavior: 'smooth'
                            });
                        }
                    }}
                >
                    <ArrowDownIcon />
                </button>}
            </div>
             {products.length === 0 ? (
                <div className="card bg-gray-700">
                    <div className="card-content flex flex-col items-center justify-center text-center h-full">
                         <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4"></div>
                         <p className="text-lg font-semibold">Loading Products...</p>
                         <p className="text-sm text-gray-300">If this takes too long, please check your connection or admin settings.</p>
                    </div>
                </div>
            ) : (
                sortedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onAddToCart={addToCart} onBuyNow={buyNow} inventory={inventory} inventoryLoaded={inventoryLoaded} />
                ))
            )}
        </main>
    );
};
// ... Other customer-facing components are unchanged ...
const CartView = ({ onBack, onGoToCheckout, showToast }) => {
    const { cart, updateCartQuantity, removeFromCart, subtotal } = useContext(CartContext);
    const { inventory } = useContext(DataContext);

    const handleUpdateCartQuantityWithStock = (id, newQuantity) => {
        const productInventory = inventory[id];
        const availableStock = productInventory && Array.isArray(productInventory.batches)
            ? productInventory.batches.reduce((sum, batch) => sum + (batch.unengraved || 0), 0)
            : 0;

        let quantityToSet = newQuantity;
        if (newQuantity < 1) {
            quantityToSet = 1;
        }
        if (newQuantity > availableStock) {
            showToast(`Only ${availableStock} of this item are available. Quantity capped.`, "error");
            quantityToSet = availableStock;
        }

        updateCartQuantity(id, quantityToSet);
    };

    return (
        <div className="view active bg-gray-100">
            <header className="flex-shrink-0 bg-white shadow-sm p-4 flex items-center justify-between"><button onClick={onBack} className="p-2"><BackArrowIcon /></button><h1 className="text-xl font-bold">My Cart</h1><div className="w-10"></div></header>
            <main className="flex-grow overflow-y-auto p-4 space-y-4">
                {Object.keys(cart).length === 0 ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500 h-full">
                        <CartIcon /><p className="text-lg font-semibold mt-4">Your cart is empty</p>
                    </div>
                ) : (
                    Object.values(cart).map(item => (
                        <div key={item.id} className="flex items-center bg-white p-2 rounded-lg shadow">
                            <img src={item.image} className="w-16 h-16 object-cover rounded-md mr-4" alt={item.name}/>
                            <div className="flex-grow"><p className="font-bold">{item.name}</p><p className="text-gray-600">J${item.price.toLocaleString()}</p></div>
                            <input
                                type="number"
                                value={item.quantity || 0}
                                onChange={(e) => handleUpdateCartQuantityWithStock(item.id, parseInt(e.target.value))}
                                className="w-12 text-center border rounded-md mx-2"
                                min="1"
                                max={inventory[item.id]?.batches?.reduce((sum, batch) => sum + (batch.unengraved || 0), 0) || 0}
                            />
                            <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-500"><TrashIcon /></button>
                        </div>
                    ))
                )}
            </main>
            {Object.keys(cart).length > 0 && <footer className="flex-shrink-0 bg-white border-t p-4 space-y-3"><div className="flex justify-between font-bold text-lg"><span>Subtotal</span><span>J${subtotal.toLocaleString()}</span></div><button onClick={onGoToCheckout} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-lg">Proceed to Checkout</button></footer>}
        </div>
    );
};
const CheckoutView = ({ onBack, showToast }) => {
    const { cart, subtotal, placeOrder } = useContext(CartContext);
    const { coupons } = useContext(DataContext);
    const [fulfillmentMethod, setFulfillmentMethod] = useState('pickup');
    const [bearerLocation, setBearerLocation] = useState(Object.keys(DELIVERY_OPTIONS)[0]);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [pickupDate, setPickupDate] = useState('');
    const [pickupTime, setPickupTime] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponMessage, setCouponMessage] = useState('');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    useEffect(() => {
        if (fulfillmentMethod !== 'pickup') {
            setPaymentMethod('bank_transfer');
        } else {
            setPaymentMethod('cod');
        }
    }, [fulfillmentMethod]);

    const fulfillmentCost = useMemo(() => {
        if (fulfillmentMethod === 'pickup') return 0;
        if (fulfillmentMethod === 'bearer') return DELIVERY_OPTIONS[bearerLocation];
        if (fulfillmentMethod === 'knutsford') return KNUTSFORD_FEE;
        return 0;
    }, [fulfillmentMethod, bearerLocation]);

    const discount = useMemo(() => {
        if (!appliedCoupon) return 0;
        let calculatedDiscount = 0;
        const cartItemsArray = Object.values(cart);

        if (appliedCoupon.appliesTo === 'all') {
            if (appliedCoupon.type === 'percentage') {
                calculatedDiscount = subtotal * (appliedCoupon.value / 100);
            } else if (appliedCoupon.type === 'fixed') {
                calculatedDiscount = appliedCoupon.value;
            }
        } else if (Array.isArray(appliedCoupon.appliesTo) && appliedCoupon.appliesTo.length > 0) {
            const eligibleItemsTotal = cartItemsArray.reduce((sum, item) => {
                if (appliedCoupon.appliesTo.includes(item.id)) {
                    return sum + (item.price * item.quantity);
                }
                return sum;
            }, 0);

            if (appliedCoupon.type === 'percentage') {
                calculatedDiscount = eligibleItemsTotal * (appliedCoupon.value / 100);
            } else if (appliedCoupon.type === 'fixed') {
                calculatedDiscount = Math.min(appliedCoupon.value, eligibleItemsTotal);
            }
        }
        return calculatedDiscount;
    }, [appliedCoupon, subtotal, cart]);

    const total = subtotal + fulfillmentCost - discount;

    const handleApplyCoupon = () => {
        const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.isActive);
        setAppliedCoupon(null);
        setCouponMessage('');

        if(!coupon) {
            showToast('Invalid or inactive coupon.', 'error');
            setCouponMessage('Invalid or inactive coupon.');
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const couponStartDate = coupon.startDate ? new Date(coupon.startDate) : null;
        if (couponStartDate) couponStartDate.setHours(0, 0, 0, 0);

        const couponEndDate = coupon.endDate ? new Date(coupon.endDate) : null;
        if (couponEndDate) couponEndDate.setHours(23, 59, 59, 999);


        if (couponStartDate && today < couponStartDate) {
            showToast('Coupon is not yet active.', 'error');
            setCouponMessage(`Coupon will be active from ${couponStartDate.toLocaleDateString()}.`);
            return;
        }
        if (couponEndDate && today > couponEndDate) {
            showToast('Coupon has expired.', 'error');
            setCouponMessage(`Coupon expired on ${couponEndDate.toLocaleDateString()}.`);
            return;
        }


        const isCouponApplicableToCart = Object.values(cart).some(item => {
            return coupon.appliesTo === 'all' || (Array.isArray(coupon.appliesTo) && coupon.appliesTo.includes(item.id));
        });

        if (!isCouponApplicableToCart) {
            showToast('Coupon not applicable to items in your cart.', 'error');
            setCouponMessage('Coupon not applicable to items in your cart.');
            return;
        }

        setAppliedCoupon(coupon);
        showToast('Coupon applied!', 'success');
    };

    useEffect(() => {
        if (appliedCoupon) {
            const currentDiscount = discount; 
            if (currentDiscount > 0) {
                setCouponMessage(`Coupon "${appliedCoupon.code}" applied! You saved J$${currentDiscount.toLocaleString()}`);
            } else {
                setCouponMessage('Coupon not applicable to items in your cart.');
                 setAppliedCoupon(null);
            }
        } else {
            setCouponMessage('');
        }
    }, [appliedCoupon, discount, cart]);


    const handleCopyBankInfo = () => {
        const bankInfo = `Company: Esirom Foundation Limited\nBank: Scotiabank\nBranch: Oxford Road\nAccount #: 846837, SAVINGS (JMD Account)`;
        copyToClipboard(bankInfo, showToast);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsPlacingOrder(true);

        const formData = new FormData(e.target);
        const fullName = formData.get('fullName');
        const email = formData.get('email');
        const phone = formData.get('phone');
        const knutsfordLocation = formData.get('knutsford_location');

        await placeOrder({
            customerInfo: { name: fullName, email, phone },
            items: cart,
            subtotal,
            fulfillmentCost,
            discount,
            total,
            couponUsed: appliedCoupon ? { code: appliedCoupon.code, value: discount } : null,
            fulfillmentMethod,
            paymentMethod,
            pickupDate: fulfillmentMethod === 'pickup' ? pickupDate : null,
            pickupTime: fulfillmentMethod === 'pickup' ? pickupTime : null,
            knutsfordLocation: fulfillmentMethod === 'knutsford' ? knutsfordLocation : null,
            bearerLocation: fulfillmentMethod === 'bearer' ? bearerLocation : null,
        });

        setIsPlacingOrder(false);
    };

    const getNextWeekday = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        if (day === 0) d.setDate(d.getDate() + 1);
        else if (day === 6) d.setDate(d.getDate() + 2);
        return d.toISOString().split('T')[0];
    };

    const handleDateChange = (e) => {
        const selectedDateValue = e.target.value;
        if (!selectedDateValue) {
            setPickupDate('');
            return;
        }
        const selectedDate = new Date(selectedDateValue);
        const dayOfWeek = selectedDate.getDay();

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            showToast("Pickups are only available Monday - Friday. Please select a weekday.", "error");
            setPickupDate('');
        } else {
            setPickupDate(selectedDateValue);
        }
    };

    const getMinDate = () => {
        const today = new Date();
        return getNextWeekday(today);
    };

    return (
        <div className="view active bg-gray-100">
            <header className="flex-shrink-0 bg-white shadow-sm p-4 flex items-center justify-between">
                <button onClick={onBack} className="p-2"><BackArrowIcon /></button>
                <h1 className="text-xl font-bold">Checkout</h1>
                <div className="w-10"></div>
            </header>
            <main className="flex-grow overflow-y-auto p-4">
                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-2">Contact Information</h2>
                        <div className="space-y-3">
                            <input name="fullName" type="text" placeholder="Full Name" className="w-full p-3 border rounded-lg" required />
                            <input name="email" type="email" placeholder="Email Address" className="w-full p-3 border rounded-lg" required />
                            <input name="phone" type="tel" placeholder="Phone Number" className="w-full p-3 border rounded-lg" required />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-2">Fulfillment Method</h2>
                        <div className="space-y-2">
                            <label className="flex items-center p-3 border rounded-lg bg-white has-[:checked]:border-blue-500">
                                <input onChange={(e) => setFulfillmentMethod(e.target.value)} type="radio" name="fulfillment" value="pickup" checked={fulfillmentMethod === 'pickup'} />
                                <span className="ml-2">Pick Up (Unit #18, 13 West Kings House Road)</span>
                                <span className="ml-auto font-semibold">Free</span>
                            </label>
                             {fulfillmentMethod === 'pickup' && (
                                <div className="pl-8 pt-2 grid grid-cols-2 gap-2">
                                    <input
                                        type="date"
                                        name="pickup_date"
                                        className="p-2 border rounded-md"
                                        required
                                        value={pickupDate}
                                        onChange={handleDateChange}
                                        min={getMinDate()}
                                    />
                                    <select name="pickup_time" className="p-2 border rounded-md" required value={pickupTime} onChange={(e) => setPickupTime(e.target.value)}>
                                        <option value="">Select Time</option>
                                        {PICKUP_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1 col-span-2">Pickups are available Monday - Friday.</p>
                                </div>
                            )}
                            <label className="flex items-center p-3 border rounded-lg bg-white has-[:checked]:border-blue-500">
                                <input onChange={(e) => setFulfillmentMethod(e.target.value)} type="radio" name="fulfillment" value="bearer" checked={fulfillmentMethod === 'bearer'} />
                                <span className="ml-2">Bearer Delivery</span>
                            </label>
                            {fulfillmentMethod === 'bearer' && (
                                <div className="pl-6 pt-2">
                                    <select name="bearer_location" onChange={(e) => setBearerLocation(e.target.value)} className="w-full p-2 border rounded-md mt-1">
                                        {Object.entries(DELIVERY_OPTIONS).map(([loc, price]) => <option key={loc} value={loc}>{`${loc} - J$${price}`}</option>)}
                                    </select>
                                </div>
                            )}
                            <label className="flex items-center p-3 border rounded-lg bg-white has-[:checked]:border-blue-500">
                                <input onChange={(e) => setFulfillmentMethod(e.target.value)} type="radio" name="fulfillment" value="knutsford" checked={fulfillmentMethod === 'knutsford'} />
                                <span className="ml-2">Knutsford Express</span>
                                <span className="ml-auto font-semibold">J${KNUTSFORD_FEE}</span>
                            </label>
                            {fulfillmentMethod === 'knutsford' && (
                                <div className="pl-6 pt-2">
                                    <select name="knutsford_location" className="w-full p-2 border rounded-md mt-1">
                                        {KNUTSFORD_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Does NOT cover Knutsford's fee to deliver to your requested destination. Covers delivery of order to Knutsford Courier.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-2">Coupon Code</h2>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                placeholder="Enter coupon code"
                                disabled={!!appliedCoupon}
                                className="w-full p-3 border rounded-lg"
                            />
                            <button
                                type="button"
                                onClick={handleApplyCoupon}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg disabled:bg-gray-400"
                                disabled={!!appliedCoupon || !couponCode}
                            >
                                Apply
                            </button>
                        </div>
                        {couponMessage && (
                             <p className={`text-sm mt-2 ${discount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                 {couponMessage}
                                 {appliedCoupon && <button type="button" onClick={() => {setAppliedCoupon(null); setCouponCode(''); setCouponMessage('');}} className="ml-2 text-red-500 font-bold">[Remove]</button>}
                             </p>
                        )}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-2">Payment Method</h2>
                        <div className="space-y-2">
                            <label className="flex items-center p-3 border rounded-lg bg-white has-[:checked]:border-blue-500">
                                <input type="radio" name="payment" value="cod" onChange={(e) => setPaymentMethod(e.target.value)} checked={paymentMethod === 'cod'} disabled={fulfillmentMethod !== 'pickup'} />
                                <span className={`ml-2 ${fulfillmentMethod !== 'pickup' ? 'text-gray-400' : ''}`}>Cash on Pickup</span>
                            </label>
                            <label className="flex items-center p-3 border rounded-lg bg-white has-[:checked]:border-blue-500">
                                <input type="radio" name="payment" value="bank_transfer" onChange={(e) => setPaymentMethod(e.target.value)} checked={paymentMethod === 'bank_transfer'} />
                                <span className="ml-2">Bank Transfer</span>
                            </label>
                            {paymentMethod === 'bank_transfer' && (
                                <div className="pl-6 p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-800 text-sm">
                                    <ul>
                                        <li><strong>Company:</strong> Esirom Foundation Limited</li>
                                        <li><strong>Bank:</strong> Scotiabank</li>
                                        <li><strong>Branch:</strong> Oxford Road</li>
                                        <li><strong>Account #:</strong> 846837, SAVINGS (JMD Account)</li>
                                    </ul>
                                    <button type="button" onClick={handleCopyBankInfo} className="mt-2 flex items-center gap-2 text-xs bg-blue-500 text-white py-1 px-2 rounded">
                                        <CopyIcon /> Copy Info
                                    </button>
                                </div>
                            )}
                            <label className="flex items-center p-3 border rounded-lg bg-white has-[:checked]:border-blue-500">
                                <input type="radio" name="payment" value="credit_card" onChange={(e) => setPaymentMethod(e.target.value)} checked={paymentMethod === 'credit_card'}/>
                                <span className="ml-2">Credit Card</span>
                            </label>
                        </div>
                    </div>
                </form>
            </main>
            <footer className="flex-shrink-0 bg-white border-t p-4 space-y-3">
                <div className="text-right space-y-1">
                    <p>Subtotal: <span className="font-semibold">J${subtotal.toLocaleString()}</span></p>
                    <p>Shipping: <span className="font-semibold">J${fulfillmentCost.toLocaleString()}</span></p>
                    {discount > 0 && <p className="text-green-600">Discount: <span className="font-semibold">-J${discount.toLocaleString()}</span></p>}
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>J${total.toLocaleString()}</span>
                </div>
                <button type="submit" form="checkout-form" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-lg disabled:bg-blue-300" disabled={isPlacingOrder}>
                    {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                </button>
            </footer>
        </div>
    );
};
const ConfirmationView = ({ order, onContinue }) => {
    if(!order) return null;
    const { id, paymentMethod, fulfillmentMethod, pickupDate, pickupTime } = order;
    return (
        <div className="view active bg-gray-100 p-4 flex flex-col items-center justify-center text-center">
            <CheckCircleIcon />
            <h1 className="text-2xl font-bold mt-4">Thank You!</h1>
            <p className="text-gray-600">Your order <span className="font-bold">#{id.slice(0, 8)}</span> has been placed.</p>
            <div className="text-left bg-white p-4 rounded-lg shadow-md w-full my-6 text-sm">
                <h2 className="font-bold mb-2">Next Steps</h2>
                {paymentMethod === 'bank_transfer' && <p>For bank transfer payments, orders will not be processed until proof of payment is sent via Whatsapp at 876-436-5244.</p>}
                {fulfillmentMethod === 'pickup' && (
                    <>
                        <p>For Pick up, please allow up to 1 business day for collection. Your selected time is:</p>
                        <p className="font-semibold">{pickupDate && new Date(pickupDate).toLocaleDateString()} at {pickupTime}</p>
                    </>
                )}
                {fulfillmentMethod === 'bearer' && <p>For Bearer Delivery, please allow up to 3 business days for delivery. We will contact you the morning of delivery.</p>}
                {fulfillmentMethod === 'knutsford' && <p>For Knutsford Courier, please allow up to 3 business days for delivery. We will contact you once the order has been dropped off.</p>}
                {paymentMethod === 'credit_card' && <p>Your payment is being processed. Thank You!</p>}
                {paymentMethod === 'bank_transfer' && (
                    <a href="http://api.whatsapp.com/send?phone=18764365244" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg mt-4"><WhatsAppIcon /> <span className="ml-2">Upload Receipt to WhatsApp</span></a>
                )}
            </div>
            <button onClick={onContinue} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-lg">Continue Shopping</button>
        </div>
    );
};
const CreditCardView = ({ order, onBack }) => { const totalQuantity = Object.values(order.items).reduce((sum, item) => sum + item.quantity, 0); const paymentUrl = totalQuantity === 1 ? "https://secure.ezeepayments.com/?CQY6un2" : "https://secure.ezeepayments.com/?kgRMTcZ"; return ( <div className="view active bg-gray-100"> <header className="flex-shrink-0 bg-white shadow-sm p-4 flex items-center justify-between"><button onClick={onBack} className="p-2"><BackArrowIcon /></button><h1 className="text-xl font-bold">Complete Payment</h1><div className="w-10"></div></header> <iframe title="Credit Card Payment" src={paymentUrl} className="w-full h-full border-0"></iframe> </div> ) };
const AboutView = ({ onBack }) => { return ( <div className="view active bg-white"> <header className="flex-shrink-0 bg-white shadow-sm p-4 flex items-center justify-between"><button onClick={onBack} className="p-2"><BackArrowIcon /></button><h1 className="text-xl font-bold">About Us</h1><div className="w-10"></div></header> <main className="flex-grow overflow-y-auto p-6 flex flex-col items-center justify-center text-center"> <img src="https://esiromfoundation.org/wp-content/uploads/2023/12/esirom-foundation-logo-icon.jpg" alt="Esirom Foundation Logo" className="h-24 w-auto mx-auto"/> <p className="mt-4 text-gray-600 max-w-sm">Bring Yuh Owna Tings (BYOT) is a movement to cut back on single-use plastics by making reusables part of everyday life. Our reusable utensil sets come with a fork, spoon, knife, and chopsticks in a compact case, perfect for life on the go. They come in a range of colours and can be customized with your name or logo.</p><p className="mt-4 text-gray-600 max-w-sm">The campaign is led by the Esirom Foundation, a Jamaican non-profit focused on solving environmental challenges in real, practical ways. We first kicked things off in December 2022 with our "Bring Your Own Cup" campaign where cafes across Kingston, including Cafe Blue and Starbucks, offered discounts to customers who brought their own reusable cup.</p><p className="mt-4 text-gray-600 max-w-sm">In January 2024, the campaign relaunched as BYOT with a wider push for all reusables. From containers and bottles, to thermoses and tumblers. So in April 2024, we launched our BYOT utensil sets, giving people a simple, tangible way to live the message, not just hear it.</p> </main> </div> ) };

// ==================================================
// 6. UI COMPONENTS (ADMIN PANEL)
// ==================================================
const AdminLoginView = ({ onLogin, showToast }) => { const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const handleLogin = (e) => { e.preventDefault(); onLogin(email, password, showToast); }; return( <div className="view active bg-gray-100 p-4 justify-center"> <form onSubmit={handleLogin} className="w-full max-w-sm mx-auto bg-white p-8 rounded-lg shadow-md space-y-6"> <h2 className="text-2xl font-bold text-center">Admin Login</h2> <div><label className="block mb-1 font-semibold">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded" required/></div> <div><label className="block mb-1 font-semibold">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" required/></div> <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Login</button> </form> </div> ); };
const AdminDashboard = ({ onLogout }) => {
    const [adminView, setAdminView] = useState('orders');
    const { products, inventory, inventoryLoaded, coupons, orders } = useContext(DataContext);
    const { showToast } = useContext(AppContext);
    const showModal = useModal();

    const crudHandlers = {
      onUpdate: (...args) => handleUpdateFirestore(...args, showToast),
      onAdd: (...args) => handleAddFirestore(...args, showToast),
      onDelete: (...args) => handleDeleteFirestore(...args, showToast, showModal),
      onBatchUpdate: (updates) => handleBatchUpdate(updates, showToast),
      showToast,
      showModal
    };

    return (
        <div className="view active bg-gray-200 flex-col h-full">
            <aside className="w-full bg-gray-800 text-white flex-shrink-0 lg:h-16 lg:flex lg:flex-row lg:items-center lg:justify-between">
                 <div className="p-4 font-bold border-b border-gray-700 lg:border-b-0 lg:p-0 lg:ml-6 hidden lg:block">Admin Panel</div>
                 <nav className="p-2 flex-grow flex justify-around lg:flex-grow-0 lg:flex-row lg:justify-center lg:space-x-2">
                     <button onClick={() => setAdminView('orders')} className={`flex flex-col items-center text-center w-full p-2 rounded-md space-x-2 lg:flex-row lg:text-left lg:w-auto ${adminView === 'orders' ? 'bg-gray-700' : ''}`}><ClipboardListIcon/><span>Orders</span></button>
                     <button onClick={() => setAdminView('inventory')} className={`flex flex-col items-center text-center w-full p-2 rounded-md space-x-2 lg:flex-row lg:text-left lg:w-auto ${adminView === 'inventory' ? 'bg-gray-700' : ''}`}><PackageIcon/><span>Inventory</span></button>
                     <button onClick={() => setAdminView('products')} className={`flex flex-col items-center text-center w-full p-2 rounded-md space-x-2 lg:flex-row lg:text-left lg:w-auto ${adminView === 'products' ? 'bg-gray-700' : ''}`}><TagIcon/><span>Products</span></button>
                     <button onClick={() => setAdminView('coupons')} className={`flex flex-col items-center text-center w-full p-2 rounded-md space-x-2 lg:flex-row lg:text-left lg:w-auto ${adminView === 'coupons' ? 'bg-gray-700' : ''}`}><TicketIcon/><span>Coupons</span></button>
                     <button onClick={() => setAdminView('insights')} className={`flex flex-col items-center text-center w-full p-2 rounded-md space-x-2 lg:flex-row lg:text-left lg:w-auto ${adminView === 'insights' ? 'bg-gray-700' : ''}`}><BarChartIcon/><span>Insights</span></button>
                 </nav>
                 <button onClick={onLogout} className="p-4 text-sm text-red-400 hover:bg-red-500 hover:text-white hidden lg:block lg:mr-6">Logout</button>
            </aside>
            <main className="flex-1 flex flex-col overflow-y-hidden lg:flex-row">
                 <header className="flex-shrink-0 bg-white shadow-sm p-4 flex items-center justify-between lg:hidden">
                    <h1 className="text-xl font-bold capitalize">{adminView}</h1>
                    <button onClick={onLogout} className="text-sm text-red-600">Logout</button>
                 </header>
                 <div className="flex-grow overflow-y-auto p-2 sm:p-6">
                    {adminView === 'orders' && <AdminOrdersView orders={orders} products={products} {...crudHandlers} inventory={inventory} />}
                    {adminView === 'inventory' && <AdminInventoryView inventory={inventory} products={products} inventoryLoaded={inventoryLoaded} {...crudHandlers} />}
                    {adminView === 'products' && <AdminProductsView products={products} {...crudHandlers}/>}
                    {adminView === 'coupons' && <AdminCouponsView products={products} coupons={coupons} {...crudHandlers} />}
                    {adminView === 'insights' && <AdminInsightsView orders={orders} {...crudHandlers}/>}
                 </div>
            </main>
        </div>
    );
}
const AdminOrdersView = ({ orders, products, onUpdate, onDelete, showToast, showModal, inventory }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showManualForm, setShowManualForm] = useState(false);

    const handleStatusUpdate = async (orderId, field, value) => {
        await onUpdate('orders', orderId, { [field]: value });
    };

    const handleDeleteOrder = (orderId) => {
        showModal('Are you sure you want to delete this order? This action cannot be undone.', () => {
            onDelete('orders', orderId);
            setSelectedOrder(null);
        });
    };

    const handleManualSubmit = async (e, manualOrderItems) => {
        e.preventDefault();

        for (const item of manualOrderItems) {
            if(!item.productId) continue;
            const productInventory = inventory[item.productId];
            if (!productInventory) {
                 showToast(`Inventory data not found for product.`, 'error');
                 return;
            }
            const availableStock = Array.isArray(productInventory.batches)
                ? productInventory.batches.reduce((sum, batch) => sum + (batch.unengraved || 0), 0)
                : 0;
            const product = products.find(p => p.id === item.productId);
            if (!product) {
                showToast(`Product with ID ${item.productId} not found.`, 'error');
                continue;
            }
            if (item.quantity > availableStock) {
                showToast(`Cannot add order: Quantity for ${product.name} exceeds available stock of ${availableStock}.`, 'error');
                return;
            }
        }

        const formData = new FormData(e.target);
        const items = {};
        let subtotal = 0;
        manualOrderItems.forEach((itemInput) => {
            if(itemInput.productId) {
                const product = products.find(p => p.id === itemInput.productId);
                if (product) {
                    items[product.id] = { ...product, quantity: parseInt(itemInput.quantity) || 1 };
                    subtotal += product.price * items[product.id].quantity;
                }
            }
        });

        const fulfillmentCost = (() => {
            const method = formData.get('manualFulfillmentMethod');
            if (method === 'pickup') return 0;
            if (method === 'bearer') return DELIVERY_OPTIONS[formData.get('manualBearerLocation')];
            if (method === 'knutsford') return KNUTSFORD_FEE;
            return 0;
        })();

        const orderId = doc(collection(db, '_')).id;
        const newOrderRef = doc(db, `artifacts/${appId}/public/data/orders`, orderId);

        const newOrder = {
            id: orderId,
            customerInfo: { name: formData.get('customerName'), email: formData.get('customerEmail'), phone: formData.get('customerPhone')},
            items, subtotal, fulfillmentCost, total: subtotal + fulfillmentCost,
            createdAt: new Date().toISOString(),
            paymentStatus: formData.get('paymentStatus'),
            fulfillmentStatus: formData.get('fulfillmentStatus'),
            fulfillmentMethod: formData.get('manualFulfillmentMethod'),
            paymentMethod: formData.get('manualPaymentMethod'),
            pickupDate: formData.get('manualFulfillmentMethod') === 'pickup' ? formData.get('manualPickupDate') : null,
            pickupTime: formData.get('manualFulfillmentMethod') === 'pickup' ? formData.get('manualPickupTime') : null,
            knutsfordLocation: formData.get('manualFulfillmentMethod') === 'knutsford' ? formData.get('manualKnutsfordLocation') : null,
            bearerLocation: formData.get('manualFulfillmentMethod') === 'bearer' ? formData.get('manualBearerLocation') : null,
        };
        
        const batch = writeBatch(db);
        batch.set(newOrderRef, newOrder);

        for (const item of manualOrderItems) {
            if (item.productId && item.quantity > 0) {
                const currentProductInv = inventory[item.productId];
                if (currentProductInv && Array.isArray(currentProductInv.batches)) {
                    let remainingToDeduct = item.quantity;
                    const updatedBatches = [...currentProductInv.batches];

                    updatedBatches.sort((a, b) => new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0));

                    for (let i = 0; i < updatedBatches.length && remainingToDeduct > 0; i++) {
                        let batchEntry = updatedBatches[i];
                        const deductibleFromBatch = Math.min(remainingToDeduct, batchEntry.unengraved);
                        batchEntry.unengraved -= deductibleFromBatch;
                        remainingToDeduct -= deductibleFromBatch;
                    }

                    const newBatches = updatedBatches.filter(b => b.unengraved > 0 || b.engraved > 0 || b.defective > 0);
                    const productDocRef = doc(db, `artifacts/${appId}/public/data/inventory`, item.productId);
                    batch.set(productDocRef, { batches: newBatches }, { merge: true });
                }
            }
        }
        try {
            await batch.commit();
            showToast("Manual order added and inventory updated!");
        } catch (error) {
            console.error("Failed to create manual order:", error);
            showToast("Failed to create order and update inventory.", "error");
        }
        setShowManualForm(false);
    };

    const sortedOrders = useMemo(() => {
        return orders.slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [orders]);

    const filteredOrders = useMemo(() => {
        return sortedOrders.filter(order => {
            const searchMatch = !searchTerm || order.id.toLowerCase().includes(searchTerm.toLowerCase()) || (order.customerInfo.name && order.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()));
            const paymentStatusMatch = paymentFilter === 'all' || order.paymentStatus === paymentFilter;
            return searchMatch && paymentStatusMatch;
        });
    }, [sortedOrders, searchTerm, paymentFilter]);

    // ... (OrderModal and ManualOrderForm components are unchanged)

    return(
        <div>
            {selectedOrder && <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onDeleteOrder={handleDeleteOrder} />}
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h2 className="text-2xl font-bold">Orders</h2>
                <div className="flex items-center gap-2 flex-wrap">
                    <input
                        type="text"
                        placeholder="Filter by ID or Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 border rounded-md"
                    />
                     <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="p-2 border rounded-md">
                        <option value="all">All Statuses</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Refunded">Refunded</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                    <button onClick={() => setShowManualForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm whitespace-nowrap">Add Manual Order</button>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fulfilled</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOrders.map(order => (
                            <tr key={order.id} onClick={() => setSelectedOrder(order)} className="cursor-pointer hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium">{order.id.slice(0, 8)}</td><td className="px-6 py-4 whitespace-nowrap">{order.customerInfo.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {order.createdAt && !isNaN(new Date(order.createdAt).getTime())
                                        ? new Date(order.createdAt).toLocaleDateString()
                                        : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">J${order.total.toLocaleString()}</td><td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {order.paymentStatus}
                                    </span>
                                </td><td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.fulfillmentStatus === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {order.fulfillmentStatus}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
};
const AdminInventoryView = ({ inventory, products, inventoryLoaded, onSave, showToast, showModal }) => {
    const [localInventory, setLocalInventory] = useState({});

    useEffect(() => {
        if (Object.keys(inventory).length > 0) {
            setLocalInventory(JSON.parse(JSON.stringify(inventory))); // Deep copy
        }
    }, [inventory]);

    const handleBatchValueChange = (productId, batchIndex, field, value) => {
        const val = parseInt(value, 10) || 0;
        setLocalInventory(prev => {
            const productInv = { ...prev[productId] };
            const updatedBatches = [...(productInv.batches || [])];
            if (updatedBatches[batchIndex]) {
                updatedBatches[batchIndex] = { ...updatedBatches[batchIndex], [field]: val };
            }
            return { ...prev, [productId]: { ...productInv, batches: updatedBatches } };
        });
    };

    const handleAddBatch = (productId) => {
        setLocalInventory(prev => {
            const productInv = { ...prev[productId] };
            const updatedBatches = [...(productInv.batches || [])];
            updatedBatches.push({
                batchId: `manual_${Date.now()}`,
                dateAdded: new Date().toISOString().split('T')[0],
                engraved: 0,
                unengraved: 0,
                defective: 0
            });
            return { ...prev, [productId]: { ...productInv, batches: updatedBatches } };
        });
    };

    const handleRemoveBatch = (productId, batchIndex) => {
        showModal('Are you sure you want to remove this batch entry?', () => {
            setLocalInventory(prev => {
                const productInv = { ...prev[productId] };
                const updatedBatches = (productInv.batches || []).filter((_, i) => i !== batchIndex);
                return { ...prev, [productId]: { ...productInv, batches: updatedBatches } };
            });
        });
    };

    const handleSaveProductInventory = async (productId) => {
        if(localInventory[productId]) {
            await onSave('inventory', productId, { batches: localInventory[productId].batches || [] });
            showToast('Inventory batches updated!');
        }
    };

    if (!inventoryLoaded) {
        return <div>Loading inventory...</div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Inventory Management</h2>
            <div className="space-y-4">
                {products.length === 0 ? <p>No products found. Please add a product first.</p> : products.map(p => {
                    const productInventory = localInventory[p.id] || { batches: [] };
                    const totalUnengravedStock = productInventory.batches.reduce((sum, batch) => sum + (batch.unengraved || 0), 0);
                    const totalEngravedStock = productInventory.batches.reduce((sum, batch) => sum + (batch.engraved || 0), 0);
                    const totalDefectiveStock = productInventory.batches.reduce((sum, batch) => sum + (batch.defective || 0), 0);
                    const overallTotalStock = totalUnengravedStock + totalEngravedStock + totalDefectiveStock;

                    return (
                        <div key={p.id} className="bg-white rounded-lg shadow p-4">
                            <h3 className="font-bold">{p.name}</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-2 items-end">
                                <div><label className="text-xs text-gray-500">Total Stock</label><input type="number" value={overallTotalStock} readOnly className="w-full p-2 border rounded mt-1 bg-gray-100"/></div>
                                <div><label className="text-xs text-gray-500">Engraved</label><input type="number" value={totalEngravedStock} readOnly className="w-full p-2 border rounded mt-1 bg-gray-100"/></div>
                                <div><label className="text-xs text-gray-500">Unengraved</label><input type="number" value={totalUnengravedStock} readOnly className="w-full p-2 border rounded mt-1 bg-gray-100"/></div>
                                <div><label className="text-xs text-gray-500">Defective</label><input type="number" value={totalDefectiveStock} readOnly className="w-full p-2 border rounded mt-1 bg-gray-100"/></div>
                                <button onClick={() => handleSaveProductInventory(p.id)} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">Save All Changes</button>
                            </div>
                            {totalUnengravedStock <= 15 && <p className="text-xs text-red-500 mt-2 font-semibold">Low unengraved stock warning!</p>}

                            <Disclosure>
                                {({ open }) => (
                                    <>
                                        <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-blue-900 bg-blue-100 rounded-lg hover:bg-blue-200 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 mt-4">
                                            <span>Stock Batches ({productInventory.batches ? productInventory.batches.length : 0})</span>
                                            <ChevronUpIcon className={`${open ? '' : 'transform rotate-180'} w-5 h-5 text-blue-500`} />
                                        </Disclosure.Button>
                                        <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-500 bg-white border border-t-0 rounded-b-lg">
                                            <div className="space-y-3">
                                                {productInventory.batches && productInventory.batches.map((batch, batchIndex) => (
                                                    <div key={batch.batchId || batchIndex} className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                                                        <span className="font-semibold text-gray-800 text-xs truncate">Batch: {batch.batchId || `Batch ${batchIndex + 1}`} ({new Date(batch.dateAdded).toLocaleDateString()})</span>
                                                        <input type="number" value={batch.engraved || 0} onChange={e => handleBatchValueChange(p.id, batchIndex, 'engraved', e.target.value)} className="w-16 p-1 text-center border rounded-sm" placeholder="Engraved"/>
                                                        <input type="number" value={batch.unengraved || 0} onChange={e => handleBatchValueChange(p.id, batchIndex, 'unengraved', e.target.value)} className="w-16 p-1 text-center border rounded-sm" placeholder="Unengraved"/>
                                                        <input type="number" value={batch.defective || 0} onChange={e => handleBatchValueChange(p.id, batchIndex, 'defective', e.target.value)} className="w-16 p-1 text-center border rounded-sm" placeholder="Defective"/>
                                                        <button onClick={() => handleRemoveBatch(p.id, batchIndex)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon /></button>
                                                    </div>
                                                ))}
                                                <button onClick={() => handleAddBatch(p.id)} className="mt-2 px-3 py-1 bg-gray-200 text-sm rounded-md hover:bg-gray-300">Add New Batch Entry</button>
                                            </div>
                                        </Disclosure.Panel>
                                    </>
                                )}
                            </Disclosure>
                        </div>
                    )
                })}
            </div>
        </div>
    )
};
// ... (Other admin components are unchanged)
const AdminProductsView = ({products, onSave, onAdd, onDelete, showModal}) => {
    const [editingProduct, setEditingProduct] = useState(null);
    const [isAddingNew, setIsAddingNew] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        let displayOrder = Number(formData.get('displayOrder'));

        if (isAddingNew && isNaN(displayOrder)) {
            displayOrder = products.length > 0 ? Math.max(...products.map(p => p.displayOrder || 0)) + 1 : 1;
        } else if (!isAddingNew && isNaN(displayOrder)) {
             displayOrder = editingProduct.displayOrder;
        }

        const productData = {
            name: formData.get('name'),
            price: Number(formData.get('price')),
            description: formData.get('description'),
            image: formData.get('image'),
            displayOrder
        };

        if (isAddingNew) {
            await onAdd('products', productData)
        } else {
            await onSave('products', editingProduct.id, productData);
        }
        setEditingProduct(null);
        setIsAddingNew(false);
    };
    
    const handleDelete = (productId) => {
        showModal('Are you sure? This will delete the product and its inventory data.', async () => {
            await onDelete('products', productId);
            await onDelete('inventory', productId, false); 
        });
    };

    const sortedProducts = useMemo(() => {
        return [...products].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }, [products]);


    const formInitialData = editingProduct || (isAddingNew ? {name:'', price:0, description:'', image:'', displayOrder: products.length > 0 ? Math.max(...products.map(p => p.displayOrder || 0)) + 1 : 1} : null);

    if (formInitialData) { return (
        <div>
            <h2 className="text-2xl font-bold mb-4">{isAddingNew ? "Add New Product" : "Edit Product"}</h2>
            <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow space-y-4">
                <div>
                    <label className="font-semibold">Product Name</label>
                    <input name="name" defaultValue={formInitialData.name} className="w-full p-2 border rounded mt-1" required/>
                </div>
                <div>
                    <label className="font-semibold">Price</label>
                    <input name="price" type="number" defaultValue={formInitialData.price} className="w-full p-2 border rounded mt-1" required/>
                </div>
                <div>
                    <label className="font-semibold">Description</label>
                    <textarea name="description" defaultValue={formInitialData.description} className="w-full p-2 border rounded mt-1 h-24"></textarea>
                </div>
                <div>
                    <label className="font-semibold">Image URL</label>
                    <input name="image" defaultValue={formInitialData.image} className="w-full p-2 border rounded mt-1"/>
                </div>
                 <div>
                    <label className="font-semibold">Display Order</label>
                    <input name="displayOrder" type="number" defaultValue={formInitialData.displayOrder} className="w-full p-2 border rounded mt-1"/>
                    <p className="text-xs text-gray-500 mt-1">Products are ordered from smallest to largest display order.</p>
                </div>
                <div className="flex justify-between items-center">
                    {!isAddingNew && (
                         <button type="button" onClick={() => handleDelete(editingProduct.id)} className="px-4 py-2 bg-red-600 text-white rounded-md">Delete Product</button>
                    )}
                    <div className="flex justify-end space-x-2 w-full">
                        <button type="button" onClick={() => { setEditingProduct(null); setIsAddingNew(false); }} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save Changes</button>
                    </div>
                </div>
            </form>
        </div>
    ) }
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Product Management</h2>
                <button onClick={() => setIsAddingNew(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md">Add New Product</button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedProducts.map((p) => (
                            <tr key={p.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{p.displayOrder || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap flex items-center">
                                    <img src={p.image} className="w-10 h-10 object-cover rounded-md mr-4" alt={p.name} onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/40x40/cccccc/ffffff?text=?'; }}/>
                                    <p className="font-bold">{p.name}</p>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">J${p.price.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => setEditingProduct(p)} className="px-4 py-1 bg-gray-200 text-sm rounded-md">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
};
const AdminCouponsView = ({ coupons, onSave, onAdd, onDelete, showModal, products }) => {
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [appliesToOption, setAppliesToOption] = useState('all');
    const [selectedProductIds, setSelectedProductIds] = useState([]);

    useEffect(() => {
        if (editingCoupon) {
            if (Array.isArray(editingCoupon.appliesTo)) {
                setAppliesToOption('specific');
                setSelectedProductIds(editingCoupon.appliesTo);
            } else {
                setAppliesToOption('all');
                setSelectedProductIds([]);
            }
        } else {
            setAppliesToOption('all');
            setSelectedProductIds([]);
        }
    }, [editingCoupon]);


    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        let appliesToValue = 'all';
        if (appliesToOption === 'specific') {
            appliesToValue = selectedProductIds;
        }

        const couponData = {
            code: formData.get('code').toUpperCase(),
            type: formData.get('type'),
            value: Number(formData.get('value')),
            isActive: formData.get('isActive') === 'on',
            appliesTo: appliesToValue,
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
        };

        if (isAddingNew) {
            await onAdd('coupons', couponData)
        } else {
            await onSave('coupons', editingCoupon.id, couponData);
        }
        setEditingCoupon(null);
        setIsAddingNew(false);
    };

    const handleDelete = (couponId) => {
        showModal('Are you sure you want to delete this coupon?', () => {
             onDelete('coupons', couponId);
             setEditingCoupon(null);
             setIsAddingNew(false);
        });
    }

    const handleProductSelection = (productId) => {
        setSelectedProductIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const formInitialData = editingCoupon || (isAddingNew ? { code: '', type: 'percentage', value: 0, isActive: true, appliesTo: 'all', startDate: '', endDate: '' } : null);

    if (formInitialData) {
        return (
            <div>
                <h2 className="text-2xl font-bold mb-4">{isAddingNew ? "Add New Coupon" : "Edit Coupon"}</h2>
                <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow space-y-4">
                    <div>
                        <label className="font-semibold">Coupon Code</label>
                        <input name="code" defaultValue={formInitialData.code} className="w-full p-2 border rounded mt-1 uppercase" required/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="font-semibold">Type</label>
                            <select name="type" defaultValue={formInitialData.type} className="w-full p-2 border rounded mt-1">
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (J$)</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-semibold">Value</label>
                            <input name="value" type="number" defaultValue={formInitialData.value} className="w-full p-2 border rounded mt-1" required/>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="font-semibold">Start Date</label>
                            <input name="startDate" type="date" defaultValue={formInitialData.startDate} className="w-full p-2 border rounded mt-1" />
                        </div>
                        <div>
                            <label className="font-semibold">End Date</label>
                            <input name="endDate" type="date" defaultValue={formInitialData.endDate} className="w-full p-2 border rounded mt-1" />
                        </div>
                    </div>
                    <div>
                        <label className="font-semibold">Applies To</label>
                        <select
                            value={appliesToOption}
                            onChange={(e) => setAppliesToOption(e.target.value)}
                            className="w-full p-2 border rounded mt-1"
                        >
                            <option value="all">All Products (Store-wide)</option>
                            <option value="specific">Specific Products</option>
                        </select>
                        {appliesToOption === 'specific' && (
                            <div className="mt-2 border rounded-lg p-2 max-h-40 overflow-y-auto">
                                {products.map(p => (
                                    <label key={p.id} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedProductIds.includes(p.id)}
                                            onChange={() => handleProductSelection(p.id)}
                                            className="h-4 w-4"
                                        />
                                        <span>{p.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center">
                        <input name="isActive" type="checkbox" defaultChecked={formInitialData.isActive} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                        <label className="ml-2 block text-sm text-gray-900">Active</label>
                    </div>
                    <div className="flex justify-between items-center">
                        {!isAddingNew && (
                            <button type="button" onClick={() => handleDelete(editingCoupon.id)} className="px-4 py-2 bg-red-600 text-white rounded-md">Delete Coupon</button>
                        )}
                        <div className="flex justify-end space-x-2 w-full">
                            <button type="button" onClick={() => { setEditingCoupon(null); setIsAddingNew(false); }} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save Changes</button>
                        </div>
                    </div>
                </form>
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Coupon Management</h2>
                <button onClick={() => setIsAddingNew(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md">Add New Coupon</button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applies To</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {coupons.map(c => (
                            <tr key={c.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-mono">{c.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap capitalize">{c.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{c.type === 'percentage' ? `${c.value}%` : `J$${c.value.toLocaleString()}`}</td>
                                <td className="px-6 py-4">
                                    {c.appliesTo === 'all' ? 'Store-wide' : (Array.isArray(c.appliesTo) && c.appliesTo.length > 0 ? `${c.appliesTo.length} Products` : 'N/A')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {c.startDate && new Date(c.startDate).toLocaleDateString()}
                                    {c.startDate && c.endDate && ' - '}
                                    {c.endDate && new Date(c.endDate).toLocaleDateString()}
                                    {!c.startDate && !c.endDate && 'Always Active'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {c.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => setEditingCoupon(c)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
};
const AdminInsightsView = ({ orders }) => {

    const getCurrentMonthDateRange = () => {
        const date = new Date();
        const from = new Date(date.getFullYear(), date.getMonth(), 1);
        const to = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return {
            from: from.toISOString().split('T')[0],
            to: to.toISOString().split('T')[0]
        };
    };

    const [dateRange, setDateRange] = useState(getCurrentMonthDateRange());
    
    const { reportData } = useMemo(() => {
        const from = new Date(dateRange.from).setHours(0,0,0,0);
        const to = new Date(dateRange.to).setHours(23,59,59,999);

        const filtered = !dateRange.from || !dateRange.to
            ? orders
            : orders.filter(order => {
                const orderDate = new Date(order.createdAt).getTime();
                return orderDate >= from && orderDate <= to;
            });

        const data = {
            totalIncome: 0, sales: 0,
            returnedValue: 0, refundedValue: 0,
            popularProducts: {}
        };

        filtered.forEach(order => {
            const orderQty = Object.values(order.items).reduce((sum, i) => sum + i.quantity, 0);
            
            if (order.paymentStatus === 'Paid' && order.fulfillmentStatus !== 'Cancelled') {
                data.totalIncome += order.total;
                data.sales += orderQty;
                 Object.values(order.items).forEach(item => {
                    data.popularProducts[item.name] = (data.popularProducts[item.name] || 0) + item.quantity;
                 });
            }
            if (order.fulfillmentStatus === 'Returned') {
                data.returnedValue += order.total;
            }
            if (order.paymentStatus === 'Refunded') {
                data.refundedValue += order.total;
            }
        });

        return {
            reportData: {
                ...data,
                popularProductsChartData: Object.entries(data.popularProducts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5) // Top 5
            }
        };
    }, [orders, dateRange]);

    const handleExport = () => {
        const headers = ["Order ID", "Date", "Customer", "Items", "Subtotal", "Discount", "Shipping", "Total", "Payment Status", "Fulfillment Status"];
        
        const from = new Date(dateRange.from).setHours(0,0,0,0);
        const to = new Date(dateRange.to).setHours(23,59,59,999);

        const filtered = !dateRange.from || !dateRange.to
            ? orders
            : orders.filter(order => {
                const orderDate = new Date(order.createdAt).getTime();
                return orderDate >= from && orderDate <= to;
            });

        const rows = filtered.map(order => {
            const orderDate = new Date(order.createdAt);
            const itemsString = Object.values(order.items).map(i => `${i.quantity}x ${i.name}`).join('; ');

            return [
                order.id,
                orderDate.toLocaleDateString(),
                order.customerInfo.name.replace(/,/g, ''),
                `"${itemsString}"`,
                order.subtotal || 0,
                order.discount || 0,
                order.fulfillmentCost || 0,
                order.total,
                order.paymentStatus,
                order.fulfillmentStatus
            ].join(',');
        });

        const csvString = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `byot_report_${dateRange.from}_to_${dateRange.to}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Insights & Analytics</h2>

            <div className="p-4 bg-white rounded-lg shadow mb-6">
                <h3 className="font-bold mb-4">Export Report</h3>
                <div className="flex items-end gap-4 flex-wrap">
                    <div>
                        <label className="text-sm font-medium">From</label>
                        <input type="date" value={dateRange.from} onChange={e => setDateRange(prev => ({...prev, from: e.target.value}))} className="w-full p-2 border rounded-md mt-1"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium">To</label>
                        <input type="date" value={dateRange.to} onChange={e => setDateRange(prev => ({...prev, to: e.target.value}))} className="w-full p-2 border rounded-md mt-1"/>
                    </div>
                    <button onClick={handleExport} disabled={!dateRange.from || !dateRange.to} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400">Export CSV</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="text-gray-500">Total Income</h3>
                    <p className="text-3xl font-bold">J${reportData.totalIncome.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="text-gray-500">Sales (Period)</h3>
                    <p className="text-3xl font-bold">{reportData.sales}</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="text-gray-500">Returned Value</h3>
                    <p className="text-3xl font-bold text-orange-500">J${reportData.returnedValue.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="text-gray-500">Refunded Value</h3>
                    <p className="text-3xl font-bold text-red-500">J${reportData.refundedValue.toLocaleString()}</p>
                </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow mb-6">
                <h3 className="font-bold mb-4">Most Popular Products (Period)</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={reportData.popularProductsChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={80} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" name="Units Sold" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
};


// ==================================================
// 7. MAIN APP & ROOT COMPONENT
// ==================================================
const App = () => {
    const { view, setView, toastMessage, toastType, showToast } = useContext(AppContext);
    const { isAdminMode, handleLogin, handleLogout } = useContext(AuthContext);

    const renderContent = () => {
        if (isAdminMode) {
            return <AdminDashboard onLogout={() => handleLogout(setView)} />;
        }
        switch (view) {
            case 'shop': return <ShopView />; 
            case 'cart': return <CartView onGoToCheckout={() => setView('checkout')} onBack={() => setView('shop')} showToast={showToast}/>; 
            case 'checkout': return <CheckoutView onBack={() => setView('cart')} showToast={showToast} />;
            case 'confirmation': return <ConfirmationView order={useContext(AppContext).orderData} onContinue={() => setView('shop')} />;
            case 'payment': return <CreditCardView order={useContext(AppContext).orderData} onBack={() => { setView('checkout'); }} />;
            case 'about': return <AboutView onBack={() => setView('shop')} />;
            case 'admin': return <AdminLoginView onLogin={(email, password) => handleLogin(email, password, showToast)} />;
            default: return <div className="view active justify-center items-center"><p>Loading...</p></div>;
        }
    };

    return (
        <div className="bg-gray-100 flex items-center justify-center p-0 md:p-4 h-screen w-screen">
             <GlobalStyles />
             <div className={`absolute top-0 left-1/2 -translate-x-1/2 mt-4 text-white text-center py-2 px-6 rounded-full shadow-lg transform z-50 transition-all duration-300 ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-20'} ${toastType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                {toastMessage}
            </div>

             {isAdminMode ? (
                 <div className="w-full h-full bg-gray-200">
                    {renderContent()}
                 </div>
             ) : (
                <div className="app-shell">
                    {renderContent()}
                    <nav className="bg-white/80 backdrop-blur-lg border-t border-gray-200 flex-shrink-0">
                        <div className="flex justify-around h-20">
                             <button onClick={() => setView('shop')} className={`flex flex-col items-center justify-center w-full ${view === 'shop' ? 'text-blue-600' : 'text-gray-500'}`}><HomeIcon /><span className="text-xs font-medium">Shop</span></button>
                             <CartButtonWithCount setView={setView} view={view}/>
                            <button onClick={() => setView('about')} className={`flex flex-col items-center justify-center w-full ${view === 'about' ? 'text-blue-600' : 'text-gray-500'}`}><InfoIcon /><span className="text-xs font-medium">About</span></button>
                            <button onClick={() => setView('admin')} className={`flex flex-col items-center justify-center w-full ${view === 'admin' ? 'text-blue-600' : 'text-gray-500'}`}><UserIcon /><span className="text-xs font-medium">Account</span></button>
                        </div>
                    </nav>
                </div>
             )}
        </div>
    );
};

const CartButtonWithCount = ({setView, view}) => {
    const { cartCount } = useContext(CartContext);
    return (
        <button onClick={() => setView('cart')} className={`flex flex-col items-center justify-center w-full relative ${view === 'cart' ? 'text-blue-600' : 'text-gray-500'}`}>
            <CartIcon />
            <span className="text-xs font-medium">Cart</span>
            {cartCount > 0 && <span className="absolute top-4 right-8 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{cartCount}</span>}
        </button>
    );
}

export default function AppWrapper() {
  return (
    <AuthProvider>
        <AppProvider>
            <ModalProvider>
                <DataProvider>
                    <CartProvider>
                        <App />
                    </CartProvider>
                </DataProvider>
            </ModalProvider>
        </AppProvider>
      </AuthProvider>
  );
}
