import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Navigation.css'; 

const Navigation = () => {
  const { auth, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/">Real-Time Collaboration Tool</Link>
        </div>
        <div className="navbar-links">
          {auth ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/editor" className="nav-link">Collaborative Editor</Link>
              <Link to="/profile" className="nav-link">Profile</Link>
              <Link to="/settings" className="nav-link">Settings</Link>
              <button className="logout-button" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/register" className="nav-link">Register</Link>
              <Link to="/login" className="nav-link">Login</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
