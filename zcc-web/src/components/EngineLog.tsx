import React from 'react';

interface EngineLogProps {
  logs: any[];
}

export const EngineLog: React.FC<EngineLogProps> = ({ logs }) => (
  <div className="engine-container-v2">
    <div className="engine-header-v2">
      <div className="header-titles">
        <h1 className="title-v2">Analysis Engine Live Cluster Log</h1>
        <p className="subtitle-v2">Monitoring autonomous ZCC parser clusters in real-time.</p>
      </div>
      <div className="engine-status-v2">
        <div className="pulse-dot-large"></div>
        <span className="status-text-v2">Engine Online</span>
      </div>
    </div>

    <div className="terminal-container">
      <div className="terminal-header-v2">
        <div className="terminal-buttons">
          <div className="terminal-dot red"></div>
          <div className="terminal-dot yellow"></div>
          <div className="terminal-dot green"></div>
        </div>
        <div className="terminal-title">zcc-agent-cluster-us-east-1</div>
      </div>
      
      <div className="terminal-body-v2">
        {logs.map((log, i) => (
          <div key={i} className="log-line-v2">
            <span className="log-timestamp">{log.timestamp}</span>
            <span className={`log-tag tag-${log.type.toLowerCase()}`}>[{log.type}]</span>
            {' '}
            <span className="log-message" style={{ color: log.message.includes('deviation') ? 'var(--warning)' : 'inherit' }}>
              {log.message}
            </span>
          </div>
        ))}
        <div className="log-line-v2 current">
          <span className="log-timestamp">16:41:36.192</span>
          <span className="log-tag tag-model">[Model]</span>
          {' '}
          <span className="log-message">Awaiting context resolution</span>
          <span className="terminal-cursor"></span>
        </div>
      </div>
    </div>
  </div>
);
