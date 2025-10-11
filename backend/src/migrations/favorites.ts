export class CreateFavoritesTable {
  name = 'CreateFavoritesTable';

  async up(queryRunner: any): Promise<void> {
    // Check if table already exists
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'favorites'
      );
    `);
    
    if (tableExists[0].exists) {
      console.log('⚠️ Favorites table already exists. Skipping creation to preserve existing data...');
      console.log('✅ Favorites table migration completed safely (existing data preserved)');
      return;
    }

    console.log('📋 Creating new favorites table...');

    await queryRunner.query(`
      CREATE TABLE "favorites" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "biodataId" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_favorites_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_favorites_user' AND table_name = 'favorites'
        ) THEN
          ALTER TABLE "favorites" ADD CONSTRAINT "FK_favorites_user" 
          FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_favorites_biodata' AND table_name = 'favorites'
        ) THEN
          ALTER TABLE "favorites" ADD CONSTRAINT "FK_favorites_biodata" 
          FOREIGN KEY ("biodataId") REFERENCES "biodata"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_favorites_user_biodata" 
      ON "favorites" ("userId", "biodataId");
    `);

    console.log('✅ Favorites table created successfully!');

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_favorites_user_id" ON "favorites" ("userId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_favorites_biodata_id" ON "favorites" ("biodataId");
    `);
  }

  async down(queryRunner: any): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "favorites" CASCADE;`);
  }
}


