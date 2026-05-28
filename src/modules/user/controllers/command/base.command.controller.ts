import type { DataSource } from 'typeorm';
import { JobsOutboxEntity, JobsOutboxModel } from '@volontariapp/database';
import { JobsOutboxRepository } from '@volontariapp/outbox';
import type { JobRegistry } from '@volontariapp/messaging';
import { UserQueue } from '@volontariapp/messaging';
import { isBaseApiError } from '@volontariapp/errors';
import { FALLBACK_ACTIVATED } from '@volontariapp/errors-nest';
import { Logger } from '@volontariapp/logger';

export abstract class BaseCommandController {
  protected readonly logger = new Logger({ context: this.constructor.name });

  constructor(protected readonly dataSource: DataSource) {}

  protected async withFallback<T, K extends keyof JobRegistry>(
    jobType: K,
    userId: string,
    payload: JobRegistry[K] extends { payload: infer P } ? P : never,
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      if (
        isBaseApiError(error) &&
        (error.statusCode === 404 || error.statusCode === 409 || error.statusCode === 400)
      ) {
        this.logger.warn(
          `Operation failed with client error (${String(error.statusCode)}). No fallback job created for ${String(jobType)}.`,
        );
        throw error;
      }

      this.logger.error(
        `Operation failed. Pushing fallback job of type ${String(jobType)} to outbox.`,
        error,
      );

      const repo = new JobsOutboxRepository<K>(this.dataSource.getRepository(JobsOutboxModel));
      const job = JobsOutboxEntity.createJob<K>({
        type: jobType,
        emitter: 'ms-user',
        emitterId: userId,
        target: UserQueue.FALLBACK_USER,
        // @ts-expect-error TS cannot narrow conditional generic types (JobPayload<K>) dynamically
        payload: { userId, payload },
      });
      await repo.create(job);
      this.logger.log(`Fallback job ${job.id} created successfully.`);
      throw FALLBACK_ACTIVATED(
        String(jobType),
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
