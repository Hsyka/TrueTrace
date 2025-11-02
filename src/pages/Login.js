import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Google Sign-In initialization
  useEffect(() => {
    /* global google */
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const res = await fetch(
            `${process.env.REACT_APP_API_URL}/api/auth/google-login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ idToken: response.credential }),
            }
          );
          const data = await res.json();
          if (res.ok) {
            localStorage.setItem("truetrace_user", JSON.stringify(data.user));
            window.location.href = "/";
          } else {
            alert(data.error || "Sign-in failed");
          }
        } catch (err) {
          console.error(err);
          alert("Network error");
        }
      },
    });

    window.google.accounts.id.renderButton(
      document.getElementById("googleSignInDiv"),
      {
        shape: "rectangular",
        theme: "outline",
        size: "large",
        text: "signin_with",
        logo_alignment: "left",
      }
    );

    window.google.accounts.id.prompt();
  }, []);

  // Email + password login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("truetrace_user", JSON.stringify(data.user));
        window.location.href = "/";
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setError("Network error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Login to TrueTrace
        </h1>

        {/* Google Sign-In */}
        <div className="flex justify-center mb-6">
          <div id="googleSignInDiv"></div>
        </div>

        <div className="flex items-center mb-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-3 text-gray-400 text-sm">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring focus:ring-blue-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring focus:ring-blue-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg py-2 transition"
          >
            Sign In
          </button>
        </form>

        {/* Footer */}
        <p className="mt-4 text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
