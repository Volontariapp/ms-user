import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBadgeProgressTables1781500000000 implements MigrationInterface {
  name = 'CreateBadgeProgressTables1781500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "badge_progress" (
        "user_id" uuid NOT NULL,
        "metric" varchar(64) NOT NULL,
        "value" integer NOT NULL DEFAULT 0,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_badge_progress" PRIMARY KEY ("user_id", "metric")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "badge_progress"
      ADD CONSTRAINT "FK_badge_progress_user" FOREIGN KEY ("user_id")
      REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE "badge_progress_events" (
        "event_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_badge_progress_events" PRIMARY KEY ("event_id", "user_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "badge_progress_events"
      ADD CONSTRAINT "FK_badge_progress_events_user" FOREIGN KEY ("user_id")
      REFERENCES "users"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "badge_progress_events" DROP CONSTRAINT "FK_badge_progress_events_user"`,
    );
    await queryRunner.query(`DROP TABLE "badge_progress_events"`);
    await queryRunner.query(
      `ALTER TABLE "badge_progress" DROP CONSTRAINT "FK_badge_progress_user"`,
    );
    await queryRunner.query(`DROP TABLE "badge_progress"`);
  }
}
