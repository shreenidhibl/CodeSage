import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const dropdownRef = useRef(null);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItem = (path, label) => {
    const isActive = location.pathname.startsWith(path);
    return (
      <div 
        key={path}
        onClick={() => navigate(path)}
        className={`px-[12px] h-[32px] flex flex-col justify-center cursor-pointer transition-all duration-150 hover:bg-[rgba(255,255,255,0.05)] hover:rounded-[4px] ${
          isActive ? 'text-white font-[600]' : 'text-[#eff1f6bf] hover:text-white'
        }`}
      >
        <span className="flex items-center h-full pt-[2px]">{label}</span>
        {isActive ? (
          <div className="w-[4px] h-[4px] bg-[#ffa116] rounded-full mx-auto" style={{ marginTop: '2px' }}></div>
        ) : (
          <div className="w-[4px] h-[4px] bg-transparent rounded-full mx-auto" style={{ marginTop: '2px' }}></div>
        )}
      </div>
    );
  };

  return (
    <nav className="flex items-center justify-between px-6 bg-[#1a1a1a] border-b border-[#2d2d2d] h-[44px]">
      <div className="flex items-center h-full">
        {/* Logo */}
        <div 
          className="font-[700] text-white mr-8 text-[16px] cursor-pointer flex items-center"
          onClick={() => navigate('/arena')}
        >
          <span className="text-[#ffa116] mr-[4px]">{'{ }'}</span> CodeSage
        </div>
        
        {/* Navigation Links */}
        <div className="flex items-center h-full gap-2 text-[14px]">
          {navItem("/arena", "Practice")}
          {navItem("/dashboard", "Dashboard")}
          {navItem("/history", "History")}
        </div>
      </div>
      
      {/* Right User Badge */}
      <div className="flex items-center">
        
        {/* Memory Badge */}
        <div 
          className="relative flex items-center cursor-default"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <span className="text-[11px] text-[#8b949e]">🧠 Memory</span>
          {showTooltip && (
            <div className="absolute top-full right-0 mt-1 bg-[#2d2d2d] border border-[#3d3d3d] rounded-[4px] px-[10px] py-[4px] text-[11px] text-white whitespace-nowrap z-[100] shadow-lg">
              Powered by Hindsight
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-[1px] h-[20px] bg-[#2d2d2d] mx-[12px]"></div>

        <div className="flex items-center relative" ref={dropdownRef}>
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
          className="bg-[#2d2d2d] text-white text-[12px] px-3 py-1 rounded-full hover:bg-[#3d3d3d] cursor-pointer transition-colors border border-[#3d3d3d]"
        >
          Demo User
        </div>
        
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 bg-[#2d2d2d] border border-[#3d3d3d] rounded-[6px] p-1 min-w-[140px] shadow-lg z-50">
            <div 
              onClick={handleLogout}
              className="px-3 py-2 text-[13px] text-[#ff375f] hover:bg-[#3d3d3d] cursor-pointer rounded transition-colors"
            >
              Sign out
            </div>
          </div>
        )}
      </div>
      </div>
    </nav>
  );
};

export default Navbar;
