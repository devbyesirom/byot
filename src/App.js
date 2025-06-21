import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut 
} from "firebase/auth";
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    doc, 
    deleteDoc,
    query,
    where,
    getDocs
} from "firebase/firestore";


// --- Firebase Configuration ---
const firebaseConfig = {
   apiKey: "AIzaSyCBv6J7ZInJ2-CX57ksZDjpmLqvO8sgJuQ",
   authDomain: "byot-40fe2.firebaseapp.com",
   projectId: "byot-40fe2",
   storageBucket: "byot-40fe2.appspot.com",
   messagingSenderId: "643015540811",
   appId: "1:643015540811:web:f8b609d7b2e6408607cdce",
   measurementId: "G-S8QD6WWN90"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- SVGs as React Components ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const CartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const ArrowDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>;
const BackArrowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="pointer-events-none" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const TicketIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ticket"><path d="M2 9a3 3 0 0 1 0 6v1a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-1a3 3 0 0 1 0-6V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const XCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.75 13.96c.25.13.43.2.5.33.08.13.12.28.12.48 0 .2-.04.38-.12.53s-.17.28-.3.4-.28.2-.45.28-.35.13-.53.13c-.18 0-.38-.04-.58-.13s-.43-.2-.65-.35-.45-.3-.68-.5-.45-.4-.68-.63c-.23-.23-.45-.48-.65-.75s-.38-.5-.53-.75c-.15-.25-.23-.5-.23-.78 0-.28.08-.53.23-.75s.33-.4.53-.53.4-.2.6-.23c.2-.03.4-.04.6-.04.2 0 .4.03.58.08s.35.13.5.22.28.2.4.33.2.25.25.4c.05.14.08.3.08.48s-.03.33-.08.45-.13.25-.23.38c-.1.13-.23.25-.38.38s-.3.25-.45.35-.3.18-.45.25c-.15.08-.3.12-.43.12-.13 0-.25-.02-.38-.08s-.25-.12-.35-.22-.2-.2-.28-.3c-.08-.1-.12-.23-.12-.38 0-.15.04-.28.12-.4.08-.12.2-.23.35-.32.15-.1.3-.15.48-.15.18 0 .35.04.5.13.15.08.3.2.43.32zM12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path></svg>;
const ClipboardListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><line x1="12" y1="11" x2="12" y2="16"></line><line x1="9.5" y1="13.5" x2="14.5" y2="13.5"></line></svg>;
const PackageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10V6a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 6v4"></path><path d="M21 10v4a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 14v-4"></path><path d="m3.29 7 8.71 5 8.71-5"></path><path d="M12 22V12"></path></svg>;
const TagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29a2.41 2.41 0 0 0 3.42 0L22 13.42a2.41 2.41 0 0 0 0-3.42z"></path><circle cx="7" cy="7" r="1"></circle></svg>;
const BarChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;

const DELIVERY_OPTIONS = { 'Kingston (10, 11)': 700, 'Portmore': 800 };
const KNUTSFORD_FEE = 500;
const KNUTSFORD_LOCATIONS = ["Angels (Spanish Town)", "Drax Hall", "Falmouth", "Gutters", "Harbour View", "New Kingston", "Luana", "Lucea", "Mandeville", "May Pen", "Montego Bay (Pier 1)", "Montego Bay Airport", "Negril", "Ocho Rios", "Port Antonio", "Port Maria", "Portmore", "Savanna-La-Mar", "Washington Boulevard"];
const PICKUP_TIMES = ["10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM", "12:00 PM - 1:00 PM", "1:00 PM - 2:00 PM", "2:00 PM - 3:00 PM", "3:00 PM - 4:00 PM"];

const GlobalStyles = () => ( <style>{` .app-shell { display: flex; flex-direction: column; height: 100%; max-height: 900px; width: 100%; max-width: 420px; margin: auto; border-radius: 2rem; overflow: hidden; box-shadow: 0 10px 50px rgba(0,0,0,0.2); } .view { flex-grow: 1; display: none; flex-direction: column; overflow: hidden; } .view.active { display: flex; } .feed { flex-grow: 1; overflow-y: scroll; scroll-snap-type: y mandatory; } .card { height: 100%; flex-shrink: 0; scroll-snap-align: start; display: flex; flex-direction: column; justify-content: flex-end; padding: 1.5rem; color: white; position: relative; background-size: cover; background-position: center; } .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0) 100%); z-index: 1; } .card-content { position: relative; z-index: 2; } .scroll-arrow { position: absolute; bottom: 7rem; left: 50%; animation: bounce 2.5s infinite; z-index: 2; } @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translate(-50%, 0); } 40% { transform: translate(-50%, -20px); } 60% { transform: translate(-50%, -10px); } } input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; } input[type="number"] { -moz-appearance: textfield; } `}</style> );

// --- View Components (Customer Facing) ---
const ShopView = ({ products, onAddToCart, onBuyNow, setBgGradient, inventory }) => { // Added inventory prop
    const feedRef = useRef(null); 
    useEffect(() => { 
        const feedEl = feedRef.current; 
        if (!feedEl) return; 
        let scrollTimeout; 
        const handleScroll = () => { 
            clearTimeout(scrollTimeout); 
            scrollTimeout = setTimeout(() => { 
                const feedHeight = feedEl.clientHeight; 
                const currentIndex = Math.round(feedEl.scrollTop / feedHeight); 
                const currentCard = feedEl.children[currentIndex]; 
                if(currentCard){ 
                    const { colorStart, colorEnd } = currentCard.dataset; 
                    if (colorStart && colorEnd) { 
                        document.body.style.background = `linear-gradient(to bottom, ${colorStart}, ${colorEnd})`; 
                    } 
                } 
            }, 50); 
        }; 
        feedEl.addEventListener('scroll', handleScroll); 
        return () => feedEl.removeEventListener('scroll', handleScroll); 
    }, [products, setBgGradient]); 
    
    const ProductCard = ({ product, onAddToCart, onBuyNow, inventory }) => { // Added inventory prop
        const [quantity, setQuantity] = useState(1);
        const availableStock = inventory[product.id]?.unengravedStock || 0; // Assuming customer buys unengraved stock

        // Enforce quantity limits on change directly
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
                alert("Please select a quantity greater than 0.");
                return;
            }
            if (quantity > availableStock) {
                // This case should ideally be prevented by min/max and stepper, but as a fallback
                alert(`Only ${availableStock} of ${product.name} are available. Adding max available to cart.`);
                onAddToCart(product, availableStock); 
            } else {
                onAddToCart(product, quantity);
            }
        };

        const handleBuyNowClick = () => {
            if (quantity === 0) {
                alert("Please select a quantity greater than 0.");
                return;
            }
            if (quantity > availableStock) {
                // This case should ideally be prevented by min/max and stepper, but as a fallback
                alert(`Only ${availableStock} of ${product.name} are available. Proceeding with max available.`);
                onBuyNow(product, availableStock); 
            } else {
                onBuyNow(product, quantity);
            }
        };

        return ( 
            <div className="card" style={{backgroundImage: `url('${product.image}')`}} data-color-start={product.colorStart} data-color-end={product.colorEnd}> 
                <div className="card-content"> 
                    <h2 className="text-3xl font-bold">{product.name}</h2> 
                    <p className="text-lg font-medium text-gray-200">J${product.price.toLocaleString()}</p> 
                    {availableStock <= 15 && availableStock > 0 && ( // Display warning if stock is low but not zero
                        <p className="text-sm text-yellow-300 font-semibold mt-1">Low stock! Only {availableStock} left.</p>
                    )}
                    {availableStock === 0 && ( // Display out of stock message
                        <p className="text-sm text-red-400 font-semibold mt-1">Out of Stock!</p>
                    )}
                    <div className="flex items-center bg-white/20 rounded-lg mt-4 w-fit"> 
                        <button onClick={() => handleQuantityStepperChange(-1)} className="p-2 text-white" disabled={quantity <= 1 || availableStock === 0}>-</button> 
                        <input 
                            type="number" 
                            className="w-12 bg-transparent text-white text-center font-bold" 
                            value={quantity} 
                            onChange={handleQuantityInputChange} // Allow direct input but validate
                            min="1" 
                            max={availableStock} 
                            disabled={availableStock === 0} // Disable input if out of stock
                        /> 
                        <button onClick={() => handleQuantityStepperChange(1)} className="p-2 text-white" disabled={quantity >= availableStock}>+</button> 
                    </div> 
                    <div className="flex items-center space-x-2 mt-4"> 
                        <button 
                            onClick={handleAddToCartClick} 
                            className="w-full bg-white/30 backdrop-blur-sm text-white font-bold py-3 rounded-lg text-lg"
                            disabled={availableStock === 0 || quantity === 0} // Disable if out of stock or quantity is 0
                        >
                            Add to Cart
                        </button> 
                        <button 
                            onClick={handleBuyNowClick} 
                            className={`w-full bg-white ${product.buttonTextColor} font-bold py-3 rounded-lg text-lg shadow-lg`}
                            disabled={availableStock === 0 || quantity === 0} // Disable if out of stock or quantity is 0
                        >
                            Buy Now
                        </button> 
                    </div> 
                </div> 
            </div> 
        ); 
    }; 
    return( 
        <main ref={feedRef} className="feed"> 
            <div className="card justify-center text-center" style={{backgroundImage: "url('https://esirom.com/wp-content/uploads/2025/06/byot-hero-new-rob.png')"}} data-color-start="#111827" data-color-end="#374151"> 
                <div className="card-content"> 
                    {/* Adjusted text size for "Bring Yuh Owna Tings" to fit on one line */}
                    <h1 className="text-4xl font-extrabold text-white drop-shadow-md whitespace-nowrap">Bring Yuh Owna Tings</h1> 
                    <p className="text-lg text-gray-200 mt-2">Reusable Utensil Sets for Everyday Use</p> 
                </div> 
                {/* Adjusted arrow position and made it clickable to scroll */}
                <button 
                    className="scroll-arrow absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white" 
                    onClick={() => {
                        if (feedRef.current) {
                            // Scroll past the current card to reveal the first product card
                            feedRef.current.scrollTo({
                                top: feedRef.current.clientHeight, 
                                behavior: 'smooth'
                            });
                        }
                    }}
                >
                    <ArrowDownIcon />
                </button> 
            </div> 
            {products.map((product) => ( 
                <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onBuyNow={onBuyNow} inventory={inventory} /> // Pass inventory to ProductCard
            ))} 
        </main> 
    ); 
};
const CartView = ({ cart, updateCartQuantity, removeFromCart, onGoToCheckout, onBack, inventory }) => { // Added inventory prop
    const subtotal = useMemo(() => Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]); 
    
    // Updated updateCartQuantity to respect available stock
    const handleUpdateCartQuantityWithStock = (id, newQuantity) => {
        const productInInventory = inventory[id];
        const availableStock = productInInventory ? productInInventory.unengravedStock : 0;
        
        let quantityToSet = newQuantity;
        if (newQuantity < 1) {
            quantityToSet = 1; // Minimum quantity is 1 unless removed
        }
        if (newQuantity > availableStock) {
            alert(`Only ${availableStock} of this item are available. Quantity capped to ${availableStock}.`);
            quantityToSet = availableStock;
        }

        updateCartQuantity(id, quantityToSet);
    };

    return ( 
        <div className="view active bg-gray-100"> 
            <header className="flex-shrink-0 bg-white shadow-sm p-4 flex items-center justify-between"><button onClick={onBack} className="p-2"><BackArrowIcon /></button><h1 className="text-xl font-bold">My Cart</h1><div className="w-10"></div></header> 
            <main className="flex-grow overflow-y-auto p-4 space-y-4"> 
                {Object.keys(cart).length === 0 ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500">
                        <CartIcon /><p className="text-lg font-semibold mt-4">Your cart is empty</p>
                    </div>
                ) : (
                    Object.values(cart).map(item => ( 
                        <div key={item.id} className="flex items-center bg-white p-2 rounded-lg shadow"> 
                            <img src={item.image} className="w-16 h-16 object-cover rounded-md mr-4" alt={item.name}/> 
                            <div className="flex-grow"><p className="font-bold">{item.name}</p><p className="text-gray-600">J${item.price.toLocaleString()}</p></div> 
                            <input 
                                type="number" 
                                value={item.quantity || 0} // Ensure value is a number, default to 0
                                onChange={(e) => handleUpdateCartQuantityWithStock(item.id, parseInt(e.target.value))} 
                                className="w-12 text-center border rounded-md mx-2" 
                                min="1"
                                max={inventory[item.id]?.unengravedStock || 0} // Set max based on available inventory
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
const CheckoutView = ({ cart, subtotal, placeOrder, onBack, coupons, showToast }) => {
    const [fulfillmentMethod, setFulfillmentMethod] = useState('pickup');
    const [bearerLocation, setBearerLocation] = useState(Object.keys(DELIVERY_OPTIONS)[0]);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [pickupDate, setPickupDate] = useState('');
    const [pickupTime, setPickupTime] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);

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
        if (appliedCoupon.type === 'percentage') {
            return subtotal * (appliedCoupon.value / 100);
        }
        if (appliedCoupon.type === 'fixed') {
            return appliedCoupon.value;
        }
        return 0;
    }, [appliedCoupon, subtotal]);

    const total = subtotal + fulfillmentCost - discount;
    
    const handleApplyCoupon = () => {
        const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.isActive);
        if(coupon) {
            setAppliedCoupon(coupon);
            showToast('Coupon applied!', 'success');
        } else {
            showToast('Invalid or inactive coupon.', 'error');
            setAppliedCoupon(null);
        }
    };

    const handleCopyBankInfo = () => {
        const bankInfo = `Company: Esirom Foundation Limited\nBank: Scotiabank\nBranch: Oxford Road\nAccount #: 846837, SAVINGS (JMD Account)`;
        const textArea = document.createElement("textarea");
        textArea.value = bankInfo;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('Bank info copied to clipboard!');
        } catch (err) {
            showToast('Failed to copy text.', 'error');
        }
        document.body.removeChild(textArea);
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const fullName = formData.get('fullName');
        const email = formData.get('email');
        const phone = formData.get('phone');
        const knutsfordLocation = formData.get('knutsford_location');

        placeOrder({
            customerInfo: { name: fullName, email, phone },
            items: cart,
            subtotal,
            fulfillmentCost,
            discount,
            total,
            couponUsed: appliedCoupon ? appliedCoupon.code : null,
            fulfillmentMethod,
            paymentMethod,
            pickupDate: fulfillmentMethod === 'pickup' ? pickupDate : null, 
            pickupTime: fulfillmentMethod === 'pickup' ? pickupTime : null,
            knutsfordLocation: fulfillmentMethod === 'knutsford' ? knutsfordLocation : null,
            bearerLocation: fulfillmentMethod === 'bearer' ? bearerLocation : null,
        });
    };

    // Function to get the next weekday date
    const getNextWeekday = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        // If Sunday (0) or Saturday (6), advance to next Monday
        if (day === 0) d.setDate(d.getDate() + 1); 
        else if (day === 6) d.setDate(d.getDate() + 2); 
        return d.toISOString().split('T')[0];
    };

    // Function to handle date change and ensure it's a weekday
    const handleDateChange = (e) => {
        const selectedDateValue = e.target.value;
        if (!selectedDateValue) { // Allow clearing the date input
            setPickupDate('');
            return;
        }
        const selectedDate = new Date(selectedDateValue);
        const dayOfWeek = selectedDate.getDay(); // Sunday - 0, Monday - 1, ..., Saturday - 6

        if (dayOfWeek === 0 || dayOfWeek === 6) { 
            alert("Pickups are only available Monday - Friday. Please select a weekday.");
            setPickupDate(''); // Clear the invalid date visually in the input
        } else {
            setPickupDate(selectedDateValue);
        }
    };

    // Get today's date in 'YYYY-MM-DD' format for min attribute, ensuring it's a weekday
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
                    {/* Coupon Code Section */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-2">Coupon Code</h2>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                placeholder="Enter coupon code"
                                className="w-full p-3 border rounded-lg"
                                disabled={!!appliedCoupon}
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
                        {appliedCoupon && (
                             <p className="text-green-600 text-sm mt-2">
                                 Coupon "{appliedCoupon.code}" applied! You saved J${discount.toLocaleString()}
                                 <button onClick={() => {setAppliedCoupon(null); setCouponCode('')}} className="ml-2 text-red-500 font-bold">[Remove]</button>
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
                <button type="submit" form="checkout-form" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-lg">Place Order</button>
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
            <p className="text-gray-600">Your order <span className="font-bold">#{id}</span> has been placed.</p>
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
                {/* Only show WhatsApp button if bank transfer is selected */}
                {paymentMethod === 'bank_transfer' && (
                    <a href="https://api.whatsapp.com/send?phone=18764365244" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg mt-4"><WhatsAppIcon /> <span className="ml-2">Upload Receipt to WhatsApp</span></a>
                )}
            </div>
            <button onClick={onContinue} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-lg">Continue Shopping</button>
        </div>
    );
};
const CreditCardView = ({ order, onBack }) => { const totalQuantity = Object.values(order.items).reduce((sum, item) => sum + item.quantity, 0); const paymentUrl = totalQuantity === 1 ? "https://secure.ezeepayments.com/?CQY6un2" : "https://secure.ezeepayments.com/?kgRMTcZ"; return ( <div className="view active bg-gray-100"> <header className="flex-shrink-0 bg-white shadow-sm p-4 flex items-center justify-between"><button onClick={onBack} className="p-2"><BackArrowIcon /></button><h1 className="text-xl font-bold">Complete Payment</h1><div className="w-10"></div></header> <iframe title="Credit Card Payment" src={paymentUrl} className="w-full h-full border-0"></iframe> </div> ) };
const AboutView = ({ onBack }) => { return ( <div className="view active bg-white"> <header className="flex-shrink-0 bg-white shadow-sm p-4 flex items-center justify-between"><button onClick={onBack} className="p-2"><BackArrowIcon /></button><h1 className="text-xl font-bold">About Us</h1><div className="w-10"></div></header> <main className="flex-grow overflow-y-auto p-6 flex flex-col items-center justify-center text-center"> <img src="https://esiromfoundation.org/wp-content/uploads/2023/12/esirom-foundation-logo-icon.jpg" alt="Esirom Foundation Logo" className="h-24 w-auto mx-auto"/> <p className="mt-4 text-gray-600 max-w-sm">Bring Yuh Owna Tings (BYOT) is a movement to cut back on single-use plastics by making reusables part of everyday life. Our reusable utensil sets come with a fork, spoon, knife, and chopsticks in a compact case, perfect for life on the go. They come in a range of colours and can be customized with your name or logo.</p><p className="mt-4 text-gray-600 max-w-sm">The campaign is led by the Esirom Foundation, a Jamaican non-profit focused on solving environmental challenges in real, practical ways. We first kicked things off in December 2022 with our "Bring Your Own Cup" campaign where cafes across Kingston, including Cafe Blue and Starbucks, offered discounts to customers who brought their own reusable cup.</p><p className="mt-4 text-gray-600 max-w-sm">In January 2024, the campaign relaunched as BYOT with a wider push for all reusables. From containers and bottles, to thermoses and tumblers. So in April 2024, we launched our BYOT utensil sets, giving people a simple, tangible way to live the message, not just hear it.</p> </main> </div> ) }

// --- Admin Components ---
const AdminLoginView = ({ onLogin }) => { const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const handleLogin = (e) => { e.preventDefault(); onLogin(email, password); }; return( <div className="view active bg-gray-100 p-4 justify-center"> <form onSubmit={handleLogin} className="w-full max-w-sm mx-auto bg-white p-8 rounded-lg shadow-md space-y-6"> <h2 className="text-2xl font-bold text-center">Admin Login</h2> <div><label className="block mb-1 font-semibold">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded" required/></div> <div><label className="block mb-1 font-semibold">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" required/></div> <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Login</button> </form> </div> ); };
const AdminDashboard = ({ onLogout, orders, products, inventory, coupons, costBatches, setProducts, setInventory, setOrders, setCoupons, setCostBatches, showToast }) => {
    const [adminView, setAdminView] = useState('orders');
    const inventoryRef = useRef(inventory);
    useEffect(() => { inventoryRef.current = inventory; }, [inventory]);

    return (
        <div className="view active bg-gray-200 flex-col">
            <aside className="w-full bg-gray-800 text-white flex-shrink-0 lg:h-16 lg:flex lg:flex-row lg:items-center lg:justify-between">
                 <div className="p-4 font-bold border-b border-gray-700 lg:border-b-0 lg:p-0 lg:ml-6 hidden lg:block">Admin Panel</div>
                 <nav className="p-2 flex-grow flex flex-col justify-around lg:flex-grow-0 lg:flex-row lg:justify-center lg:space-x-6">
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
                    {adminView === 'orders' && <AdminOrdersView orders={orders} setOrders={setOrders} showToast={showToast} inventory={inventoryRef} setInventory={setInventory} />}
                    {adminView === 'inventory' && <AdminInventoryView inventory={inventory} setInventory={setInventory} products={products} showToast={showToast} />}
                    {adminView === 'products' && <AdminProductsView products={products} setProducts={setProducts} showToast={showToast}/>}
                    {adminView === 'coupons' && <AdminCouponsView coupons={coupons} setCoupons={setCoupons} showToast={showToast} />}
                    {adminView === 'insights' && <AdminInsightsView orders={orders} costBatches={costBatches} setCostBatches={setCostBatches} showToast={showToast} />}
                 </div>
            </main>
        </div>
    );
}
const AdminOrdersView = ({ orders, setOrders, showToast, inventory, setInventory }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showManualForm, setShowManualForm] = useState(false);
    
    const handleStatusUpdate = (orderId, field, value) => {
        setOrders(prevOrders => {
            const oldOrder = prevOrders.find(o => o.id === orderId);
            if (!oldOrder) return prevOrders;

            const updatedOrder = { ...oldOrder, [field]: value };

            setInventory(prevInventory => {
                const newInventory = { ...prevInventory };

                if (field === 'fulfillmentStatus' && value === 'Completed' && oldOrder.fulfillmentStatus !== 'Completed') {
                     Object.values(oldOrder.items).forEach(item => {
                        if (newInventory[item.id]) {
                            newInventory[item.id].unengravedStock -= item.quantity;
                        }
                    });
                } else if (field === 'fulfillmentStatus' && ['Returned', 'Cancelled'].includes(value) && !['Returned', 'Cancelled'].includes(oldOrder.fulfillmentStatus)) {
                    Object.values(oldOrder.items).forEach(item => {
                         if (newInventory[item.id]) {
                           newInventory[item.id].unengravedStock += item.quantity;
                        }
                    });
                }
                return newInventory;
            });
            return prevOrders.map(o => o.id === orderId ? updatedOrder : o);
        });
        showToast('Order status updated!');
    };
    const handleDeleteOrder = (orderId) => {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        showToast("Order deleted!");
        setSelectedOrder(null);
    };

    const handleManualSubmit = (e, manualOrderItems) => {
        e.preventDefault();
        
        for (const item of manualOrderItems) {
            if(!item.productId) continue;
            const stock = inventory.current[item.productId]?.unengravedStock || 0;
            if (item.quantity > stock) {
                showToast(`Cannot add order: Quantity for ${PRODUCTS_DATA.find(p=>p.id === item.productId).name} exceeds available stock of ${stock}.`, 'error');
                return;
            }
        }

        const formData = new FormData(e.target);
        const items = {};
        let subtotal = 0;
        manualOrderItems.forEach((itemInput) => {
            if(itemInput.productId) {
                const product = PRODUCTS_DATA.find(p => p.id === itemInput.productId);
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

        const newOrder = {
            id: `BYOT-${Date.now()}`,
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
        setOrders(prev => [newOrder, ...prev]);
        setShowManualForm(false);
        showToast("Manual order added!");
    };
    
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const searchMatch = !searchTerm || order.id.toLowerCase().includes(searchTerm.toLowerCase()) || order.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase());
            const paymentStatusMatch = paymentFilter === 'all' || order.paymentStatus === paymentFilter;
            return searchMatch && paymentStatusMatch;
        });
    }, [orders, searchTerm, paymentFilter]);

    const OrderModal = ({ order, onClose, onDeleteOrder }) => (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h3 className="font-bold">Order #{order.id}</h3>
                    <button onClick={onClose} className="text-2xl font-bold p-1">&times;</button>
                </div>
                <div className="p-4 space-y-4 text-sm overflow-y-auto">
                    {/* Customer Details */}
                    <div>
                        <h4 className="font-semibold mb-2 border-b pb-1">Customer Details</h4>
                        <p><strong>Name:</strong> {order.customerInfo.name}</p>
                        {order.customerInfo.email && <p><strong>Email:</strong> {order.customerInfo.email}</p>}
                        {order.customerInfo.phone && <p><strong>Phone:</strong> {order.customerInfo.phone}</p>}
                    </div>

                    {/* Fulfillment Details */}
                    <div>
                        <h4 className="font-semibold mb-2 border-b pb-1">Fulfillment Details</h4>
                        <p><strong>Method:</strong> <span className="capitalize">{order.fulfillmentMethod?.replace('_', ' ') || 'N/A'}</span></p>
                        {order.fulfillmentMethod === 'pickup' && (
                            <p><strong>Details:</strong> {order.pickupDate ? new Date(order.pickupDate).toLocaleDateString() : 'N/A'} at {order.pickupTime || 'N/A'}</p>
                        )}
                        {order.fulfillmentMethod === 'bearer' && (
                            <p><strong>Location:</strong> {order.bearerLocation || 'N/A'}</p>
                        )}
                        {order.fulfillmentMethod === 'knutsford' && (
                            <p><strong>Location:</strong> {order.knutsfordLocation || 'N/A'}</p>
                        )}
                    </div>
                    
                    {/* Order & Payment Status */}
                    <div>
                        <h4 className="font-semibold mb-2 border-b pb-1">Order Status</h4>
                         <p className="mb-2"><strong>Payment Method:</strong> <span className="capitalize">{order.paymentMethod?.replace('_', ' ') || 'N/A'}</span></p>
                        <div className="flex items-center">
                            <label className="w-32">Payment Status</label>
                            <select defaultValue={order.paymentStatus} onChange={(e) => handleStatusUpdate(order.id, 'paymentStatus', e.target.value)} className="p-1 border rounded-md">
                                <option>Pending</option>
                                <option>Paid</option>
                                <option>Refunded</option>
                                <option>Cancelled</option>
                            </select>
                        </div>
                        <div className="flex items-center mt-2">
                            <label className="w-32">Fulfillment</label>
                            <select defaultValue={order.fulfillmentStatus} onChange={(e) => handleStatusUpdate(order.id, 'fulfillmentStatus', e.target.value)} className="p-1 border rounded-md">
                                <option>Pending</option>
                                <option>Completed</option>
                                <option>Returned</option>
                                <option>Cancelled</option>
                            </select>
                        </div>
                    </div>

                    {/* Items */}
                    <div>
                        <h4 className="font-semibold mb-2 border-b pb-1">Items</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            {Object.values(order.items).map(item => (
                                <li key={item.id || item.name || Math.random()}>
                                    {item.name || 'Unknown Product'} (x{item.quantity || 0}) - J${(item.price * (item.quantity || 0)).toLocaleString()}
                                </li>
                            ))}
                        </ul>
                        {order.couponUsed && <p className="text-green-600 font-semibold mt-2">Coupon Used: {order.couponUsed} (-J${order.discount.toLocaleString()})</p>}
                        <p className="font-bold text-right mt-2">Total: J${order.total.toLocaleString()}</p>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-between items-center flex-shrink-0">
                    <button onClick={() => onDeleteOrder(order.id)} className="px-3 py-1 bg-red-500 text-white rounded-md flex items-center text-sm hover:bg-red-600">
                        <TrashIcon className="mr-1"/> Delete Order
                    </button>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Close</button>
                </div>
            </div>
        </div>
    );
    
    const ManualOrderForm = () => {
         const [manualOrderItems, setManualOrderItems] = useState([{ productId: '', quantity: 1 }]);
         const [manualFulfillmentMethod, setManualFulfillmentMethod] = useState('pickup');
         const [manualBearerLocation, setManualBearerLocation] = useState(Object.keys(DELIVERY_OPTIONS)[0]);
         const [manualKnutsfordLocation, setManualKnutsfordLocation] = useState(KNUTSFORD_LOCATIONS[0]);
         const [manualPaymentMethod, setManualPaymentMethod] = useState('cod');
         const [manualPickupDate, setManualPickupDate] = useState('');
         const [manualPickupTime, setManualPickupTime] = useState(PICKUP_TIMES[0]);
         
         const handleLocalManualItemChange = (index, field, value) => {
            const updatedItems = [...manualOrderItems];
            const currentItem = updatedItems[index];
            
            if (field === 'productId') {
                currentItem.productId = value;
            } else if (field === 'quantity') {
                const productId = currentItem.productId;
                if (productId && inventory.current[productId]) {
                    const availableStock = inventory.current[productId].unengravedStock;
                    let requestedQuantity = parseInt(value, 10);
                    if (isNaN(requestedQuantity) || requestedQuantity < 1) {
                        requestedQuantity = 1;
                    }
                    if (requestedQuantity > availableStock) {
                        showToast(`Only ${availableStock} units available for this product.`, 'error');
                        currentItem.quantity = availableStock;
                    } else {
                         currentItem.quantity = requestedQuantity;
                    }
                } else {
                    currentItem.quantity = value;
                }
            }
            setManualOrderItems(updatedItems);
         };

         const handleLocalAddItemRow = () => {
            setManualOrderItems(prev => [...prev, { productId: '', quantity: 1 }]);
         };

         const handleLocalRemoveItemRow = (indexToRemove) => {
            setManualOrderItems(prev => prev.filter((_, i) => i !== indexToRemove));
         };

        return (
            <div className="bg-white p-6 rounded-lg shadow-lg"> 
                <h2 className="text-2xl font-bold mb-6">Add Manual Order</h2> 
                <form onSubmit={(e) => handleManualSubmit(e, manualOrderItems)} className="space-y-6">
                    {/* Customer Info */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-2">Customer Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <input name="customerName" type="text" placeholder="Full Name" className="w-full p-2 border rounded" required />
                           <input name="customerEmail" type="email" placeholder="Email Address" className="w-full p-2 border rounded" />
                           <input name="customerPhone" type="tel" placeholder="Phone Number" className="w-full p-2 border rounded" required />
                        </div>
                    </div>

                    {/* Items */}
                    <div> 
                        <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-2">Items</h3> 
                        <div className="space-y-2"> 
                            {manualOrderItems.map((item, index) => {
                                const productInventory = item.productId ? inventory.current[item.productId] : null;
                                const availableStock = productInventory ? productInventory.unengravedStock : 0;
                                return (
                                    <div key={index} className="flex gap-2 items-center"> 
                                        <select 
                                            name={`productId-${index}`} 
                                            className="w-full p-2 border rounded" 
                                            value={item.productId} 
                                            onChange={(e) => handleLocalManualItemChange(index, 'productId', e.target.value)}
                                            required
                                        > 
                                            <option value="">Select Product</option> 
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)} 
                                        </select> 
                                        <div className="flex items-center border rounded">
                                            <input 
                                                type="number" 
                                                placeholder="Qty" 
                                                className="w-20 p-2" 
                                                min="1"
                                                max={availableStock}
                                                value={item.quantity}
                                                onChange={(e) => handleLocalManualItemChange(index, 'quantity', e.target.value)}
                                                required
                                            /> 
                                            <span className="text-xs text-gray-500 pr-2">({availableStock} avail.)</span>
                                        </div>
                                        {manualOrderItems.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => handleLocalRemoveItemRow(index)} 
                                                className="p-2 text-red-500 rounded-md hover:bg-red-100"
                                            >
                                                <TrashIcon />
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                            <button type="button" onClick={handleLocalAddItemRow} className="px-4 py-2 bg-gray-200 text-sm rounded-md mt-2">Add Another Item</button>
                        </div> 
                    </div>

                    {/* Fulfillment Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-2">Fulfillment Details</h3>
                        <div className="space-y-2">
                            <select name="manualFulfillmentMethod" value={manualFulfillmentMethod} onChange={(e) => setManualFulfillmentMethod(e.target.value)} className="w-full p-2 border rounded">
                                <option value="pickup">Pick Up</option>
                                <option value="bearer">Bearer Delivery</option>
                                <option value="knutsford">Knutsford Express</option>
                            </select>
                            {manualFulfillmentMethod === 'bearer' && (
                                <div className="pl-2 pt-2">
                                    <select name="manualBearerLocation" value={manualBearerLocation} onChange={(e) => setManualBearerLocation(e.target.value)} className="w-full p-2 border rounded-md mt-1">
                                        {Object.entries(DELIVERY_OPTIONS).map(([loc, price]) => <option key={loc} value={loc}>{`${loc} - J$${price}`}</option>)}
                                    </select>
                                </div>
                            )}
                            {manualFulfillmentMethod === 'knutsford' && (
                                <div className="pl-2 pt-2">
                                    <select name="manualKnutsfordLocation" value={manualKnutsfordLocation} onChange={(e) => setManualKnutsfordLocation(e.target.value)} className="w-full p-2 border rounded-md mt-1">
                                        {KNUTSFORD_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                            )}
                            {manualFulfillmentMethod === 'pickup' && (
                                <div className="pl-2 pt-2 grid grid-cols-2 gap-2">
                                    <input type="date" name="manualPickupDate" value={manualPickupDate} onChange={(e) => setManualPickupDate(e.target.value)} className="p-2 border rounded-md" required />
                                    <select name="manualPickupTime" value={manualPickupTime} onChange={(e) => setManualPickupTime(e.target.value)} className="p-2 border rounded-md" required>
                                        {PICKUP_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Payment & Order Status */}
                     <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-2">Payment and Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Payment Method</label>
                                <select name="manualPaymentMethod" value={manualPaymentMethod} onChange={e => setManualPaymentMethod(e.target.value)} className="w-full p-2 border rounded mt-1">
                                    <option value="cod">Cash on Pickup</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="credit_card">Credit Card</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Payment Status</label>
                                <select name="paymentStatus" className="w-full p-2 border rounded mt-1">
                                    <option>Pending</option>
                                    <option>Paid</option>
                                </select>
                            </div> 
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Fulfillment</label>
                                <select name="fulfillmentStatus" className="w-full p-2 border rounded mt-1">
                                    <option>Pending</option>
                                    <option>Completed</option>
                                </select>
                            </div> 
                        </div>
                    </div> 

                    <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                        <button type="button" onClick={() => { setShowManualForm(false); }} className="px-4 py-2 bg-gray-300 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Add Order</button>
                    </div> 
                </form> 
            </div>
        )
    }

    if (showManualForm) {
        return <ManualOrderForm />;
    }
    
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
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fulfilled</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOrders.map(order => (
                            <tr key={order.id} onClick={() => setSelectedOrder(order)} className="cursor-pointer hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{order.id}</td><td className="px-6 py-4 whitespace-nowrap">{order.customerInfo.name}</td>
                                {/* Conditionally display date or "N/A" based on whether it's a valid date string */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {order.createdAt && !isNaN(new Date(order.createdAt).getTime()) // Check for valid date object
                                        ? new Date(order.createdAt).toLocaleDateString() 
                                        : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">J${order.total.toLocaleString()}</td><td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {order.paymentStatus}
                                    </span>
                                </td><td className="px-6 py-4 whitespace-nowrap">
                                    {order.fulfillmentStatus === 'Completed' ? (
                                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <XCircleIcon className="h-5 w-5 text-red-500" />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
const AdminInventoryView = ({ inventory, setInventory, products, showToast }) => {
    const handleValueChange = (productId, field, value) => {
        const newInventory = {
            ...inventory,
            [productId]: {
                ...inventory[productId],
                [field]: parseInt(value) || 0
            }
        };

        // Recalculate totalStock based on engraved, unengraved, and defective
        const { engravedStock, unengravedStock, defective } = newInventory[productId];
        newInventory[productId].totalStock = (engravedStock || 0) + (unengravedStock || 0) + (defective || 0);

        setInventory(newInventory);
    };

    const handleSave = (id) => {
        console.log(`Saving inventory for ${id}:`, inventory[id]); 
        showToast(`Inventory for ${products.find(p=>p.id===id).name} saved!`);
    };
    return ( <div> <h2 className="text-2xl font-bold mb-4">Inventory Management</h2> <div className="space-y-4"> {products.map(p => ( <div key={p.id} className="bg-white rounded-lg shadow p-4"> <h3 className="font-bold">{p.name}</h3> <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-2 items-end"> <div><label className="text-xs text-gray-500">Total Stock</label><input type="number" value={inventory[p.id]?.totalStock || 0} readOnly className="w-full p-2 border rounded mt-1 bg-gray-100"/></div> <div><label className="text-xs text-gray-500">Engraved</label><input type="number" value={inventory[p.id]?.engravedStock || 0} onChange={e => handleValueChange(p.id, 'engravedStock', e.target.value)} className="w-full p-2 border rounded mt-1"/></div> <div><label className="text-xs text-gray-500">Unengraved</label><input type="number" value={inventory[p.id]?.unengravedStock || 0} onChange={e => handleValueChange(p.id, 'unengravedStock', e.target.value)} className="w-full p-2 border rounded mt-1"/></div> <div><label className="text-xs text-gray-500">Defective</label><input type="number" value={inventory[p.id]?.defective || 0} onChange={e => handleValueChange(p.id, 'defective', e.target.value)} className="w-full p-2 border rounded mt-1"/></div> <button onClick={() => handleSave(p.id)} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">Save</button> </div> {inventory[p.id]?.unengravedStock <= 15 && <p className="text-xs text-red-500 mt-2 font-semibold">Low stock warning!</p>} </div> ))} </div> </div> ) }
const AdminProductsView = ({products, setProducts, showToast}) => { const [editingProduct, setEditingProduct] = useState(null); const [isAddingNew, setIsAddingNew] = useState(false); const handleSave = (e) => { e.preventDefault(); const formData = new FormData(e.target); const productData = { id: editingProduct ? editingProduct.id : `byot-${Date.now()}`, name: formData.get('name'), price: Number(formData.get('price')), description: formData.get('description'), image: formData.get('image'), colorStart: '#cccccc', colorEnd: '#eeeeee', buttonTextColor: 'text-gray-800', }; if (isAddingNew) { setProducts(prev => [...prev, productData]); showToast("Product added!"); } else { setProducts(prev => prev.map(p => p.id === productData.id ? {...p, ...productData} : p)); showToast("Product updated!"); } setEditingProduct(null); setIsAddingNew(false); }
    const formInitialData = editingProduct || (isAddingNew ? {name:'', price:0, description:'', image:''} : null);
    if (formInitialData) { return ( <div> <h2 className="text-2xl font-bold mb-4">{isAddingNew ? "Add New Product" : "Edit Product"}</h2> <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow space-y-4"> <div><label className="font-semibold">Product Name</label><input name="name" defaultValue={formInitialData.name} className="w-full p-2 border rounded mt-1"/></div> <div><label className="font-semibold">Price</label><input name="price" type="number" defaultValue={formInitialData.price} className="w-full p-2 border rounded mt-1"/></div> <div><label className="font-semibold">Description</label><textarea name="description" defaultValue={formInitialData.description} className="w-full p-2 border rounded mt-1 h-24"></textarea></div> <div><label className="font-semibold">Image URL</label><input name="image" defaultValue={formInitialData.image} className="w-full p-2 border rounded mt-1"/></div> <div className="flex justify-end space-x-2"><button type="button" onClick={() => { setEditingProduct(null); setIsAddingNew(false); }} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save Changes</button></div> </form> </div> ) }
    return ( <div> <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">Product Management</h2><button onClick={() => setIsAddingNew(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md">Add New Product</button></div> <div className="bg-white rounded-lg shadow overflow-hidden"> {products.map(p => ( <div key={p.id} className="flex items-center p-4 border-b"> <img src={p.image} className="w-12 h-12 object-cover rounded-md mr-4" alt={p.name}/> <div className="flex-grow"><p className="font-bold">{p.name}</p><p className="text-sm text-gray-500">J${p.price}</p></div> <button onClick={() => setEditingProduct(p)} className="px-4 py-1 bg-gray-200 text-sm rounded-md">Edit</button> </div> ))} </div> </div> ) }
const AdminCouponsView = ({ coupons, setCoupons, showToast }) => {
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [isAddingNew, setIsAddingNew] = useState(false);

    const handleSave = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const couponData = {
            id: editingCoupon ? editingCoupon.id : `coup-${Date.now()}`,
            code: formData.get('code').toUpperCase(),
            type: formData.get('type'),
            value: Number(formData.get('value')),
            isActive: formData.get('isActive') === 'on',
        };

        if (isAddingNew) {
            setCoupons(prev => [...prev, couponData]);
            showToast("Coupon added!");
        } else {
            setCoupons(prev => prev.map(c => c.id === couponData.id ? couponData : c));
            showToast("Coupon updated!");
        }
        setEditingCoupon(null);
        setIsAddingNew(false);
    };

    const formInitialData = editingCoupon || (isAddingNew ? { code: '', type: 'percentage', value: 0, isActive: true } : null);

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
                    <div className="flex items-center">
                        <input name="isActive" type="checkbox" defaultChecked={formInitialData.isActive} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                        <label className="ml-2 block text-sm text-gray-900">Active</label>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={() => { setEditingCoupon(null); setIsAddingNew(false); }} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save Changes</button>
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
}
const AdminInsightsView = ({ orders, costBatches, setCostBatches, showToast }) => {
    const [editingBatch, setEditingBatch] = useState(null);
    
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

    const handleSaveBatch = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const batchData = {
            id: editingBatch.id,
            name: formData.get('name'),
            productCost: Number(formData.get('productCost')),
            alibabaShipping: Number(formData.get('alibabaShipping')),
            mailpacShipping: Number(formData.get('mailpacShipping')),
            numSets: Number(formData.get('numSets')),
        };
        batchData.costPerSet = batchData.numSets > 0 ? (batchData.productCost + batchData.alibabaShipping + batchData.mailpacShipping) / batchData.numSets : 0;
        
        setCostBatches(prev => prev.map(b => b.id === editingBatch.id ? { ...b, ...batchData } : b));
        setEditingBatch(null);
        showToast("Batch updated successfully!");
    };

    const handleCreateNewBatch = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newBatchData = {
            id: `batch-${Date.now()}`,
            name: formData.get('name'),
            productCost: Number(formData.get('productCost')),
            alibabaShipping: Number(formData.get('alibabaShipping')),
            mailpacShipping: Number(formData.get('mailpacShipping')),
            numSets: Number(formData.get('numSets')),
            startDate: new Date().toISOString(),
            endDate: null,
            isActive: true,
        };
        newBatchData.costPerSet = newBatchData.numSets > 0 ? (newBatchData.productCost + newBatchData.alibabaShipping + newBatchData.mailpacShipping) / newBatchData.numSets : 0;

        setCostBatches(prevBatches => {
            const updatedBatches = prevBatches.map(batch => 
                batch.isActive ? { ...batch, isActive: false, endDate: new Date().toISOString() } : batch
            );
            return [...updatedBatches, newBatchData];
        });
        
        setEditingBatch(null);
        showToast("New cost batch created and activated!");
    };
    
    const handleToggleBatchStatus = (batchIdToToggle) => {
         setCostBatches(prevBatches => {
            const targetBatch = prevBatches.find(b => b.id === batchIdToToggle);
            if (!targetBatch) return prevBatches;

            // If we are trying to DEACTIVATE the batch
            if (targetBatch.isActive) {
                // Check if it's the only active batch
                const activeBatchesCount = prevBatches.filter(b => b.isActive).length;
                if (activeBatchesCount <= 1) {
                    showToast("Cannot deactivate the only active batch.", "error");
                    return prevBatches; // Do not allow deactivation
                }
            }
            
            // Proceed with toggling
            return prevBatches.map(batch => {
                 if (batch.id === batchIdToToggle) {
                    return { ...batch, isActive: !batch.isActive, endDate: !batch.isActive ? new Date().toISOString() : null };
                }
                // If we are ACTIVATING the target batch, deactivate all others.
                if (targetBatch && !targetBatch.isActive && batch.isActive) {
                    return { ...batch, isActive: false, endDate: new Date().toISOString() };
                }
                return batch;
            });
        });
    };
    
    const { filteredOrders, reportData } = useMemo(() => {
        const from = new Date(dateRange.from).setHours(0,0,0,0);
        const to = new Date(dateRange.to).setHours(23,59,59,999);
        
        const filtered = !dateRange.from || !dateRange.to 
            ? orders 
            : orders.filter(order => {
                const orderDate = new Date(order.createdAt).getTime();
                return orderDate >= from && orderDate <= to;
            });

        const data = { 
            totalIncome: 0, totalProfit: 0, sales: 0,
            returnedValue: 0, refundedValue: 0,
            monthlySales: { 'This Month': { sales: 0, income: 0, profit: 0 }, 'Last Month': { sales: 0, income: 0, profit: 0 } },
            popularColors: {}
        };
        const now = new Date();

        filtered.forEach(order => {
            const orderQty = Object.values(order.items).reduce((sum, i) => sum + i.quantity, 0);
            const costBatch = costBatches.find(b => b.id === order.costBatchId) || costBatches.find(b => b.isActive);
            const costOfGoods = (costBatch?.costPerSet || 0) * orderQty;
            
            if (order.paymentStatus === 'Paid' && order.fulfillmentStatus === 'Completed') {
                data.totalIncome += order.total;
                data.totalProfit += order.total - costOfGoods;
                data.sales += orderQty;
                
                Object.values(order.items).forEach(item => {
                    const color = item.name.replace(' Kit', '');
                    data.popularColors[color] = (data.popularColors[color] || 0) + item.quantity;
                });

            } else if (order.fulfillmentStatus === 'Returned') {
                data.returnedValue += order.total;
            } else if (order.paymentStatus === 'Refunded') {
                data.refundedValue += order.total;
            }
        });

        // This part is for the smaller monthly chart, separate from the main report data
        orders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            const monthDiff = (now.getFullYear() - orderDate.getFullYear()) * 12 + now.getMonth() - orderDate.getMonth();
            const key = monthDiff === 0 ? 'This Month' : (monthDiff === 1 ? 'Last Month' : null);
            if (key && order.paymentStatus === 'Paid' && order.fulfillmentStatus === 'Completed') {
                const orderQty = Object.values(order.items).reduce((sum, i) => sum + i.quantity, 0);
                const costBatch = costBatches.find(b => b.id === order.costBatchId) || costBatches.find(b => b.isActive);
                const costOfGoods = (costBatch?.costPerSet || 0) * orderQty;
                data.monthlySales[key].income += order.total;
                data.monthlySales[key].profit += order.total - costOfGoods;
            }
        });
        
        return {
            filteredOrders: filtered,
            reportData: {
                ...data,
                monthlyChartData: [
                    { name: 'Last Month', Income: data.monthlySales['Last Month'].income, Profit: data.monthlySales['Last Month'].profit },
                    { name: 'This Month', Income: data.monthlySales['This Month'].income, Profit: data.monthlySales['This Month'].profit },
                ],
                popularColorsChartData: Object.entries(data.popularColors).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
            }
        };
    }, [orders, costBatches, dateRange]);

    const handleExport = () => {
        const headers = ["Order ID", "Date", "Customer", "Items", "Subtotal", "Discount", "Shipping", "Total", "Profit"];
        
        const rows = filteredOrders.map(order => {
            const orderQty = Object.values(order.items).reduce((sum, i) => sum + i.quantity, 0);
            const costBatch = costBatches.find(b => b.id === order.costBatchId) || costBatches.find(b => b.isActive);
            const costOfGoods = (costBatch?.costPerSet || 0) * orderQty;
            const profit = order.paymentStatus === 'Paid' && order.fulfillmentStatus === 'Completed' ? order.total - costOfGoods : 0;
            
            const itemsString = Object.values(order.items).map(i => `${i.quantity}x ${i.name}`).join('; ');

            return [
                order.id,
                new Date(order.createdAt).toLocaleDateString(),
                order.customerInfo.name,
                `"${itemsString}"`, // Quote to handle commas in item names
                order.subtotal || 0,
                order.discount || 0,
                order.fulfillmentCost || 0,
                order.total,
                profit.toFixed(2)
            ].join(',');
        });

        const csvString = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `byot_report_${dateRange.from}_to_${dateRange.to}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const BatchForm = ({ batch, onSave, onCancel }) => {
        return (
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6">{batch.isNew ? "Create New Cost Batch" : "Edit Cost Batch"}</h2>
                <form onSubmit={onSave} className="space-y-4">
                     <div>
                        <label className="font-semibold block mb-1">Batch Name</label>
                        <input name="name" defaultValue={batch.name} placeholder="e.g. July 2025 Order" className="w-full p-2 border rounded" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="font-semibold block mb-1">Shipping Cost (Alibaba)</label>
                            <input name="alibabaShipping" type="number" step="0.01" defaultValue={batch.alibabaShipping} className="w-full p-2 border rounded" required />
                         </div>
                         <div>
                             <label className="font-semibold block mb-1">Shipping Cost (Mailpac)</label>
                            <input name="mailpacShipping" type="number" step="0.01" defaultValue={batch.mailpacShipping} className="w-full p-2 border rounded" required />
                         </div>
                         <div>
                            <label className="font-semibold block mb-1">Product Cost (Alibaba)</label>
                            <input name="productCost" type="number" step="0.01" defaultValue={batch.productCost} className="w-full p-2 border rounded" required />
                         </div>
                         <div>
                             <label className="font-semibold block mb-1">Total # of Sets</label>
                            <input name="numSets" type="number" defaultValue={batch.numSets} className="w-full p-2 border rounded" required />
                         </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save Changes</button>
                    </div>
                </form>
                 <p className="text-xs text-gray-500 mt-4">Note: After saving, please update your stock levels in the 'Inventory' tab to reflect the new batch.</p>
            </div>
        );
    };

    if (editingBatch) {
        return <BatchForm batch={editingBatch} onSave={editingBatch.isNew ? handleCreateNewBatch : handleSaveBatch} onCancel={() => setEditingBatch(null)} />
    }
    

    return ( 
        <div> 
            <h2 className="text-2xl font-bold mb-6">Insights & Analytics</h2> 
            
            {/* Reporting Section */}
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
            
             {/* --- Key Metrics --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6"> 
                <div className="p-4 bg-white rounded-lg shadow"> 
                    <h3 className="text-gray-500">Total Income</h3> 
                    <p className="text-3xl font-bold">J${reportData.totalIncome.toLocaleString()}</p>
                </div> 
                <div className="p-4 bg-white rounded-lg shadow"> 
                    <h3 className="text-gray-500">Total Profit</h3> 
                    <p className="text-3xl font-bold">J${reportData.totalProfit.toLocaleString()}</p>
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

            {/* --- Charts & Batches --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-white rounded-lg shadow"> 
                    <h3 className="font-bold mb-4">Monthly Profitability</h3> 
                    <ResponsiveContainer width="100%" height={200}> 
                        <BarChart data={reportData.monthlyChartData} > 
                            <CartesianGrid strokeDasharray="3 3" /> 
                            <XAxis dataKey="name" /> 
                            <YAxis /> 
                            <Tooltip formatter={(value) => `J$${value.toLocaleString()}`} /> 
                            <Legend /> 
                            <Bar dataKey="Profit" fill="#8884d8" /> 
                            <Bar dataKey="Income" fill="#82ca9d" /> 
                        </BarChart> 
                    </ResponsiveContainer> 
                </div> 
                <div className="p-4 bg-white rounded-lg shadow"> 
                    <h3 className="font-bold mb-4">Most Popular Colors (Period)</h3> 
                    <ResponsiveContainer width="100%" height={200}> 
                        <BarChart data={reportData.popularColorsChartData} layout="vertical"> 
                            <CartesianGrid strokeDasharray="3 3" /> 
                            <XAxis type="number" /> 
                            <YAxis type="category" dataKey="name" width={80} /> 
                            <Tooltip /> 
                            <Bar dataKey="count" fill="#3b82f6" name="Units Sold" /> 
                        </BarChart> 
                    </ResponsiveContainer> 
                </div> 
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">Cost Batches</h3>
                     <button onClick={() => setEditingBatch({ name: '', productCost: 0, alibabaShipping: 0, mailpacShipping: 0, numSets: 0, isNew: true })} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">Create New Batch</button>
                 </div>
                 <div className="space-y-2">
                    {costBatches.slice().reverse().map(batch => (
                        <div key={batch.id} className={`p-3 rounded-lg border ${batch.isActive ? 'border-green-500 bg-green-50' : 'bg-gray-100'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{batch.name}</p>
                                    <p className="text-sm text-gray-600">Cost per Set: J${batch.costPerSet.toFixed(2)}</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(batch.startDate).toLocaleDateString()} - {batch.endDate ? new Date(batch.endDate).toLocaleDateString() : 'Present'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <button onClick={() => setEditingBatch(batch)} className="p-1 text-blue-600 hover:text-blue-800"><EditIcon/></button>
                                     <div className="flex items-center">
                                        <span className={`text-xs mr-2 ${batch.isActive ? 'text-green-600 font-bold' : 'text-gray-500'}`}>{batch.isActive ? 'Active' : 'Inactive'}</span>
                                        <button onClick={() => handleToggleBatchStatus(batch.id)} className={`relative inline-flex h-6 w-11 items-center rounded-full ${batch.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${batch.isActive ? 'translate-x-6' : 'translate-x-1'}`}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        </div> 
    ) 
}

// --- Main App Component ---
export default function App() {
    const [view, setView] = useState('shop');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [products, setProducts] = useState([]);
    const [inventory, setInventory] = useState({});
    const [orders, setOrders] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [costBatches, setCostBatches] = useState([]);
    const [cart, setCart] = useState({});
    const [bgGradient, setBgGradient] = useState('linear-gradient(to bottom, #111827, #374151)');
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [orderData, setOrderData] = useState(null);
    
    useEffect(() => {
        onAuthStateChanged(auth, user => {
            setIsLoggedIn(!!user);
        });

        const unsubscribes = [
            onSnapshot(collection(db, "products"), (snapshot) => setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))),
            onSnapshot(collection(db, "inventory"), (snapshot) => {
                const invData = {};
                snapshot.forEach(doc => {
                    invData[doc.id] = doc.data();
                });
                setInventory(invData);
            }),
            onSnapshot(collection(db, "orders"), (snapshot) => setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))),
            onSnapshot(collection(db, "coupons"), (snapshot) => setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))),
            onSnapshot(collection(db, "costBatches"), (snapshot) => setCostBatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))))
        ];

        return () => unsubscribes.forEach(unsub => unsub());
    }, []);

    useEffect(() => { if (!isLoggedIn && view !== 'shop') { setBgGradient('linear-gradient(to bottom, #d1d5db, #f9fafb)'); } else if (isLoggedIn) { setBgGradient('linear-gradient(to bottom, #e5e7eb, #f3f4f6)'); } }, [view, isLoggedIn]);
    
    const showToast = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const subtotal = useMemo(() => Object.values(cart).reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
    const cartCount = useMemo(() => Object.values(cart).reduce((s, i) => s + i.quantity, 0), [cart]);
    
    const handleAddToCart = (product, quantity) => { setCart(p => ({ ...p, [product.id]: { ...product, quantity: (p[product.id]?.quantity || 0) + quantity } })); showToast(`${quantity} x ${product.name} added!`); };
    const handleBuyNow = (product, quantity) => { setCart({ [product.id]: { ...product, quantity } }); setView('checkout'); };
    const handleUpdateCartQuantity = (id, q) => { if (q < 1) { handleRemoveFromCart(id); return; } setCart(p => ({...p, [id]: {...p[id], quantity: q}})); };
    const handleRemoveFromCart = (id) => { setCart(p => { const n = {...p}; delete n[id]; return n; }); };
    
    const placeOrder = async (order) => {
        const activeCostBatch = costBatches.find(b => b.isActive);
        const newOrder = {
            ...order, 
            costBatchId: activeCostBatch ? activeCostBatch.id : null,
            createdAt: new Date().toISOString()
        }; 
        
        try {
            const docRef = await addDoc(collection(db, "orders"), newOrder);
            setOrderData({ ...newOrder, id: docRef.id });
             if (order.paymentMethod === 'credit_card') { 
                setView('payment'); 
            } else { 
                setView('confirmation'); 
            } 
            setCart({});
        } catch (error) {
            console.error("Error placing order: ", error);
            showToast('Failed to place order.', 'error');
        }
    };
    
    const handleContinueShopping = () => { setOrderData(null); setView('shop'); };
    const handleLogin = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            alert('Login Failed! ' + error.message);
        }
    }
    const handleLogout = async () => {
        try {
            await signOut(auth);
            setView('shop');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    }
    
    const renderContent = () => {
        if (isLoggedIn) {
            return <AdminDashboard onLogout={handleLogout} orders={orders} products={products} inventory={inventory} coupons={coupons} costBatches={costBatches} setProducts={setProducts} setInventory={setInventory} setOrders={setOrders} setCoupons={setCoupons} setCostBatches={setCostBatches} showToast={showToast} />;
        }
        switch (view) {
            case 'shop': return <div className="view active"><ShopView products={products} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} setBgGradient={setBgGradient} inventory={inventory} /></div>; 
            case 'cart': return <CartView cart={cart} updateCartQuantity={handleUpdateCartQuantity} removeFromCart={handleRemoveFromCart} onGoToCheckout={() => setView('checkout')} onBack={() => setView('shop')} inventory={inventory} />; 
            case 'checkout': return <CheckoutView cart={cart} subtotal={subtotal} placeOrder={placeOrder} onBack={() => setView('cart')} coupons={coupons} showToast={showToast} />;
            case 'confirmation': return <ConfirmationView order={orderData} onContinue={handleContinueShopping} />;
            case 'payment': return <CreditCardView order={orderData} onBack={() => { setView('checkout'); setCart(orderData.items); }} />;
            case 'about': return <AboutView onBack={() => setView('shop')} />;
            case 'admin': return <AdminLoginView onLogin={handleLogin} />;
            default: return null;
        }
    };

    return (
        <div style={{ background: bgGradient }} className="flex items-center justify-center p-0 md:p-4 h-screen">
             <GlobalStyles />
             {isLoggedIn ? (
                 <div className="w-full h-full bg-gray-200">
                    {renderContent()}
                 </div>
             ) : (
                <div className="app-shell">
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 mt-4 text-white text-center py-2 px-6 rounded-full shadow-lg transform z-50 transition-all duration-300 ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-20'} ${toastType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {toastMessage}
                    </div>
                    {renderContent()}
                    <nav className="bg-white/80 backdrop-blur-lg border-t border-gray-200 flex-shrink-0">
                        <div className="flex justify-around h-20">
                             <button onClick={() => setView('shop')} className={`flex flex-col items-center justify-center w-full ${view === 'shop' ? 'text-blue-600' : 'text-gray-500'}`}><HomeIcon /><span className="text-xs font-medium">Shop</span></button>
                            <button onClick={() => setView('cart')} className={`flex flex-col items-center justify-center w-full relative ${view === 'cart' ? 'text-blue-600' : 'text-gray-500'}`}><CartIcon /><span className="text-xs font-medium">Cart</span>{cartCount > 0 && <span className="absolute top-4 right-8 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{cartCount}</span>}</button>
                            <button onClick={() => setView('about')} className={`flex flex-col items-center justify-center w-full ${view === 'about' ? 'text-blue-600' : 'text-gray-500'}`}><InfoIcon /><span className="text-xs font-medium">About</span></button>
                            <button onClick={() => setView('admin')} className={`flex flex-col items-center justify-center w-full ${view === 'admin' ? 'text-blue-600' : 'text-gray-500'}`}><UserIcon /><span className="text-xs font-medium">Account</span></button>
                        </div>
                    </nav>
                </div>
             )}
        </div>
    );
}
