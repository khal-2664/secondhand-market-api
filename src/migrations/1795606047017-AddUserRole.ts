import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRole1795606047017 implements MigrationInterface {
  name = 'AddUserRole1795606047017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" character varying(20) NOT NULL DEFAULT 'member'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
  }
}
