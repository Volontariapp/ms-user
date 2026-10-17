import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateImpactScoreCredits1792100000000 implements MigrationInterface {
  name = 'CreateImpactScoreCredits1792100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "impact_score_credits" (
        "event_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "score" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_impact_score_credits" PRIMARY KEY ("event_id", "user_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "impact_score_credits"
      ADD CONSTRAINT "FK_impact_score_credits_user" FOREIGN KEY ("user_id")
      REFERENCES "users"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "impact_score_credits" DROP CONSTRAINT "FK_impact_score_credits_user"`,
    );
    await queryRunner.query(`DROP TABLE "impact_score_credits"`);
  }
}
