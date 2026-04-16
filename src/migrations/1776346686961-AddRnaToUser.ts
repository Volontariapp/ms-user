import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRnaToUser1776346686961 implements MigrationInterface {
  name = 'AddRnaToUser1776346686961';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "rna" varchar`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "rna"`);
  }
}
