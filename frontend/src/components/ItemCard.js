import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const ItemCard = ({ item }) => {
  return (
    <Link to={`/item/${item._id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <img 
          src={item.imageUrl} 
          alt={item.title}
          className="w-full h-48 object-cover"
        />
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
          <p className="text-gray-600 text-sm mb-2">{item.category}</p>
          <p className="text-gray-500 text-sm">📍 {item.location}</p>
          <p className="text-gray-400 text-xs mt-2">
            Found {formatDistanceToNow(new Date(item.dateFound), { addSuffix: true })}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;