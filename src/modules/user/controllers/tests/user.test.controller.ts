import { randomUUID } from 'node:crypto';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
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
import { JobMessagingType } from '@volontariapp/messaging';
import { TestOutboxResponse } from '../../dto/response/test-outbox.reponse.dto.js';

databaseMapper.registerBidirectional(JobsOutboxModel, JobsOutboxEntity);

class JobsOutboxRepository extends BaseRepository<JobsOutboxModel, JobsOutboxEntity, string> {
  constructor(repository: Repository<JobsOutboxModel>) {
    super(repository, JobsOutboxEntity, JobsOutboxModel);
  }
}

@ApiTags('test-outbox')
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
  @ApiOperation({ summary: 'Test jobs outbox creation' })
  @ApiQuery({
    name: 'x',
    required: false,
    type: String,
    description: 'Number of jobs to create',
  })
  @ApiResponse({ status: 200, type: TestOutboxResponse })
  async testOutbox(@Query('x') x: string): Promise<TestOutboxResponse> {
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
      entity.payload = { message: `hello world` };
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

  @Get('welcome-email')
  @ApiOperation({ summary: 'Push a SendWelcomeEmail job to outbox' })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'User ID',
    example: 'user-123',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'Email address',
    example: 'user@example.com',
  })
  @ApiQuery({
    name: 'firstName',
    required: false,
    type: String,
    description: 'First Name',
    example: 'John',
  })
  @ApiResponse({ status: 200, type: TestOutboxResponse })
  async pushWelcomeEmail(
    @Query('userId') userId: string = 'user-123',
    @Query('email') email: string = 'user@example.com',
    @Query('firstName') firstName: string = 'John',
  ): Promise<TestOutboxResponse> {
    const repository = new JobsOutboxRepository(this.typeormRepository);
    const writer = new JobsOutboxWriter(this.logger, repository);

    const now = new Date();
    const entity = new JobsOutboxEntity();
    entity.id = randomUUID();
    entity.type = JobMessagingType.SEND_WELCOME_EMAIL;
    entity.emitter = 'ms-user';
    entity.status = OutboxStatus.PENDING;
    entity.attempts = 0;
    entity.createdAt = now;
    entity.updatedAt = now;
    entity.target = 'user-queue';
    entity.payload = {
      userId,
      email,
      firstName,
    };
    entity.scheduledAt = now;

    await writer.create(entity);

    return {
      success: true,
      count: 1,
      ids: [entity.id],
    };
  }

  @Get('reset-password')
  @ApiOperation({ summary: 'Push a ResetPassword job to outbox' })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'Email address',
    example: 'user@example.com',
  })
  @ApiQuery({
    name: 'token',
    required: false,
    type: String,
    description: 'Reset Token',
    example: 'reset-token-xyz-123',
  })
  @ApiResponse({ status: 200, type: TestOutboxResponse })
  async pushResetPassword(
    @Query('email') email: string = 'user@example.com',
    @Query('token') token: string = 'reset-token-xyz-123',
  ): Promise<TestOutboxResponse> {
    const repository = new JobsOutboxRepository(this.typeormRepository);
    const writer = new JobsOutboxWriter(this.logger, repository);

    const now = new Date();
    const entity = new JobsOutboxEntity();
    entity.id = randomUUID();
    entity.type = JobMessagingType.RESET_PASSWORD;
    entity.emitter = 'ms-user';
    entity.status = OutboxStatus.PENDING;
    entity.attempts = 0;
    entity.createdAt = now;
    entity.updatedAt = now;
    entity.target = 'user-queue';
    entity.payload = {
      email,
      token,
    };
    entity.scheduledAt = now;

    await writer.create(entity);

    return {
      success: true,
      count: 1,
      ids: [entity.id],
    };
  }

  @Get('follow-user')
  @ApiOperation({ summary: 'Push a FollowUser job to outbox' })
  @ApiQuery({
    name: 'followerId',
    required: false,
    type: String,
    description: 'Follower User ID',
    example: 'follower-user-456',
  })
  @ApiQuery({
    name: 'followingId',
    required: false,
    type: String,
    description: 'Following User ID',
    example: 'following-user-789',
  })
  @ApiResponse({ status: 200, type: TestOutboxResponse })
  async pushFollowUser(
    @Query('followerId') followerId: string = 'follower-user-456',
    @Query('followingId') followingId: string = 'following-user-789',
  ): Promise<TestOutboxResponse> {
    const repository = new JobsOutboxRepository(this.typeormRepository);
    const writer = new JobsOutboxWriter(this.logger, repository);

    const now = new Date();
    const entity = new JobsOutboxEntity();
    entity.id = randomUUID();
    entity.type = JobMessagingType.FOLLOW_USER;
    entity.emitter = 'ms-user';
    entity.status = OutboxStatus.PENDING;
    entity.attempts = 0;
    entity.createdAt = now;
    entity.updatedAt = now;
    entity.target = 'social-queue';
    entity.payload = {
      followerId,
      followingId,
    };
    entity.scheduledAt = now;

    await writer.create(entity);

    return {
      success: true,
      count: 1,
      ids: [entity.id],
    };
  }

  @Get('publish-event')
  @ApiOperation({ summary: 'Push a PublishEvent job to outbox' })
  @ApiQuery({
    name: 'eventId',
    required: false,
    type: String,
    description: 'Event ID',
    example: 'event-abc-789',
  })
  @ApiQuery({
    name: 'creatorId',
    required: false,
    type: String,
    description: 'Creator User ID',
    example: 'user-123',
  })
  @ApiResponse({ status: 200, type: TestOutboxResponse })
  async pushPublishEvent(
    @Query('eventId') eventId: string = 'event-abc-789',
    @Query('creatorId') creatorId: string = 'user-123',
  ): Promise<TestOutboxResponse> {
    const repository = new JobsOutboxRepository(this.typeormRepository);
    const writer = new JobsOutboxWriter(this.logger, repository);

    const now = new Date();
    const entity = new JobsOutboxEntity();
    entity.id = randomUUID();
    entity.type = JobMessagingType.PUBLISH_EVENT;
    entity.emitter = 'ms-user';
    entity.status = OutboxStatus.PENDING;
    entity.attempts = 0;
    entity.createdAt = now;
    entity.updatedAt = now;
    entity.target = 'event-queue';
    entity.payload = {
      eventId,
      creatorId,
    };
    entity.scheduledAt = now;

    await writer.create(entity);

    return {
      success: true,
      count: 1,
      ids: [entity.id],
    };
  }

  @Get('publish-post')
  @ApiOperation({ summary: 'Push a PublishPost job to outbox' })
  @ApiQuery({
    name: 'postId',
    required: false,
    type: String,
    description: 'Post ID',
    example: 'post-def-456',
  })
  @ApiQuery({
    name: 'authorId',
    required: false,
    type: String,
    description: 'Author User ID',
    example: 'user-123',
  })
  @ApiResponse({ status: 200, type: TestOutboxResponse })
  async pushPublishPost(
    @Query('postId') postId: string = 'post-def-456',
    @Query('authorId') authorId: string = 'user-123',
  ): Promise<TestOutboxResponse> {
    const repository = new JobsOutboxRepository(this.typeormRepository);
    const writer = new JobsOutboxWriter(this.logger, repository);

    const now = new Date();
    const entity = new JobsOutboxEntity();
    entity.id = randomUUID();
    entity.type = JobMessagingType.PUBLISH_POST;
    entity.emitter = 'ms-user';
    entity.status = OutboxStatus.PENDING;
    entity.attempts = 0;
    entity.createdAt = now;
    entity.updatedAt = now;
    entity.target = 'post-queue';
    entity.payload = {
      postId,
      authorId,
    };
    entity.scheduledAt = now;

    await writer.create(entity);

    return {
      success: true,
      count: 1,
      ids: [entity.id],
    };
  }
}
