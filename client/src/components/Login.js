// src/components/Login.js
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/api'; 
import { AuthContext } from '../context/AuthContext';
import '../styles/Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const { login: loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(formData);
      // Pass only the token string to loginUser
      loginUser(data.token);
      navigate('/dashboard');
    } catch (error) {
      if (error.response) {
        // Server responded with a status code outside the 2xx range
        console.error('Login failed:', error.response.data.message);
      } else if (error.request) {
        // No response received from server
        console.error('No response from server:', error.request);
      } else {
        // Other errors
        console.error('Error during login:', error.message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
