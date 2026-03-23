import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Skeleton from '../components/Skeleton';
import { useToast } from '../context/ToastContext';

const API_BASE = "http://localhost:8000";

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    document.title = "History | CodeSage";
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/history`);
        setHistory(res.data.history || []);
      } catch (e) {
        showToast("Failed to fetch history", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="min-h-[calc(100vh-44px)] bg-[#1a1a1a] p-6 page-enter">
      <div className="max-w-[900px] mx-auto text-[#eff1f6]">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[22px] font-[700] mb-1">History</h1>
          <p className="text-[#eff1f6bf] text-[13px]">{history.length} problems solved</p>
        </div>

        <div>
          {loading ? (
             <div className="space-y-2">
               <Skeleton width="100%" height="70px" borderRadius="8px" />
               <Skeleton width="100%" height="70px" borderRadius="8px" />
               <Skeleton width="100%" height="70px" borderRadius="8px" />
               <Skeleton width="100%" height="70px" borderRadius="8px" />
             </div>
          ) : history.length > 0 ? (
            <div className="space-y-2">
              {history.map(item => (
                <div key={item.id} className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg py-[14px] px-[20px] flex items-center justify-between transition-all duration-150 ease-out hover:bg-[#333333] hover:border-[#4d4d4d] group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffa116] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]" tabIndex="0">
                  {/* Left Side */}
                  <div className="flex items-center gap-3 w-1/3">
                    <span className="text-[#ffa116] font-mono text-[14px]">#{item.id}</span>
                    <span className="text-white font-bold text-[15px] truncate max-w-[200px]" title={item.problem_title}>
                      {item.problem_title}
                    </span>
                  </div>
                  
                  {/* Middle Side */}
                  <div className="flex items-center justify-center gap-2 w-1/3">
                    <span className="bg-[#333333] text-[#cccccc] text-[11px] rounded-[3px] px-2 py-0.5 border border-[#3d3d3d]">
                      {item.topic}
                    </span>
                    <span className="bg-[#333333] text-[#cccccc] text-[11px] rounded-[3px] px-2 py-0.5 uppercase border border-[#3d3d3d]">
                      {item.language}
                    </span>
                  </div>

                  {/* Right Side */}
                  <div className="flex items-center justify-end gap-4 w-1/3 text-right">
                    <div className="flex flex-col items-end justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#eff1f6bf] text-[12px] truncate max-w-[120px] capitalize" title={item.mistake_category}>
                          {item.mistake_category === "none" ? "Perfect Execution" : item.mistake_category}
                        </span>
                        {item.pattern_broken && (
                          <span className="bg-[rgba(44,187,93,0.1)] text-[#2cbb5d] border border-[rgba(44,187,93,0.2)] rounded-[10px] px-[10px] py-[2px] text-[11px] font-[600]">
                            🎉 Pattern Broken
                          </span>
                        )}
                        {item.trap_mode && (
                          <span className="text-[#ffa116] text-[11px] font-[600]">
                            ⚠ Trap Mode
                          </span>
                        )}
                      </div>
                      <span className="text-[#8b949e] text-[10px]">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                    
                    {/* Hover Arrow */}
                    <span className="text-[#8b949e] opacity-0 group-hover:opacity-100 transition-opacity text-[16px] translate-x-[-8px] group-hover:translate-x-0 duration-200">
                      →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-[#3d3d3d] rounded-lg bg-[#1a1a1a]/50">
              <p className="text-[15px] text-white font-medium mb-4">No problems solved yet.</p>
              <Link 
                to="/arena" 
                className="bg-[#ffa116] text-black font-[600] px-5 py-2 rounded-[4px] text-[13px] hover:bg-[#e69114] transition-colors inline-block"
              >
                Go to Practice Arena
              </Link>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default History;
