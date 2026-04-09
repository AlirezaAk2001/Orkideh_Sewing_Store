"use client";

import { useState } from "react";
import { Star } from "lucide-react";

const StarRating = ({ rating, setRating }) => {
  const [hover, setHover] = useState(null);

  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, index) => {
        const value = index + 1;
        return (
          <label key={value} className="cursor-pointer">
            <input
              type="radio"
              name="rating"
              value={value}
              className="hidden"
              onClick={() => setRating && setRating(value)}
              disabled={!setRating}
            />
            <Star
              size={28}
              className={`transition-colors duration-200 ${
                value <= (hover || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              }`}
              onMouseEnter={() => setRating && setHover(value)}
              onMouseLeave={() => setRating && setHover(null)}
            />
          </label>
        );
      })}
    </div>
  );
};

export default StarRating;