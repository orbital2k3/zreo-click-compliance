export type AgentStatus = 'idle' | 'running' | 'paused' | 'failed' | 'completed';

export interface AgentLog {
  timestamp: string;
  type: string;
  message: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  type: 'outreach' | 'parser' | 'risk-analysis' | 'coordinator';
}
