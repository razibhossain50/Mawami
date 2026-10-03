import * as bcrypt from 'bcryptjs';

/**
 * Seeds BULK_COUNT users (seed0001@finder.test ...) each with one biodata, using varied,
 * deterministic data (same run => same data) so search / filters / pagination can be tested.
 * Idempotent: users that already exist (by email) are skipped. Login password: Testpass@50
 */
export const BULK_COUNT = 500;
export const BULK_EMAIL_DOMAIN = 'finder.test';

// ---- tiny deterministic PRNG (mulberry32) ----
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = makeRng(20261003);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
const int = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
/** Weighted pick: [value, weight][] */
const weighted = <T>(items: ReadonlyArray<readonly [T, number]>): T => {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [v, w] of items) {
    if ((r -= w) <= 0) return v;
  }
  return items[items.length - 1][0];
};

const MALE_NAMES = ['Abdullah', 'Rahim', 'Karim', 'Hasan', 'Hossain', 'Imran', 'Tanvir', 'Rafiq', 'Sakib', 'Nasir', 'Fahim', 'Jahid', 'Mahmud', 'Arif', 'Shahin', 'Rakib', 'Tareq', 'Mizanur', 'Faisal', 'Shamim'];
const FEMALE_NAMES = ['Fatema', 'Ayesha', 'Nusrat', 'Sumaiya', 'Tahmina', 'Rokeya', 'Jannat', 'Farzana', 'Sadia', 'Mim', 'Nadia', 'Rima', 'Shirin', 'Tasnim', 'Laila', 'Maliha', 'Sharmin', 'Anika', 'Parvin', 'Humaira'];
const SURNAMES = ['Ahmed', 'Rahman', 'Islam', 'Khan', 'Chowdhury', 'Uddin', 'Hossain', 'Sarker', 'Mia', 'Akter', 'Begum', 'Siddique', 'Talukder', 'Mondal', 'Sheikh'];
const FATHER_NAMES = ['Md. Abdul Karim', 'Md. Rafiqul Islam', 'Md. Shahidullah', 'Abul Hashem', 'Md. Nurul Haque', 'Mofazzal Hossain', 'Md. Jalal Uddin', 'Abdus Salam'];
const MOTHER_NAMES = ['Rahima Begum', 'Salma Khatun', 'Fatema Begum', 'Nasima Akter', 'Rokeya Khatun', 'Jahanara Begum', 'Morzina Akter', 'Amena Begum'];

