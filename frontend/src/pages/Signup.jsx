import React , { useState } from 'react'
import { signup } from "../services/authService.js"
import { Link , useNavigate} from 'react-router-dom'; 
const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit =async (e) => {
    e.preventDefault(); 
    console.log(" [SIGNUP DEBUG 1] Submit hit! Sending this payload:", formData);
    try {
      const response = await signup(formData);
      console.log("Backend response completely received:", response);
      if (response.status === 201) {
        alert(" Account successfully created!");
        navigate("/login");
      }
    } catch (error) {
      
      console.error("Signup failed:", error);
      alert(error.response?.data?.message || "internal server error!");
    }
  };


  return (
    
    <div className="min-h-screen flex items-center justify-center bg-gray-50 ">
      
      <div className="w-full max-w-96 bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 text-center mb-4">Create Account</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input 
              type="text"
              name="name"
              value={formData.name} 
              onChange={handleChange}
              placeholder="Enter username" 
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm  focus:border-blue-500" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email" 
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm  focus:border-blue-500" 
              required
            />  
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password" 
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm  focus:border-blue-500" 
              required
            />
          </div>

          {/* Submit Button */}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded text-sm mt-2">
            Sign Up
          </button>
        </form>
        <p className="text-sm text-center text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">Log In</Link>
        </p>
      </div>

    </div>
  );
};

export default Signup;
