import React from 'react';

const Skeleton = ({ width = "100%", height = "16px", borderRadius = "4px", className = "" }) => {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
};

export default Skeleton;
