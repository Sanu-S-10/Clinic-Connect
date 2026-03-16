
import React from 'react';
import { Link } from 'react-router-dom';
import { Clinic } from '../types';
import StarRating from './StarRating';

interface ClinicCardProps {
  clinic: Clinic & { specialties?: string[]; address?: string };
}

const ClinicCard: React.FC<ClinicCardProps> = ({ clinic }) => {
  return (
    <div className="bg-white p-6 rounded-2xl flex flex-col h-full shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 border border-gray-100 group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
            {clinic.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={clinic.rating || 0} size="sm" />
            <span className="text-xs text-gray-500">
              ({clinic.reviewCount || 0} {(clinic.reviewCount === 1) ? 'review' : 'reviews'})
            </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3 mb-6">
        {clinic.location && (
          <div className="flex items-center text-gray-500 text-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {clinic.location}
          </div>
        )}
        {clinic.address && (
          <div className="flex items-center text-gray-500 text-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5.581m0 0H9m11.581 0a2 2 0 01-2 2H7a2 2 0 01-2-2m0 0H4" />
            </svg>
            <span className="truncate">{clinic.address}</span>
          </div>
        )}
        {clinic.specialties && clinic.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {clinic.specialties.slice(0, 2).map((spec, idx) => (
              <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                {spec}
              </span>
            ))}
            {clinic.specialties.length > 2 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                +{clinic.specialties.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
      
      <Link 
        to={`/clinic/${clinic.id}`} 
        className="block w-full text-center py-2.5 mt-auto rounded-xl border border-blue-100 text-blue-700 font-medium hover:bg-blue-50 transition-colors"
      >
        View Details
      </Link>
    </div>
  );
};

export default ClinicCard;
