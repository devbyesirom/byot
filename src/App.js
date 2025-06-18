import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- SVGs as React Components ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const CartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const ArrowDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>;
const BackArrowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="pointer-events-none" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
// Adjusted CheckCircleIcon to have matching width and height attributes as XCircleIcon for visual consistency.
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const XCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.75 13.96c.25.13.43.2.5.33.08.13.12.28.12.48 0 .2-.04.38-.12.53s-.17.28-.3.4-.28.2-.45.28-.35.13-.53.13c-.18 0-.38-.04-.58-.13s-.43-.2-.65-.35-.45-.3-.68-.5-.45-.4-.68-.63c-.23-.23-.45-.48-.65-.75s-.38-.5-.53-.75c-.15-.25-.23-.5-.23-.78 0-.28.08-.53.23-.75s.33-.4.53-.53.4-.2.6-.23c.2-.03.4-.04.6-.04.2 0 .4.03.58.08s.35.13.5.22.28.2.4.33.2.25.25.4c.05.14.08.3.08.48s-.03.33-.08.45-.13.25-.23.38c-.1.13-.23.25-.38.38s-.3.25-.45.35-.3.18-.45.25c-.15.08-.3.12-.43.12-.13 0-.25-.02-.38-.08s-.25-.12-.35-.22-.2-.2-.28-.3c-.08-.1-.12-.23-.12-.38 0-.15.04-.28.12-.4.08-.12.2-.23.35-.32.15-.1.3-.15.48-.15.18 0 .35.04.5.13.15.08.3.2.43.32zM12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path></svg>;
const ClipboardListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><line x1="12" y1="11" x2="12" y2="16"></line><line x1="9.5" y1="13.5" x2="14.5" y2="13.5"></line></svg>;
const PackageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10V6a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 6v4"></path><path d="M21 10v4a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 14v-4"></path><path d="m3.29 7 8.71 5 8.71-5"></path><path d="M12 22V12"></path></svg>;
const TagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29a2.41 2.41 0 0 0 3.42 0L22 13.42a2.41 2.41 0 0 0 0-3.42z"></path><circle cx="7" cy="7" r="1"></circle></svg>;
const BarChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>;

// --- Local Data ---
const PRODUCTS_DATA = [
    { id: 'byot-001', name: 'Dark Blue Kit', price: 2000, image: 'https://esirom.com/wp-content/uploads/2025/06/BYOTUtensils-DarkBlue.png', colorStart: '#1e3a8a', colorEnd: '#93c5fd', buttonTextColor: 'text-blue-900', description: 'A classic and versatile color for your sustainable journey.' },
    { id: 'byot-002', name: 'Teal Kit', price: 2000, image: 'https://esirom.com/wp-content/uploads/2025/06/BYOTUtensils-Teal.png', colorStart: '#0d9488', colorEnd: '#a7f3d0', buttonTextColor: 'text-teal-800', description: 'Make a vibrant statement with this beautiful teal set.' },
    { id: 'byot-003', name: 'Mint Kit', price: 2000, image: 'https://esirom.com/wp-content/uploads/2025/06/BYOTUtensils-Mint.png', colorStart: '#10b981', colorEnd: '#d1fae5', buttonTextColor: 'text-emerald-800', description: 'A fresh and cool mint green to brighten your day.' },
    { id: 'byot-004', name: 'Yellow Kit', price: 2000, image: 'https://esirom.com/wp-content/uploads/2025/06/BYOTUtensils-Yellow.png', colorStart: '#f59e0b', colorEnd: '#fef3c7', buttonTextColor: 'text-amber-800', description: 'A pop of sunshine yellow for a cheerful mealtime.' },
    { id: 'byot-005', name: 'Pink Kit', price: 2000, image: 'https://esirom.com/wp-content/uploads/2025/06/BYOTUtensils-Pink.png', colorStart: '#ec4899', colorEnd: '#fce7f3', buttonTextColor: 'text-pink-800', description: 'A soft and stylish pink for an elegant touch.' },
];
const DUMMY_ORDERS = [
    {id: 'BYOT-1718679601', customerInfo: {name: 'John Doe'}, items: {'byot-001': {id: 'byot-001', name: 'Dark Blue Kit', quantity: 2, price: 2000}}, total: 4000, createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), paymentStatus: 'Paid', fulfillmentStatus: 'Completed' },
    {id: 'BYOT-1718679602', customerInfo: {name: 'Jane Smith'}, items: {'byot-005': {id: 'byot-005', name: 'Pink Kit', quantity: 1, price: 2000}}, total: 2000, createdAt: new Date().toISOString(), paymentStatus: 'Pending', fulfillmentStatus: 'Pending' },
    {id: 'BYOT-1718679603', customerInfo: {name: 'Peter Pan'}, items: {'byot-002': {id: 'byot-002', name: 'Teal Kit', quantity: 1, price: 2000}, 'byot-003': {id: 'byot-003', name: 'Mint Kit', quantity:1, price: 2000}}, total: 4000, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), paymentStatus: 'Paid', fulfillmentStatus: 'Completed' },
    {id: 'BYOT-1718679604', customerInfo: {name: 'Alice Brown'}, items: {'byot-001': {id: 'byot-001', name: 'Dark Blue Kit', quantity: 1, price: 2000}}, total: 2000, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), paymentStatus: 'Paid', fulfillmentStatus: 'Returned' },
    {id: 'BYOT-1718679605', customerInfo: {name: 'Bob White'}, items: {'byot-004': {id: 'byot-004', name: 'Yellow Kit', quantity: 1, price: 2000}}, total: 2000, createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), paymentStatus: 'Refunded', fulfillmentStatus: 'Cancelled' },
];
const DUMMY_INVENTORY = {
    'byot-001': { totalStock: 271, engravedStock: 50, unengravedStock: 221, defective: 2 },
    'byot-002': { totalStock: 69, engravedStock: 10, unengravedStock: 59, defective: 0 },
    'byot-003': { totalStock: 32, engravedStock: 5, unengravedStock: 27, defective: 1 },
    'byot-004': { totalStock: 8, engravedStock: 2, unengravedStock: 6, defective: 0 },
    'byot-005': { totalStock: 33, engravedStock: 15, unengravedStock: 18, defective: 3 },
};

