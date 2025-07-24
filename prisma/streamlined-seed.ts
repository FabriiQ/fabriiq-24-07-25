import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting streamlined database seeding...\n');

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

    // Step 5: Users (Admin and Teachers only, skip students)
    console.log('👥 Step 5: Seeding users (admins and teachers)...');
    const { seedUsers } = await import('../src/server/db/seed-data/users');
    const users = await seedUsers(prisma, institutions, campuses);
    console.log('✅ Users seeded\n');

    // Step 6: Classes
    console.log('🏛️ Step 6: Seeding classes...');
    const { seedClasses } = await import('../src/server/db/seed-data/classes');
    const classes = await seedClasses(prisma, campuses, academicCycles, programsResult.programs);
    console.log('✅ Classes seeded\n');

    // Step 7: Subjects
    console.log('📚 Step 7: Seeding subjects...');
    const { seedSubjects } = await import('../src/server/db/seed-data/subjects');
    const subjects = await seedSubjects(prisma, programsResult.courses);
    console.log('✅ Subjects seeded\n');

    // Step 8: Subject Topics
    console.log('📖 Step 8: Seeding subject topics...');
    const { seedSubjectTopics } = await import('../src/server/db/seed-data/subject-topics');
    const subjectTopics = await seedSubjectTopics(prisma, subjects);
    console.log('✅ Subject topics seeded\n');

    // Step 9: Activity Types
    console.log('🎯 Step 9: Seeding activity types...');
    const { seedActivityTypes } = await import('../src/server/db/seed-data/activity-types');
    const activityTypes = await seedActivityTypes(prisma);
    console.log('✅ Activity types seeded\n');

    // Step 10: Activities
    console.log('📝 Step 10: Seeding activities...');
    const { seedActivities } = await import('../src/server/db/seed-data/activities');
    const activities = await seedActivities(prisma, subjects, classes, users, activityTypes);
    console.log('✅ Activities seeded\n');

    // Step 11: Timetables
    console.log('⏰ Step 11: Seeding timetables...');
    const { seedTimetables } = await import('../src/server/db/seed-data/timetables');
    const timetables = await seedTimetables(prisma, classes, subjects, users);
    console.log('✅ Timetables seeded\n');

    // Step 12: Feedback
    console.log('💬 Step 12: Seeding feedback...');
    const { seedFeedback } = await import('../src/server/db/seed-data/feedback');
    const feedback = await seedFeedback(prisma, users, activities);
    console.log('✅ Feedback seeded\n');

    console.log('\n🎉 Streamlined database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Institutions: ${institutions?.length || 0}`);
    console.log(`- Campuses: ${campuses?.length || 0}`);
    console.log(`- Academic Cycles: ${academicCycles?.length || 0}`);
    console.log(`- Programs: ${programsResult?.programs?.length || 0}`);
    console.log(`- Users: ${users?.length || 0}`);
    console.log(`- Classes: ${classes?.length || 0}`);
    console.log(`- Subjects: ${subjects?.length || 0}`);
    console.log(`- Subject Topics: ${subjectTopics?.length || 0}`);
    console.log(`- Activity Types: ${activityTypes?.length || 0}`);
    console.log(`- Activities: ${activities?.length || 0}`);
    console.log(`- Timetables: ${timetables?.length || 0}`);
    console.log(`- Feedback: ${feedback?.length || 0}`);

    console.log('\n⚠️  Skipped: Student enrollments (can be added separately if needed)');
    console.log('\n✨ Database is ready for use!');

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
