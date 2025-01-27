import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Profile from './components/Profile';

function App() {
  return (
    <Router>
      <header>
        <nav>
          <Link to="/register">Register</Link>
          <Link to="/login">Login</Link>
          <Link to="/profile">Profile</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
