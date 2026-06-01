import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import API_URL from '../config';
import { Trash2 } from 'lucide-react';

const MyClaims = () => {
  const [claims, setClaims] = useState([]);
  const [found, setFound] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [claimsRes, foundRes] = await Promise.all([
        axios.get(`${API_URL}/items/my/claims`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/items/my/found`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setClaims(claimsRes.data);
      setFound(foundRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Delete function for found items
  const handleDeleteFound = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_URL}/items/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Item deleted successfully');
        fetchData(); // Refresh the list
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to delete item');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Items</h1>
      
      {/* Items I've Claimed */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Items I've Claimed</h2>
        {claims.length === 0 ? (
          <p className="text-gray-500">You haven't claimed any items yet.</p>
        ) : (
          <div className="space-y-4">
            {claims.map(item => (
              <div key={item._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center space-x-4">
                  <img src={item.imageUrl} alt={item.title} className="w-20 h-20 object-cover rounded" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-gray-600 text-sm">Found at: {item.location}</p>
                    <p className="text-gray-600 text-sm">By: {item.reportedBy?.name || 'Unknown'}</p>
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        item.claimRequest?.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        item.claimRequest?.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.claimRequest?.status || 'pending'}
                      </span>
                    </div>
                  </div>
                  <Link to={`/item/${item._id}`} className="text-blue-600 hover:underline">View Details →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Items I've Found */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Items I've Found</h2>
        {found.length === 0 ? (
          <p className="text-gray-500">You haven't reported any found items yet.</p>
        ) : (
          <div className="space-y-4">
            {found.map(item => (
              <div key={item._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center space-x-4">
                  <img src={item.imageUrl} alt={item.title} className="w-20 h-20 object-cover rounded" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-gray-600 text-sm">Location: {item.location}</p>
                    <p className="text-gray-600 text-sm">Status: {item.status}</p>
                    {item.claimRequest?.status === 'pending' && (
                      <p className="text-yellow-600 text-sm mt-1">⚠️ Has a pending claim request!</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Link to={`/item/${item._id}`} className="text-blue-600 hover:underline">
                      View Details →
                    </Link>
                    <button
                      onClick={() => handleDeleteFound(item._id)}
                      className="text-red-600 hover:text-red-800 transition"
                      title="Delete item"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyClaims;