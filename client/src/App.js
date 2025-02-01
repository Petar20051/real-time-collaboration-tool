import React from 'react';
import { BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import CollaborativeEditorPage from './pages/CollaborativeEditorPage';
import Settings from './components/Settings';
import Profile from './components/Profile';
import Navigation from './components/Navigation';



function App() {
  return (
    <Router>
      <header>
        <Navigation/>
      </header>
      <main style={{ padding: '20px' }}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editor"
            element={
              <ProtectedRoute>
                <CollaborativeEditorPage />
              </ProtectedRoute>
            }
          />
           <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile/>
              </ProtectedRoute>
            }
          />
           <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
