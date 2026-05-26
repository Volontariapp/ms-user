import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  RELATIONSHIP_QUERY_SERVICE_NAME,
  RelationshipQueryServiceClient,
  GetMyFollowsQuery,
  GetMyFollowersQuery,
  GetMyFollowsResponse,
  GetMyFollowersResponse,
} from '@volontariapp/contracts-nest';
import { firstValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { Logger } from '@volontariapp/logger';
import { Observable } from 'rxjs';

interface QueryServiceWithMetadata extends RelationshipQueryServiceClient {
  getMyFollows(request: GetMyFollowsQuery, metadata?: Metadata): Observable<GetMyFollowsResponse>;
  getMyFollowers(
    request: GetMyFollowersQuery,
    metadata?: Metadata,
  ): Observable<GetMyFollowersResponse>;
}

@Injectable()
export class SocialRelationshipQueryClientService implements OnModuleInit {
  private readonly logger = new Logger({ context: SocialRelationshipQueryClientService.name });
  private queryService!: QueryServiceWithMetadata;

  constructor(@Inject(SOCIAL_PACKAGE) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.queryService = this.client.getService<RelationshipQueryServiceClient>(
      RELATIONSHIP_QUERY_SERVICE_NAME,
    ) as QueryServiceWithMetadata;
    this.logger.log('SocialRelationshipQueryClientService initialized');
  }

  async getMyFollows(token: string, limit = 10, page = 1): Promise<string[]> {
    this.logger.debug(`Calling getMyFollows with limit=${String(limit)}, page=${String(page)}`);
    const request: GetMyFollowsQuery = { pagination: { limit, page } };

    const outboundMetadata = new Metadata();
    if (token) {
      outboundMetadata.set('x-internal-token', token);
    }

    const response: GetMyFollowsResponse = await firstValueFrom(
      this.queryService.getMyFollows(request, outboundMetadata),
    );
    return response.ids;
  }

  async getMyFollowers(token: string, limit = 10, page = 1): Promise<string[]> {
    this.logger.debug(`Calling getMyFollowers with limit=${String(limit)}, page=${String(page)}`);
    const request: GetMyFollowersQuery = { pagination: { limit, page } };

    const outboundMetadata = new Metadata();
    if (token) {
      outboundMetadata.set('x-internal-token', token);
    }

    const response: GetMyFollowersResponse = await firstValueFrom(
      this.queryService.getMyFollowers(request, outboundMetadata),
    );
    return response.ids;
  }
}
