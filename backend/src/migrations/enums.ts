export class CreateEnums {
  name = 'CreateEnums';

  async up(queryRunner: any): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
          CREATE TYPE user_role_enum AS ENUM ('user', 'admin', 'superadmin');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        -- Only create enum types if they don't exist (preserve existing data)
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'biodata_approval_status_enum') THEN
          CREATE TYPE biodata_approval_status_enum AS ENUM ('in_progress', 'pending', 'approved', 'rejected', 'inactive');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'biodata_visibility_status_enum') THEN
          CREATE TYPE biodata_visibility_status_enum AS ENUM ('active', 'inactive');
        END IF;
      END
      $$;
    `);
  }
}


