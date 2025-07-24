import { PrismaClient, SystemStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndFixTeachers() {
  console.log('🔍 Checking current teacher state...\n');

  try {
    // Check teachers
    const teachers = await prisma.user.findMany({
      where: { 
        userType: { in: ['TEACHER', 'CAMPUS_TEACHER'] }
      },
      include: { 
        teacherProfile: true
      }
    });

    console.log(`Found ${teachers.length} teachers:`);
    teachers.forEach(teacher => {
      console.log(`- ${teacher.name} (${teacher.username}) - Profile: ${teacher.teacherProfile ? 'Yes' : 'No'}`);
    });

    // Check classes
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        classTeacherId: true,
        campusId: true
      }
    });

    console.log(`\nFound ${classes.length} classes:`);
    classes.forEach(cls => {
      console.log(`- ${cls.name} - Primary Teacher ID: ${cls.classTeacherId || 'None'}`);
    });

    // Check existing teacher assignments
    const existingAssignments = await prisma.teacherAssignment.findMany({
      where: { status: SystemStatus.ACTIVE },
      include: {
        teacher: {
          include: { user: true }
        },
        class: true
      }
    });

    console.log(`\nFound ${existingAssignments.length} existing teacher assignments:`);
    existingAssignments.forEach(assignment => {
      console.log(`- ${assignment.teacher.user?.name} -> ${assignment.class.name}`);
    });

    // Now let's add missing assignments
    console.log('\n🔧 Adding missing teacher assignments...\n');

    for (const teacher of teachers) {
      if (!teacher.teacherProfile) {
        console.log(`⚠️ Teacher ${teacher.name} has no profile, skipping...`);
        continue;
      }

      console.log(`👨‍🏫 Processing ${teacher.name}...`);

      // Check if teacher is a primary teacher for any class
      const primaryClasses = classes.filter(cls => cls.classTeacherId === teacher.teacherProfile!.id);
      
      for (const cls of primaryClasses) {
        const existingAssignment = await prisma.teacherAssignment.findFirst({
          where: {
            teacherId: teacher.teacherProfile.id,
            classId: cls.id,
            status: SystemStatus.ACTIVE
          }
        });

        if (!existingAssignment) {
          await prisma.teacherAssignment.create({
            data: {
              teacherId: teacher.teacherProfile.id,
              classId: cls.id,
              status: SystemStatus.ACTIVE,
              startDate: new Date(),
            }
          });
          console.log(`   ✅ Added assignment to ${cls.name} (primary teacher)`);
        } else {
          console.log(`   ⚠️ Already assigned to ${cls.name} (primary teacher)`);
        }
      }

      // If teacher has no primary classes, assign them to at least one class
      if (primaryClasses.length === 0) {
        const teacherAssignments = await prisma.teacherAssignment.findMany({
          where: {
            teacherId: teacher.teacherProfile.id,
            status: SystemStatus.ACTIVE
          }
        });

        if (teacherAssignments.length === 0 && classes.length > 0) {
          // Assign to first available class
          const cls = classes[0];
          await prisma.teacherAssignment.create({
            data: {
              teacherId: teacher.teacherProfile.id,
              classId: cls.id,
              status: SystemStatus.ACTIVE,
              startDate: new Date(),
            }
          });
          console.log(`   ✅ Added assignment to ${cls.name} (general assignment)`);
        }
      }
    }

    // Final verification
    console.log('\n🔍 Final verification...');
    const finalAssignments = await prisma.teacherAssignment.findMany({
      where: { status: SystemStatus.ACTIVE },
      include: {
        teacher: {
          include: { user: true }
        },
        class: true
      }
    });

    console.log(`\nTotal teacher assignments: ${finalAssignments.length}`);
    finalAssignments.forEach(assignment => {
      console.log(`- ${assignment.teacher.user?.name} -> ${assignment.class.name}`);
    });

    console.log('\n✅ Teacher assignments check and fix completed!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixTeachers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
