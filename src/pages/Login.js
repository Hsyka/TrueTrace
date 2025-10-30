import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEffect } from "react";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: Replace with real auth call
    console.log('Login attempt', { email, password });
  };
    useEffect(() => {
  /* global google */
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  if (window.google) {
    console.log("GIS clientId:", process.env.REACT_APP_GOOGLE_CLIENT_ID);
    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
    });

    // Show the One Tap prompt
    google.accounts.id.prompt();

    // Render a visible Google button
    google.accounts.id.renderButton(
      document.getElementById("gsi-btn"),
      {
        type: "standard",
        shape: "pill",
        theme: "outline",
        size: "large",
        text: "continue_with",
        logo_alignment: "left",
      }
    );
  }
}, []);

function handleCredentialResponse(response) {
  fetch("/api/auth/google-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: response.credential }),
  })
    .then((res) => res.json())
    .then((data) => {
      localStorage.setItem("truetrace_user", JSON.stringify(data.user));
      window.location.href = "/";
    })
    .catch(console.error);
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
    {/* Main Header - Always visible */}
      <header className="fixed top-0 w-full bg-white shadow-sm z-50 transition-all h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
        {/* Top Title/Logo */}
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            <Link to="/">True Trace</Link>
          </div>
        </div>
      </header>
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Login to True Trace</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <div id="gsi-btn" className="flex justify-center mt-4"></div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Sign in
          </button>
          <div className="flex items-center justify-between text-sm mt-2">
            <Link to="/" className="text-blue-600 hover:underline">Forgot password?</Link>
            <Link to="/signup" className="text-blue-600 hover:underline">Create account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}