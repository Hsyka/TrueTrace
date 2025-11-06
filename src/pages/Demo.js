import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productAPI, healthCheck } from "../services/api";

export default function Demo() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState("checking");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    checkServerStatus();
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkServerStatus = async () => {
    try {
      await healthCheck(); // should call /api/ping under the hood
      setServerStatus("connected");
    } catch {
      setServerStatus("disconnected");
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");
      // 🔧 getAllProducts now returns an ARRAY (from /api/products)
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

  const handleStockUpdate = async (productId, operation, amount) => {
    try {
      setLoading(true);
      setError("");
      await productAPI.updateStock(productId, operation, amount);
      await loadProducts(); // Reload products to get updated quantities
    } catch (err) {
      console.error("Stock update error:", err);
      setError(err.message || "Failed to update stock");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectEdit = async (productId, newQuantity) => {
    try {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const parsedQty = parseInt(newQuantity);
      if (isNaN(parsedQty) || parsedQty < 0) {
        setError("Please enter a valid positive number");
        return;
      }

      setLoading(true);
      setError("");
      
      // Use "set" operation to directly set the quantity
      await productAPI.updateStock(productId, "set", parsedQty);
      await loadProducts();
      setEditingId(null);
    } catch (err) {
      console.error("Direct edit error:", err);
      setError(err.message || "Failed to update quantity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            <Link to="/">True Trace</Link>
          </div>
          <div className="flex items-center space-x-4">
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
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Demo</h1>

        {/* Products from Database */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-6">Products from Database</h2>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <span className="ml-2 text-gray-600">Loading products...</span>
            </div>
          )}

          {!loading && error && (
            <div className="text-red-600 text-sm mb-4">{error}</div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0h8m-8 0l3-3 3 3"
                  />
                </svg>
              </div>
              <p className="text-gray-500">No products found in database</p>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-4 hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={
                        product.imageUrl ||
                        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300"
                      }
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300";
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-gray-600">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-500">
                          SKU: {product.sku} | Category:{" "}
                          {product.category || "—"}
                        </span>
                        <span className="font-semibold text-green-600">
                          $
                          {Number(product.price ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stock Control Section */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Stock Quantity:
                      </span>
                      <div className="flex items-center space-x-2">
                        {/* Decrease Button */}
                        <button
                          onClick={() => handleStockUpdate(product.id, "remove", 1)}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={loading || product.quantity === 0}
                          title="Decrease stock by 1"
                        >
                          −
                        </button>

                        {/* Editable Quantity Display */}
                        {editingId === product.id ? (
                          <div className="relative inline-block">
                            <input
                              type="number"
                              min="0"
                              defaultValue={product.quantity}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => {
                                if (editValue !== "") {
                                  handleDirectEdit(product.id, editValue);
                                } else {
                                  setEditingId(null);
                                }
                              }}
                              onKeyPress={(e) => {
                                if (e.key === "Enter" && editValue !== "") {
                                  handleDirectEdit(product.id, editValue);
                                }
                              }}
                              className="w-24 text-center border border-blue-300 rounded-md pr-12 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                              units
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(product.id);
                              setEditValue(product.quantity.toString());
                            }}
                            className="px-4 py-1 cursor-pointer hover:bg-gray-100 rounded-md min-w-[100px] text-center border border-gray-300 transition-colors"
                            disabled={loading}
                            title="Click to edit quantity"
                          >
                            <span className="font-medium">{product.quantity}</span>
                            <span className="text-xs text-gray-500 ml-1">units</span>
                          </button>
                        )}

                        {/* Increase Button */}
                        <button
                          onClick={() => handleStockUpdate(product.id, "add", 1)}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={loading}
                          title="Increase stock by 1"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
