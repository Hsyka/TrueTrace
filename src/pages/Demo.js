import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Demo() {



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
    {/* Main Header - Always visible */}
      <header className="fixed top-0 w-full bg-white shadow-sm z-50 transition-all h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
        {/* Top Title/Logo */}
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            <Link to='/'>True Trace</Link>
          </div>
        </div>
      </header>
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Demo Page</h1>
      </div>
    </div>
  );
}