import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Package, Upload, User, LogOut } from 'lucide-react';
import Notifications from './Notifications';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-blue-600" />
            <span className="font-bold text-xl text-gray-800">Lost & Found</span>
          </Link>
          
          {user && (
            <div className="flex items-center space-x-4">
              <Link to="/upload" className="flex items-center space-x-1 text-gray-600 hover:text-blue-600">
                <Upload className="h-5 w-5" />
                <span>Report Found</span>
              </Link>
              <Link to="/my-claims" className="text-gray-600 hover:text-blue-600">
                My Claims
              </Link>
              <Link to="/lost-items" className="text-gray-600 hover:text-blue-600">
                Lost Items
              </Link>
              <Notifications />
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-gray-600">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;