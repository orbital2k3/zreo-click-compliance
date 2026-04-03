import type { AgentConfig, AgentLog, AgentStatus } from './types';
import { SharedMemory } from './SharedMemory';

export abstract class BaseAgent {
  public config: AgentConfig;
  protected memory: SharedMemory;
  private status: AgentStatus = 'idle';
  private logs: AgentLog[] = [];
  private onLog?: (log: AgentLog) => void;
  private onStatusChange?: (status: AgentStatus) => void;

  constructor(config: AgentConfig, memory: SharedMemory) {
    this.config = config;
    this.memory = memory;
  }

  public getStatus(): AgentStatus {
    return this.status;
  }

  public getLogs(): AgentLog[] {
    return this.logs;
  }

  protected setStatus(status: AgentStatus) {
    this.status = status;
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  protected log(message: string, type?: string) {
    const newLog: AgentLog = {
      timestamp: new Date().toLocaleTimeString(),
      type: type || this.config.type.toUpperCase(),
      message
    };
    this.logs.push(newLog);
    if (this.onLog) {
      this.onLog(newLog);
    }
  }

  public subscribeToLogs(callback: (log: AgentLog) => void) {
    this.onLog = callback;
  }

  public subscribeToStatus(callback: (status: AgentStatus) => void) {
    this.onStatusChange = callback;
  }

  public abstract run(data: any): Promise<any>;
}
