import { PrismaClient, SystemStatus, UserType, AccessScope } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting basic database seeding...');

  try {
    // 1. Create Institution
    const institution = await prisma.institution.upsert({
      where: { code: 'SIS' },
      update: {},
      create: {
        name: 'Sunshine International School',
        code: 'SIS',
        status: SystemStatus.ACTIVE,
      },
    });
    console.log('✅ Institution created');

    // 2. Create Campus
    const campus = await prisma.campus.upsert({
      where: { code: 'MAIN' },
      update: {},
      create: {
        name: 'Main Campus',
        code: 'MAIN',
        institutionId: institution.id,
        status: SystemStatus.ACTIVE,
        address: {
          street: '123 Education Street',
          city: 'Learning City',
          state: 'Knowledge State',
          zipCode: '12345',
          country: 'Education Land'
        },
        contact: {
          phone: '+1-555-0123',
          email: 'main@sis.edu',
          website: 'https://sis.edu'
        }
      },
    });
    console.log('✅ Campus created');

    // 3. Create Academic Cycle
    const academicCycle = await prisma.academicCycle.upsert({
      where: { code: 'AY2024-25' },
      update: {},
      create: {
        name: 'Academic Year 2024-25',
        code: 'AY2024-25',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-07-31'),
        institutionId: institution.id,
        status: SystemStatus.ACTIVE,
      },
    });
    console.log('✅ Academic cycle created');

    // 4. Create Program
    const program = await prisma.program.upsert({
      where: { code: 'ELEM' },
      update: {},
      create: {
        name: 'Elementary Program',
        code: 'ELEM',
        type: 'Elementary',
        level: 1,
        duration: 6,
        institutionId: institution.id,
        status: SystemStatus.ACTIVE,
      },
    });
    console.log('✅ Program created');

    // 5. Create Program-Campus Association
    await prisma.programCampus.upsert({
      where: {
        programId_campusId: {
          programId: program.id,
          campusId: campus.id,
        },
      },
      update: {},
      create: {
        programId: program.id,
        campusId: campus.id,
        status: SystemStatus.ACTIVE,
      },
    });
    console.log('✅ Program-Campus association created');

    // 6. Create Course
    const course = await prisma.course.upsert({
      where: { code: 'GRADE3' },
      update: {},
      create: {
        name: 'Grade 3',
        code: 'GRADE3',
        level: 3,
        credits: 1.0,
        programId: program.id,
        status: SystemStatus.ACTIVE,
      },
    });
    console.log('✅ Course created');

    // 7. Create Course-Campus Association
    await prisma.courseCampus.upsert({
      where: {
        courseId_campusId: {
          courseId: course.id,
          campusId: campus.id,
        },
      },
      update: {},
      create: {
        courseId: course.id,
        campusId: campus.id,
        status: SystemStatus.ACTIVE,
      },
    });
    console.log('✅ Course-Campus association created');

    // 8. Create Subjects
    const mathSubject = await prisma.subject.upsert({
      where: { code: 'MATH3' },
      update: {},
      create: {
        name: 'Mathematics Grade 3',
        code: 'MATH3',
        credits: 1.0,
        courseId: course.id,
        status: SystemStatus.ACTIVE,
        bloomsDistribution: {
          REMEMBER: 20,
          UNDERSTAND: 25,
          APPLY: 25,
          ANALYZE: 20,
          EVALUATE: 7,
          CREATE: 3,
        },
      },
    });

    const englishSubject = await prisma.subject.upsert({
      where: { code: 'ENG3' },
      update: {},
      create: {
        name: 'English Grade 3',
        code: 'ENG3',
        credits: 1.0,
        courseId: course.id,
        status: SystemStatus.ACTIVE,
        bloomsDistribution: {
          REMEMBER: 15,
          UNDERSTAND: 30,
          APPLY: 25,
          ANALYZE: 20,
          EVALUATE: 7,
          CREATE: 3,
        },
      },
    });

    const scienceSubject = await prisma.subject.upsert({
      where: { code: 'SCI3' },
      update: {},
      create: {
        name: 'Science Grade 3',
        code: 'SCI3',
        credits: 1.0,
        courseId: course.id,
        status: SystemStatus.ACTIVE,
        bloomsDistribution: {
          REMEMBER: 25,
          UNDERSTAND: 25,
          APPLY: 25,
          ANALYZE: 15,
          EVALUATE: 7,
          CREATE: 3,
        },
      },
    });
    console.log('✅ Subjects created');

    // 9. Create Admin User
    const hashedPassword = await hash('admin123', 12);
    const adminUser = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        name: 'System Administrator',
        email: 'admin@sis.edu',
        username: 'admin',
        password: hashedPassword,
        userType: UserType.SYSTEM_ADMIN,
        accessScope: AccessScope.SYSTEM,
        institutionId: institution.id,
        primaryCampusId: campus.id,
        status: SystemStatus.ACTIVE,
      },
    });
    console.log('✅ Admin user created');

    // 10. Create Teacher User
    const teacherUser = await prisma.user.upsert({
      where: { username: 'teacher1' },
      update: {},
      create: {
        name: 'John Teacher',
        email: 'teacher1@sis.edu',
        username: 'teacher1',
        password: hashedPassword,
        userType: UserType.CAMPUS_TEACHER,
        accessScope: AccessScope.SINGLE_CAMPUS,
        institutionId: institution.id,
        primaryCampusId: campus.id,
        status: SystemStatus.ACTIVE,
      },
    });

    // Create Teacher Profile
    await prisma.teacherProfile.upsert({
      where: { userId: teacherUser.id },
      update: {},
      create: {
        userId: teacherUser.id,
        employeeId: 'T001',
        department: 'Elementary',
        qualifications: ['B.Ed', 'M.A. Mathematics'],
        specializations: ['Mathematics', 'Science'],
        experience: 5,
      },
    });
    console.log('✅ Teacher user and profile created');

    console.log('\n🎉 Basic database seeding completed successfully!');
    console.log('\nCreated:');
    console.log('- Institution: Sunshine International School (SIS)');
    console.log('- Campus: Main Campus');
    console.log('- Program: Elementary Program');
    console.log('- Course: Grade 3');
    console.log('- Subjects: Mathematics, English, Science');
    console.log('- Users: admin (admin123), teacher1 (admin123)');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
