import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import NotificationBanner from './components/NotificationBanner';
import ReservationBanner from './components/ReservationBanner';
import ProductSearchFilter from './components/ProductSearchFilter';
import ProductCatalog from './components/ProductCatalog';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import PaymentGatewayModal from './components/PaymentGatewayModal';
import OrderHistory from './components/OrderHistory';

// Retrieve backend API base URL from Vite environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export default function App() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [timer, setTimer] = useState(300);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('shop');

  // Fetch products when search filters change
  useEffect(() => {
    fetchProducts();
  }, [search, category, minPrice, maxPrice, inStockOnly]);

  // Fetch orders on initial load
  useEffect(() => {
    fetchOrders();
  }, []);

  // Stock reservation countdown timer (5 minutes = 300s)
  useEffect(() => {
    let interval = null;
    if (activeOrder && activeOrder.status === 'RESERVED' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            handleAutoExpire();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeOrder, timer]);

  // Fetch Products API Call
  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category !== 'All') params.append('category', category);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (inStockOnly) params.append('in_stock', 'true');

      const res = await fetch(`${API_BASE_URL}/api/products/?${params.toString()}`);
      if (res.ok) setProducts(await res.json());
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  // Fetch Orders API Call
  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/`);
      if (res.ok) setOrders(await res.json());
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  // Cart Management Functions
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.available_stock) return prev;
        return prev.map((item) =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    });
    setMessage({ type: 'success', text: `Added ${product.name} to cart!` });
    setTimeout(() => setMessage(null), 3000);
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product_id !== productId));
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (product && newQuantity > product.available_stock) return;

    setCart((prev) =>
      prev.map((item) => (item.product_id === productId ? { ...item, quantity: newQuantity } : item))
    );
  };

  // Checkout API Call (Reserves Stock)
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const payload = {
        customer_id: 'guest_user',
        total_amount: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        items: cart.map((item) => ({
          product_id: Number(item.id || item.product_id),
          quantity: Number(item.quantity),
          unit_price: Number(item.price || item.unit_price || 0),
        })),
      };

      console.log('Sending Checkout Payload:', payload);

      // Prepend API_BASE_URL to hit the FastAPI backend on Vercel
      const res = await fetch(`${API_BASE_URL}/api/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.detail)
            ? data.detail.map((e) => `${e.loc.join('.')}: ${e.msg}`).join(', ')
            : data.detail || 'Checkout failed'
        );
      }

      // Order created and stock reserved successfully
      setActiveOrder(data);
      setCart([]);
      setIsCartOpen(false);
      setTimer(300); // Reset timer to 5 minutes
      setMessage({ type: 'success', text: `Stock reserved for 5 minutes! Order ID: ${data.id.slice(0, 8)}...` });
      fetchProducts();
      fetchOrders();
    } catch (err) {
      console.error('Checkout Error:', err);
      setMessage({ type: 'error', text: `Checkout Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Payment Processing API Call
  const handleProcessPayment = async (outcome) => {
    if (!activeOrder) return;
    setLoading(true);
    setMessage(null);
    try {
      const idempotencyKey = `PAY-${activeOrder.id}-${Date.now()}`;
      const res = await fetch(`${API_BASE_URL}/api/payments/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: activeOrder.id,
          idempotency_key: idempotencyKey,
          simulated_outcome: outcome,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Payment failed');

      setMessage({
        type: outcome === 'SUCCESS' ? 'success' : 'error',
        text: `Payment ${outcome}: Order ${data.id.slice(0, 8)} updated to ${data.status}.`,
      });
      setActiveOrder(null);
      setShowPaymentModal(false);
      fetchProducts();
      fetchOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Auto-Expire Reservation on Timeout
  const handleAutoExpire = async () => {
    if (!activeOrder) return;
    try {
      await fetch(`${API_BASE_URL}/api/payments/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: activeOrder.id,
          idempotency_key: `EXPIRE-${activeOrder.id}-${Date.now()}`,
          simulated_outcome: 'TIMEOUT',
        }),
      });
      setMessage({ type: 'error', text: 'Stock reservation expired. Items returned to inventory.' });
      setActiveOrder(null);
      setShowPaymentModal(false);
      fetchProducts();
      fetchOrders();
    } catch (err) {
      console.error('Auto-expire failed:', err);
    }
  };

  // Cancel Order API Call
  const handleCancelOrder = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Cancellation failed');

      setMessage({ type: 'success', text: `Order ${orderId.slice(0, 8)} cancelled.` });
      fetchProducts();
      fetchOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Refund Order API Call
  const handleRefundOrder = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/refund`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Refund failed');

      setMessage({ type: 'success', text: `Order ${orderId.slice(0, 8)} refunded.` });
      fetchProducts();
      fetchOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Helper to format countdown timer as MM:SS
  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#C6F0E4] text-[#171317] font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartItemCount={cart.reduce((total, item) => total + item.quantity, 0)}
        setIsCartOpen={setIsCartOpen}
      />

      <NotificationBanner message={message} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <ReservationBanner
          activeOrder={activeOrder}
          timer={timer}
          formatTimer={formatTimer}
          onOpenPaymentModal={() => setShowPaymentModal(true)}
        />

        {activeTab === 'shop' ? (
          <div>
            <ProductSearchFilter
              search={search}
              setSearch={setSearch}
              category={category}
              setCategory={setCategory}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              inStockOnly={inStockOnly}
              setInStockOnly={setInStockOnly}
            />
            <ProductCatalog
              products={products}
              onAddToCart={addToCart}
              onSelectProduct={setSelectedProduct}
            />
          </div>
        ) : (
          <OrderHistory
            orders={orders}
            onCancelOrder={handleCancelOrder}
            onRefundOrder={handleRefundOrder}
          />
        )}
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateCartQuantity}
        onCheckout={handleCheckout}
        loading={loading}
      />

      <ProductDetailModal
        selectedProduct={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <PaymentGatewayModal
        isOpen={showPaymentModal}
        activeOrder={activeOrder}
        timer={timer}
        formatTimer={formatTimer}
        onProcessPayment={handleProcessPayment}
        loading={loading}
      />
    </div>
  );
}