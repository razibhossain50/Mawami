export class CreateProfileViewsTable {
  name = 'CreateProfileViewsTable';

  async up(queryRunner: any): Promise<void> {
    // Check if table already exists
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profile_views'
      );
    `);
    
    if (tableExists[0].exists) {
      console.log('⚠️ Profile views table already exists. Skipping creation to preserve existing data...');
      console.log('✅ Profile views table migration completed safely (existing data preserved)');
      return;
    }

    console.log('📋 Creating new profile views table...');

    await queryRunner.query(`
      CREATE TABLE "profile_views" (
        "id" SERIAL NOT NULL,
        "biodataId" integer NOT NULL,
        "viewerId" integer,
        "ipAddress" character varying,
        "userAgent" character varying,
        "viewedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_profile_views_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_profile_views_viewer' AND table_name = 'profile_views'
        ) THEN
          ALTER TABLE "profile_views" ADD CONSTRAINT "FK_profile_views_viewer" 
          FOREIGN KEY ("viewerId") REFERENCES "user"("id") ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_profile_views_biodata' AND table_name = 'profile_views'
        ) THEN
          ALTER TABLE "profile_views" ADD CONSTRAINT "FK_profile_views_biodata" 
          FOREIGN KEY ("biodataId") REFERENCES "biodata"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_profile_views_viewer_id" ON "profile_views" ("viewerId");
    `);

    console.log('✅ Profile views table created successfully!');

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_profile_views_biodata_id" ON "profile_views" ("biodataId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_profile_views_viewed_at" ON "profile_views" ("viewedAt");
    `);
  }

  async down(queryRunner: any): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "profile_views" CASCADE;`);
  }
}


