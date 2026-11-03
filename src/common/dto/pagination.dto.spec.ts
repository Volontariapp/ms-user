import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from '@jest/globals';
import { MAX_PAGINATION_LIMIT, PaginationRequestDTO } from './pagination.dto.js';

describe('PaginationRequestDTO', () => {
  it('doit valider avec page 1 et limit 10', async () => {
    const dto = plainToInstance(PaginationRequestDTO, {
      page: 1,
      limit: 10,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('doit valider avec page 1 et limit 1000', async () => {
    const dto = plainToInstance(PaginationRequestDTO, {
      page: 1,
      limit: 1000,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('doit refuser une limit superieure au plafond (1001)', async () => {
    const dto = plainToInstance(PaginationRequestDTO, {
      page: 1,
      limit: 1001,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((error) => error.property === 'limit')).toBe(true);
  });

  it('doit refuser une page egale a 0', async () => {
    const dto = plainToInstance(PaginationRequestDTO, {
      page: 0,
      limit: 10,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((error) => error.property === 'page')).toBe(true);
  });

  it('doit refuser une limit egale a 0', async () => {
    const dto = plainToInstance(PaginationRequestDTO, {
      page: 1,
      limit: 0,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((error) => error.property === 'limit')).toBe(true);
  });

  it('doit refuser une limit non entiere egale a 2.5', async () => {
    const dto = plainToInstance(PaginationRequestDTO, {
      page: 1,
      limit: 2.5,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((error) => error.property === 'limit')).toBe(true);
  });
});
