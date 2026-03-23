import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Skeleton from '../components/Skeleton';
import { useToast } from '../context/ToastContext';

const API_BASE = "http://localhost:8000";

const chartData = [
  { category: "Conceptual", count: 4 },
  { category: "Logic", count: 3 },
  { category: "Complexity", count: 5 },
  { category: "Syntax", count: 1 },
  { category: "Edge Cases", count: 6 },
];

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({ reflection: "", observations: [] });
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    document.title = "Dashboard | CodeSage";
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/dashboard`);
      setDashboardData({
        reflection: res.data.reflection || "",
        observations: res.data.observations || []
      });
    } catch (e) {
      showToast("Failed to fetch dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="min-h-[calc(100vh-44px)] bg-[#1a1a1a] p-6 page-enter">
      <div className="max-w-[1100px] mx-auto text-[#eff1f6]">
        
        {/* SECTION 1: Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-[700] mb-1">My Patterns</h1>
            <p className="text-[#eff1f6bf] text-[13px]">Powered by Hindsight Memory 🧠</p>
          </div>
          <button 
            onClick={fetchDashboard}
            disabled={loading}
            className="bg-[#2d2d2d] border border-[#3d3d3d] hover:bg-[#3d3d3d] text-white px-4 py-2 rounded text-[13px] transition-colors disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* SECTION 2: AI Reflection Card */}
        <div className="mb-8">
          <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c084fc]"></span>
              <span className="text-[#eff1f6bf] text-[12px] uppercase tracking-wider font-[600]">Hindsight Reflection</span>
            </div>
            {loading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-[#3d3d3d] rounded w-3/4"></div>
                  <div className="h-4 bg-[#3d3d3d] rounded w-1/2"></div>
                </div>
              </div>
            ) : dashboardData.reflection ? (
              <p className="text-[14px] text-[#eff1f6bf] leading-[1.7] whitespace-pre-wrap">
                {dashboardData.reflection}
              </p>
            ) : (
              <p className="text-[14px] text-[#eff1f6bf] italic">
                Solve at least 5 problems to generate a reflection.
              </p>
            )}
          </div>
        </div>

        {/* SECTION 3: Observations Grid */}
        <div className="mb-10">
          <h2 className="text-[16px] font-[600] mb-4">Memory Observations</h2>
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               <Skeleton width="100%" height="100px" borderRadius="8px" />
               <Skeleton width="100%" height="100px" borderRadius="8px" />
             </div>
          ) : dashboardData.observations && dashboardData.observations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dashboardData.observations.map((obs, i) => (
                <div key={i} className="bg-[#2d2d2d] border border-[#3d3d3d] border-l-[3px] border-l-[#ffa116] rounded-lg p-[18px] transition-all duration-150 ease-out hover:border-[#ffb84d] hover:shadow-[0_0_0_1px_rgba(255,161,22,0.2)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-[600] text-[14px]">{obs.title}</h3>
                      {obs.evidence_count && (
                        <span className="bg-[rgba(255,161,22,0.1)] text-[#ffa116] text-[11px] px-[10px] py-[2px] rounded-[10px] border border-[rgba(255,161,22,0.2)]">
                          {obs.evidence_count} observations
                        </span>
                      )}
                    </div>
                    <p className="text-[#eff1f6bf] text-[13px] leading-relaxed">
                      {obs.summary}
                    </p>
                  </div>
                  <div className="mt-4 text-[#3d3d3d] text-[10px] font-mono tracking-wide">
                    🧠 From Hindsight
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-[#3d3d3d] rounded-lg bg-[#1a1a1a]/50">
              <div className="text-4xl mb-3 text-gray-500">🔍</div>
              <h3 className="text-[15px] text-white font-medium mb-1">No patterns detected yet.</h3>
              <p className="text-[13px] text-[#eff1f6bf]">Solve problems in Practice Arena to build your memory profile.</p>
            </div>
          )}
        </div>

        {/* SECTION 4: Mistake Frequency Chart */}
        <div>
          <h2 className="text-[16px] font-[600] mb-4">Mistake Categories</h2>
          <div className="h-[220px] w-full bg-[#1a1a1a]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="category" 
                  tick={{ fill: "#8b949e", fontSize: 12 }} 
                  axisLine={{ stroke: "#3d3d3d" }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: "#8b949e", fontSize: 12 }} 
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip 
                  cursor={{ fill: "rgba(255,161,22,0.1)" }}
                  contentStyle={{ backgroundColor: "#2d2d2d", border: "1px solid #3d3d3d", borderRadius: "4px", color: "white" }}
                  itemStyle={{ color: "#ffa116" }}
                />
                <Bar dataKey="count" fill="#ffa116" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
