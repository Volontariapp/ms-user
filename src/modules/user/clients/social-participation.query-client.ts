import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  PARTICIPATION_QUERY_SERVICE_NAME,
  ParticipationQueryServiceClient,
  GetEventParticipantsQuery,
  GetEventParticipantsResponse,
} from '@volontariapp/contracts-nest';
import { firstValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { Logger } from '@volontariapp/logger';
import { Observable } from 'rxjs';

interface QueryServiceWithMetadata extends ParticipationQueryServiceClient {
  getEventParticipants(
    request: GetEventParticipantsQuery,
    metadata?: Metadata,
  ): Observable<GetEventParticipantsResponse>;
}

@Injectable()
export class SocialParticipationQueryClientService implements OnModuleInit {
  private readonly logger = new Logger({ context: SocialParticipationQueryClientService.name });
  private queryService!: QueryServiceWithMetadata;

  constructor(@Inject(SOCIAL_PACKAGE) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.queryService = this.client.getService<ParticipationQueryServiceClient>(
      PARTICIPATION_QUERY_SERVICE_NAME,
    ) as QueryServiceWithMetadata;
    this.logger.log('SocialParticipationQueryClientService initialized');
  }

  async getEventParticipants(
    token: string,
    eventId: string,
    limit = 10,
    page = 1,
  ): Promise<{ ids: string[]; totalCount: number }> {
    this.logger.debug(
      `Calling getEventParticipants for event ${eventId} with limit=${String(limit)}, page=${String(page)}`,
    );
    const request: GetEventParticipantsQuery = { eventId, pagination: { limit, page } };

    const outboundMetadata = new Metadata();
    if (token) {
      outboundMetadata.set('x-internal-token', token);
    }

    const response: GetEventParticipantsResponse = await firstValueFrom(
      this.queryService.getEventParticipants(request, outboundMetadata),
    );
    return {
      ids: response.ids,
      totalCount: response.pagination?.total ?? 0,
    };
  }
}
