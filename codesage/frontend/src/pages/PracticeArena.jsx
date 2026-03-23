import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import Skeleton from '../components/Skeleton';
import { useToast } from '../context/ToastContext';

const API_BASE = "http://localhost:8000";

const TOPICS = [
  "Arrays", "Strings", "Linked Lists", "Trees", "Graphs",
  "Dynamic Programming", "Recursion", "Sorting", "Binary Search", "Stacks & Queues"
];

const PracticeArena = () => {
  // State
  const [currentProblem, setCurrentProblem] = useState(null);
  const [code, setCode] = useState("# Write your solution here");
  const [language, setLanguage] = useState("python");
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const [trapMode, setTrapMode] = useState(false);
  const [hiddenTrap, setHiddenTrap] = useState(null);
  const [trapPulse, setTrapPulse] = useState(false);

  // Replaced booleans with state machine strings
  const [generateState, setGenerateState] = useState("default"); // default, loading, success, error
  const [submissionPhase, setSubmissionPhase] = useState("default"); // default, running, judging, done

  const [output, setOutput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackHighlight, setFeedbackHighlight] = useState(false);
  const [judgeStatus, setJudgeStatus] = useState("");
  const [activeTab, setActiveTab] = useState("Output");

  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);

  const [showPatternBroken, setShowPatternBroken] = useState(false);
  const [patternBrokenDetail, setPatternBrokenDetail] = useState("");

  const [dailyChallenge, setDailyChallenge] = useState({ topic: "Arrays" });

  const [whyOpen, setWhyOpen] = useState(false);
  const [recalledMemories, setRecalledMemories] = useState([]);
  const [isRecalling, setIsRecalling] = useState(false);

  // Initialize daily challenge on mount and keyboard shortcuts
  const { showToast } = useToast();

  useEffect(() => {
    document.title = "Practice Arena | CodeSage";

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-submit')?.click();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        document.getElementById('btn-generate')?.click();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setChatOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowPatternBroken(false);
        setChatOpen(false);
        setWhyOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    fetchDailyChallenge();
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchDailyChallenge = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/daily-challenge`);
      if (res.data && res.data.topic) {
        setDailyChallenge(res.data);
      }
    } catch (e) {
      showToast("Failed to fetch daily challenge", "error");
    }
  };

  const loadChallenge = async () => {
    if (generateState === "loading") return;
    setGenerateState("loading");
    setTrapMode(false);
    setSelectedTopic(dailyChallenge.topic);
    try {
      const res = await axios.post(`${API_BASE}/api/generate-problem`, {
        topic: dailyChallenge.topic,
        trap_mode: false
      });
      applyProblem(res.data);
      setGenerateState("success");
      showToast("Problem loaded", "info");
      setTimeout(() => setGenerateState("default"), 300);
    } catch (e) {
      showToast("Failed to generate challenge", "error");
      setGenerateState("error");
      setTimeout(() => setGenerateState("default"), 300);
    }
  };

  const generateProblem = async () => {
    if (generateState === "loading") return;
    setGenerateState("loading");
    try {
      const res = await axios.post(`${API_BASE}/api/generate-problem`, {
        topic: selectedTopic,
        trap_mode: trapMode
      });
      applyProblem(res.data);
      setGenerateState("success");
      showToast("Problem generated from your memory profile", "info");
      setTimeout(() => setGenerateState("default"), 300);
    } catch (e) {
      showToast("Failed to generate problem", "error");
      setGenerateState("error");
      setTimeout(() => setGenerateState("default"), 300);
    }
  };

  const applyProblem = (data) => {
    setCurrentProblem(data);
    setHiddenTrap(data.hidden_trap || null);
    setOutput("");
    setFeedback("");
    setJudgeStatus("");
    setWhyOpen(false); // Reset why panel
    // Defaults for language code template
    if (language === "python" || language === "python3") {
      setCode(`# Title: ${data.title}\n# Write your solution here`);
    } else if (language === "javascript" || language === "js") {
      setCode(`// Title: ${data.title}\n// Write your solution here`);
    } else {
      setCode(`// Title: ${data.title}\n// Write your solution here`);
    }
  };

  const fetchWhyContext = async () => {
    if (!whyOpen) {
      setWhyOpen(true);
      setIsRecalling(true);
      try {
        const res = await axios.get(`${API_BASE}/api/recall-context?topic=${encodeURIComponent(selectedTopic)}`);
        setRecalledMemories(res.data.memories || []);
        if (!res.data.memories || res.data.memories.length === 0) {
          showToast("No memory yet — keep practicing!", "warning");
        }
      } catch (e) {
        showToast("Memory service unavailable — retrying", "error");
      } finally {
        setIsRecalling(false);
      }
    } else {
      setWhyOpen(false);
    }
  };

  const handleRun = () => {
    // Basic mock running since Run API isn't distinct in prompt
    setOutput("Executing test cases... (Please use Submit for full validation)");
    setActiveTab("Output");
  };

  const submitSolution = async () => {
    if (!currentProblem || submissionPhase !== "default") return;
    setSubmissionPhase("running");
    setActiveTab("Feedback");
    setFeedback("Awaiting code execution...");
    setOutput("Executing...");
    setJudgeStatus("");

    try {
      // Transition to Judging phase quickly to signify code autopsy
      setTimeout(() => setSubmissionPhase("judging"), 800);

      const payload = {
        code,
        language,
        problem_title: currentProblem.title,
        problem_description: currentProblem.description,
        topic: selectedTopic,
        trap_mode: trapMode,
        hidden_trap: hiddenTrap
      };

      const res = await axios.post(`${API_BASE}/api/submit`, payload);

      setOutput(res.data.judge0_output);
      setJudgeStatus(res.data.judge0_status);
      setFeedback(res.data.feedback);
      
      // Highlight feedback tab
      setFeedbackHighlight(true);
      setTimeout(() => setFeedbackHighlight(false), 1000);

      setSubmissionPhase("done");
      setTimeout(() => setSubmissionPhase("default"), 400);

      if (res.data.judge0_status.toLowerCase().includes('accepted')) {
        showToast("Solution analyzed and memory updated", "success");
      } else {
        showToast("Code execution failed — check your output", "warning");
      }

      if (res.data.pattern_broken) {
        setPatternBrokenDetail(res.data.pattern_broken_detail);
        setShowPatternBroken(true);
      }

    } catch (e) {
      showToast("Submission evaluation failed due to a server error.", "error");
      setFeedback("Submission evaluation failed due to a server error.");
      setOutput("Internal Server Error.");
      setSubmissionPhase("default");
    }
  };

  const handleTrapToggle = () => {
    setTrapMode(!trapMode);
    if (!trapMode) {
      setTrapPulse(true);
      setTimeout(() => setTrapPulse(false), 150);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatting) return;

    const newMsg = { role: "user", content: chatInput };
    const updatedHistory = [...chatHistory, newMsg];
    setChatHistory(updatedHistory);
    setChatInput("");
    setIsChatting(true);

    try {
      const res = await axios.post(`${API_BASE}/api/chat`, {
        message: newMsg.content,
        current_problem: currentProblem ? `${currentProblem.title}\n${currentProblem.description}` : "None selected",
        current_code: code,
        history: chatHistory
      });

      setChatHistory([
        ...updatedHistory,
        { role: "assistant", content: res.data.reply, memories_used: res.data.memories_used }
      ]);
    } catch (e) {
      showToast("Error accessing mentor API.", "error");
      setChatHistory([...updatedHistory, { role: "assistant", content: "Error accessing mentor API." }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="flex w-full overflow-hidden page-enter" style={{ height: 'calc(100vh - 44px)' }}>
      {/* -------------------- LEFT PANEL (45%) -------------------- */}
      <div className="w-[45%] flex flex-col h-full bg-[#1a1a1a] overflow-y-auto border-r-[4px] border-[#2d2d2d]">

        {/* Daily Challenge Banner */}
        <div className="flex items-center justify-between px-4 py-[10px] bg-[#2d2d2d] border-b border-[#3d3d3d] border-l-[3px] border-l-[#ffa116]">
          <div className="text-white text-[14px]">
            <span className="text-[#ffa116]">⚡</span> Daily Challenge: <span className="text-[#ffa116] font-[600]">{dailyChallenge.topic}</span>
          </div>
          <button
            onClick={loadChallenge}
            disabled={generateState === "loading"}
            className="text-[12px] font-[600] border border-[#ffa116] text-[#ffa116] bg-transparent px-[12px] py-[4px] rounded-[4px] hover:bg-[rgba(255,161,22,0.1)] transition-colors disabled:opacity-50"
          >
            {generateState === "loading" && !trapMode ? "Loading..." : "Load Challenge"}
          </button>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center gap-4 px-4 py-3 bg-[#1a1a1a] border-b border-[#2d2d2d]">
          
          {/* Custom Topic Selector */}
          <div className="relative">
            <select
              className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-[6px] text-white py-[7px] pl-[12px] pr-[32px] text-[13px] hover:border-[#ffa116] focus:border-[#ffa116] outline-none cursor-pointer appearance-none transition-colors"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#8b949e] pointer-events-none text-[10px]">
              ▾
            </div>
          </div>

          <button
            id="btn-generate"
            onClick={generateProblem}
            disabled={generateState === "loading"}
            className={`font-[600] text-[13px] px-[14px] py-[6px] rounded transition-colors disabled:opacity-100 flex items-center gap-2 ${
              generateState === "loading" ? "bg-[#cc8012] text-white cursor-not-allowed" :
              generateState === "success" ? "bg-[#2cbb5d] text-white" :
              generateState === "error" ? "bg-[#ff375f] text-white" :
              "bg-[#ffa116] text-[#1a1a1a] hover:bg-[#ffb84d]"
            }`}
          >
            {generateState === "loading" && (
              <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            )}
            {generateState === "loading" ? "Generating..." : "Generate Problem"}
          </button>

          {/* Trap Mode Pill */}
          <div
            onClick={handleTrapToggle}
            className={`cursor-pointer px-3 py-1 text-[12px] font-semibold flex items-center gap-1 transition-all duration-200 
              rounded-full border ${
              trapMode ? 'bg-[rgba(255,161,22,0.15)] text-[#ffa116] border-[#ffa116]' : 'bg-[#2d2d2d] text-[#8b949e] border-[#3d3d3d]'
            }`}
            style={trapPulse ? { transform: 'scale(1.05)' } : { transform: 'scale(1)' }}
          >
            {trapMode ? "⚠ Trap Mode" : "Normal Mode"}
          </div>

          <button
            onClick={fetchWhyContext}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-[#2d2d2d] text-white hover:bg-[#3d3d3d] border border-[#3d3d3d] ml-auto transition-colors"
            title="Why this problem?"
          >
            ?
          </button>
        </div>

        {/* Problem Statement Area */}
        <div className="p-5 flex-1 text-[#eff1f6]">
          {generateState === "loading" ? (
            <div className="space-y-4">
              <Skeleton width="60%" height="28px" />
              <Skeleton width="100%" height="16px" />
              <Skeleton width="100%" height="16px" />
              <Skeleton width="80%" height="16px" />
            </div>
          ) : currentProblem ? (
            <div>
              <h1 className="text-white text-[20px] font-[600] mb-2">{currentProblem.title}</h1>
              <div className={`inline-block text-[12px] font-[600] px-[10px] py-[2px] rounded-[4px] mb-4 border
                ${currentProblem.difficulty?.toLowerCase() === 'easy' ? 'text-[#00af9b] bg-[rgba(0,175,155,0.15)] border-[rgba(0,175,155,0.3)]' :
                  currentProblem.difficulty?.toLowerCase() === 'medium' ? 'text-[#ffb800] bg-[rgba(255,184,0,0.15)] border-[rgba(255,184,0,0.3)]' :
                    'text-[#ff375f] bg-[rgba(255,55,95,0.15)] border-[rgba(255,55,95,0.3)]'}`}>
                {currentProblem.difficulty}
              </div>
              <hr className="border-[#2d2d2d] mb-4" />

              <div className="text-[14px] leading-[1.7] text-[#eff1f6bf] whitespace-pre-wrap mb-6">
                {currentProblem.description}
              </div>

              {currentProblem.examples?.map((ex, i) => (
                <div key={i} className="mb-6">
                  <div className="font-bold text-white text-[14px] mb-2">Example {i + 1}:</div>
                  <div className="bg-[#2d2d2d] p-3 rounded font-mono text-[13px] text-[#eff1f6] border border-[#3d3d3d]">
                    <div><span className="font-bold text-white">Input:</span> {ex.input}</div>
                    <div><span className="font-bold text-white">Output:</span> {ex.output}</div>
                  </div>
                </div>
              ))}

              {currentProblem.constraints && currentProblem.constraints.length > 0 && (
                <div className="mb-6">
                  <div className="font-bold text-white text-[14px] mb-2">Constraints:</div>
                  <ul className="list-disc pl-5 text-[14px] text-[#eff1f6bf] space-y-1">
                    {currentProblem.constraints.map((c, i) => <li key={i}><code>{c}</code></li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-[#2d2d2d] text-[64px] font-[800] mb-4 leading-none">{`{ }`}</div>
              <div className="text-[#8b949e] text-[16px] font-[600] mb-2">Ready to practice?</div>
              <div className="text-[#3d3d3d] text-[13px] max-w-[280px] text-center leading-[1.6]">
                Select a topic above and click Generate Problem, or load today's challenge.
              </div>
            </div>
          )}

          {/* Why This Problem Panel */}
          {whyOpen && (
            <div className="mt-8 bg-[#2d2d2d] rounded-lg p-4 border border-[#3d3d3d] overflow-hidden transition-all duration-250 ease-out animate-[fadeIn_0.2s_ease-out]" style={{ maxHeight: '300px' }}>
              <h3 className="text-[#c084fc] font-semibold text-[15px] mb-3">🧠 Why did I get this problem?</h3>
              {isRecalling ? (
                <div className="text-[13px] text-[#eff1f6bf]">Retrieving memories...</div>
              ) : recalledMemories.length > 0 ? (
                <ul className="space-y-2">
                  {recalledMemories.map((mem, i) => (
                    <li key={i} className="bg-[#1a1a1a] p-2 rounded text-[13px] text-[#eff1f6bf] flex gap-2 items-start opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]" style={{ animationDelay: `${i * 50}ms` }}>
                      <span className="text-[#c084fc] mt-0.5">•</span> <span>{mem}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-[13px] text-[#eff1f6bf] italic">
                  No history yet — solve more problems to see personalized context.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* -------------------- RIGHT PANEL (55%) -------------------- */}
      <div className="w-[55%] flex flex-col h-full bg-[#1a1a1a] relative">

        {/* Editor Toolbar */}
        <div className="flex items-center px-4 py-2 bg-[#2d2d2d] border-b border-[#3d3d3d] h-[45px]">
          <select
            className="bg-[#1a1a1a] text-[#eff1f6] text-[13px] p-1 rounded outline-none border border-[#3d3d3d]"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleRun}
              className="bg-transparent border border-[#3d3d3d] text-white rounded text-[13px] px-[14px] py-[5px] hover:bg-[#3d3d3d] transition-colors"
            >
              Run
            </button>
            <button
              id="btn-submit"
              onClick={submitSolution}
              disabled={submissionPhase !== "default" || !currentProblem}
              className={`font-[600] rounded text-[13px] px-[14px] py-[5px] transition-colors disabled:opacity-100 flex items-center gap-2 ${
                submissionPhase === "running" || submissionPhase === "judging" ? "bg-[#1e8f47] text-white cursor-not-allowed" :
                submissionPhase === "done" ? "bg-[#2cbb5d] text-white" :
                "bg-[#2cbb5d] text-white hover:bg-[#239a4c]"
              }`}
            >
              {(submissionPhase === "running" || submissionPhase === "judging") && (
                <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              )}
              {submissionPhase === "running" ? "Running code..." :
               submissionPhase === "judging" ? "Analyzing..." : "Submit"}
            </button>
          </div>
        </div>

        {/* Monaco Editor (60%) */}
        <div className="h-[60%] w-full">
          <Editor
            height="100%"
            theme="vs-dark"
            language={language}
            value={code}
            onChange={(val) => setCode(val)}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              roundedSelection: false,
              padding: { top: 16 }
            }}
          />
        </div>

        {/* Editor Status Bar */}
        <div className="h-[24px] bg-[#2d2d2d] border-t border-[#3d3d3d] border-b border-[#3d3d3d] flex items-center justify-between px-3">
          <div className="text-[#8b949e] text-[11px] font-mono flex items-center gap-1.5">
            {language === 'python' ? '🐍 Python' : language === 'javascript' ? '🟨 JavaScript' : language === 'cpp' ? '🔷 C++' : '☕ Java'}
          </div>
          <div className="text-[#8b949e] text-[11px] font-mono">
            {`Lines: ${code.split('\\n').length}`}
          </div>
        </div>

        {/* Output / Feedback Area (40%) */}
        <div className="flex-1 flex flex-col bg-[#1a1a1a] border-t border-[#2d2d2d] overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center bg-[#2d2d2d] h-[36px] px-2 border-b border-[#3d3d3d]">
            <div
              onClick={() => setActiveTab("Output")}
              className={`px-4 h-full flex items-center text-[13px] cursor-pointer transition-colors border-b-2 
                ${activeTab === "Output" ? "text-white border-[#ffa116]" : "text-[#eff1f6bf] border-transparent hover:text-white"}`}
            >
              Output
            </div>
            <div
              onClick={() => setActiveTab("Feedback")}
              className={`px-4 h-full flex items-center text-[13px] cursor-pointer transition-colors duration-200 border-b-2 
                ${activeTab === "Feedback" ? "text-white border-[#ffa116]" : "text-[#eff1f6bf] border-transparent hover:text-white"}
                ${feedbackHighlight ? "text-[#ffa116] !border-[#ffa116] bg-[rgba(255,161,22,0.1)]" : ""}`}
            >
              Feedback
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "Output" ? (
              <div className="font-mono text-[13px]">
                {judgeStatus && (
                  <div className={`mb-3 font-semibold text-[15px] flex items-center gap-2 ${judgeStatus.toLowerCase().includes('accepted') ? 'text-[#2cbb5d] text-[16px]' : 'text-[#ff375f]'}`}>
                    {judgeStatus.toLowerCase().includes('accepted') ? (
                      <span className="inline-block animate-[scaleIn_0.2s_ease-out_forwards]">✓ Accepted</span>
                    ) : (
                      <span>✗ {judgeStatus}</span>
                    )}
                  </div>
                )}
                {output ? (
                  <div className="bg-[#2d2d2d] font-mono text-[12px] p-3 rounded-[6px] text-[#eff1f6] border border-[#3d3d3d] overflow-x-auto overflow-y-auto max-h-[150px] whitespace-pre-wrap">
                    {output}
                  </div>
                ) : (
                  <div className="text-[#eff1f6bf]">Run or Submit code to see output...</div>
                )}
              </div>
            ) : (
              <div className="text-[14px] leading-[1.7] text-[#eff1f6bf] whitespace-pre-wrap">
                {feedback || "Submit your code to receive AI autopsy and mentoring feedback..."}
              </div>
            )}
          </div>
        </div>

        {/* Chatbot Hidden Trigger (When closed) */}
        {!chatOpen && (
          <div
            onClick={() => setChatOpen(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#2d2d2d] border-l border-t border-b border-[#3d3d3d] cursor-pointer hover:bg-[#3d3d3d] hover:text-white transition-colors flex items-center justify-center py-[12px] px-[6px] text-[#8b949e] text-[12px] rounded-l-[6px]"
          >
            <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>💬 Ask TraceAI</span>
          </div>
        )}
      </div>

      {/* -------------------- CHATBOT SIDEBAR OVERLAY -------------------- */}
      {chatOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 transition-opacity"
          onClick={() => setChatOpen(false)}
        />
      )}

      {/* -------------------- CHATBOT SIDEBAR -------------------- */}
      <div 
        className={`fixed right-0 top-[44px] bottom-0 w-[360px] bg-[#1a1a1a] border-l border-[#2d2d2d] flex flex-col z-50 shadow-2xl transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          chatOpen ? 'translate-x-0 visible' : 'translate-x-full invisible'
        }`}
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 h-[45px] bg-[#2d2d2d] border-b border-[#3d3d3d]">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-[14px]">CodeSage Mentor - TraceAI</span>
            <span className="bg-[#c084fc]/20 text-[#c084fc] text-[10px] px-2 py-0.5 rounded">Socratic Mode</span>
          </div>
          <button onClick={() => setChatOpen(false)} className="text-[#eff1f6bf] hover:text-white transition-colors">✕</button>
        </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {chatHistory.length === 0 && (
              <div className="text-center text-[#eff1f6bf] text-[13px] mt-4">
                👋 Ask for a hint, concept breakdown, or debugging help!
              </div>
            )}
            {chatHistory.map((m, i) => (
              <div key={i} className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'self-end' : 'self-start'}`}>
                <div className={`p-3 rounded-lg text-[13px] leading-[1.6] ${m.role === 'user' ? 'bg-[#2d4a7a] text-white rounded-br-none' : 'bg-[#2d2d2d] text-[#eff1f6] rounded-bl-none border border-[#3d3d3d]'}`}>
                  {m.content}
                </div>
                {m.role === 'assistant' && m.memories_used && m.memories_used.length > 0 && (
                  <details className="mt-1 text-[11px] text-[#eff1f6bf] opacity-80 cursor-pointer pl-1">
                    <summary className="hover:text-white transition-colors outline-none cursor-pointer">📎 Based on your history</summary>
                    <ul className="pl-4 mt-1 list-disc space-y-1">
                      {m.memories_used.map((mem, j) => <li key={j}>{mem}</li>)}
                    </ul>
                  </details>
                )}
              </div>
            ))}
            {isChatting && (
              <div className="self-start bg-[#2d2d2d] p-3 rounded-lg text-white rounded-bl-none border border-[#3d3d3d] text-[13px]">
                <span className="animate-pulse">Typing...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 bg-[#2d2d2d] border-t border-[#3d3d3d] flex items-center gap-2">
            <input
              type="text"
              className="flex-1 bg-[#1a1a1a] text-white text-[13px] px-3 py-2 rounded border border-[#3d3d3d] outline-none focus:border-[#ffa116] transition-colors placeholder-[#eff1f6bf]"
              placeholder="Ask for guidance..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
            />
            <button
              onClick={handleChatSend}
              disabled={isChatting || !chatInput.trim()}
              className="bg-[#c084fc] text-white rounded w-8 h-8 flex items-center justify-center hover:bg-[#a855f7] disabled:opacity-50 transition-colors"
            >
              ↑
            </button>
          </div>
        </div>

      {/* -------------------- PATTERN BROKEN MODAL -------------------- */}
      {showPatternBroken && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-200">
          <div className="bg-[#1a1a1a] border-2 border-[#2cbb5d] rounded-xl p-8 max-w-[480px] w-full text-center shadow-[0_0_30px_rgba(44,187,93,0.15)] animate-[slideUpFade_0.25s_ease-out_forwards]">
            <div className="text-6xl mb-4 animate-[bounceIn_0.4s_ease-out_0.2s_both]">🎉</div>
            <h2 className="text-[#2cbb5d] text-[24px] font-[700] mb-4 tracking-tight">Pattern Broken!</h2>
            <p className="text-[#eff1f6] text-[15px] leading-relaxed mb-8 bg-[#2cbb5d]/10 p-4 rounded-lg border border-[#2cbb5d]/30">
              {patternBrokenDetail}
            </p>
            <button
              onClick={() => setShowPatternBroken(false)}
              className="bg-[#ffa116] text-[#1a1a1a] font-[700] px-8 py-3 rounded-lg hover:bg-[#ffb84d] transition-colors shadow-lg hover:shadow-xl active:scale-95"
            >
              Keep Going
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUpFade {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />

      {/* Keyboard Shortcuts Hint */}
      <div className="fixed bottom-0 left-0 right-0 h-[28px] bg-[#141414] border-t border-[#2d2d2d] text-center leading-[28px] text-[11px] font-mono text-[#3d3d3d] hover:text-[#8b949e] transition-colors z-[100] pointer-events-auto">
        ⌘+Enter Submit  ·  ⌘+G Generate  ·  ⌘+/ Chat  ·  Esc Close
      </div>
    </div>
  );
};

export default PracticeArena;
