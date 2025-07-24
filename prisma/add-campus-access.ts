import { PrismaClient, SystemStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function addCampusAccess() {
  console.log('🏫 Adding campus access for teachers...\n');

  try {
    // Get all teachers
    const teachers = await prisma.user.findMany({
      where: { 
        userType: { in: ['TEACHER', 'CAMPUS_TEACHER'] }
      },
      include: { 
        teacherProfile: true,
        activeCampuses: {
          where: { status: SystemStatus.ACTIVE }
        }
      }
    });

    console.log(`Found ${teachers.length} teachers`);

    // Get all campuses
    const campuses = await prisma.campus.findMany({
      select: {
        id: true,
        name: true
      }
    });

    console.log(`Found ${campuses.length} campuses`);

    for (const teacher of teachers) {
      if (!teacher.teacherProfile) {
        console.log(`⚠️ Teacher ${teacher.name} has no profile, skipping...`);
        continue;
      }

      console.log(`\n👨‍🏫 Processing ${teacher.name}:`);
      console.log(`   - Current campus access: ${teacher.activeCampuses.length}`);

      // Get teacher's class assignments to determine which campuses they need access to
      const teacherAssignments = await prisma.teacherAssignment.findMany({
        where: {
          teacherId: teacher.teacherProfile.id,
          status: SystemStatus.ACTIVE
        },
        include: {
          class: {
            select: {
              campusId: true,
              name: true
            }
          }
        }
      });

      const requiredCampusIds = [...new Set(teacherAssignments.map(assignment => assignment.class.campusId))];
      console.log(`   - Required campus access: ${requiredCampusIds.length} campuses`);

      for (const campusId of requiredCampusIds) {
        // Check if teacher already has access to this campus
        const existingAccess = await prisma.userCampusAccess.findFirst({
          where: {
            userId: teacher.id,
            campusId: campusId,
            status: SystemStatus.ACTIVE
          }
        });

        if (!existingAccess) {
          // Add campus access
          await prisma.userCampusAccess.create({
            data: {
              userId: teacher.id,
              campusId: campusId,
              roleType: teacher.userType,
              status: SystemStatus.ACTIVE,
              startDate: new Date()
            }
          });

          const campus = campuses.find(c => c.id === campusId);
          console.log(`   ✅ Added access to ${campus?.name || campusId}`);
        } else {
          const campus = campuses.find(c => c.id === campusId);
          console.log(`   ⚠️ Already has access to ${campus?.name || campusId}`);
        }
      }

      // If teacher has no assignments, give them access to the first campus
      if (requiredCampusIds.length === 0 && campuses.length > 0) {
        const firstCampus = campuses[0];
        
        const existingAccess = await prisma.userCampusAccess.findFirst({
          where: {
            userId: teacher.id,
            campusId: firstCampus.id,
            status: SystemStatus.ACTIVE
          }
        });

        if (!existingAccess) {
          await prisma.userCampusAccess.create({
            data: {
              userId: teacher.id,
              campusId: firstCampus.id,
              roleType: teacher.userType,
              status: SystemStatus.ACTIVE,
              startDate: new Date()
            }
          });
          console.log(`   ✅ Added fallback access to ${firstCampus.name}`);
        }
      }
    }

    // Verification
    console.log('\n🔍 Verifying campus access...');
    const teachersWithAccess = await prisma.user.findMany({
      where: { 
        userType: { in: ['TEACHER', 'CAMPUS_TEACHER'] }
      },
      include: { 
        activeCampuses: {
          where: { status: SystemStatus.ACTIVE },
          include: { campus: true }
        }
      }
    });

    for (const teacher of teachersWithAccess) {
      console.log(`📋 ${teacher.name}: ${teacher.activeCampuses.length} campus access`);
      teacher.activeCampuses.forEach(access => {
        console.log(`   - ${access.campus.name}`);
      });
    }

    console.log('\n✅ Campus access setup completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCampusAccess()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
