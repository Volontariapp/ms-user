import { USERS_TRIGGER } from '@volontariapp/domain-user';
import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Re-applies the user.created trigger of @volontariapp/domain-user. Since domain-user 2.16.0 it
 * also targets the user:created stream, which ws-service needs to open the user creation gather
 * (without it the WebSocket 'user.created' notification is never sent). USERS_TRIGGER uses
 * CREATE OR REPLACE, so re-running it is safe.
 */
export class RefreshUserCreatedTrigger1792400000000 implements MigrationInterface {
  name = 'RefreshUserCreatedTrigger1792400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(USERS_TRIGGER);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
CREATE OR REPLACE FUNCTION create_user_created_event_queue_record()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO event_queue (
            type, emitter, "emitterId", payload, target_services,
            version, status, attempts, updated_at, created_at
        ) VALUES (
            'user.created',
            'ms-user',
            NEW.id,
            jsonb_build_object('after', jsonb_build_object('id', NEW.id, 'role', NEW.role)),
            ARRAY['social:user'],
            1, 'PENDING', 0, now(), now()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`);
  }
}
