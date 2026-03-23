import React from 'react';

const Toast = ({ message, type }) => {
  const typeMap = {
    success: { bg: '#1a2e1a', docBorder: '#2cbb5d', icon: '✓', iconColor: '#2cbb5d' },
    error: { bg: '#2e1a1a', docBorder: '#ff375f', icon: '✗', iconColor: '#ff375f' },
    info: { bg: '#1a1f2e', docBorder: '#79c0ff', icon: 'ℹ', iconColor: '#79c0ff' },
    warning: { bg: '#2e2a1a', docBorder: '#ffa116', icon: '⚠', iconColor: '#ffa116' }
  };

  const style = typeMap[type] || typeMap.info;

  return (
    <div 
      className="min-w-[280px] max-w-[380px] rounded-[8px] py-[12px] px-[16px] text-[13px] font-[500] shadow-[0_4px_12px_rgba(0,0,0,0.4)] flex items-start gap-3 animate-[toastSlideIn_0.25s_ease-out_forwards] pointer-events-auto"
      style={{ 
        backgroundColor: style.bg, 
        borderLeft: `3px solid ${style.docBorder}` 
      }}
    >
      <span className="font-bold text-[14px] flex-shrink-0" style={{ color: style.iconColor }}>
        {style.icon}
      </span>
      <span className="text-[#eff1f6] leading-[1.5] flex-1">
        {message}
      </span>
    </div>
  );
};

export default Toast;
