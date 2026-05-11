/**
 * Simple in-process async job queue
 * Processes jobs sequentially (one at a time)
 * Retries once on failure before marking as failed
 */

interface Job {
  id: string;
  reportId: string;
  retries: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

type JobHandler = (reportId: string) => Promise<void>;

export class JobQueue {
  private queue: Job[] = [];
  private isProcessing = false;
  private jobHandler: JobHandler | null = null;

  /**
   * Register the job handler function
   */
  setJobHandler(handler: JobHandler): void {
    this.jobHandler = handler;
  }

  /**
   * Add a job to the queue
   */
  enqueue(reportId: string): void {
    const job: Job = {
      id: `${reportId}-${Date.now()}`,
      reportId,
      retries: 0,
      maxRetries: 1, // Retry once on failure
      status: 'pending',
    };

    this.queue.push(job);
    console.log(`[Queue] Job enqueued for report ${reportId}. Queue size: ${this.queue.length}`);

    // Start processing if not already running
    this.processNext();
  }

  /**
   * Process jobs sequentially
   */
  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue[0];

      if (!this.jobHandler) {
        console.error('[Queue] Job handler not set. Cannot process job.');
        this.isProcessing = false;
        return;
      }

      try {
        job.status = 'processing';
        console.log(`[Queue] Processing job ${job.id} for report ${job.reportId}`);

        await this.jobHandler(job.reportId);

        job.status = 'completed';
        console.log(`[Queue] Job ${job.id} completed successfully`);

        this.queue.shift(); // Remove from queue
      } catch (err) {
        console.error(`[Queue] Job ${job.id} failed:`, err);

        // Retry once
        if (job.retries < job.maxRetries) {
          job.retries++;
          job.status = 'pending';
          console.log(
            `[Queue] Retrying job ${job.id} (attempt ${job.retries + 1}/${job.maxRetries + 1})`
          );
          // Continue to retry (don't remove from queue, will retry immediately)
        } else {
          job.status = 'failed';
          console.error(`[Queue] Job ${job.id} failed permanently after ${job.maxRetries + 1} attempts`);
          this.queue.shift(); // Remove from queue after max retries
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Get queue status
   */
  getStatus(): {
    queueLength: number;
    isProcessing: boolean;
    jobs: Job[];
  } {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      jobs: [...this.queue],
    };
  }
}

// Export singleton instance
export const jobQueue = new JobQueue();
