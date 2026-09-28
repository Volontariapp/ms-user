import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDefaultBadges1780000000001 implements MigrationInterface {
  name = 'SeedDefaultBadges1780000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "badges" ("name", "slug", "description") VALUES
        ('Premier Pas', 'EVENT_PARTICIPATION_TIER_1', 'Participer à 1 événement'),
        ('Engagé·e', 'EVENT_PARTICIPATION_TIER_2', 'Participer à 5 événements'),
        ('Pilier', 'EVENT_PARTICIPATION_TIER_3', 'Participer à 10 événements'),
        ('Figure locale', 'EVENT_PARTICIPATION_TIER_4', 'Participer à 20 événements'),
        ('Cœur Solidaire', 'EVENT_SOCIAL_TIER_1', 'Participer à 1 événement socio'),
        ('Tisseur·se de liens', 'EVENT_SOCIAL_TIER_2', 'Participer à 5 événements socio'),
        ('Graine d''écolo', 'EVENT_ECOLOGY_TIER_1', 'Participer à 1 événement éco'),
        ('Main Verte', 'EVENT_ECOLOGY_TIER_2', 'Participer à 5 événements éco'),
        ('Éco-Solidaire', 'EVENT_HYBRID_ECO_SOCIAL_TIER_1', 'Participer à 5 événements éco et 5 événements socio'),
        ('Soutien du cœur', 'SOCIAL_LIKE_COUNT_10', 'Liker 10 posts'),
        ('Curieux·se', 'EVENT_WISHLIST_COUNT_10', 'Wishlist 10 événements'),
        ('Première Plume', 'COMMUNITY_POST_COUNT_1', 'Poster 1 post'),
        ('Bâtisseur·se', 'EVENT_HOST_COUNT_1', 'Poster 1 événement')
      ON CONFLICT ("slug") DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "badges" WHERE "slug" IN (
        'EVENT_PARTICIPATION_TIER_1',
        'EVENT_PARTICIPATION_TIER_2',
        'EVENT_PARTICIPATION_TIER_3',
        'EVENT_PARTICIPATION_TIER_4',
        'EVENT_SOCIAL_TIER_1',
        'EVENT_SOCIAL_TIER_2',
        'EVENT_ECOLOGY_TIER_1',
        'EVENT_ECOLOGY_TIER_2',
        'EVENT_HYBRID_ECO_SOCIAL_TIER_1',
        'SOCIAL_LIKE_COUNT_10',
        'EVENT_WISHLIST_COUNT_10',
        'COMMUNITY_POST_COUNT_1',
        'EVENT_HOST_COUNT_1'
      );
    `);
  }
}
