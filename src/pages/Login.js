import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Hardcoded test credentials
  const TEST_EMAIL = "test@example.com";
  const TEST_PASSWORD = "password123";

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
            navigate("/inventory");
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
  }, [navigate]);

  // Email + password login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Check hardcoded credentials first
    if (email === TEST_EMAIL && password === TEST_PASSWORD) {
      const testUser = {
        id: "test-user-123",
        email: TEST_EMAIL,
        name: "Test User"
      };
      localStorage.setItem("truetrace_user", JSON.stringify(testUser));
      navigate("/inventory");
      return;
    }

    // If not test credentials, try actual API
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
        navigate("/inventory");
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

        {/* Test Credentials Info */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs font-semibold text-yellow-800 mb-1">Test Credentials:</p>
          <p className="text-xs text-yellow-700">Email: {TEST_EMAIL}</p>
          <p className="text-xs text-yellow-700">Password: {TEST_PASSWORD}</p>
        </div>

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
              <Link to="/" className="text-blue-500 hover:text-blue-600 font-medium text-sm">Forgot Password?</Link>
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
          Don't have an account?{" "}
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