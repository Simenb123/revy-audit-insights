
import React from 'react';
import { Link } from 'react-router-dom';

const Logo = () => {
  return (
    <Link to="/" className="flex items-center gap-2 text-white">
      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
        <span className="text-revio-500 font-bold text-xl">A</span>
      </div>
      <span className="font-bold text-xl">AI Revi</span>
    </Link>
  );
};

export default Logo;
