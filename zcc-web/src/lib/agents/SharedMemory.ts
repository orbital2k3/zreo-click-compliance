import type { AgentLog } from './types';

export class SharedMemory {
  private data: Record<string, any> = {};
  private logs: AgentLog[] = [];
  private onUpdate?: (data: Record<string, any>) => void;

  constructor(initialData: Record<string, any> = {}) {
    this.data = initialData;
  }

  public set(key: string, value: any, agentName: string) {
    this.data[key] = value;
    this.addLog(agentName, `Updated memory: ${key} = ${JSON.stringify(value)}`);
    if (this.onUpdate) {
      this.onUpdate(this.data);
    }
  }

  public get(key: string): any {
    return this.data[key];
  }

  public getAll(): Record<string, any> {
    return { ...this.data };
  }

  private addLog(agentName: string, message: string) {
    const log: AgentLog = {
      timestamp: new Date().toLocaleTimeString(),
      type: 'MEMORY',
      message: `[${agentName}] ${message}`
    };
    this.logs.push(log);
  }

  public getMemoryLogs(): AgentLog[] {
    return this.logs;
  }

  public subscribe(callback: (data: Record<string, any>) => void) {
    this.onUpdate = callback;
  }
}
