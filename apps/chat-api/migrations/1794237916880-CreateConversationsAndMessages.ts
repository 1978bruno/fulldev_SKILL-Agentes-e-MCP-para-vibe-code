import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateConversationsAndMessages1794237916880 implements MigrationInterface {
    name = 'CreateConversationsAndMessages1794237916880'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "conversations" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "kind" text NOT NULL, "name" text, "topic" text, CONSTRAINT "conversations_topic_length_check" CHECK (char_length("topic") <= 250), CONSTRAINT "conversations_name_length_check" CHECK (char_length("name") BETWEEN 1 AND 80), CONSTRAINT "conversations_channel_name_check" CHECK ("kind" <> 'public_channel' OR "name" IS NOT NULL), CONSTRAINT "conversations_kind_check" CHECK ("kind" IN ('public_channel')), CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "conversations_name_key" ON "conversations"  ("name") WHERE "name" IS NOT NULL`);
        await queryRunner.query(`CREATE TABLE "conversation_members" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "conversation_id" uuid NOT NULL, "person_id" uuid NOT NULL, CONSTRAINT "conversation_members_conversation_person_key" UNIQUE ("conversation_id", "person_id"), CONSTRAINT "PK_33146a476696a973a14d931e675" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_307396ba74dab7d9014ea24e6f" ON "conversation_members"  ("person_id") `);
        await queryRunner.query(`CREATE TABLE "messages" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "conversation_id" uuid NOT NULL, "author_id" uuid NOT NULL, "client_id" uuid NOT NULL, "body" text NOT NULL, CONSTRAINT "messages_author_client_key" UNIQUE ("author_id", "client_id"), CONSTRAINT "messages_body_length_check" CHECK (char_length("body") BETWEEN 1 AND 4000), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "messages_conversation_id_id_idx" ON "messages"  ("conversation_id", "id") `);
        await queryRunner.query(`ALTER TABLE "conversation_members" ADD CONSTRAINT "FK_36340a1704b039608e34244511f" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_members" ADD CONSTRAINT "FK_307396ba74dab7d9014ea24e6fb" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_05535bc695e9f7ee104616459d3" FOREIGN KEY ("author_id") REFERENCES "people"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_05535bc695e9f7ee104616459d3"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23"`);
        await queryRunner.query(`ALTER TABLE "conversation_members" DROP CONSTRAINT "FK_307396ba74dab7d9014ea24e6fb"`);
        await queryRunner.query(`ALTER TABLE "conversation_members" DROP CONSTRAINT "FK_36340a1704b039608e34244511f"`);
        await queryRunner.query(`DROP INDEX "public"."messages_conversation_id_id_idx"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_307396ba74dab7d9014ea24e6f"`);
        await queryRunner.query(`DROP TABLE "conversation_members"`);
        await queryRunner.query(`DROP INDEX "public"."conversations_name_key"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
    }

}
