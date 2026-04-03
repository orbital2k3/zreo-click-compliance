import { BaseAgent } from './BaseAgent';
import { OutreachAgent, ParserAgent, RiskScorerAgent } from './Specialists';
import { SharedMemory } from './SharedMemory';

export class CoordinatorAgent extends BaseAgent {
  private memoryInternal: SharedMemory;
  private outreach: OutreachAgent;
  private parser: ParserAgent;
  private scorer: RiskScorerAgent;

  constructor() {
    const sharedMem = new SharedMemory({
      session_id: Date.now().toString(),
      workflow_name: 'SOC2_ASSESSMENT'
    });
    
    super({ id: 'coordinator-main', name: 'ZCC Coordinator', type: 'coordinator' }, sharedMem);
    
    this.memoryInternal = sharedMem;
    this.outreach = new OutreachAgent({ id: 'outreach-1', name: 'Outreach Agent', type: 'outreach' }, sharedMem);
    this.parser = new ParserAgent({ id: 'parser-1', name: 'Parser Agent', type: 'parser' }, sharedMem);
    this.scorer = new RiskScorerAgent({ id: 'scorer-1', name: 'Risk Scorer Agent', type: 'risk-analysis' }, sharedMem);
  }

  public async run(vendor: any) {
    this.setStatus('running');
    this.log(`Received new vendor task: ${vendor.name} (${vendor.email}). Orchestrating with Shared Memory.`);
    this.memoryInternal.set('active_vendor', vendor, this.config.name);

    // 1. Outreach Stage
    this.log(`Tasking Outreach Agent...`);
    const outreachResult = await this.outreach.run(vendor);
    if (!outreachResult.success) {
      this.setStatus('failed');
      this.log(`Outreach stage failed. Workflow aborted.`, 'ERROR');
      return;
    }

    // 2. Parser Stage
    this.log(`Tasking Parser Agent with retrieved artifact...`);
    const parserResult = await this.parser.run({ name: `${vendor.name}_SOC2.pdf`, size: 14200000 });
    if (!parserResult.success) {
      this.setStatus('failed');
      this.log(`Parsing stage failed. Workflow aborted.`, 'ERROR');
      return;
    }

    // 3. Risk Scoring Stage
    this.log(`Tasking Risk Scorer Agent with parsed findings...`);
    const scoreResult = await this.scorer.run();
    if (!scoreResult.success) {
      this.setStatus('failed');
      this.log(`Risk scoring stage failed. Workflow aborted.`, 'ERROR');
      return;
    }

    return this._finalise(vendor.name);
  }

  /**
   * Manual upload path: skips Outreach and feeds the provided file
   * directly into the Parser → Risk Scorer pipeline.
   */
  public async runWithUpload(vendor: any, file: File) {
    this.setStatus('running');
    this.log(`Manual report upload received for ${vendor.name}: "${file.name}" (${(file.size / 1024).toFixed(1)} KB).`);
    this.memoryInternal.set('active_vendor', vendor, this.config.name);
    // Mark outreach as already satisfied so ParserAgent doesn't warn
    this.memoryInternal.set('outreach_complete', true, this.config.name);

    // Parser Stage
    this.log(`Routing uploaded artifact to Parser Agent...`);
    const parserResult = await this.parser.run({ name: file.name, size: file.size });
    if (!parserResult.success) {
      this.setStatus('failed');
      this.log(`Parsing stage failed. Workflow aborted.`, 'ERROR');
      return;
    }

    // Risk Scoring Stage
    this.log(`Tasking Risk Scorer Agent with parsed findings...`);
    const scoreResult = await this.scorer.run();
    if (!scoreResult.success) {
      this.setStatus('failed');
      this.log(`Risk scoring stage failed. Workflow aborted.`, 'ERROR');
      return;
    }

    return this._finalise(vendor.name, file.name);
  }

  private _finalise(vendorName: string, reportName?: string) {
    // Final result aggregation from Memory
    const finalScore = this.memoryInternal.get('final_score');
    const finalVerdict = this.memoryInternal.get('verdict');

    this.log(`Multi-agent workflow complete. Shared Memory finalized. Verdict: ${finalVerdict}. Score: ${finalScore}/100.`);
    this.setStatus('completed');

    return {
      verdict: finalVerdict,
      score: finalScore,
      reportName: reportName ?? `${vendorName}_SOC2_2025.pdf`,
      reports: [
        {
          year: '2025',
          date: new Date().toLocaleDateString(),
          status: finalVerdict.toLowerCase(),
          exceptions: finalScore > 90 ? 0 : 1,
          reportName: reportName ?? `${vendorName}_SOC2_2025.pdf`
        }
      ]
    };
  }

  public subscribeToAll(callback: (log: any) => void) {
    this.subscribeToLogs(callback);
    this.outreach.subscribeToLogs(callback);
    this.parser.subscribeToLogs(callback);
    this.scorer.subscribeToLogs(callback);
    
    // Also stream memory logs
    this.memoryInternal.subscribe((data) => {
      const lastKey = Object.keys(data).pop();
      callback({
        timestamp: new Date().toLocaleTimeString(),
        type: 'MEMORY',
        message: `Persistent sync: ${lastKey}`
      });
    });
  }
}
