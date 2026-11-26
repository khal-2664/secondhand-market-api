import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddForeignKeyIndexes1795676588289 implements MigrationInterface {
  name = 'AddForeignKeyIndexes1795676588289';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_ef504ef111805fb530dc5bea75" ON "posts" ("seller_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_852f266adc5d67c40405c887b4" ON "posts" ("category_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4431880582fab347b6290ee72b" ON "orders" ("post_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5e90e93d0e036c3fadbaefa4d0" ON "orders" ("buyer_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_92e950a2513a79bb3fab273c92" ON "reviews" ("reviewer_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a7b3e1afadd6b52f3b6864745e" ON "reviews" ("reviewee_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a7b3e1afadd6b52f3b6864745e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_92e950a2513a79bb3fab273c92"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5e90e93d0e036c3fadbaefa4d0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4431880582fab347b6290ee72b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_852f266adc5d67c40405c887b4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ef504ef111805fb530dc5bea75"`,
    );
  }
}
