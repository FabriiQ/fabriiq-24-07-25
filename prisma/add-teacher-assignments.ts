import { PrismaClient, SystemStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function addTeacherAssignments() {
  console.log('🚀 Adding teacher assignments for existing teachers...\n');

  try {
    // Get all teachers with their profiles
    const teachers = await prisma.user.findMany({
      where: { 
        userType: { in: ['TEACHER', 'CAMPUS_TEACHER'] }
      },
      include: { 
        teacherProfile: true,
        userCampusAccess: {
          where: { status: SystemStatus.ACTIVE },
          include: { campus: true }
        }
      }
    });

    // Get all classes
    const classes = await prisma.class.findMany({
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

    console.log(`Found ${teachers.length} teachers and ${classes.length} classes\n`);

    // Teacher specializations based on common names/patterns
    const teacherSpecializations: Record<string, string[]> = {
      'robert_brown': ['MATH'],
      'jennifer_davis': ['MATH'], 
      'david_wilson': ['ENG'],
      'emily_taylor': ['ENG'],
      'james_anderson': ['SCI'],
      'lisa_martinez': ['PE'],
    };

    const assignments = [];

    for (const teacher of teachers) {
      if (!teacher.teacherProfile) {
        console.log(`⚠️ Teacher ${teacher.name} has no profile, skipping...`);
        continue;
      }

      console.log(`👨‍🏫 Processing assignments for ${teacher.name} (${teacher.username})`);
      
      // Get teacher's accessible campus IDs
      const teacherCampusIds = teacher.userCampusAccess.map(access => access.campusId);
      
      // Filter classes that are in teacher's accessible campuses
      const accessibleClasses = classes.filter(cls => 
        teacherCampusIds.includes(cls.campusId)
      );

      console.log(`   - Can access ${accessibleClasses.length} classes in their campuses`);

      // Get teacher's specialization
      const teacherSubjects = teacherSpecializations[teacher.username] || ['MATH'];
      
      let assignedClasses = 0;
      const maxAssignments = teacher.username === 'james_anderson' || teacher.username === 'lisa_martinez' ? 4 : 2;

      for (const classItem of accessibleClasses) {
        if (assignedClasses >= maxAssignments) break;

        // Check if teacher is the primary class teacher
        const isPrimaryTeacher = classItem.classTeacherId === teacher.teacherProfile.id;
        
        // Check if class has subjects that match teacher's specialization
        const classSubjects = classItem.courseCampus?.course?.subjects || [];
        const hasMatchingSubject = classSubjects.some(subject => 
          teacherSubjects.some(teacherSubject => 
            subject.code.includes(teacherSubject) || subject.name.toUpperCase().includes(teacherSubject)
          )
        );

        const shouldAssign = isPrimaryTeacher || hasMatchingSubject;

        if (shouldAssign) {
          // Check if teacher is already assigned to this class
          const existingAssignment = await prisma.teacherAssignment.findFirst({
            where: {
              teacherId: teacher.teacherProfile.id,
              classId: classItem.id,
              status: SystemStatus.ACTIVE
            }
          });

          if (!existingAssignment) {
            const assignment = await prisma.teacherAssignment.create({
              data: {
                teacherId: teacher.teacherProfile.id,
                classId: classItem.id,
                status: SystemStatus.ACTIVE,
                startDate: new Date(),
              }
            });
            
            assignments.push(assignment);
            assignedClasses++;
            
            const reason = isPrimaryTeacher ? '(primary teacher)' : '(subject match)';
            console.log(`   ✅ Assigned to ${classItem.name} ${reason}`);
          } else {
            console.log(`   ⚠️ Already assigned to ${classItem.name}`);
          }
        }
      }

      // If no assignments were made and teacher has accessible classes, assign to at least one
      if (assignedClasses === 0 && accessibleClasses.length > 0) {
        const classItem = accessibleClasses[0];
        
        const existingAssignment = await prisma.teacherAssignment.findFirst({
          where: {
            teacherId: teacher.teacherProfile.id,
            classId: classItem.id,
            status: SystemStatus.ACTIVE
          }
        });

        if (!existingAssignment) {
          const assignment = await prisma.teacherAssignment.create({
            data: {
              teacherId: teacher.teacherProfile.id,
              classId: classItem.id,
              status: SystemStatus.ACTIVE,
              startDate: new Date(),
            }
          });
          
          assignments.push(assignment);
          console.log(`   ✅ Assigned to ${classItem.name} (fallback assignment)`);
        }
      }

      console.log(`   📊 Total assignments for ${teacher.name}: ${assignedClasses}`);
    }

    console.log(`\n✅ Teacher assignments completed: ${assignments.length} total assignments`);
    
    // Verification
    console.log('\n🔍 Verifying teacher assignments...');
    for (const teacher of teachers) {
      if (teacher.teacherProfile) {
        const teacherAssignments = await prisma.teacherAssignment.findMany({
          where: {
            teacherId: teacher.teacherProfile.id,
            status: SystemStatus.ACTIVE
          },
          include: {
            class: true
          }
        });
        
        console.log(`📋 ${teacher.name}: ${teacherAssignments.length} classes assigned`);
        teacherAssignments.forEach(assignment => {
          console.log(`   - ${assignment.class.name}`);
        });
      }
    }

    console.log('\n🎉 Teacher assignments completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Total assignments created: ${assignments.length}`);
    console.log(`- Teachers processed: ${teachers.length}`);
    console.log(`- Classes available: ${classes.length}`);
    console.log('\n✨ Teachers should now have access to their assigned classes!');

  } catch (error) {
    console.error('❌ Error during teacher assignments:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addTeacherAssignments()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
