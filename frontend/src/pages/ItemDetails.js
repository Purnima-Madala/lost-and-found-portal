import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import API_URL from '../config';

const ItemDetails = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [claimMessage, setClaimMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await axios.get(`${API_URL}/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItem(response.data);
    } catch (error) {
      toast.error('Failed to load item');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!claimMessage.trim()) {
      toast.error('Please provide a message describing why this item belongs to you');
      return;
    }
    
    try {
      await axios.post(`${API_URL}/items/${id}/claim`, 
        { message: claimMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Claim request sent! The finder will review your request.');
      fetchItem();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to claim item');
    }
  };

  const handleClaimResponse = async (status) => {
    try {
      await axios.put(`${API_URL}/items/${id}/claim/respond`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Claim ${status}!`);
      fetchItem();
    } catch (error) {
      toast.error('Failed to respond to claim');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!item) return null;

  const isFinder = item.reportedBy._id === user.id;
  const isClaimer = item.claimedBy?._id === user.id;
  const canClaim = !isFinder && item.status === 'found';
  const hasPendingClaim = item.claimRequest?.status === 'pending';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <img src={item.imageUrl} alt={item.title} className="w-full h-96 object-cover" />
        
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
          <p className="text-gray-600 mb-4">{item.category}</p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Location Found</h3>
              <p className="text-gray-600">📍 {item.location}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Date Found</h3>
              <p className="text-gray-600">{formatDistanceToNow(new Date(item.dateFound), { addSuffix: true })}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
            <p className="text-gray-600">{item.description}</p>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Reported By</h3>
            <p className="text-gray-600">{item.reportedBy.name}</p>
            <p className="text-gray-500 text-sm">{item.reportedBy.email}</p>
          </div>
          
          {isFinder && item.claimRequest?.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Pending Claim Request</h3>
              <p className="text-gray-700 mb-3">{item.claimRequest.message}</p>
              <div className="flex space-x-3">
                <button onClick={() => handleClaimResponse('approved')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Approve</button>
                <button onClick={() => handleClaimResponse('rejected')} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Reject</button>
              </div>
            </div>
          )}
          
          {canClaim && !hasPendingClaim && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-700 mb-3">Claim This Item</h3>
              <textarea value={claimMessage} onChange={(e) => setClaimMessage(e.target.value)} placeholder="Describe why this item belongs to you (e.g., color, markings, where you lost it)..." rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3" />
              <button onClick={handleClaim} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Submit Claim Request</button>
            </div>
          )}
          
          {item.status === 'claimed' && isClaimer && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold">✅ Your claim has been approved!</p>
              <p className="text-green-700 mt-1">Contact the finder to arrange pickup. They will reach out to you.</p>
            </div>
          )}
          
          {item.status === 'claimed' && isFinder && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 font-semibold">Claim approved!</p>
              <p className="text-blue-700 mt-1">You can now chat with the claimant to arrange the return.</p>
              <button onClick={() => navigate(`/chat/${item.claimedBy._id}`)} className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Chat with Claimant</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;