const DELIVERY_OPTIONS = { 'Kingston (10, 11)': 700, 'Portmore': 800 };
const KNUTSFORD_FEE = 500;
const KNUTSFORD_LOCATIONS = ["Angels (Spanish Town)", "Drax Hall", "Falmouth", "Gutters", "Harbour View", "New Kingston", "Luana", "Lucea", "Mandeville", "May Pen", "Montego Bay (Pier 1)", "Montego Bay Airport", "Negril", "Ocho Rios", "Port Antonio", "Port Maria", "Portmore", "Savanna-La-Mar", "Washington Boulevard"];
const PICKUP_TIMES = [
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "12:00 PM - 1:00 PM",
    "1:00 PM - 2:00 PM",
    "2:00 PM - 3:00 PM",
    "3:00 PM - 4:00 PM"
];

const GlobalStyles = () => ( <style>{` .app-shell { display: flex; flex-direction: column; height: 100%; max-height: 900px; width: 100%; max-width: 420px; margin: auto; border-radius: 2rem; overflow: hidden; box-shadow: 0 10px 50px rgba(0,0,0,0.2); } .view { flex-grow: 1; display: none; flex-direction: column; overflow: hidden; } .view.active { display: flex; } .feed { flex-grow: 1; overflow-y: scroll; scroll-snap-type: y mandatory; } .card { height: 100%; flex-shrink: 0; scroll-snap-align: start; display: flex; flex-direction: column; justify-content: flex-end; padding: 1.5rem; color: white; position: relative; background-size: cover; background-position: center; } .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0) 100%); z-index: 1; } .card-content { position: relative; z-index: 2; } .scroll-arrow { position: absolute; bottom: 7rem; left: 50%; animation: bounce 2.5s infinite; z-index: 2; } @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translate(-50%, 0); } 40% { transform: translate(-50%, -20px); } 60% { transform: translate(-50%, -10px); } } `}</style> );

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
                    <h1 className="text-4xl font-extrabold text-white drop-shadow-md">Bring Yuh Owna Tings</h1> 
                    <p className="text-lg text-gray-200 mt-2">Sustainable Kits for a Greener Jamaica.</p> 
                </div> 
                <div className="scroll-arrow text-white"><ArrowDownIcon /></div> 
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
const CheckoutView = ({ cart, subtotal, placeOrder, onBack }) => {
    const [fulfillmentMethod, setFulfillmentMethod] = useState('pickup');
    const [bearerLocation, setBearerLocation] = useState(Object.keys(DELIVERY_OPTIONS)[0]);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [pickupDate, setPickupDate] = useState(''); // State for pickup date
    const [pickupTime, setPickupTime] = useState(''); // State for pickup time

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

    const total = subtotal + fulfillmentCost;

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        // Extract values from formData first
        const fullName = formData.get('fullName');
        const email = formData.get('email');
        const phone = formData.get('phone');
        // knutsfordLocation is only relevant if fulfillmentMethod is 'knutsford'
        const knutsfordLocation = formData.get('knutsford_location'); // This variable is now used

        placeOrder({
            customerInfo: {
                name: fullName,
                email: email,
                phone: phone
            },
            items: cart,
            subtotal,
            fulfillmentCost,
            total,
            fulfillmentMethod,
            paymentMethod,
            // Ensure pickupDate and pickupTime are only set if fulfillmentMethod is 'pickup'
            pickupDate: fulfillmentMethod === 'pickup' ? pickupDate : null, 
            pickupTime: fulfillmentMethod === 'pickup' ? pickupTime : null,
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

    // Get today's date in నేపథ్యంలో-MM-DD format for min attribute, ensuring it's a weekday
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
                                <span className="ml-2">Pick Up (13 West Kings House Road)</span>
                                <span className="ml-auto font-semibold">Free</span>
                            </label>
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
                                    <p className="text-xs text-gray-500 mt-1">Note: Knutsford charges a separate fee on collection.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-2">Payment Method</h2>
                        <div className="space-y-2">
                            {fulfillmentMethod === 'pickup' && (
                                <label className="flex items-center p-3 border rounded-lg bg-white has-[:checked]:border-blue-500">
                                    <input type="radio" name="payment" value="cod" onChange={(e) => setPaymentMethod(e.target.value)} checked={paymentMethod === 'cod'} />
                                    <span className="ml-2">Cash on Pickup</span>
                                </label>
                            )}
                            {paymentMethod === 'cod' && fulfillmentMethod === 'pickup' && (
                                <div className="pl-6 pt-2 grid grid-cols-2 gap-2">
                                    <input
                                        type="date"
                                        name="pickup_date"
                                        className="p-2 border rounded-md"
                                        required
                                        value={pickupDate}
                                        onChange={handleDateChange} // Use the new handler
                                        min={getMinDate()} // Set minimum date to today
                                    />
                                    <select name="pickup_time" className="p-2 border rounded-md" required value={pickupTime} onChange={(e) => setPickupTime(e.target.value)}>
                                        {PICKUP_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1 col-span-2">Pickups are available Monday - Friday.</p>
                                </div>
                            )}
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
                                        <li><strong>Account #:</strong> 846837, SAVINGS</li>
                                    </ul>
                                </div>
                            )}
                            {fulfillmentMethod === 'pickup' && (
                                <label className="flex items-center p-3 border rounded-lg bg-white has-[:checked]:border-blue-500">
                                    <input type="radio" name="payment" value="credit_card" onChange={(e) => setPaymentMethod(e.target.value)} checked={paymentMethod === 'credit_card'}/>
                                    <span className="ml-2">Credit Card</span>
                                </label>
                            )}
                        </div>
                    </div>
                </form>
            </main>
            <footer className="flex-shrink-0 bg-white border-t p-4 space-y-3">
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>J${total.toLocaleString()}</span>
                </div>
                <button type="submit" form="checkout-form" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-lg">Place Order</button>
            </footer>
        </div>
    );
};
const ConfirmationView = ({ order, onContinue }) => { if(!order) return null; const { id, paymentMethod, fulfillmentMethod, pickupDate, pickupTime } = order; return ( <div className="view active bg-gray-100 p-4 flex flex-col items-center justify-center text-center"> <CheckCircleIcon /><h1 className="text-2xl font-bold mt-4">Thank You!</h1><p className="text-gray-600">Your order <span className="font-bold">#{id}</span> has been placed.</p> <div className="text-left bg-white p-4 rounded-lg shadow-md w-full my-6 text-sm"> <h2 className="font-bold mb-2">Next Steps</h2> {paymentMethod === 'bank_transfer' && <div className="space-y-3"><p>To complete your order, please send proof of payment to our WhatsApp.</p><a href="https://api.whatsapp.com/send?phone=18764365244" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg"><WhatsAppIcon /> <span className="ml-2">Upload Receipt to WhatsApp</span></a></div>} {paymentMethod === 'cod' && fulfillmentMethod === 'pickup' && <p>Your pickup is scheduled for <strong>{pickupDate}</strong> between <strong>{pickupTime}</strong>. Please have cash ready.</p>} {paymentMethod === 'credit_card' && <p>Your payment is being processed. Thank You!</p>} {fulfillmentMethod === 'bearer' && <p>We will contact you shortly to coordinate your delivery.</p>} {fulfillmentMethod === 'knutsford' && <p>Your package will be dropped off at Knutsford Express. They will contact you when it's ready for collection.</p>} </div> <button onClick={onContinue} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-lg">Continue Shopping</button> </div> ); };
const CreditCardView = ({ order, onBack }) => { const totalQuantity = Object.values(order.items).reduce((sum, item) => sum + item.quantity, 0); const paymentUrl = totalQuantity === 1 ? "https://secure.ezeepayments.com/?CQY6un2" : "https://secure.ezeepayments.com/?kgRMTcZ"; return ( <div className="view active bg-gray-100"> <header className="flex-shrink-0 bg-white shadow-sm p-4 flex items-center justify-between"><button onClick={onBack} className="p-2"><BackArrowIcon /></button><h1 className="text-xl font-bold">Complete Payment</h1><div className="w-10"></div></header> <iframe title="Credit Card Payment" src={paymentUrl} className="w-full h-full border-0"></iframe> </div> ) };
const AboutView = ({ onBack }) => { return ( <div className="view active bg-white"> <header className="flex-shrink-0 bg-white shadow-sm p-4 flex items-center justify-between"><button onClick={onBack} className="p-2"><BackArrowIcon /></button><h1 className="text-xl font-bold">About Us</h1><div className="w-10"></div></header> <main className="flex-grow overflow-y-auto p-6 flex flex-col items-center justify-center text-center"> <img src="https://esiromfoundation.org/wp-content/uploads/2023/12/esirom-foundation-logo-icon.jpg" alt="Esirom Foundation Logo" className="h-24 w-auto mx-auto"/> <h2 className="text-3xl font-bold text-gray-800 mt-4">Esirom Foundation</h2><p className="mt-4 text-gray-600 max-w-sm">Dedicated to fostering positive change through community-based initiatives in education, environment, and entrepreneurship in Jamaica.</p> </main> </div> ) }

// --- Admin Components ---
const AdminLoginView = ({ onLogin }) => { const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const handleLogin = (e) => { e.preventDefault(); onLogin(email, password); }; return( <div className="view active bg-gray-100 p-4 justify-center"> <form onSubmit={handleLogin} className="w-full max-w-sm mx-auto bg-white p-8 rounded-lg shadow-md space-y-6"> <h2 className="text-2xl font-bold text-center">Admin Login</h2> <div><label className="block mb-1 font-semibold">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded" required/></div> <div><label className="block mb-1 font-semibold">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" required/></div> <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Login</button> </form> </div> ); };
const AdminDashboard = ({ onLogout, orders, products, inventory, setProducts, setInventory, setOrders, showToast }) => {
    const [adminView, setAdminView] = useState('orders');
    // Using useRef to get the latest inventory without triggering re-renders in the child component unnecessarily.
    const inventoryRef = useRef(inventory);
    useEffect(() => {
        inventoryRef.current = inventory;
    }, [inventory]);

    return (
        // Changed main dashboard container to always be flex-col for consistent layout as nav moves to top
        <div className="view active bg-gray-200 flex-col">
            {/* Admin Panel as a top horizontal bar on large screens, and vertical sidebar on small screens */}
            <aside className="w-full bg-gray-800 text-white flex-shrink-0 
                              lg:h-16 lg:flex lg:flex-row lg:items-center lg:justify-between">
                 {/* Admin Panel Title - hidden on mobile, visible on large screens (top left) */}
                 <div className="p-4 font-bold border-b border-gray-700 
                                 lg:border-b-0 lg:p-0 lg:ml-6 hidden lg:block">Admin Panel</div>
                 
                 {/* Navigation links - vertical on mobile, horizontal on large screens */}
                 <nav className="p-2 flex-grow flex flex-col justify-around 
                                 lg:flex-grow-0 lg:flex-row lg:justify-center lg:space-x-6">
                     <button onClick={() => setAdminView('orders')} className={`flex flex-col items-center text-center w-full p-2 rounded-md space-x-2 
                                 lg:flex-row lg:text-left lg:w-auto ${adminView === 'orders' ? 'bg-gray-700' : ''}`}><ClipboardListIcon/><span>Orders</span></button>
                     <button onClick={() => setAdminView('inventory')} className={`flex flex-col items-center text-center w-full p-2 rounded-md space-x-2 
                                 lg:flex-row lg:text-left lg:w-auto ${adminView === 'inventory' ? 'bg-gray-700' : ''}`}><PackageIcon/><span>Inventory</span></button>
                     <button onClick={() => setAdminView('products')} className={`flex flex-col items-center text-center w-full p-2 rounded-md space-x-2 
                                 lg:flex-row lg:text-left lg:w-auto ${adminView === 'products' ? 'bg-gray-700' : ''}`}><TagIcon/><span>Products</span></button>
                     <button onClick={() => setAdminView('insights')} className={`flex flex-col items-center text-center w-full p-2 rounded-md space-x-2 
                                 lg:flex-row lg:text-left lg:w-auto ${adminView === 'insights' ? 'bg-gray-700' : ''}`}><BarChartIcon/><span>Insights</span></button>
                 </nav>
                 
                 {/* Logout button - hidden on mobile, visible on large screens (top right) */}
                 <button onClick={onLogout} className="p-4 text-sm text-red-400 hover:bg-red-500 hover:text-white 
                                 hidden lg:block lg:mr-6">Logout</button>
            </aside>
            
            <main className="flex-1 flex flex-col overflow-y-hidden lg:flex-row"> {/* This main will be alongside the content*/}
                 {/* Mobile header (for when the above aside becomes vertical nav) */}
                 <header className="flex-shrink-0 bg-white shadow-sm p-4 flex items-center justify-between lg:hidden">
                    <h1 className="text-xl font-bold capitalize">{adminView}</h1>
                    <button onClick={onLogout} className="text-sm text-red-600">Logout</button>
                 </header>
                 <div className="flex-grow overflow-y-auto p-2 sm:p-6">
                    {adminView === 'orders' && <AdminOrdersView orders={orders} setOrders={setOrders} showToast={showToast} inventory={inventoryRef} setInventory={setInventory} />}
                    {adminView === 'inventory' && <AdminInventoryView inventory={inventory} setInventory={setInventory} products={products} showToast={showToast} />}
                    {adminView === 'products' && <AdminProductsView products={products} setProducts={setProducts} showToast={showToast}/>}
                    {adminView === 'insights' && <AdminInsightsView orders={orders}/>}
                 </div>
            </main>
        </div>
    );
}
const AdminOrdersView = ({ orders, setOrders, showToast, inventory, setInventory }) => {
    // State to manage the dynamic input fields for manual order items
    const [manualOrderItems, setManualOrderItems] = useState([{ productId: '', quantity: 1 }]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showManualForm, setShowManualForm] = useState(false);

    const handleStatusUpdate = (orderId, field, value) => {
        setOrders(prevOrders => {
            const oldOrder = prevOrders.find(o => o.id === orderId);
            if (!oldOrder) return prevOrders; // Should not happen

            const updatedOrder = { ...oldOrder, [field]: value };

            // Determine inventory changes based on status transition
            setInventory(prevInventory => {
                const newInventory = { ...prevInventory }; // Clone for immutability

                // Inventory decrease for 'Completed' fulfillment
                if (field === 'fulfillmentStatus' && value === 'Completed' && oldOrder.fulfillmentStatus !== 'Completed') {
                    console.log(`Decreasing stock for order ${orderId} becoming Completed.`);
                    Object.values(oldOrder.items).forEach(item => {
                        const productId = item.id;
                        const quantityOrdered = item.quantity;
                        if (newInventory[productId]) {
                            newInventory[productId].totalStock = Math.max(0, newInventory[productId].totalStock - quantityOrdered);
                            newInventory[productId].unengravedStock = Math.max(0, newInventory[productId].unengravedStock - quantityOrdered);
                            console.log(`  Product ${productId}: -${quantityOrdered}. New stock: ${newInventory[productId].totalStock}`);
                        }
                    });
                    showToast(`Stock decreased for completed order ${orderId}`);
                }
                // Only adjust stock if the fulfillment status is changing to 'Returned' or 'Cancelled'
                else if (field === 'fulfillmentStatus' && (value === 'Returned' || value === 'Cancelled') && 
                         oldOrder.fulfillmentStatus !== 'Returned' && oldOrder.fulfillmentStatus !== 'Cancelled') {
                    console.log(`Increasing stock for order ${orderId} becoming ${value}.`);
                    Object.values(oldOrder.items).forEach(item => {
                        const productId = item.id;
                        const quantityAdjust = item.quantity;
                        if (newInventory[productId]) {
                            newInventory[productId].totalStock += quantityAdjust;
                            newInventory[productId].unengravedStock += quantityAdjust;
                            console.log(`  Product ${productId}: +${quantityAdjust}. New stock: ${newInventory[productId].totalStock}`);
                        }
                    });
                    showToast(`Stock updated for ${value.toLowerCase()} order ${orderId}`);
                }
                // Only adjust stock if payment status is changing to 'Refunded' AND fulfillment wasn't already returned/cancelled
                else if (field === 'paymentStatus' && value === 'Refunded' && oldOrder.paymentStatus !== 'Refunded') {
                     if (oldOrder.fulfillmentStatus !== 'Returned' && oldOrder.fulfillmentStatus !== 'Cancelled') {
                        console.log(`Increasing stock for order ${orderId} becoming Refunded (not returned/cancelled).`);
                        Object.values(oldOrder.items).forEach(item => {
                            const productId = item.id;
                            const quantityAdjust = item.quantity;
                            if (newInventory[productId]) {
                                newInventory[productId].totalStock += quantityAdjust;
                                newInventory[productId].unengravedStock += quantityAdjust;
                                console.log(`  Product ${productId}: +${quantityAdjust}. New stock: ${newInventory[productId].totalStock}`);
                            }
                        });
                        setInventory(newInventory); // Explicitly call setInventory here
                        showToast(`Stock updated for refunded order ${orderId}`);
                    }
                }
                return newInventory;
            });

            return prevOrders.map(o => o.id === orderId ? updatedOrder : o);
        });
    };

    const handleDeleteOrder = (orderId) => {
        // In a real application, you'd want a custom confirmation modal here.
        // For simplicity, directly deleting.
        setOrders(prev => prev.filter(o => o.id !== orderId));
        showToast("Order deleted!");
        setSelectedOrder(null); // Close modal after deletion
    };


    const handleManualSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const items = {};
        manualOrderItems.forEach((itemInput) => { // Renamed 'item' to 'itemInput' to avoid conflict with PRODUCTS_DATA item
            if(itemInput.productId) {
                const product = PRODUCTS_DATA.find(p => p.id === itemInput.productId);
                if (product) { // Ensure product is found before adding to items
                    items[product.id] = {
                        name: product.name,
                        price: product.price,
                        image: product.image, // Ensure image is carried over
                        quantity: parseInt(itemInput.quantity) || 1
                    };
                } else {
                    console.warn(`Product with ID ${itemInput.productId} not found in PRODUCTS_DATA.`);
                    showToast(`Product with ID ${itemInput.productId} not found and skipped.`);
                }
            }
        });

        const customerName = formData.get('customerName');
        const paymentStatus = formData.get('paymentStatus');
        const fulfillmentStatus = formData.get('fulfillmentStatus');


        const subtotal = Object.values(items).reduce((sum, i)=> sum + (i.price * i.quantity), 0);
        const newOrder = {
            id: `BYOT-${Date.now()}`,
            customerInfo: {name: customerName},
            items,
            total: subtotal,
            createdAt: new Date().toISOString(),
            paymentStatus: paymentStatus,
            fulfillmentStatus: fulfillmentStatus
        };
        setOrders(prev => [newOrder, ...prev]);
        setShowManualForm(false);
        setManualOrderItems([{ productId: '', quantity: 1 }]);
        showToast("Manual order added!");
    };

    const handleAddItemRow = () => {
        setManualOrderItems(prev => [...prev, { productId: '', quantity: 1 }]);
    };

    const handleManualItemChange = (index, field, value) => {
        setManualOrderItems(prev => prev.map((item, i) => 
            i === index ? { ...item, [field]: value } : item
        ));
    };

    const handleRemoveItemRow = (indexToRemove) => {
        setManualOrderItems(prev => prev.filter((_, i) => i !== indexToRemove));
    };


    const OrderModal = ({ order, onClose, onDeleteOrder }) => ( 
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50"> 
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md"> 
                <div className="p-4 border-b flex justify-between items-center"> 
                    <h3 className="font-bold">Order #{order.id}</h3>
                    <button onClick={onClose}>&times;</button> 
                </div> 
                <div className="p-4 space-y-2 text-sm"> 
                    <p><strong>Customer:</strong> {order.customerInfo.name}</p> 
                    <div className="flex items-center"> 
                        <label className="w-32">Payment Status</label> 
                        <select defaultValue={order.paymentStatus} onChange={(e) => handleStatusUpdate(order.id, 'paymentStatus', e.target.value)} className="p-1 border rounded-md"> 
                            <option>Pending</option> 
                            <option>Paid</option>
                            <option>Refunded</option> 
                            <option>Cancelled</option>
                        </select> 
                    </div> 
                    <div className="flex items-center"> 
                        <label className="w-32">Fulfillment</label> 
                        <select defaultValue={order.fulfillmentStatus} onChange={(e) => handleStatusUpdate(order.id, 'fulfillmentStatus', e.target.value)} className="p-1 border rounded-md"> 
                            <option>Pending</option> 
                            <option>Completed</option>
                            <option>Returned</option> 
                            <option>Cancelled</option>
                        </select> 
                    </div> 
                    {/* Display order items with quantity and price */}
                    <h4 className="font-semibold mt-4">Items:</h4>
                    <ul className="list-disc pl-5">
                        {/* Ensure item properties are safely accessed with fallback values */}
                        {Object.values(order.items).map(item => (
                            <li key={item.id || item.name || Math.random()}>
                                {item.name || 'Unknown Product'} (x{item.quantity || 0}) - J${(item.price || 0).toLocaleString()}
                            </li>
                        ))}
                    </ul>
                </div> 
                <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
                    <button onClick={() => onDeleteOrder(order.id)} className="px-3 py-1 bg-red-500 text-white rounded-md flex items-center text-sm">
                        <TrashIcon className="mr-1"/> Delete Order
                    </button>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Close</button>
                </div> 
            </div> 
        </div>
    );
    if (showManualForm) { return ( 
        <div> 
            <h2 className="text-2xl font-bold mb-4">Add Manual Order</h2> 
            <form onSubmit={handleManualSubmit} className="bg-white p-6 rounded-lg shadow space-y-4"> 
                <input name="customerName" type="text" placeholder="Customer Name" className="w-full p-2 border rounded" required /> 
                <div> 
                    <h3 className="font-semibold mb-2">Items</h3> 
                    <div className="space-y-2"> 
                        {manualOrderItems.map((item, index) => (
                            <div key={index} className="flex gap-2 items-center"> 
                                <select 
                                    name={`productId-${index}`} 
                                    className="w-full p-2 border rounded" 
                                    value={item.productId} 
                                    onChange={(e) => handleManualItemChange(index, 'productId', e.target.value)}
                                    required
                                > 
                                    <option value="">Select Product</option> 
                                    {PRODUCTS_DATA.map(p => <option key={p.id} value={p.id}>{p.name}</option>)} 
                                </select> 
                                <input 
                                    type="number" 
                                    placeholder="Qty" 
                                    className="w-20 p-2 border rounded" 
                                    min="1" 
                                    value={item.quantity}
                                    onChange={(e) => handleManualItemChange(index, 'quantity', e.target.value)}
                                    required
                                /> 
                                {manualOrderItems.length > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveItemRow(index)} 
                                        className="p-2 text-red-500 rounded-md hover:bg-red-100"
                                    >
                                        <TrashIcon />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={handleAddItemRow} className="px-4 py-2 bg-gray-200 text-sm rounded-md mt-2">Add Another Item</button>
                    </div> 
                </div> 
                <div className="grid grid-cols-2 gap-4"> 
                    <div><label>Payment Status</label><select name="paymentStatus" className="w-full p-2 border rounded mt-1"><option>Pending</option><option>Paid</option></select></div> 
                    <div><label>Fulfillment</label><select name="fulfillmentStatus" className="w-full p-2 border rounded mt-1"><option>Pending</option><option>Completed</option></select></div> 
                </div> 
                <div className="flex justify-end space-x-2"><button type="button" onClick={() => { setShowManualForm(false); setManualOrderItems([{ productId: '', quantity: 1 }]); }} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Add Order</button></div> 
            </form> 
        </div> ) }
    return(
        <div>
            {selectedOrder && <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onDeleteOrder={handleDeleteOrder} />}
            <div className="flex justify-between items-center mb-4"> <h2 className="text-2xl font-bold">Orders</h2> <button onClick={() => setShowManualForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">Add Manual Order</button> </div>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fulfilled</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map(order => (
                            <tr key={order.id} onClick={() => setSelectedOrder(order)} className="cursor-pointer hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{order.id}</td><td className="px-6 py-4 whitespace-nowrap">{order.customerInfo.name}</td>
                                {/* Conditionally display date or "N/A" based on whether it's a valid date string */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {order.pickupDate && order.pickupDate !== 'N/A' && !isNaN(new Date(order.pickupDate).getTime()) // Check for valid date object
                                        ? new Date(order.pickupDate).toLocaleDateString() 
                                        : new Date(order.createdAt).toLocaleDateString()} {/* Fallback to createdAt for display */}
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
const AdminInsightsView = ({ orders }) => { const [costs, setCosts] = useState({ productCost: 1000, alibabaShipping: 200, mailpacShipping: 50, numSets: 1 }); const handleCostChange = (e) => setCosts(prev => ({...prev, [e.target.name]: Number(e.target.value)})); const costPerSet = useMemo(() => { const totalCost = costs.productCost + costs.alibabaShipping + costs.mailpacShipping; return costs.numSets > 0 ? totalCost / costs.numSets : 0; }, [costs]); 
    const salesData = useMemo(() => { 
        const data = { 'This Month': { sales: 0, income: 0 }, 'Last Month': { sales: 0, income: 0 } }; 
        const now = new Date(); 
        orders.forEach(order => { 
            // Only count orders that are Paid AND Completed (or were never cancelled/returned)
            if (order.paymentStatus !== 'Refunded' && order.fulfillmentStatus !== 'Returned' && order.fulfillmentStatus !== 'Cancelled') {
                const orderDate = new Date(order.createdAt); 
                const monthDiff = (now.getFullYear() - orderDate.getFullYear()) * 12 + now.getMonth() - orderDate.getMonth(); 
                const key = monthDiff === 0 ? 'This Month' : (monthDiff === 1 ? 'Last Month' : null); 
                if (key) { 
                    const orderQty = Object.values(order.items).reduce((sum, i) => sum + i.quantity, 0); 
                    data[key].sales += orderQty; 
                    data[key].income += order.total; 
                }
            } 
        }); 
        return [ 
            { name: 'Last Month', Sales: data['Last Month'].sales, Income: data['Last Month'].income, Profit: data['Last Month'].income - (data['Last Month'].sales * costPerSet) }, 
            { name: 'This Month', Sales: data['This Month'].sales, Income: data['This Month'].income, Profit: data['This Month'].income - (data['This Month'].sales * costPerSet) } 
        ]; 
    }, [orders, costPerSet]); 
    
    const popularColors = useMemo(() => { 
        const colorCounts = {}; 
        orders.forEach(order => { 
            // Only count items from orders that are Paid AND Completed
            if (order.paymentStatus !== 'Refunded' && order.fulfillmentStatus !== 'Returned' && order.fulfillmentStatus !== 'Cancelled') {
                Object.values(order.items).forEach(item => { 
                    if (item.name && item.name.includes('Kit')) { 
                        const color = item.name.replace(' Kit', ''); 
                        colorCounts[color] = (colorCounts[color] || 0) + item.quantity; 
                    } 
                });
            } 
        }); 
        return Object.entries(colorCounts).map(([name, count]) => ({name, count})).sort((a,b) => b.count - a.count); 
    }, [orders]); 
    
    // Calculate values for canceled/returned/refunded orders
    const cancelledReturnedValue = useMemo(() => {
        return orders.reduce((sum, order) => {
            if (order.fulfillmentStatus === 'Returned' || order.fulfillmentStatus === 'Cancelled') {
                return sum + order.total;
            }
            return sum;
        }, 0);
    }, [orders]);

    const refundedValue = useMemo(() => {
        return orders.reduce((sum, order) => {
            if (order.paymentStatus === 'Refunded') {
                // Ensure we don't double count if also returned/cancelled
                if (order.fulfillmentStatus !== 'Returned' && order.fulfillmentStatus !== 'Cancelled') {
                    return sum + order.total;
                }
            }
            return sum;
        }, 0);
    }, [orders]);

    return ( 
        <div> 
            <h2 className="text-2xl font-bold mb-6">Insights & Analytics</h2> 
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"> 
                <div className="p-4 bg-white rounded-lg shadow"> 
                    <h3 className="text-gray-500">Total Income</h3> 
                    <p className="text-3xl font-bold">J${orders
                        .filter(order => order.paymentStatus !== 'Refunded' && order.fulfillmentStatus !== 'Returned' && order.fulfillmentStatus !== 'Cancelled')
                        .reduce((sum, o) => sum + o.total, 0).toLocaleString()}
                    </p>
                </div> 
                <div className="p-4 bg-white rounded-lg shadow"> 
                    <h3 className="text-gray-500">Sales (This Month)</h3> 
                    <p className="text-3xl font-bold">{salesData[1].Sales}</p>
                </div> 
                <div className="p-4 bg-white rounded-lg shadow"> 
                    <h3 className="text-gray-500">Profit (This Month)</h3> 
                    <p className="text-3xl font-bold">J${salesData[1].Profit.toLocaleString()}</p>
                </div> 
                <div className="p-4 bg-white rounded-lg shadow"> {/* New card for Canceled/Returned */}
                    <h3 className="text-gray-500">Canceled/Returned Value</h3> 
                    <p className="text-3xl font-bold text-red-500">J${cancelledReturnedValue.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow"> {/* New card for Refunded */}
                    <h3 className="text-gray-500">Refunded Value</h3> 
                    <p className="text-3xl font-bold text-red-500">J${refundedValue.toLocaleString()}</p>
                </div>
            </div> 
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> 
                <div className="p-4 bg-white rounded-lg shadow"> 
                    <h3 className="font-bold mb-4">Cost Calculation</h3> 
                    <div className="space-y-2 text-sm"> 
                        <div className="flex justify-between"><label>Product Cost (Alibaba)</label><input name="productCost" value={costs.productCost} onChange={handleCostChange} type="number" className="w-24 p-1 border rounded"/></div> 
                        <div className="flex justify-between"><label>Shipping Cost (Alibaba)</label><input name="alibabaShipping" value={costs.alibabaShipping} onChange={handleCostChange} type="number" className="w-24 p-1 border rounded"/></div> 
                        <div className="flex justify-between"><label>Shipping Cost (Mailpac)</label><input name="mailpacShipping" value={costs.mailpacShipping} onChange={handleCostChange} type="number" className="w-24 p-1 border rounded"/></div> 
                        <div className="flex justify-between"><label>Total Number of Sets</label><input name="numSets" value={costs.numSets} onChange={handleCostChange} type="number" className="w-24 p-1 border rounded"/></div> 
                        <div className="flex justify-between font-bold border-t pt-2 mt-2"><label>Cost Per Set</label><span>J${costPerSet.toFixed(2)}</span></div> 
                    </div> 
                </div> 
                <div className="p-4 bg-white rounded-lg shadow"> 
                    <h3 className="font-bold mb-4">Profitability</h3> 
                    <ResponsiveContainer width="100%" height={200}> 
                        <BarChart data={salesData}> 
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
                    <h3 className="font-bold mb-4">Most Popular Colors</h3> 
                    <ResponsiveContainer width="100%" height={200}> 
                        <BarChart data={popularColors} layout="vertical"> 
                            <CartesianGrid strokeDasharray="3 3" /> 
                            <XAxis type="number" /> 
                            <YAxis type="category" dataKey="name" width={80} /> 
                            <Tooltip /> 
                            <Bar dataKey="count" fill="#3b82f6" name="Units Sold" /> 
                        </BarChart> 
                    </ResponsiveContainer> 
                </div> 
            </div> 
        </div> 
    ) 
}

// --- Main App Component ---
export default function App() {
    const [view, setView] = useState('shop');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [products, setProducts] = useState(PRODUCTS_DATA);
    const [inventory, setInventory] = useState(DUMMY_INVENTORY);
    const [orders, setOrders] = useState(DUMMY_ORDERS);
function App() {
    const [cart, setCart] = useState({});

    // --- Add this inside the App component where state and functions are declared ---
    const removeFromCart = (id) => {
        setCart(prev => {
            const updatedCart = { ...prev };
            delete updatedCart[id];
            return updatedCart;
        });
    };

    const updateCartQuantity = (id, quantity) => {
        setCart(prev => ({
            ...prev,
            [id]: { ...prev[id], quantity }
        }));
    };

    const handleGoToCheckout = () => {
        // handle checkout logic
    };

    const handleBack = () => {
        // handle back navigation
    };

    const inventory = {}; // placeholder

    return (
        <CartView
            cart={cart}
            updateCartQuantity={updateCartQuantity}
            removeFromCart={removeFromCart}
            onGoToCheckout={handleGoToCheckout}
            onBack={handleBack}
            inventory={inventory}
        />
    );
}

export default App;

    const [bgGradient, setBgGradient] = useState('linear-gradient(to bottom, #111827, #374151)');
    const [toastMessage, setToastMessage] = useState('');
    const [orderData, setOrderData] = useState(null);
    
    useEffect(() => { if (!isLoggedIn && view !== 'shop') { setBgGradient('linear-gradient(to bottom, #d1d5db, #f9fafb)'); } else if (isLoggedIn) { setBgGradient('linear-gradient(to bottom, #e5e7eb, #f3f4f6)'); } }, [view, isLoggedIn]);
    useEffect(() => { if(toastMessage){ const timer = setTimeout(() => setToastMessage(''), 2000); return () => clearTimeout(timer); } }, [toastMessage]);

    const subtotal = useMemo(() => Object.values(cart).reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
    const cartCount = useMemo(() => Object.values(cart).reduce((s, i) => s + i.quantity, 0), [cart]);
    
    const handleAddToCart = (product, quantity) => { setCart(p => ({ ...p, [product.id]: { ...product, quantity: (p[product.id]?.quantity || 0) + quantity } })); setToastMessage(`${quantity} x ${product.name} added!`); };
    const handleBuyNow = (product, quantity) => { setCart({ [product.id]: { ...product, quantity } }); setView('checkout'); };
    const handleUpdateCartQuantity = (id, q) => { if (q < 1) { handleRemoveFromCart(id); return; } setCart(p => ({...p, [id]: {...p[id], quantity: q}})); };
    const handleRemoveFromCart = (id) => { setCart(p => { const n = {...p}; delete n[id]; return n; }); };
    
    const placeOrder = (order) => { 
        const newOrder = {
            ...order, 
            id: `BYOT-${Date.now()}`,
            // Ensure paymentStatus and fulfillmentStatus have initial values for new orders
            paymentStatus: order.paymentStatus || 'Pending', 
            fulfillmentStatus: order.fulfillmentStatus || 'Pending',
            createdAt: new Date().toISOString() // Ensure createdAt is always a valid date string
        }; 
        setOrderData(newOrder); 
        setOrders(prev => [newOrder, ...prev]); 

        // Important: Inventory is NOT decreased here. It's only decreased when order is "Completed" via handleStatusUpdate.
        // This prevents stock issues if an order is placed but never fulfilled.

        if (order.paymentMethod === 'credit_card') { 
            setView('payment'); 
        } else { 
            setView('confirmation'); 
        } 
        setCart({}); 
    };
    
    const handleContinueShopping = () => { setOrderData(null); setView('shop'); };
    const handleLogin = (email, password) => { if (email === 'foundation@esirom.com' && password === 'M@$t3rK3Y') { setIsLoggedIn(true); } else { alert('Login Failed!'); } }
    const handleLogout = () => { setIsLoggedIn(false); setView('shop'); }
    
    const renderContent = () => {
        if (isLoggedIn) {
            return <AdminDashboard onLogout={handleLogout} orders={orders} products={products} inventory={inventory} setProducts={setProducts} setInventory={setInventory} setOrders={setOrders} showToast={setToastMessage} />;
        }
        switch (view) {
            case 'shop': return <div className="view active"><ShopView products={products} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} setBgGradient={setBgGradient} inventory={inventory} /></div>; {/* Pass inventory to ShopView */}
            case 'cart': return <CartView cart={cart} updateCartQuantity={handleUpdateCartQuantity} removeFromCart={removeFromCart} onGoToCheckout={() => setView('checkout')} onBack={() => setView('shop')} inventory={inventory} />; {/* Pass inventory to CartView */}
            case 'checkout': return <CheckoutView cart={cart} subtotal={subtotal} placeOrder={placeOrder} onBack={() => setView('cart')} />;
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
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 mt-4 bg-green-500 text-white text-center py-2 px-6 rounded-full shadow-lg transform z-50 transition-all duration-300 ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-20'}`}>
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
