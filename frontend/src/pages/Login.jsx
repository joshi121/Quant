import React , { useState } from 'react'
import { login } from "../services/authService.js"
import { Link, useNavigate } from 'react-router-dom'; 
const Login = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted! Sending data:", loginData);
    try {
      const response = await login(loginData);
      console.log(response);
      if (response.status ===200) {
        alert("Login Successful!");
        const hostData = response.data.user; 
        localStorage.setItem("host_user", JSON.stringify(hostData));
        navigate("/");
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert(error.response?.data?.message || "Invalid credentials or server error!");
    }
  };
  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
      
      <div className="w-full max-w-sm bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 text-center mb-6">Welcome Back</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              name="email"
              value={loginData.email}
              onChange={handleChange}
              placeholder="Enter your email" 
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" 
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              name="password"
              value={loginData.password}
              onChange={handleChange}
              placeholder="Enter your password" 
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" 
              required

            />
          </div>

          {/* Submit Button */}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded text-sm mt-2 transition-colors">
            Log In
          </button>
        </form>
        <p className="text-sm text-center text-gray-600 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">Sign Up</Link>
        </p>
      </div>

    </div>
    
  )
}

export default Login
