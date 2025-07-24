import { PrismaClient, UserType, AccessScope, SystemStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const CAMPUS_ID = 'cmc4erx8b005574m1sjmp9cb4'; // The campus ID from your URL
const DEFAULT_PASSWORD = 'Password123!';

async function main() {
  console.log('Starting student seeding for campus:', CAMPUS_ID);

  try {
    // Check if campus exists
    const campus = await prisma.campus.findUnique({
      where: { id: CAMPUS_ID },
      include: {
        institution: true
      }
    });

    if (!campus) {
      console.error('Campus not found with ID:', CAMPUS_ID);
      return;
    }

    console.log('Found campus:', campus.name);

    // Hash password
    const hashedPassword = await hash(DEFAULT_PASSWORD, 12);

    // Create 10 sample students
    const studentData = [
      { name: 'Ahmed Ali', email: 'ahmed.ali@student.example.com', username: 'ahmed_ali' },
      { name: 'Fatima Khan', email: 'fatima.khan@student.example.com', username: 'fatima_khan' },
      { name: 'Muhammad Hassan', email: 'muhammad.hassan@student.example.com', username: 'muhammad_hassan' },
      { name: 'Ayesha Ahmed', email: 'ayesha.ahmed@student.example.com', username: 'ayesha_ahmed' },
      { name: 'Omar Sheikh', email: 'omar.sheikh@student.example.com', username: 'omar_sheikh' },
      { name: 'Zainab Malik', email: 'zainab.malik@student.example.com', username: 'zainab_malik' },
      { name: 'Ali Raza', email: 'ali.raza@student.example.com', username: 'ali_raza' },
      { name: 'Sana Tariq', email: 'sana.tariq@student.example.com', username: 'sana_tariq' },
      { name: 'Bilal Ahmad', email: 'bilal.ahmad@student.example.com', username: 'bilal_ahmad' },
      { name: 'Mariam Siddique', email: 'mariam.siddique@student.example.com', username: 'mariam_siddique' }
    ];

    let createdCount = 0;

    for (const student of studentData) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: student.email },
              { username: student.username }
            ]
          }
        });

        if (existingUser) {
          console.log(`User already exists: ${student.name}`);
          continue;
        }

        // Create user
        const user = await prisma.user.create({
          data: {
            name: student.name,
            email: student.email,
            username: student.username,
            password: hashedPassword,
            userType: UserType.STUDENT,
            accessScope: AccessScope.SINGLE_CAMPUS,
            status: SystemStatus.ACTIVE,
            institutionId: campus.institutionId,
            primaryCampusId: CAMPUS_ID
          }
        });

        // Create student profile
        const studentProfile = await prisma.studentProfile.create({
          data: {
            userId: user.id,
            enrollmentNumber: `SIS-${Date.now()}-${createdCount + 1}`,
            currentGrade: 'Grade 3',
            academicHistory: {
              previousSchool: 'Previous Elementary School',
              previousGrade: 'Grade 2',
              joiningDate: new Date('2023-08-01').toISOString(),
            },
            interests: ['Reading', 'Sports', 'Art'],
            achievements: [
              {
                title: 'Reading Champion',
                date: new Date('2023-05-15').toISOString(),
                description: 'Read the most books in class',
              },
            ],
            guardianInfo: {
              primaryGuardian: {
                name: `${student.name.split(' ')[0]}'s Parent`,
                relationship: 'Parent',
                contact: `03${Math.floor(Math.random() * 10)}${Math.floor(1000000 + Math.random() * 9000000)}`,
                email: `parent.${student.username}@example.com`,
              },
            },
          }
        });

        // Create campus access
        await prisma.userCampusAccess.create({
          data: {
            userId: user.id,
            campusId: CAMPUS_ID,
            roleType: UserType.STUDENT,
            status: SystemStatus.ACTIVE
          }
        });

        console.log(`Created student: ${student.name} (${studentProfile.enrollmentNumber})`);
        createdCount++;

      } catch (error) {
        console.error(`Error creating student ${student.name}:`, error);
      }
    }

    console.log(`Successfully created ${createdCount} students for campus ${campus.name}`);

  } catch (error) {
    console.error('Error seeding students:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('Student seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during student seeding:', error);
    process.exit(1);
  });
