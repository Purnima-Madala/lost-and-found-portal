import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadItem from './pages/UploadItem';
import ItemDetails from './pages/ItemDetails';
import MyClaims from './pages/MyClaims';
import Chat from './pages/Chat';
import LostItems from './pages/LostItems';

// Add this route:


function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/upload" element={<PrivateRoute><UploadItem /></PrivateRoute>} />
                <Route path="/item/:id" element={<PrivateRoute><ItemDetails /></PrivateRoute>} />
                <Route path="/my-claims" element={<PrivateRoute><MyClaims /></PrivateRoute>} />
                <Route path="/chat/:userId" element={<PrivateRoute><Chat /></PrivateRoute>} />
                <Route path="/lost-items" element={<PrivateRoute><LostItems /></PrivateRoute>} />
                <Route path="*" element={<Navigate to="/" />} />
                
              </Routes>
            </main>
            <Toaster position="top-right" />
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;