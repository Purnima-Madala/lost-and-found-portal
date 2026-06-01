import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import API_URL from '../config';
import { Trash2 } from 'lucide-react';

const LostItems = () => {
  const [lostItems, setLostItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { token, user } = useAuth(); // Added user here
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    reward: ''
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchLostItems();
  }, [token]);

  const fetchLostItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/lost-items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLostItems(response.data);
    } catch (error) {
      toast.error('Failed to fetch lost items');
    } finally {
      setLoading(false);
    }
  };

  // Delete function - fixed to use API_URL
  const handleDeleteLost = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this lost item? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_URL}/lost-items/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Lost item deleted successfully');
        fetchLostItems(); // Refresh the list
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to delete item');
      }
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category || !formData.location) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setSubmitting(true);
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('location', formData.location);
    data.append('reward', formData.reward);
    if (image) data.append('image', image);
    
    try {
      await axios.post(`${API_URL}/lost-items/report`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Lost item reported successfully!');
      setShowForm(false);
      setFormData({ title: '', description: '', category: '', location: '', reward: '' });
      setImage(null);
      setPreview(null);
      fetchLostItems();
    } catch (error) {
      toast.error('Failed to report lost item');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['ID Card', 'Laptop Charger', 'Keys', 'Water Bottle', 'Earphones', 'Other'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Lost Items</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Report Lost Item'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Report Lost Item</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">Select category</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Location Lost *</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required placeholder="e.g., Library, 3rd Floor" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Reward (Optional)</label>
              <input type="text" name="reward" value={formData.reward} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., $20, Coffee treat, etc." />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Photo (Optional)</label>
              <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer">
                <input {...getInputProps()} />
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-32 mx-auto" />
                ) : (
                  <p className="text-gray-500">Click or drag image here</p>
                )}
              </div>
            </div>
            
            <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              {submitting ? 'Submitting...' : 'Report Lost Item'}
            </button>
          </form>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lostItems.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No lost items reported yet
          </div>
        ) : (
          lostItems.map(item => (
            <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{item.category}</p>
                  </div>
                  {/* Delete button - only show if current user owns this item */}
                  {item.reportedBy?._id === user?.id && (
                    <button
                      onClick={() => handleDeleteLost(item._id)}
                      className="text-red-600 hover:text-red-800 transition p-1"
                      title="Delete item"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <p className="text-gray-600 text-sm">📍 Lost at: {item.location}</p>
                <p className="text-gray-500 text-xs mt-2">
                  Lost {formatDistanceToNow(new Date(item.lostDate), { addSuffix: true })}
                </p>
                {item.reward && item.reward !== 'No reward offered' && (
                  <p className="text-green-600 text-sm mt-2 font-semibold">🎁 Reward: {item.reward}</p>
                )}
                <p className="text-gray-700 text-sm mt-2 line-clamp-2">{item.description}</p>
                <p className="text-gray-500 text-xs mt-2">Posted by: {item.reportedBy?.name || 'Unknown'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LostItems;