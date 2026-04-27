import { randomUUID } from 'node:crypto';
import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseRepository,
  databaseMapper,
  JobsOutboxEntity,
  JobsOutboxModel,
  OutboxStatus,
  type Repository,
} from '@volontariapp/database';
import { Logger } from '@volontariapp/logger';
import { JobsOutboxWriter } from '@volontariapp/outbox';

databaseMapper.registerBidirectional(JobsOutboxModel, JobsOutboxEntity);

class JobsOutboxRepository extends BaseRepository<
  JobsOutboxModel,
  JobsOutboxEntity,
  string
> {
  constructor(repository: Repository<JobsOutboxModel>) {
    super(repository, JobsOutboxEntity, JobsOutboxModel);
  }
}

@Controller('test-outbox')
export class UserTestController {
  private readonly logger = new Logger({
    context: 'UserTestController',
    format: 'json',
  });

  constructor(
    @InjectRepository(JobsOutboxModel)
    private readonly typeormRepository: Repository<JobsOutboxModel>,
  ) {}

  @Get()
  async testOutbox(@Query('x') x: string): Promise<{ success: boolean; count: number; ids: string[] }> {
    const repository = new JobsOutboxRepository(this.typeormRepository);
    const writer = new JobsOutboxWriter(this.logger, repository);

    const count = parseInt(x, 10) || 1;
    const entities: JobsOutboxEntity[] = [];

    for (let i = 0; i < count; i++) {
      const now = new Date();
      const entity = new JobsOutboxEntity();
      entity.id = randomUUID();
      entity.type = 'test-job';
      entity.emitter = 'ms-user';
      entity.status = OutboxStatus.PENDING;
      entity.attempts = 0;
      entity.createdAt = now;
      entity.updatedAt = now;
      entity.target = 'test-target';
      entity.payload = { message: `hello world ${i + 1}`, index: i };
      entity.scheduledAt = now;
      entities.push(entity);
    }

    if (entities.length === 1) {
      await writer.create(entities[0]);
    } else {
      await writer.createMany(entities);
    }

    return {
      success: true,
      count: entities.length,
      ids: entities.map((e) => e.id),
    };
  }
}
