import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting essential database seeding...\n');

  try {
    // Step 1: Institutions
    console.log('📍 Step 1: Seeding institutions...');
    const { seedInstitutions } = await import('../src/server/db/seed-data/institutions');
    const institutions = await seedInstitutions(prisma);
    console.log('✅ Institutions seeded\n');

    // Step 2: Campuses
    console.log('🏫 Step 2: Seeding campuses...');
    const { seedCampuses } = await import('../src/server/db/seed-data/campuses');
    const campuses = await seedCampuses(prisma, institutions);
    console.log('✅ Campuses seeded\n');

    // Step 3: Academic Cycles
    console.log('📅 Step 3: Seeding academic cycles...');
    const { seedAcademicCycles } = await import('../src/server/db/seed-data/academic-cycles');
    const academicCycles = await seedAcademicCycles(prisma, institutions);
    console.log('✅ Academic cycles seeded\n');

    // Step 4: Programs
    console.log('🎓 Step 4: Seeding programs...');
    const { seedPrograms } = await import('../src/server/db/seed-data/programs');
    const programsResult = await seedPrograms(prisma, institutions, campuses, academicCycles);
    console.log('✅ Programs seeded\n');

    // Step 5: Users (Admin and Teachers only)
    console.log('👥 Step 5: Seeding users (admins and teachers)...');
    const { seedUsers } = await import('../src/server/db/seed-data/users');
    const users = await seedUsers(prisma, institutions, campuses);
    console.log('✅ Users seeded\n');

    // Step 6: Subjects
    console.log('📚 Step 6: Seeding subjects...');
    const { seedSubjects } = await import('../src/server/db/seed-data/subjects');
    const subjects = await seedSubjects(prisma, programsResult.courses);
    console.log('✅ Subjects seeded\n');

    // Step 7: Subject Topics
    console.log('📖 Step 7: Seeding subject topics...');
    const { seedSubjectTopics } = await import('../src/server/db/seed-data/subject-topics');
    const subjectTopics = await seedSubjectTopics(prisma, subjects);
    console.log('✅ Subject topics seeded\n');

    // Step 8: Activity Types
    console.log('🎯 Step 8: Seeding activity types...');
    const { seedActivityTypes } = await import('../src/server/db/seed-data/activity-types');
    const activityTypes = await seedActivityTypes(prisma);
    console.log('✅ Activity types seeded\n');

    console.log('\n🎉 Essential database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Institutions: ${institutions?.length || 0}`);
    console.log(`- Campuses: ${campuses?.length || 0}`);
    console.log(`- Academic Cycles: ${academicCycles?.length || 0}`);
    console.log(`- Programs: ${programsResult?.programs?.length || 0}`);
    console.log(`- Courses: ${programsResult?.courses?.length || 0}`);
    console.log(`- Users: ${users?.length || 0}`);
    console.log(`- Subjects: ${subjects?.length || 0}`);
    console.log(`- Subject Topics: ${subjectTopics?.length || 0}`);
    console.log(`- Activity Types: ${activityTypes?.length || 0}`);

    console.log('\n✨ Essential data seeded successfully!');
    console.log('\n📋 What was seeded:');
    console.log('  • Institution: Sunshine International School (SIS)');
    console.log('  • Campuses: Main Campus, Secondary Campus');
    console.log('  • Academic Year: 2024-25');
    console.log('  • Program: Primary Years Program (PYP)');
    console.log('  • Course: Class 3 (PYP-CL3)');
    console.log('  • Subjects: Mathematics, English, Science, Physical Education');
    console.log('  • Subject Topics: Comprehensive curriculum topics for each subject');
    console.log('  • Users: Admin and teacher accounts');
    console.log('  • Activity Types: Various activity categories');

    console.log('\n🔑 Login Credentials:');
    console.log('  • Admin: username "admin", password "admin123"');
    console.log('  • Teachers: Various teacher accounts with password "teacher123"');

    console.log('\n⚠️  Note: Classes, student enrollments, and some advanced features');
    console.log('   can be added separately if needed.');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
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
