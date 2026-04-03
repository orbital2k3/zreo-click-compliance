import { BaseAgent } from './BaseAgent';

export class OutreachAgent extends BaseAgent {
  public async run(vendor: { name: string, email: string }) {
    this.setStatus('running');
    this.log(`Initiating outreach sequence for ${vendor.name}...`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.memory.set('vendor_details', vendor, this.config.name);
    this.log(`Searching internal CRM for ${vendor.name} contact history.`, 'CRM');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.log(`Sending autonomous email to ${vendor.email}. Subject: SOC 2 Report Request`, 'SMTP');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    this.memory.set('outreach_complete', true, this.config.name);
    this.log(`Request successfully delivered. Awaiting vendor reply.`, 'Outreach');
    
    this.setStatus('completed');
    return { success: true, status: 'outreach_sent' };
  }
}

export class ParserAgent extends BaseAgent {
  public async run(fileData: { name: string, size: number }) {
    this.setStatus('running');
    this.log(`Incoming artifact detected: ${fileData.name} (${(fileData.size / 1024).toFixed(1)} KB)`);
    
    // Demonstrate reading from memory
    const outreachComplete = this.memory.get('outreach_complete');
    if (!outreachComplete) {
      this.log('Warning: Parsing before outreach verification.', 'PARSER');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    this.log(`Initializing OCR layer. Extracted 142 semantic blocks.`, 'Parser');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    this.log(`Searching for "Auditor's Opinion"... Identified Page 12.`, 'Model');
    
    const findings = [
      { control: 'CC6.1', status: 'clean', description: 'Logical access controls operating effectively.' }
    ];
    this.memory.set('parsed_findings', findings, this.config.name);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.log(`Opinion Class: UNQUALIFIED. Status: Clean.`, 'Classification');
    
    this.setStatus('completed');
    return { success: true, status: 'parsing_complete', findings };
  }
}

export class RiskScorerAgent extends BaseAgent {
  public async run(_findings: any[] = []) {
    this.setStatus('running');
    
    // Demonstrate reading from memory instead of params
    const memoryFindings = this.memory.get('parsed_findings') || _findings;
    this.log(`Starting risk scoring based on ${memoryFindings.length} findings from shared memory...`);
    
    await new Promise(resolve => setTimeout(resolve, 2500));
    this.log(`Evaluating control effectiveness for Trust Services Principles: Security, Availability.`, 'Policy');
    
    await new Promise(resolve => setTimeout(resolve, 2500));
    this.memory.set('final_score', 95, this.config.name);
    this.memory.set('verdict', 'APPROVED', this.config.name);
    this.log(`No critical exceptions identified in auditors' test results.`, 'Scoring');
    
    this.setStatus('completed');
    return { success: true, score: 95, verdict: 'APPROVED' };
  }
}
