import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScoringAuditFieldsToImpactScoreCredits1792300000000 implements MigrationInterface {
  name = 'AddScoringAuditFieldsToImpactScoreCredits1792300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "impact_score_credits" ADD COLUMN "role" character varying(20) NULL`,
    );
    await queryRunner.query(`ALTER TABLE "impact_score_credits" ADD COLUMN "rank" integer NULL`);
    await queryRunner.query(
      `ALTER TABLE "impact_score_credits" ADD COLUMN "formula_version" integer NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "impact_score_credits" ADD COLUMN "event_pool" integer NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "impact_score_credits" DROP COLUMN "event_pool"`);
    await queryRunner.query(`ALTER TABLE "impact_score_credits" DROP COLUMN "formula_version"`);
    await queryRunner.query(`ALTER TABLE "impact_score_credits" DROP COLUMN "rank"`);
    await queryRunner.query(`ALTER TABLE "impact_score_credits" DROP COLUMN "role"`);
  }
}
