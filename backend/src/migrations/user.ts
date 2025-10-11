export class CreateUserTable {
  name = 'CreateUserTable';

  async up(queryRunner: any): Promise<void> {
    // Check if table already exists
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user'
      );
    `);

    if (tableExists[0].exists) {
      console.log('⚠️ User table already exists. Skipping creation to preserve existing data...');

      // Only add missing columns or indexes if needed
      // Add any new columns here in future migrations

      console.log('✅ User table migration completed safely (existing data preserved)');
      return;
    }

    console.log('📋 Creating new user table...');

    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" SERIAL NOT NULL,
        "fullName" character varying,
        "email" character varying NOT NULL,
        "password" character varying,
        "googleId" character varying,
        "profilePicture" character varying,
        "role" user_role_enum NOT NULL DEFAULT 'user',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_user_email" ON "user" ("email");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_email" ON "user" ("email");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_google_id" ON "user" ("googleId") WHERE "googleId" IS NOT NULL;
    `);

    console.log('✅ User table created successfully!');
  }

  async down(queryRunner: any): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user" CASCADE;`);
  }
}


