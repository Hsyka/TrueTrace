import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [items, setItems] = useState([
    { id: 1, name: 'Item 1', info: 'Info' },
    { id: 2, name: 'Item 2', info: 'Info' },
    { id: 3, name: 'Item 3', info: 'Info' }
  ]);

  const handleEdit = () => {
    console.log('Edit clicked');
  };

  const handleDelete = () => {
    console.log('Delete clicked');
  };

  const handleAddProduct = () => {
    console.log('Add new product clicked');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header - Same as other pages */}
      <header className="fixed top-0 w-full bg-white shadow-sm z-50 h-16 flex items-center">
        <div className="w-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
              True Trace
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition">
              Search
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout with Sidebar */}
      <div className="flex pt-16">
        {/* Collapsible Sidebar */}
        <aside 
          className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gray-700 text-white transition-all duration-300 ${
            sidebarOpen ? 'w-80' : 'w-0'
          } overflow-hidden`}
        >
          <nav className="p-4 space-y-2">
            <button className="w-full text-left px-4 py-3 bg-gray-500 rounded hover:bg-gray-600 transition">
              Feature Option 1 (Main)
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-600 rounded hover:bg-gray-500 transition">
              Feature Option 2
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-600 rounded hover:bg-gray-500 transition">
              Feature Option 3
            </button>
          </nav>
          <div className="absolute bottom-0 left-0 right-0 p-6 text-center text-gray-400 border-t border-gray-600">
            Nav bar
          </div>
        </aside>

        {/* Main Content */}
        <div 
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'ml-80' : 'ml-0'
          }`}
        >
          <div className="p-6 flex gap-6">
            {/* Main Table Section */}
            <div className="flex-1 bg-white rounded-lg shadow">
              {/* Action Bar */}
              <div className="p-4 border-b flex items-center gap-4">
                <button className="text-gray-600 hover:text-gray-900">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={handleEdit}
                  className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition"
                >
                  Delete
                </button>
                <input
                  type="text"
                  placeholder="Search Box"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Table */}
              <div className="overflow-hidden">
                <div className="bg-gray-200 px-6 py-3 border-b">
                  <div className="font-semibold text-gray-700">Header</div>
                </div>
                {items.map((item) => (
                  <div key={item.id} className="px-6 py-4 border-b hover:bg-gray-50">
                    <div className="text-gray-700">{item.name} | {item.info}</div>
                  </div>
                ))}
              </div>

              {/* Table Content Area */}
              <div className="p-12 text-center text-gray-500 text-lg">
                Table Content
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-64 bg-white rounded-lg shadow p-6">
              <button
                onClick={handleAddProduct}
                className="w-full mb-6 px-4 py-3 bg-gray-700 text-white rounded hover:bg-gray-800 transition font-semibold"
              >
                Add new Product
              </button>
              <div className="text-sm text-gray-600 text-center">
                Potential other content/ in-depth filtering
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}