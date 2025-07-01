import React from 'react';
import { Link } from 'react-router-dom';

const Logo = () => {
  return (
    <Link to="/" className="flex items-center gap-2">
      <img
        src="/lovable-uploads/f813b1e2-df71-4a18-b810-b8b775bf7c90.png"
        alt="AI Revy"
        className="w-8 h-8 rounded-full"
      />
    </Link>
  );
};

export default Logo;
