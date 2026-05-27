import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  INTERACTION_QUERY_SERVICE_NAME,
  InteractionQueryServiceClient,
  GetPostLikersQuery,
  GetPostLikersResponse,
} from '@volontariapp/contracts-nest';
import { firstValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { Logger } from '@volontariapp/logger';
import { Observable } from 'rxjs';

interface QueryServiceWithMetadata extends InteractionQueryServiceClient {
  getPostLikers(
    request: GetPostLikersQuery,
    metadata?: Metadata,
  ): Observable<GetPostLikersResponse>;
}

@Injectable()
export class SocialInteractionQueryClientService implements OnModuleInit {
  private readonly logger = new Logger({ context: SocialInteractionQueryClientService.name });
  private queryService!: QueryServiceWithMetadata;

  constructor(@Inject(SOCIAL_PACKAGE) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.queryService = this.client.getService<InteractionQueryServiceClient>(
      INTERACTION_QUERY_SERVICE_NAME,
    ) as QueryServiceWithMetadata;
    this.logger.log('SocialInteractionQueryClientService initialized');
  }

  async getPostLikers(token: string, postId: string, limit = 10, page = 1): Promise<string[]> {
    this.logger.debug(
      `Calling getPostLikers for post ${postId} with limit=${String(limit)}, page=${String(page)}`,
    );
    const request: GetPostLikersQuery = { postId, pagination: { limit, page } };

    const outboundMetadata = new Metadata();
    if (token) {
      outboundMetadata.set('x-internal-token', token);
    }

    const response: GetPostLikersResponse = await firstValueFrom(
      this.queryService.getPostLikers(request, outboundMetadata),
    );
    return response.ids;
  }
}
