import { PrismaClient, SystemStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function debugSocialWallAccess() {
  console.log('🔍 Debugging Social Wall Access...\n');

  try {
    // Get a specific teacher and class to test
    const teacher = await prisma.user.findFirst({
      where: { 
        userType: { in: ['TEACHER', 'CAMPUS_TEACHER'] }
      },
      include: { 
        teacherProfile: true,
        activeCampuses: {
          where: { status: SystemStatus.ACTIVE },
          include: { campus: true }
        }
      }
    });

    if (!teacher) {
      console.log('❌ No teachers found');
      return;
    }

    console.log(`👨‍🏫 Testing with teacher: ${teacher.name} (${teacher.username})`);
    console.log(`   - User Type: ${teacher.userType}`);
    console.log(`   - Teacher Profile ID: ${teacher.teacherProfile?.id}`);
    console.log(`   - Campus Access: ${teacher.activeCampuses.length} campuses`);

    // Get a class to test
    const testClass = await prisma.class.findFirst({
      include: {
        courseCampus: {
          include: {
            course: {
              include: {
                subjects: true
              }
            }
          }
        }
      }
    });

    if (!testClass) {
      console.log('❌ No classes found');
      return;
    }

    console.log(`\n🏫 Testing with class: ${testClass.name}`);
    console.log(`   - Class ID: ${testClass.id}`);
    console.log(`   - Campus ID: ${testClass.campusId}`);
    console.log(`   - Primary Teacher ID: ${testClass.classTeacherId || 'None'}`);

    // Check if teacher is primary teacher
    const isPrimaryTeacher = testClass.classTeacherId === teacher.teacherProfile?.id;
    console.log(`\n🔍 Primary Teacher Check:`);
    console.log(`   - Is Primary Teacher: ${isPrimaryTeacher}`);

    // Check teacher assignment
    const teacherAssignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: teacher.teacherProfile?.id,
        classId: testClass.id,
        status: SystemStatus.ACTIVE
      }
    });

    console.log(`\n🔍 Teacher Assignment Check:`);
    console.log(`   - Has Assignment: ${!!teacherAssignment}`);
    if (teacherAssignment) {
      console.log(`   - Assignment ID: ${teacherAssignment.id}`);
      console.log(`   - Start Date: ${teacherAssignment.startDate}`);
    }

    // Check campus access
    const teacherCampusIds = teacher.activeCampuses.map(access => access.campusId);
    const hasClassCampusAccess = teacherCampusIds.includes(testClass.campusId);
    
    console.log(`\n🔍 Campus Access Check:`);
    console.log(`   - Teacher Campus IDs: ${teacherCampusIds.join(', ')}`);
    console.log(`   - Class Campus ID: ${testClass.campusId}`);
    console.log(`   - Has Campus Access: ${hasClassCampusAccess}`);

    // Final access decision
    const hasAccess = isPrimaryTeacher || !!teacherAssignment;
    console.log(`\n✅ Final Access Decision:`);
    console.log(`   - Has Access: ${hasAccess}`);
    console.log(`   - Reason: ${isPrimaryTeacher ? 'Primary Teacher' : !!teacherAssignment ? 'Has Assignment' : 'No Access'}`);

    // Test the actual social wall service logic
    console.log(`\n🧪 Testing Social Wall Service Logic...`);
    
    // Simulate the exact service logic
    const user = await prisma.user.findUnique({
      where: { id: teacher.id },
      include: { teacherProfile: true, studentProfile: true }
    });

    if (!user) {
      console.log('❌ User not found in service test');
      return;
    }

    console.log(`   - User found: ${user.name}`);
    console.log(`   - User type: ${user.userType}`);
    console.log(`   - Has teacher profile: ${!!user.teacherProfile}`);

    if (user.userType === 'CAMPUS_TEACHER' || user.userType === 'TEACHER') {
      if (!user.teacherProfile) {
        console.log('   ❌ Teacher user without teacher profile');
        return;
      }

      // Check both teacher assignment and primary class teacher status in parallel
      const [assignment, classDetails] = await Promise.all([
        prisma.teacherAssignment.findFirst({
          where: {
            teacherId: user.teacherProfile.id,
            classId: testClass.id,
            status: SystemStatus.ACTIVE
          }
        }),
        prisma.class.findUnique({
          where: { id: testClass.id },
          select: { classTeacherId: true }
        })
      ]);

      const isPrimary = classDetails?.classTeacherId === user.teacherProfile.id;
      const hasAssign = !!assignment;
      const serviceAccess = isPrimary || hasAssign;

      console.log(`   - Service Primary Teacher: ${isPrimary}`);
      console.log(`   - Service Has Assignment: ${hasAssign}`);
      console.log(`   - Service Access Result: ${serviceAccess}`);
    }

    // Check all teacher assignments for this teacher
    console.log(`\n📋 All Teacher Assignments for ${teacher.name}:`);
    const allAssignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: teacher.teacherProfile?.id,
        status: SystemStatus.ACTIVE
      },
      include: {
        class: true
      }
    });

    console.log(`   - Total assignments: ${allAssignments.length}`);
    allAssignments.forEach(assignment => {
      console.log(`   - ${assignment.class.name} (${assignment.class.id})`);
    });

    // Check if there are any classes where this teacher is primary
    console.log(`\n👑 Classes where ${teacher.name} is Primary Teacher:`);
    const primaryClasses = await prisma.class.findMany({
      where: {
        classTeacherId: teacher.teacherProfile?.id
      }
    });

    console.log(`   - Total primary classes: ${primaryClasses.length}`);
    primaryClasses.forEach(cls => {
      console.log(`   - ${cls.name} (${cls.id})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSocialWallAccess()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
