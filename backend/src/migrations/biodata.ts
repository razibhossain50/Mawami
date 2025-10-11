export class CreateBiodataTable {
  name = 'CreateBiodataTable';

  async up(queryRunner: any): Promise<void> {
    // Check if table already exists
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'biodata'
      );
    `);
    
    if (tableExists[0].exists) {
      console.log('⚠️ Biodata table already exists. Running column migrations to ensure all columns exist...');
      
      // Helper function to check if column exists
      const columnExists = async (columnName: string) => {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'biodata' 
            AND column_name = $1
          );
        `, [columnName]);
        return result[0].exists;
      };

      // Ensure enum types exist
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'biodata_approval_status_enum') THEN
            CREATE TYPE biodata_approval_status_enum AS ENUM ('in_progress', 'pending', 'approved', 'rejected', 'inactive');
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'biodata_visibility_status_enum') THEN
            CREATE TYPE biodata_visibility_status_enum AS ENUM ('active', 'inactive');
          END IF;
        END
        $$;
      `);

      // Add missing columns if they don't exist (safe for existing data)
      if (!(await columnExists('profilePictureVisible'))) {
        console.log('📋 Adding profilePictureVisible column...');
        await queryRunner.query(`
          ALTER TABLE "biodata" 
          ADD COLUMN "profilePictureVisible" boolean NOT NULL DEFAULT false;
        `);
        console.log('✅ Added profilePictureVisible column with default value false');
      }

      if (!(await columnExists('biodataApprovalStatus'))) {
        console.log('📋 Adding biodataApprovalStatus column...');
        // First add column as nullable to check existing data
        await queryRunner.query(`
          ALTER TABLE "biodata" 
          ADD COLUMN "biodataApprovalStatus" biodata_approval_status_enum;
        `);
        
        // Set default only for NULL values (newly added)
        await queryRunner.query(`
          UPDATE "biodata" 
          SET "biodataApprovalStatus" = 'in_progress' 
          WHERE "biodataApprovalStatus" IS NULL;
        `);
        
        // Now make it NOT NULL since all rows have values
        await queryRunner.query(`
          ALTER TABLE "biodata" 
          ALTER COLUMN "biodataApprovalStatus" SET NOT NULL;
        `);
        
        // Set default for future inserts
        await queryRunner.query(`
          ALTER TABLE "biodata" 
          ALTER COLUMN "biodataApprovalStatus" SET DEFAULT 'in_progress';
        `);
        
        console.log('✅ Added biodataApprovalStatus column (preserving any existing values)');
      } else {
        console.log('✅ biodataApprovalStatus column already exists (preserving existing values)');
      }

      if (!(await columnExists('biodataVisibilityStatus'))) {
        console.log('📋 Adding biodataVisibilityStatus column...');
        await queryRunner.query(`
          ALTER TABLE "biodata" 
          ADD COLUMN "biodataVisibilityStatus" biodata_visibility_status_enum NOT NULL DEFAULT 'active';
        `);
        console.log('✅ Added biodataVisibilityStatus column');
      }

      if (!(await columnExists('viewCount'))) {
        console.log('📋 Adding viewCount column...');
        await queryRunner.query(`
          ALTER TABLE "biodata" 
          ADD COLUMN "viewCount" integer NOT NULL DEFAULT 0;
        `);
        console.log('✅ Added viewCount column');
      }

      if (!(await columnExists('createdAt'))) {
        console.log('📋 Adding createdAt column...');
        await queryRunner.query(`
          ALTER TABLE "biodata" 
          ADD COLUMN "createdAt" TIMESTAMP NOT NULL DEFAULT now();
        `);
        console.log('✅ Added createdAt column');
      }

      if (!(await columnExists('updatedAt'))) {
        console.log('📋 Adding updatedAt column...');
        await queryRunner.query(`
          ALTER TABLE "biodata" 
          ADD COLUMN "updatedAt" TIMESTAMP NOT NULL DEFAULT now();
        `);
        console.log('✅ Added updatedAt column');
      }

      // Create indexes
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_biodata_approval_status" ON "biodata" ("biodataApprovalStatus");
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_biodata_visibility_status" ON "biodata" ("biodataVisibilityStatus");
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_biodata_profile_picture_visible" ON "biodata" ("profilePictureVisible");
      `);

      console.log('✅ All biodata columns verified and missing columns added successfully!');
      return;
    }

    console.log('📋 Creating new biodata table...');

    // Ensure enum types exist before creating table
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'biodata_approval_status_enum') THEN
          CREATE TYPE biodata_approval_status_enum AS ENUM ('in_progress', 'pending', 'approved', 'rejected', 'inactive');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'biodata_visibility_status_enum') THEN
          CREATE TYPE biodata_visibility_status_enum AS ENUM ('active', 'inactive');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE "biodata" (
        "id" SERIAL NOT NULL,
        "step" integer NOT NULL DEFAULT 1,
        "userId" integer,
        "completedSteps" text,
        "partnerAgeMin" integer,
        "partnerAgeMax" integer,
        "sameAsPermanent" boolean DEFAULT false,
        "religion" character varying,
        "biodataType" character varying,
        "maritalStatus" character varying,
        "dateOfBirth" character varying,
        "age" integer,
        "height" character varying,
        "weight" integer,
        "complexion" character varying,
        "profession" character varying,
        "bloodGroup" character varying,
        "permanentCountry" character varying,
        "permanentDivision" character varying,
        "permanentZilla" character varying,
        "permanentUpazilla" character varying,
        "permanentArea" character varying,
        "presentCountry" character varying,
        "presentDivision" character varying,
        "presentZilla" character varying,
        "presentUpazilla" character varying,
        "presentArea" character varying,
        "healthIssues" character varying,
        "educationMedium" character varying,
        "highestEducation" character varying,
        "instituteName" character varying,
        "subject" character varying,
        "passingYear" character varying,
        "result" character varying,
        "economicCondition" character varying,
        "fatherName" character varying,
        "fatherProfession" character varying,
        "fatherAlive" character varying,
        "motherName" character varying,
        "motherProfession" character varying,
        "motherAlive" character varying,
        "brothersCount" integer,
        "sistersCount" integer,
        "familyDetails" character varying,
        "partnerComplexion" character varying,
        "partnerHeight" character varying,
        "partnerEducation" character varying,
        "partnerProfession" character varying,
        "partnerLocation" character varying,
        "partnerDetails" character varying,
        "fullName" character varying,
        "profilePicture" character varying,
        "profilePictureVisible" boolean NOT NULL DEFAULT false,
        "email" character varying,
        "guardianMobile" character varying,
        "ownMobile" character varying,
        "biodataApprovalStatus" biodata_approval_status_enum NOT NULL DEFAULT 'in_progress',
        "biodataVisibilityStatus" biodata_visibility_status_enum NOT NULL DEFAULT 'active',
        "viewCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_biodata_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_biodata_user' AND table_name = 'biodata'
        ) THEN
          ALTER TABLE "biodata" ADD CONSTRAINT "FK_biodata_user" 
          FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_biodata_user_id" ON "biodata" ("userId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_biodata_approval_status" ON "biodata" ("biodataApprovalStatus");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_biodata_visibility_status" ON "biodata" ("biodataVisibilityStatus");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_biodata_profile_picture_visible" ON "biodata" ("profilePictureVisible");
    `);

    console.log('✅ Biodata table created successfully with all required columns!');
  }

  async down(queryRunner: any): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_biodata_profile_picture_visible";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_biodata_visibility_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_biodata_approval_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_biodata_user_id";`);
    
    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "biodata" CASCADE;`);
    
    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS biodata_visibility_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS biodata_approval_status_enum;`);
  }
}