const RELIGIONS = [['Islam', 80], ['Hinduism', 10], ['Christianity', 5], ['Buddhism', 4], ['Other', 1]] as const;
const MARITAL = [['Unmarried', 70], ['Divorced', 14], ['Married', 4], ['Widow', 6], ['Widower', 6]] as const;
const COMPLEXIONS = ['Black', 'Dusky', 'Wheatish', 'Fair', 'Very Fair'] as const;
const BLOOD = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'] as const;
const PROFESSIONS = ['Software Engineer', 'Doctor', 'Teacher', 'Banker', 'Businessman', 'Civil Engineer', 'Government Job', 'Lawyer', 'Pharmacist', 'Accountant', 'Student', 'Architect', 'Nurse', 'Entrepreneur', 'Army Officer'] as const;
const FEMALE_PROFESSIONS = [...PROFESSIONS, 'Housewife', 'Fashion Designer'] as const;
const MEDIUMS = ['Bangla', 'English', 'Arabic', 'Others'] as const;
const EDUCATIONS = ['Below SSC', 'SSC', 'HSC', 'Diploma', 'Diploma Running', 'Honours', 'Honours Running', 'Masters', 'Masters Running', 'PHD'] as const;
const RESULTS = ['Not Available', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D'] as const;
const SUBJECTS = ['Computer Science', 'Business Administration', 'Medicine', 'English Literature', 'Civil Engineering', 'Economics', 'Law', 'Pharmacy', 'Electrical Engineering', 'Accounting', 'Islamic Studies', 'Architecture'] as const;
const INSTITUTES = ['BUET', 'Dhaka University', 'Rajshahi University', 'Chittagong University', 'North South University', 'BRAC University', 'SUST', 'Jahangirnagar University', 'Khulna University', 'Dhaka Medical College', 'Notre Dame College', 'Viqarunnisa Noon School'] as const;
const ECONOMIC = ['Lower Class', 'Lower Middle Class', 'Middle Class', 'Upper Middle Class', 'Upper Class'] as const;
const FATHER_PROFESSIONS = ['Business', 'Teacher', 'Retired', 'Farmer', 'Government Job', 'Doctor', 'Engineer', 'Banker'] as const;
const MOTHER_PROFESSIONS = ['Housewife', 'Teacher', 'Doctor', 'Government Job', 'Banker', 'Housewife'] as const;
const HEALTH = ['None', 'None', 'None', 'None', 'Mild asthma', 'Diabetes (controlled)', 'Wears glasses', 'Allergies'] as const;

// height keys match the form: '4.11', '5.7', 'below-4', 'upper-7'
const HEIGHT_MIN = 48; // 4'0"
const HEIGHT_MAX = 83; // 6'11"
const heightKey = (inches: number) => `${Math.floor(inches / 12)}.${inches % 12}`;
const heightLabel = (inches: number) => `${Math.floor(inches / 12)}ft ${inches % 12}in`;

// [division, district, upazila] - names exist in frontend/src/api/geo-location.ts
const LOCATIONS = [
  ['Dhaka', 'Dhaka', 'Savar'],
  ['Dhaka', 'Dhaka', 'Dohar'],
  ['Dhaka', 'Dhaka', 'Keraniganj'],
  ['Chattogram', 'Chattogram', 'Anwara'],
  ['Chattogram', 'Chattogram', 'Banshkhali'],
  ['Rajshahi', 'Rajshahi', 'Bagha'],
  ['Khulna', 'Khulna', 'Batiaghata'],
  ['Sylhet', 'Sylhet', 'Balaganj'],
  ['Rangpur', 'Rangpur', 'Badarganj'],
  ['Mymensingh', 'Mymensingh', 'Bhaluka'],
] as const;

const AREAS = ['Road 12, House 34', 'Block C, Flat 5B', 'Village Moynakuri', 'Sector 7, Uttara', 'Shantinagar', 'Station Road', 'College Para', 'Mirpur DOHS'] as const;

// Mostly approved+active so the data shows up in search; the rest cover every other state
const STATUSES = [
  ['approved', 'active', 5, [1, 2, 3, 4, 5], 60],
  ['approved', 'inactive', 5, [1, 2, 3, 4, 5], 8],
  ['pending', 'active', 5, [1, 2, 3, 4, 5], 12],
  ['rejected', 'active', 5, [1, 2, 3, 4, 5], 5],
  ['inactive', 'inactive', 5, [1, 2, 3, 4, 5], 3],
  ['in_progress', 'active', 1, [1], 4],
  ['in_progress', 'active', 2, [1, 2], 3],
  ['in_progress', 'active', 3, [1, 2, 3], 3],
  ['in_progress', 'active', 4, [1, 2, 3, 4], 2],
] as const;

function buildBiodata(index: number, userId: number) {
  const isMale = rng() < 0.5;
  const firstName = pick(isMale ? MALE_NAMES : FEMALE_NAMES);
  const fullName = `${firstName} ${pick(SURNAMES)}`;

  const age = int(20, 45);
  const birthYear = new Date().getFullYear() - age;
  const dateOfBirth = `${birthYear}-${String(int(1, 12)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`;

  const heightInches = isMale ? int(62, 76) : int(55, 69);
  const [division, district, upazila] = pick(LOCATIONS);
  const sameAsPermanent = rng() < 0.6;
  const [pDivision, pDistrict, pUpazila] = sameAsPermanent ? [division, district, upazila] : pick(LOCATIONS);
  const area = pick(AREAS);

  const partnerMin = Math.max(18, age - int(2, 8));
  const partnerMax = Math.min(70, partnerMin + int(3, 12));

  const [approval, visibility, step, completed] = weighted(
    STATUSES.map((s) => [s, s[4]] as const),
  );
  const done = step === 5;

  // Incomplete biodatas only have the fields of their completed steps (like the real form)
  const has = (n: number) => (completed as readonly number[]).includes(n);

  return {
    step,
    userId,
    completedSteps: completed.join(','),
    partnerAgeMin: has(4) ? partnerMin : 18,
    partnerAgeMax: has(4) ? partnerMax : 35,
    sameAsPermanent,
    religion: weighted(RELIGIONS),
    biodataType: isMale ? 'Male' : 'Female',
    maritalStatus: weighted(MARITAL),
    dateOfBirth,
    age,
    height: heightKey(heightInches),
    weight: isMale ? int(55, 95) : int(40, 75),
    complexion: pick(COMPLEXIONS),
    profession: pick(isMale ? PROFESSIONS : FEMALE_PROFESSIONS),
    bloodGroup: pick(BLOOD),
    permanentCountry: 'Bangladesh',
    permanentDivision: division,
    permanentZilla: district,
    permanentUpazilla: upazila,
    permanentArea: area,
    presentCountry: 'Bangladesh',
    presentDivision: pDivision,
    presentZilla: pDistrict,
    presentUpazilla: pUpazila,
    presentArea: sameAsPermanent ? area : pick(AREAS),
    healthIssues: pick(HEALTH),
    educationMedium: has(2) ? pick(MEDIUMS) : null,
    highestEducation: has(2) ? pick(EDUCATIONS) : null,
    instituteName: has(2) ? pick(INSTITUTES) : null,
    subject: has(2) ? pick(SUBJECTS) : null,
    passingYear: has(2) ? String(int(Math.max(birthYear + 18, 2005), new Date().getFullYear())) : null,
    result: has(2) ? pick(RESULTS) : null,
    economicCondition: has(3) ? pick(ECONOMIC) : null,
    fatherName: has(3) ? pick(FATHER_NAMES) : null,
    fatherProfession: has(3) ? pick(FATHER_PROFESSIONS) : null,
    fatherAlive: has(3) ? weighted([['Yes', 80], ['No', 20]] as const) : null,
    motherName: has(3) ? pick(MOTHER_NAMES) : null,
    motherProfession: has(3) ? pick(MOTHER_PROFESSIONS) : null,
    motherAlive: has(3) ? weighted([['Yes', 88], ['No', 12]] as const) : null,
    brothersCount: has(3) ? int(0, 4) : null,
    sistersCount: has(3) ? int(0, 4) : null,
    familyDetails: has(3) ? 'We are a close-knit family with strong values and a focus on education.' : null,
    partnerComplexion: has(4) ? pick(COMPLEXIONS) : null,
    partnerHeight: has(4) ? `${heightLabel(Math.max(HEIGHT_MIN, heightInches - 6))} to ${heightLabel(Math.min(HEIGHT_MAX, heightInches + 6))}` : null,
    partnerEducation: has(4) ? pick(['Honours or above', 'Masters', 'HSC or above', 'Any']) : null,
    partnerProfession: has(4) ? pick(['Any', 'Teacher or Government Job', 'Doctor or Engineer', 'Business']) : null,
    partnerLocation: has(4) ? pick(['Dhaka or nearby areas', 'Anywhere in Bangladesh', `${division} division`]) : null,
    partnerDetails: has(4) ? 'Looking for a kind, educated and religious partner from a good family.' : null,
    fullName: has(5) ? fullName : null,
    profilePicture: null,
    profilePictureVisible: done && rng() < 0.3,
    email: has(5) ? `seed${String(index).padStart(4, '0')}@${BULK_EMAIL_DOMAIN}` : null,
    guardianMobile: has(5) ? `017${int(10000000, 99999999)}` : null,
    ownMobile: has(5) ? `018${int(10000000, 99999999)}` : null,
    biodataApprovalStatus: approval,
    biodataVisibilityStatus: visibility,
    viewCount: approval === 'approved' ? int(0, 300) : 0,
    userFullName: fullName,
  };
}

export async function seedBulkBiodata(dataSource: any, count: number = BULK_COUNT): Promise<void> {
  console.log(`🌱 Seeding ${count} bulk users + biodatas...`);
  const password = await bcrypt.hash('Testpass@50', 10); // hash once, reuse for every user
  let created = 0;
  let skipped = 0;

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    for (let i = 1; i <= count; i++) {
      // Always generate the row so the PRNG stream (and thus the data) is stable across reruns
      const email = `seed${String(i).padStart(4, '0')}@${BULK_EMAIL_DOMAIN}`;
      const existing = await queryRunner.query('SELECT id FROM "user" WHERE email = $1', [email]);
      const placeholderUserId = existing[0]?.id ?? 0;
      const b = buildBiodata(i, placeholderUserId);

      if (existing.length) {
        skipped++;
        continue;
      }

      const userRows = await queryRunner.query(
        `INSERT INTO "user" ("fullName", "email", "password", "role", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, 'user', NOW(), NOW()) RETURNING id`,
        [b.userFullName, email, password],
      );
      b.userId = userRows[0].id;

      const { userFullName, ...row } = b;
      void userFullName;
      const columns = Object.keys(row);
      const placeholders = columns.map((_, idx) => `$${idx + 1}`);
      await queryRunner.query(
        `INSERT INTO "biodata" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')})`,
        columns.map((c) => (row as Record<string, unknown>)[c]),
      );
      created++;
    }
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }

  console.log(`✅ Bulk seed done: ${created} created, ${skipped} already existed`);
}
