import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from '@jest/globals';
import { GetUsersByIdsQueryDTO, MAX_USERS_BY_IDS } from './get-users-by-ids.query.dto.js';

const buildIds = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => `id-${String(index)}`);

describe('GetUsersByIdsQueryDTO', () => {
  it('doit valider exactement 100 ids', async () => {
    const dto = plainToInstance(GetUsersByIdsQueryDTO, { ids: buildIds(MAX_USERS_BY_IDS) });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('doit refuser plus de 100 ids', async () => {
    const dto = plainToInstance(GetUsersByIdsQueryDTO, { ids: buildIds(MAX_USERS_BY_IDS + 1) });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints).toHaveProperty('arrayMaxSize');
  });

  it('doit refuser un ids qui n est pas un tableau', async () => {
    const dto = plainToInstance(GetUsersByIdsQueryDTO, { ids: 'abc' });
    expect(await validate(dto)).not.toHaveLength(0);
  });
});
