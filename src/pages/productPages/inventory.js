import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI, healthCheck } from '../../services/api';

export default function Inventory() {
  // Backend state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState("checking");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Selection and editing state
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [addProductMode, setAddProductMode] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    price: 0,
    quantity: 0,
    imageUrl: ''
  });

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // NEW: Changes panel state
  const [changesOpen, setChangesOpen] = useState(false);          // NEW
  const [changes, setChanges] = useState([]);                     // NEW
  const [changesLoading, setChangesLoading] = useState(false);    // NEW
  const [changesError, setChangesError] = useState('');           // NEW
  const [expandedChangeIds, setExpandedChangeIds] = useState({}); // NEW

  // Settings state
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('viewMode') || 'table';
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  // Load products and check server on mount
  useEffect(() => {
    checkServerStatus();
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Store settings
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    localStorage.setItem('viewMode', viewMode);
  }, [darkMode, viewMode]);

  const checkServerStatus = async () => {
    try {
      await healthCheck();
      setServerStatus("connected");
    } catch {
      setServerStatus("disconnected");
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const items = await productAPI.getAllProducts();
      setProducts(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Failed to load products:", err);
      setError("Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // NEW: fetch changes feed
  const loadChanges = async () => { // NEW
    try {
      setChangesLoading(true);
      setChangesError('');
      const res = await fetch('/api/changes?table=products&limit=200', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Failed to load changes (${res.status})`);
      const data = await res.json();
      setChanges(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Changes load error:', e);
      setChanges([]);
      setChangesError(e.message || 'Failed to load changes');
    } finally {
      setChangesLoading(false);
    }
  };

  // NEW: open changes modal and load data
  const openChanges = () => { // NEW
    setChangesOpen(true);
    loadChanges();
  };

  const handleProductClick = (productId) => {
    setSelectedProductId(productId);
  };

  const handleEdit = () => {
    if (!selectedProductId) {
      setError("Please select a product to edit");
      return;
    }
    const product = products.find(p => p.id === selectedProductId);
    if (product) {
      setEditFormData({
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description || '',
        category: product.category || '',
        price: product.price,
        quantity: product.quantity,
        imageUrl: product.imageUrl || ''
      });
      setEditModalOpen(true);
    }
  };

  const handleDelete = () => {
    if (!selectedProductId) {
      setError("Please select a product to delete");
      return;
    }
    setDeleteModalOpen(true);
    setDeleteConfirmText("");
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmText !== "DELETE") {
      setError("Please type DELETE to confirm");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await productAPI.deleteProduct(selectedProductId);
      await loadProducts();
      setDeleteModalOpen(false);
      setSelectedProductId(null);
      setDeleteConfirmText("");
    } catch (err) {
      console.error("Failed to delete product:", err);
      setError(err.message || "Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setDeleteConfirmText("");
  };

  const handleAddProduct = () => {
    setAddProductMode(true);
    setNewProductData({
      name: '',
      sku: '',
      description: '',
      category: '',
      price: 0,
      quantity: 0,
      imageUrl: ''
    });
  };

  const handleAddProductConfirm = async () => {
    try {
      if (!newProductData.name || !newProductData.sku) {
        setError("Name and SKU are required fields");
        return;
      }

      setLoading(true);
      setError("");
      await productAPI.createProduct(newProductData);
      await loadProducts();
      setAddProductMode(false);
      setNewProductData({
        name: '',
        sku: '',
        description: '',
        category: '',
        price: 0,
        quantity: 0,
        imageUrl: ''
      });
    } catch (err) {
      console.error("Failed to create product:", err);
      setError(err.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProductCancel = () => {
    setAddProductMode(false);
    setNewProductData({
      name: '',
      sku: '',
      description: '',
      category: '',
      price: 0,
      quantity: 0,
      imageUrl: ''
    });
  };

  const handleEditConfirm = async () => {
    try {
      setLoading(true);
      setError("");

      if (!editFormData.name || !editFormData.sku) {
        setError("Name and SKU are required fields");
        setLoading(false);
        return;
      }

      const parsedPrice = parseFloat(editFormData.price);
      const parsedQty = parseInt(editFormData.quantity);

      if (isNaN(parsedPrice) || parsedPrice < 0) {
        setError("Please enter a valid positive price");
        setLoading(false);
        return;
      }

      if (isNaN(parsedQty) || parsedQty < 0) {
        setError("Please enter a valid positive quantity");
        setLoading(false);
        return;
      }

      await productAPI.updateProduct(editFormData.id, {
        name: editFormData.name,
        sku: editFormData.sku,
        description: editFormData.description,
        category: editFormData.category,
        price: parsedPrice,
        quantity: parsedQty,
        imageUrl: editFormData.imageUrl
      });

      await loadProducts();
      setEditModalOpen(false);
      setSelectedProductId(null);
      setEditFormData({});
    } catch (err) {
      console.error("Failed to update product:", err);
      setError(err.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditModalOpen(false);
    setEditFormData({});
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // NEW: toggle details in changes modal
  const toggleExpand = (id) => { // NEW
    setExpandedChangeIds((s) => ({ ...s, [id]: !s[id] }));
  };

  // NEW: pill color by action
  const actionPillClass = (action) => { // NEW
    const base = "px-2 py-0.5 rounded text-xs font-semibold";
    if (action === 'INSERT') return `${base} ${darkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-700'}`;
    if (action === 'UPDATE') return `${base} ${darkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-700'}`;
    return `${base} ${darkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-700'}`; // DELETE
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <header className={`fixed top-0 w-full ${darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white'} shadow-sm z-50 h-16 flex items-center`}>
        <div className="w-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
              <Link to="/">True Trace</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center space-x-2 ${
                serverStatus === "connected" ? "text-green-600" : "text-red-600"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  serverStatus === "connected" ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm">
                {serverStatus === "checking"
                  ? "Checking..."
                  : serverStatus === "connected"
                  ? "Backend Connected"
                  : "Backend Disconnected"}
              </span>
            </div>
            <button className={darkMode ? 'p-2 text-gray-300 hover:text-white' : 'p-2 text-gray-600 hover:text-gray-900'}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className="flex pt-16">
        <aside 
          className={`fixed left-0 top-16 h-[calc(100vh-4rem)] ${darkMode ? 'bg-gray-800 border-r border-gray-700' : 'bg-gray-700'} text-white transition-all duration-300 ${
            sidebarOpen ? 'w-80' : 'w-0'
          } overflow-hidden`}
        >
          <nav className="p-4 space-y-2">
  <button
    className={`w-full text-left px-4 py-3 ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'} rounded transition`}
  >
    Feature Option 1 (Main)
  </button>

  <button
    className={`w-full text-left px-4 py-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-600 hover:bg-gray-500'} rounded transition`}
  >
    Feature Option 2
  </button>

  <button
    className={`w-full text-left px-4 py-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-600 hover:bg-gray-500'} rounded transition`}
  >
    Feature Option 3
  </button>

  {/* NEW: Changes (Audit) */}
  <button
    onClick={() => { setSidebarOpen(false); openChanges(); }}
    className={`w-full flex items-center justify-between px-4 py-3 ${darkMode ? 'bg-indigo-700 hover:bg-indigo-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded transition`}
    title="View recent database changes"
  >
    <span className="flex items-center gap-2">
      {/* clock-history-ish icon */}
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0Z" />
      </svg>
      Changes (Audit)
    </span>
    <svg className="w-4 h-4 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  </button>
</nav>

        </aside>

        {/* Main Content */}
        <div 
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'ml-80' : 'ml-0'
          }`}
        >
          <div className="p-6 flex gap-6">
            {/* Main Table Section */}
            <div className={`flex-1 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
              {/* Action Bar */}
              <div className={`p-4 ${darkMode ? 'border-b border-gray-700' : 'border-b'} flex items-center gap-4`}>
                <button 
                  onClick={loadProducts}
                  className={darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
                  title="Refresh products"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>

                <button
                  onClick={handleEdit}
                  className={`px-6 py-2 ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-700 hover:bg-gray-800'} text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={!selectedProductId}
                >
                  Edit
                </button>

                <button
                  onClick={handleDelete}
                  className={`px-6 py-2 ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-700 hover:bg-gray-800'} text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={!selectedProductId}
                >
                  Delete
                </button>

                {/* NEW: Changes button */}
                <button
                  onClick={openChanges}
                  className={`px-6 py-2 ${darkMode ? 'bg-indigo-700 hover:bg-indigo-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded transition`}
                  title="Show recent database changes"
                >
                  Changes
                </button>

                <input
                  type="text"
                  placeholder="Search by name, SKU, or category"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`flex-1 px-4 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <button 
                  onClick={() => setSettingsOpen(true)}
                  className={darkMode ? 'p-2 text-gray-300 hover:text-white' : 'p-2 text-gray-600 hover:text-gray-900'}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756.426-1.756 2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>

              {/* Error Message */}
              {!loading && error && (
                <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              {/* Table / Grid */}
              <div className="overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading products...</span>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className={darkMode ? 'text-gray-500' : 'text-gray-400'}>
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0h8m-8 0l3-3 3 3" />
                      </svg>
                    </div>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                      {searchTerm ? 'No products found matching your search' : 'No products found in database'}
                    </p>
                  </div>
                ) : viewMode === 'table' ? (
                  <div className="p-4 space-y-3">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        className={`border rounded-lg p-4 transition-all cursor-pointer ${
                          selectedProductId === product.id
                            ? darkMode
                              ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                              : 'border-blue-500 bg-blue-50'
                            : darkMode 
                              ? 'border-gray-700 hover:border-gray-600 bg-gray-750' 
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <img
                            src={product.imageUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300"}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300";
                            }}
                          />
                          <div className="flex-1">
                            <h3 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {product.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                SKU: {product.sku} | Category: {product.category || "—"}
                              </span>
                              <span className="font-semibold text-green-600">
                                ${Number(product.price ?? 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className={`text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <div className="text-sm font-medium">Stock</div>
                            <div className="text-2xl font-bold">{product.quantity}</div>
                            <div className="text-xs text-gray-500">units</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        className={`border rounded-lg overflow-hidden transition-all cursor-pointer ${
                          selectedProductId === product.id
                            ? darkMode
                              ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                              : 'border-blue-500 bg-blue-50'
                            : darkMode 
                              ? 'border-gray-700 hover:border-gray-600 bg-gray-750' 
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={product.imageUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300"}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300";
                          }}
                        />
                        <div className="p-4">
                          <h3 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {product.name}
                          </h3>
                          {product.description && (
                            <p className={`text-sm mb-3 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {product.description}
                            </p>
                          )}
                          <div className="space-y-2">
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              <span className="font-medium">SKU:</span> {product.sku}
                            </div>
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              <span className="font-medium">Category:</span> {product.category || "—"}
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                              <span className="font-semibold text-green-600 text-lg">
                                ${Number(product.price ?? 0).toFixed(2)}
                              </span>
                              <div className={`text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <div className="text-xs font-medium">Stock</div>
                                <div className="text-xl font-bold">{product.quantity}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className={`w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
              {!addProductMode ? (
                <>
                  <button
                    onClick={handleAddProduct}
                    className={`w-full mb-6 px-4 py-3 ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-700 hover:bg-gray-800'} text-white rounded transition font-semibold`}>
                    Add new Product
                  </button>
                  <div className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Potential other content/ in-depth filtering
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Add New Product
                  </h3>
                  {/* (form unchanged) */}
                  {/* ... all your inputs ... */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal - unchanged */}
      {deleteModalOpen && (
        /* ... your existing modal code ... */
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {/* (unchanged content) */}
        </div>
      )}

      {/* Edit Modal - unchanged */}
      {editModalOpen && (
        /* ... your existing modal code ... */
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {/* (unchanged content) */}
        </div>
      )}

      {/* NEW: Changes Modal */}
      {changesOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-[900px] max-h-[85vh] overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Changes</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadChanges}
                  className={darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
                  title="Refresh changes"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => setChangesOpen(false)}
                  className={`px-3 py-1.5 rounded ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {changesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading changes…</span>
                </div>
              ) : changesError ? (
                <div className={`p-3 rounded border ${darkMode ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {changesError}
                </div>
              ) : changes.length === 0 ? (
                <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>No recent changes.</div>
              ) : (
                <div className="space-y-3">
                  {changes.map((c) => (
                    <div key={c.id} className={`rounded border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className={actionPillClass(c.action)}>{c.action}</span>
                            <span className={darkMode ? 'text-gray-200' : 'text-gray-900'}>{c.table_name}</span>
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>row #{c.row_pk}</span>
                          </div>
                          <div className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            by <span className="font-medium">{c.actor_name || 'Unknown'}</span>
                            {c.actor_email ? <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}> ({c.actor_email})</span> : null}
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}> • {new Date(c.changed_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleExpand(c.id)}
                          className={`text-sm px-3 py-1.5 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                        >
                          {expandedChangeIds[c.id] ? 'Hide Details' : 'Show Details'}
                        </button>
                      </div>
                      {expandedChangeIds[c.id] && (
                        <div className={`px-4 pb-4 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className={`text-xs uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Old</div>
                              <pre className={`text-xs p-3 rounded overflow-x-auto ${darkMode ? 'bg-gray-900/60 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                                {JSON.stringify(c.old_data, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <div className={`text-xs uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>New</div>
                              <pre className={`text-xs p-3 rounded overflow-x-auto ${darkMode ? 'bg-gray-900/60 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                                {JSON.stringify(c.new_data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal - unchanged */}
      {settingsOpen && (
        /* ... your existing modal code ... */
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {/* (unchanged content) */}
        </div>
      )}
    </div>
  );
}
