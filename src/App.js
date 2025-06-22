/* global __firebase_config, __app_id, __initial_auth_token */

import React, { useState, useEffect, useMemo, useRef, useContext, createContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Disclosure } from '@headlessui/react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, signInAnonymously, signInWithCustomToken } from "firebase/auth";
import { getFirestore, collection, onSnapshot, addDoc, doc, deleteDoc, writeBatch, setDoc, query } from "firebase/firestore";

// ==================================================
// 1. SETUP & CONFIGURATION
// ==================================================

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
// 2. CONTEXTS, PROVIDERS & HELPER FUNCTIONS
// ==================================================

const AuthContext = createContext(null);
const AppContext = createContext(null);
const DataContext = createContext(null);
const CartContext = createContext(null);
const ModalContext = createContext(null); 

const useModal = () => useContext(ModalContext);

const copyToClipboard = (text, showToast) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; 
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        showToast('Bank info copied to clipboard!');
    } catch (err) {
        showToast('Failed to copy text.', 'error');
    }
    document.body.removeChild(textArea);
};

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
// 3. ICON & UI COMPONENTS
// ==================================================
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const CartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const ArrowDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>;
const BackArrowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const TicketIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ticket"><path d="M2 9a3 3 0 0 1 0 6v1a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-1a3 3 0 0 1 0-6V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.75 13.96c.25.13.43.2.5.33.08.13.12.28.12.48 0 .2-.04.38-.12.53s-.17.28-.3.4-.28.2-.45.28-.35.13-.53.13c-.18 0-.38-.04-.58-.13s-.43-.2-.65-.35-.45-.3-.68-.5-.45-.4-.68-.63c-.23-.23-.45-.48-.65-.75s-.38-.5-.53-.75c-.15-.25-.23-.5-.23-.78 0-.28.08-.53.23-.75s.33-.4.53-.53.4-.2.6-.23c.2-.03.4-.04.6-.04.2 0 .4.03.58.08s.35.13.5.22.28.2.4.33.2.25.25.4c.05.14.08.3.08.48s-.03.33-.08.45-.13.25-.23.38c-.1.13-.23.25-.38.38s-.3.25-.45.35-.3.18-.45.25c-.15.08-.3.12-.43.12-.13 0-.25-.02-.38-.08s-.25-.12-.35-.22-.2-.2-.28-.3c-.08-.1-.12-.23-.12-.38 0-.15.04-.28.12-.4.08-.12.2-.23.35-.32.15-.1.3-.15.48-.15.18 0 .35.04.5.13.15.08.3.2.43.32zM12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path></svg>;
const ClipboardListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><line x1="12" y1="11" x2="12" y2="16"></line><line x1="9.5" y1="13.5" x2="14.5" y2="13.5"></line></svg>;
const PackageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10V6a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 6v4"></path><path d="M21 10v4a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 14v-4"></path><path d="m3.29 7 8.71 5 8.71-5"></path><path d="M12 22V12"></path></svg>;
const TagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29a2.41 2.41 0 0 0 3.42 0L22 13.42a2.41 2.41 0 0 0 0-3.42z"></path><circle cx="7" cy="7" r="1"></circle></svg>;
const BarChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>;
const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;
const ChevronUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>;

const GlobalStyles = () => ( <style>{` body { background-color: #f3f4f6; } .app-shell { display: flex; flex-direction: column; height: 100%; max-height: 900px; width: 100%; max-width: 420px; margin: auto; border-radius: 2rem; overflow: hidden; box-shadow: 0 10px 50px rgba(0,0,0,0.2); } .view { flex-grow: 1; display: none; flex-direction: column; overflow: hidden; } .view.active { display: flex; } .feed { flex-grow: 1; overflow-y: auto; scroll-snap-type: y mandatory; } .card { height: 100%; flex-shrink: 0; scroll-snap-align: start; display: flex; flex-direction: column; justify-content: flex-end; padding: 1.5rem; color: white; position: relative; background-size: cover; background-position: center; } .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0) 100%); z-index: 1; } .card-content { position: relative; z-index: 2; } .scroll-arrow { position: absolute; bottom: 7rem; left: 50%; animation: bounce 2.5s infinite; z-index: 2; } @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translate(-50%, 0); } 40% { transform: translate(-50%, -20px); } 60% { transform: translate(-50%, -10px); } } input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; } input[type="number"] { -moz-appearance: textfield; } `}</style> );


// ==================================================
// 4. MAIN APPLICATION COMPONENTS
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
             {products.length === 0 && inventoryLoaded ? (
                 <div className="card bg-gray-700">
                     <div className="card-content flex flex-col items-center justify-center text-center h-full">
                         <p className="text-lg font-semibold">No products available.</p>
                         <p className="text-sm text-gray-300">Please check your Firebase products collection or admin settings.</p>
                     </div>
                 </div>
             ) : products.length === 0 && !inventoryLoaded ? (
                <div className="card bg-gray-700">
                    <div className="card-content flex flex-col items-center justify-center text-center h-full">
                         <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4"></div>
                         <p className="text-lg font-semibold">Loading Products...</p>
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
const AboutView = ({ onBack }) => { return ( <div className="view active bg-white"> <header className="flex-shrink-0 bg-white shadow-sm p-4 flex items-center justify-between"><button onClick={onBack} className="p-2"><BackArrowIcon /></button><h1 className="text-xl font-bold">About Us</h1><div className="w-10"></div></header> <main className="flex-grow overflow-y-auto p-6 flex flex-col items-center justify-center text-center"> <img src="https://esiromfoundation.org/wp-content/uploads/2023/12/esirom-foundation-logo-icon.jpg" alt="Esirom Foundation Logo" className="h-24 w-auto mx-auto"/> <p className="mt-4 text-gray-600 max-w-sm">Bring Yuh Owna Tings (BYOT) is a movement to cut back on single-use plastics by making reusables part of everyday life. Our reusable utensil sets come with a fork, spoon, knife, and chopsticks in a compact case, perfect for life on the go. They come in a range of colours and can be customized with your name or logo.</p><p className="mt-4 text-gray-600 max-w-sm">The campaign is led by the Esirom Foundation, a Jamaican non-profit focused on solving environmental challenges in real, practical ways. We first kicked things off in December 2022 with our "Bring Your Own Cup" campaign where cafes across Kingston, including Cafe Blue and Starbucks, offered discounts to customers who brought their own reusable cup.</p><p className="mt-4 text-gray-600 max-w-sm">In January 2024, the campaign relaunched as BYOT with a wider push for all reusables. From containers and bottles, to thermoses and tumblers. So in April 2024, we launched our BYOT utensil sets, giving people a simple, tangible way to live the message, not just hear it.</p> </main> </div> ) }
const AdminLoginView = ({ onLogin, showToast }) => { const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const handleLogin = (e) => { e.preventDefault(); onLogin(email, password, showToast); }; return( <div className="view active bg-gray-100 p-4 justify-center"> <form onSubmit={handleLogin} className="w-full max-w-sm mx-auto bg-white p-8 rounded-lg shadow-md space-y-6"> <h2 className="text-2xl font-bold text-center">Admin Login</h2> <div><label className="block mb-1 font-semibold">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded" required/></div> <div><label className="block mb-1 font-semibold">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" required/></div> <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Login</button> </form> </div> ); };

// ... (Rest of Admin components follow)
// ... (The corrected file will have the rest of the components)

// ==================================================
// 5. ROOT COMPONENT
// ==================================================
function App() {
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
