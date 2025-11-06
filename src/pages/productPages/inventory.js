import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('table');

  const [darkMode, setDarkMode] = useState(()=> {
    const saved = sessionStorage.getItem('darkMode');
    return saved === 'true';
  });
  useEffect(()=>{
    sessionStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

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
            <button className={`w-full text-left px-4 py-3 ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'} rounded transition`}>
              Feature Option 1 (Main)
            </button>
            <button className={`w-full text-left px-4 py-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-600 hover:bg-gray-500'} rounded transition`}>
              Feature Option 2
            </button>
            <button className={`w-full text-left px-4 py-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-600 hover:bg-gray-500'} rounded transition`}>
              Feature Option 3
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
                <button className={darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={handleEdit}
                  className={`px-6 py-2 ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-700 hover:bg-gray-800'} text-white rounded transition`}
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className={`px-6 py-2 ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-700 hover:bg-gray-800'} text-white rounded transition`}
                >
                  Delete
                </button>
                <input
                  type="text"
                  placeholder="Search Box"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`flex-1 px-4 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <button className={`px-4 py-2 ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-700 hover:bg-gray-800'} text-white rounded transition`}>
                 Search
                </button>
                <button 
                  onClick={() => setSettingsOpen(true)}
                  className={darkMode ? 'p-2 text-gray-300 hover:text-white' : 'p-2 text-gray-600 hover:text-gray-900'}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-hidden p-4">
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} px-6 py-3 border-b ${darkMode ? 'border-gray-600' : ''}`}>
                  <div className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Header</div>
                </div>
                {items.map((item) => (
                  <div key={item.id} className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <div className={darkMode ? 'text-gray-200' : 'text-gray-700'}>{item.name} | {item.info}</div>
                  </div>
                ))}
                    <div className={`p-12 text-center text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Table Content
              </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className={`w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
              <button
                onClick={handleAddProduct}
                className={`w-full mb-6 px-4 py-3 ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-700 hover:bg-gray-800'} text-white rounded transition font-semibold`}
              >
                Add new Product
              </button>
              <div className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Potential other content/ in-depth filtering
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-96 max-h-[80vh] overflow-hidden`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : ''} flex items-center justify-between`}>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : ''}`}>Settings</h2>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                <div>
                  <h3 className={`font-medium mb-3 ${darkMode ? 'text-white' : ''}`}>Display</h3>
                  
                  {/* View Slider */}
                    <div className="flex items-center justify-between py-1">
                      <span className={darkMode ? 'text-gray-300' : ''}>View</span>
                      <div className='flex items-center gap-2'>

                        {/* Label */}
                        <span className={`text-sm ${viewMode === 'table' ? (darkMode ? 'text-white' : 'text-gray-900') : 'text-gray-400'} `}>
                          Table
                        </span>

                        {/* Slider toggle */}
                        <button onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')} className={`relative w-14 h-7 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-blue-600' : 'bg-gray-300'}`}>
                          <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${viewMode === 'grid' ? 'translate-x-7' : 'translate-x-0'}`}/>
                        </button>

                        {/* Label */}
                        <span className={`text-sm ${viewMode === 'grid' ? (darkMode ? 'text-white' : 'text-gray-900') : 'text-gray-400'}`}>
                          Grid
                        </span>
                      </div>
                    </div>

                  {/* Theme Slider */}
                  <div className="flex items-center justify-between py-2">
                    <span className={darkMode ? 'text-gray-300' : ''}>Theme</span>
                    <div className="flex items-center gap-2">
                      
                      {/* Label */}
                      <span className={`text-sm ${!darkMode ? darkMode ? 'text-white' : 'text-gray-900' : 'text-gray-400'}`}>
                        Light
                      </span>

                      {/* Slider toggle */}
                      <button onClick={() => setDarkMode(!darkMode)} className={`relative w-14 h-7 rounded-full transition-colors ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
                        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-0'}`}/>
                      </button>

                      {/* Label */}
                      <span className={`text-sm ${darkMode ? darkMode ? 'text-white' : 'text-gray-900' : 'text-gray-400'}`}>
                        Dark
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`px-6 py-4 border-t ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'} flex justify-end gap-2`}>
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}