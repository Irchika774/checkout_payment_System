
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

// ==========================================
// BACKEND API
// ==========================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://checkout-payment-system-mh5f.vercel.app';

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

  // ==========================================
  // FETCH PRODUCTS
  // ==========================================

  useEffect(() => {
    fetchProducts();
  }, [search, category, minPrice, maxPrice, inStockOnly]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();

      if (search) {
        params.append('search', search);
      }

      if (category !== 'All') {
        params.append('category', category);
      }

      if (minPrice) {
        params.append('min_price', minPrice);
      }

      if (maxPrice) {
        params.append('max_price', maxPrice);
      }

      if (inStockOnly) {
        params.append('in_stock', 'true');
      }

      const url =
        `${API_BASE_URL}/api/products/?${params.toString()}`;

      console.log('Fetching products from:', url);

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(
          `Products API error: ${res.status}`
        );
      }

      const data = await res.json();

      console.log('Products received:', data);

      setProducts(data);
    } catch (err) {
      console.error(
        'Failed to fetch products:',
        err
      );

      setMessage({
        type: 'error',
        text: 'Unable to load products. Please try again.',
      });
    }
  };

  // ==========================================
  // FETCH ORDERS
  // ==========================================

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const url =
        `${API_BASE_URL}/api/orders/`;

      console.log('Fetching orders from:', url);

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(
          `Orders API error: ${res.status}`
        );
      }

      const data = await res.json();

      console.log('Orders received:', data);

      setOrders(data);
    } catch (err) {
      console.error(
        'Failed to fetch orders:',
        err
      );
    }
  };

  // ==========================================
  // RESERVATION TIMER
  // ==========================================

  useEffect(() => {
    let interval = null;

    if (
      activeOrder &&
      activeOrder.status === 'RESERVED' &&
      timer > 0
    ) {
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

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeOrder, timer]);

  // ==========================================
  // ADD TO CART
  // ==========================================

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.product_id === product.id
      );

      if (existing) {
        if (
          existing.quantity >=
          product.available_stock
        ) {
          return prev;
        }

        return prev.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item
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

    setMessage({
      type: 'success',
      text: `Added ${product.name} to cart!`,
    });

    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  // ==========================================
  // UPDATE CART QUANTITY
  // ==========================================

  const updateCartQuantity = (
    productId,
    newQuantity
  ) => {
    if (newQuantity <= 0) {
      setCart((prev) =>
        prev.filter(
          (item) =>
            item.product_id !== productId
        )
      );

      return;
    }

    const product = products.find(
      (p) => p.id === productId
    );

    if (
      product &&
      newQuantity > product.available_stock
    ) {
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              quantity: newQuantity,
            }
          : item
      )
    );
  };

  // ==========================================
  // CHECKOUT
  // ==========================================

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setMessage({
        type: 'error',
        text: 'Your cart is empty.',
      });

      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        customer_id: 'guest_user',

        items: cart.map((item) => ({
          product_id: Number(
            item.product_id
          ),
          quantity: Number(
            item.quantity
          ),
        })),
      };

      console.log(
        'Sending Checkout Payload:',
        payload
      );

      const url =
        `${API_BASE_URL}/api/orders/checkout`;

      console.log(
        'Checkout URL:',
        url
      );

      // IMPORTANT:
      // Use backend URL, not /api/orders/checkout
      const res = await fetch(url, {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify(payload),
      });

      const data = await res.json();

      console.log(
        'Checkout Response:',
        data
      );

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.detail)
            ? data.detail
                .map(
                  (e) =>
                    `${e.loc.join('.')}: ${e.msg}`
                )
                .join(', ')
            : data.detail ||
                'Checkout failed'
        );
      }

      setActiveOrder(data);

      setCart([]);

      setTimer(300);

      setIsCartOpen(false);

      setMessage({
        type: 'success',
        text:
          `Stock reserved! Order ID: ` +
          `${data.id.slice(0, 8)}...`,
      });

      await fetchProducts();
      await fetchOrders();
    } catch (err) {
      console.error(
        'Checkout Error:',
        err
      );

      setMessage({
        type: 'error',
        text:
          err.message ||
          'Checkout failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // PROCESS PAYMENT
  // ==========================================

  const handleProcessPayment = async (
    outcome
  ) => {
    if (!activeOrder) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const idempotencyKey =
        `PAY-${activeOrder.id}-${Date.now()}`;

      const url =
        `${API_BASE_URL}/api/payments/process`;

      console.log(
        'Payment URL:',
        url
      );

      console.log(
        'Payment outcome:',
        outcome
      );

      const res = await fetch(url, {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          order_id:
            activeOrder.id,

          idempotency_key:
            idempotencyKey,

          simulated_outcome:
            outcome,
        }),
      });

      const data = await res.json();

      console.log(
        'Payment Response:',
        data
      );

      if (!res.ok) {
        throw new Error(
          data.detail ||
            'Payment failed'
        );
      }

      setMessage({
        type:
          outcome === 'SUCCESS'
            ? 'success'
            : 'error',

        text:
          `Payment ${outcome}: ` +
          `Order ${data.id.slice(0, 8)} ` +
          `updated to ${data.status}.`,
      });

      setActiveOrder(null);

      setShowPaymentModal(false);

      await fetchProducts();
      await fetchOrders();
    } catch (err) {
      console.error(
        'Payment Error:',
        err
      );

      setMessage({
        type: 'error',
        text:
          err.message ||
          'Payment failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // AUTOMATIC EXPIRATION
  // ==========================================

  const handleAutoExpire = async () => {
    if (!activeOrder) {
      return;
    }

    try {
      const url =
        `${API_BASE_URL}/api/payments/process`;

      const res = await fetch(url, {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          order_id:
            activeOrder.id,

          idempotency_key:
            `EXPIRE-${activeOrder.id}-${Date.now()}`,

          simulated_outcome:
            'TIMEOUT',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.detail ||
            'Auto-expiration failed'
        );
      }

      console.log(
        'Auto-expire response:',
        data
      );

      setMessage({
        type: 'error',
        text:
          'Stock reservation expired.',
      });

      setActiveOrder(null);

      setShowPaymentModal(false);

      await fetchProducts();
      await fetchOrders();
    } catch (err) {
      console.error(
        'Auto-expire failed:',
        err
      );

      setMessage({
        type: 'error',
        text:
          err.message ||
          'Reservation expiration failed.',
      });
    }
  };

  // ==========================================
  // CANCEL ORDER
  // ==========================================

  const handleCancelOrder = async (
    orderId
  ) => {
    try {
      const url =
        `${API_BASE_URL}/api/orders/${orderId}/cancel`;

      const res = await fetch(url, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.detail ||
            'Cancellation failed'
        );
      }

      setMessage({
        type: 'success',
        text:
          `Order ${orderId.slice(0, 8)} cancelled.`,
      });

      await fetchProducts();
      await fetchOrders();
    } catch (err) {
      console.error(
        'Cancel Error:',
        err
      );

      setMessage({
        type: 'error',
        text:
          err.message ||
          'Cancellation failed.',
      });
    }
  };

  // ==========================================
  // REFUND ORDER
  // ==========================================

  const handleRefundOrder = async (
    orderId
  ) => {
    try {
      const url =
        `${API_BASE_URL}/api/orders/${orderId}/refund`;

      const res = await fetch(url, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.detail ||
            'Refund failed'
        );
      }

      setMessage({
        type: 'success',
        text:
          `Order ${orderId.slice(0, 8)} refunded.`,
      });

      await fetchProducts();
      await fetchOrders();
    } catch (err) {
      console.error(
        'Refund Error:',
        err
      );

      setMessage({
        type: 'error',
        text:
          err.message ||
          'Refund failed.',
      });
    }
  };

  // ==========================================
  // FORMAT TIMER
  // ==========================================

  const formatTimer = (secs) => {
    const m =
      Math.floor(secs / 60);

    const s =
      secs % 60;

    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-[#C6F0E4] text-[#171317] font-sans">

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartItemCount={cart.reduce(
          (total, item) =>
            total + item.quantity,
          0
        )}
        setIsCartOpen={setIsCartOpen}
      />

      <NotificationBanner
        message={message}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">

        <ReservationBanner
          activeOrder={activeOrder}
          timer={timer}
          formatTimer={formatTimer}
          onOpenPaymentModal={() =>
            setShowPaymentModal(true)
          }
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
              onSelectProduct={
                setSelectedProduct
              }
            />

          </div>
        ) : (
          <OrderHistory
            orders={orders}
            onCancelOrder={
              handleCancelOrder
            }
            onRefundOrder={
              handleRefundOrder
            }
          />
        )}

      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() =>
          setIsCartOpen(false)
        }
        cart={cart}
        onUpdateQuantity={
          updateCartQuantity
        }
        onCheckout={
          handleCheckout
        }
        loading={loading}
      />

      <ProductDetailModal
        selectedProduct={
          selectedProduct
        }
        onClose={() =>
          setSelectedProduct(null)
        }
      />

      <PaymentGatewayModal
        isOpen={showPaymentModal}
        activeOrder={activeOrder}
        timer={timer}
        formatTimer={formatTimer}
        onProcessPayment={
          handleProcessPayment
        }
        loading={loading}
      />

    </div>
  );
}

