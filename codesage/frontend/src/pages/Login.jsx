import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const { showToast } = useToast();

  useEffect(() => {
    document.title = "Login | CodeSage";
  }, []);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    
    setTimeout(() => {
      const success = login(username, password);
      if (success) {
        navigate('/arena');
      } else {
        setError(true);
        setLoading(false);
      }
    }, 800);
  };

  const handleSignupClick = () => {
    showToast("Sign up is not available in the demo. Use: username: user, password: 1234", "info");
  };

  return (
    <div className="h-screen w-full bg-[#1a1a1a] flex overflow-hidden">
      
      {/* LEFT PANEL (55%) - Desktop only */}
      <div className="hidden md:flex flex-col justify-between w-[55%] h-full bg-[#141414] border-r border-[#2d2d2d] py-[60px] px-[48px] relative">
        <div className="flex items-center gap-2">
          <span className="text-[#ffa116] text-[22px] font-bold">{'{ }'}</span>
          <span className="text-white text-[22px] font-[700]">CodeSage</span>
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-[42px] font-[800] leading-[1.15] tracking-[-1.5px] text-white">
            Code <span className="text-[#ffa116]">Smarter</span>.<br />Learn Faster.
          </h1>
          <p className="text-[15px] text-[#8b949e] max-w-[380px] leading-[1.6] mt-4">
            An AI mentor that remembers every mistake you make — and makes sure you never repeat them.
          </p>
          
          <div className="flex flex-wrap gap-[10px] mt-[32px]">
            <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-[20px] px-4 py-2 text-[13px] text-[#eff1f6bf] inline-flex gap-2">
              🧠 Hindsight Memory
            </div>
            <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-[20px] px-4 py-2 text-[13px] text-[#eff1f6bf] inline-flex gap-2">
              ⚡ Trap Mode
            </div>
            <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-[20px] px-4 py-2 text-[13px] text-[#eff1f6bf] inline-flex gap-2">
              🔬 Code Autopsy
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-[24px] left-[48px]">
          <span className="text-[#3d3d3d] text-[11px] font-mono">Powered by Hindsight · Vectorize</span>
        </div>
      </div>

      {/* RIGHT PANEL (45%) */}
      <div className="w-full md:w-[45%] h-full flex flex-col justify-center bg-[#1a1a1a] py-[48px] px-[40px]">
        <h2 className="text-white text-[24px] font-[700]">Welcome back</h2>
        <p className="text-[#8b949e] text-[14px] mb-[32px]">Sign in to continue your practice session.</p>

        {/* DEMO HINT BOX */}
        <div className="bg-[rgba(255,161,22,0.08)] border border-[rgba(255,161,22,0.25)] rounded-[8px] p-[12px] px-[16px] mb-[24px]">
          <div className="text-[#ffa116] text-[12px] font-[600] mb-1">🔑 Demo credentials</div>
          <div className="text-[#cdd9e5] font-mono text-[12px]">Username: user  ·  Password: 1234</div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="mb-4 flex flex-col">
            <label className="text-[13px] text-[#8b949e] mb-[6px]">Username</label>
            <input 
              type="text" 
              className="w-full bg-[#2d2d2d] border border-[#3d3d3d] rounded-[6px] py-[10px] px-[14px] text-white text-[14px] outline-none focus:border-[#ffa116] focus:ring-[3px] focus:ring-[rgba(255,161,22,0.1)] transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[13px] text-[#8b949e] mb-[6px]">Password</label>
            <input 
              type="password" 
              className="w-full bg-[#2d2d2d] border border-[#3d3d3d] rounded-[6px] py-[10px] px-[14px] text-white text-[14px] outline-none focus:border-[#ffa116] focus:ring-[3px] focus:ring-[rgba(255,161,22,0.1)] transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-[#ff375f] text-[13px] mt-[8px]">
              ❌ Invalid credentials. Use username: user, password: 1234
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-[20px] bg-[#ffa116] hover:bg-[#ffb84d] text-[#1a1a1a] font-[700] text-[14px] rounded-[6px] py-[11px] border-none cursor-pointer transition-all disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffa116] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-[13px] text-[#8b949e]">
          Don't have an account? <span onClick={handleSignupClick} className="text-[#ffa116] hover:underline cursor-pointer">Sign up</span>
        </div>

        <div className="mt-8 text-center">
          <span className="text-[#3d3d3d] text-[11px]">© 2025 CodeSage · Built for hackathon</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
