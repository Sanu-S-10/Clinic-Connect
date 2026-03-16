import React, { useState } from 'react';

interface StarRatingProps {
  rating: number; // The current rating (0 - 5)
  interactive?: boolean; // Whether users can click to change rating
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  interactive = false, 
  onRatingChange,
  size = 'md' 
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  // Star size classes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const starSize = sizeClasses[size];

  // SVG for a full star with proper offset or clip path
  // We will build the stars using a wrapper and clipping to achieve half-star effects easily
  const renderStar = (index: number) => {
    // index is 0 to 4
    const starValue = index + 1;
    let fillPercentage = 0;

    if (displayRating >= starValue) {
      fillPercentage = 100;
    } else if (displayRating >= starValue - 0.5) {
      fillPercentage = 50;
    }

    return (
      <div 
        key={index} 
        className={`relative ${starSize} cursor-${interactive ? 'pointer' : 'default'} mx-0.5`}
        onMouseLeave={() => interactive && setHoverRating(null)}
      >
        {/* Background empty star */}
        <svg 
          className="absolute top-0 left-0 w-full h-full text-gray-300" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>

        {/* Foreground filled star with clip path to handle full/half fills */}
        <div 
          className="absolute top-0 left-0 h-full overflow-hidden flex items-center" 
          style={{ width: `${fillPercentage}%` }}
        >
          <svg 
            className={`w-full h-full text-yellow-400`} 
            style={{ minWidth: size === 'sm' ? '1rem' : size === 'md' ? '1.5rem' : '2rem' }}
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>

        {/* Interaction zones for half-star precision */}
        {interactive && (
          <div className="absolute top-0 left-0 w-full h-full flex z-10">
            <div 
              className="flex-1 h-full" 
              onMouseEnter={() => setHoverRating(starValue - 0.5)}
              onClick={() => onRatingChange && onRatingChange(starValue - 0.5)}
            />
            <div 
              className="flex-1 h-full" 
              onMouseEnter={() => setHoverRating(starValue)}
              onClick={() => onRatingChange && onRatingChange(starValue)}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex items-center">
      {[0, 1, 2, 3, 4].map(renderStar)}
    </div>
  );
};

export default StarRating;
