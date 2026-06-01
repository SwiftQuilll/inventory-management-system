import React, { useState, useEffect } from 'react';
import { productAPI, customerAPI, orderAPI } from './api';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Notification States
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form Field Tracking States
  const [productForm, setProductForm] = useState({ name: '', sku: '', price: '', stock: '' });
  const [customerForm, setCustomerForm] = useState({ name: '', email: '' });
  const [orderForm, setOrderForm] = useState({ customer_id: '', product_id: '', quantity: 1 });

  // Load database tables on app mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, custRes, orderRes] = await Promise.all([
        productAPI.getAll(),
        customerAPI.getAll(),
        orderAPI.getAll()
      ]);
      setProducts(prodRes.data);
      setCustomers(custRes.data);
      setOrders(orderRes.data);
    } catch (err) {
      showNotification('Error contacting database services', 'danger');
    }
  };

  const showNotification = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // Submission Handlers
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await productAPI.create(productForm);
      showNotification('Product registered successfully!', 'success');
      setProductForm({ name: '', sku: '', price: '', stock: '' });
      fetchData();
    } catch (err) {
      showNotification(err.response?.data?.detail || 'SKU must be unique', 'danger');
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      await customerAPI.create(customerForm);
      showNotification('Customer registered successfully!', 'success');
      setCustomerForm({ name: '', email: '' });
      fetchData();
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Email must be unique', 'danger');
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    try {
      const orderPayload = {
        customer_id: parseInt(orderForm.customer_id),
        items: [{
          product_id: parseInt(orderForm.product_id),
          quantity: parseInt(orderForm.quantity)
        }]
      };
      await orderAPI.create(orderPayload);
      showNotification('Order submitted, stock deducted successfully!', 'success');
      fetchData();
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Order execution failed', 'danger');
    }
  };

  return (
    <div className="dashboard-container">
      <header>
        <h2>Inventory & Order Management Workspace</h2>
        <div className="nav-tabs">
          <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>Products</button>
          <button className={activeTab === 'customers' ? 'active' : ''} onClick={() => setActiveTab('customers')}>Customers</button>
          <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>Place Order</button>
        </div>
      </header>

      {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      {activeTab === 'products' && (
        <div className="grid-layout">
          <div className="card">
            <h3>Add New Product</h3>
            <form onSubmit={handleProductSubmit}>
              <div className="form-group"><label>Name</label><input type="text" required value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} /></div>
              <div className="form-group"><label>SKU</label><input type="text" required value={productForm.sku} onChange={(e) => setProductForm({...productForm, sku: e.target.value})} /></div>
              <div className="form-group"><label>Price ($)</label><input type="number" step="0.01" required value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} /></div>
              <div className="form-group"><label>Stock Level</label><input type="number" required value={productForm.stock} onChange={(e) => setProductForm({...productForm, stock: e.target.value})} /></div>
              <button className="btn-submit" type="submit">Save Product</button>
            </form>
          </div>
          <div className="card">
            <h3>Current Inventory Items</h3>
            <table>
              <thead><tr><th>SKU</th><th>Name</th><th>Price</th><th>Stock Left</th></tr></thead>
              <tbody>
                {products.map(p => <tr key={p.id}><td>{p.sku}</td><td>{p.name}</td><td>${p.price}</td><td>{p.stock}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="grid-layout">
          <div className="card">
            <h3>Register Customer</h3>
            <form onSubmit={handleCustomerSubmit}>
              <div className="form-group"><label>Full Name</label><input type="text" required value={customerForm.name} onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})} /></div>
              <div className="form-group"><label>Email Address</label><input type="email" required value={customerForm.email} onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})} /></div>
              <button className="btn-submit" type="submit">Save Profile</button>
            </form>
          </div>
          <div className="card">
            <h3>Customer Directory</h3>
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Email</th></tr></thead>
              <tbody>
                {customers.map(c => <tr key={c.id}><td>{c.id}</td><td>{c.name}</td><td>{c.email}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="grid-layout">
          <div className="card">
            <h3>Create Order</h3>
            <form onSubmit={handleOrderSubmit}>
              <div className="form-group">
                <label>Select Customer</label>
                <select required value={orderForm.customer_id} onChange={(e) => setOrderForm({...orderForm, customer_id: e.target.value})}>
                  <option value="">-- Choose Profile --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Select Product</label>
                <select required value={orderForm.product_id} onChange={(e) => setOrderForm({...orderForm, product_id: e.target.value})}>
                  <option value="">-- Choose Item --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (In Stock: {p.stock})</option>)}
                </select>
              </div>
              <div className="form-group"><label>Quantity</label><input type="number" min="1" required value={orderForm.quantity} onChange={(e) => setOrderForm({...orderForm, quantity: e.target.value})} /></div>
              <button className="btn-submit" type="submit">Dispatch Order</button>
            </form>
          </div>
          <div className="card">
            <h3>Order Log History</h3>
            <table>
              <thead><tr><th>Order ID</th><th>Customer ID</th><th>Total Value</th></tr></thead>
              <tbody>
                {orders.map(o => <tr key={o.id}><td>{o.id}</td><td>{o.customer_id}</td><td>${o.total_price.toFixed(2)}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;