import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConversationCreator1794264064585 implements MigrationInterface {
    name = 'AddConversationCreator1794264064585'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" ADD "created_by" uuid`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "client_id" uuid`);
        await queryRunner.query(`CREATE UNIQUE INDEX "conversations_creator_client_key" ON "conversations"  ("created_by", "client_id") WHERE "created_by" IS NOT NULL AND "client_id" IS NOT NULL`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_81d92d15c62b3fff79c617c9043" FOREIGN KEY ("created_by") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_81d92d15c62b3fff79c617c9043"`);
        await queryRunner.query(`DROP INDEX "public"."conversations_creator_client_key"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "client_id"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "created_by"`);
    }

}
