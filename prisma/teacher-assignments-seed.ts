import { PrismaClient, SystemStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting teacher assignments seeding...\n');

  try {
    // Get all teachers
    const teachers = await prisma.user.findMany({
      where: { userType: 'TEACHER' },
      include: { teacherProfile: true }
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

    // Create teacher assignments
    console.log('👨‍🏫 Creating teacher assignments...');
    const assignments = [];

    // Assign teachers to classes based on their specialization
    const teacherSpecializations = {
      'robert_brown': ['MATH'], // Math teacher (Boys)
      'jennifer_davis': ['MATH'], // Math teacher (Girls)
      'james_anderson': ['SCI'], // Science teacher
      'lisa_wilson': ['ENG'], // English teacher
      'david_taylor': ['PE'], // Physical Education teacher
      'emma_clark': ['ART'], // Arts teacher
    };

    for (const teacher of teachers) {
      if (!teacher.teacherProfile) {
        console.log(`⚠️ Teacher ${teacher.name} has no profile, skipping...`);
        continue;
      }

      const teacherSubjects = teacherSpecializations[teacher.username as keyof typeof teacherSpecializations] || ['MATH'];
      
      // Assign teacher to 2-3 classes that have subjects matching their specialization
      let assignedClasses = 0;
      const maxAssignments = 3;

      for (const classItem of classes) {
        if (assignedClasses >= maxAssignments) break;

        // Check if class has subjects that match teacher's specialization
        const classSubjects = classItem.courseCampus?.course?.subjects || [];
        const hasMatchingSubject = classSubjects.some(subject => 
          teacherSubjects.some(teacherSubject => 
            subject.code.includes(teacherSubject)
          )
        );

        if (hasMatchingSubject) {
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
            console.log(`✅ Assigned ${teacher.name} to ${classItem.name}`);
          }
        }
      }

      // If no matching subjects found, assign to first available classes
      if (assignedClasses === 0) {
        for (const classItem of classes.slice(0, 2)) {
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
            console.log(`✅ Assigned ${teacher.name} to ${classItem.name} (general assignment)`);
          }
        }
      }
    }

    console.log(`\n✅ Teacher assignments created: ${assignments.length}\n`);

    // Verify assignments
    console.log('🔍 Verifying teacher assignments...');
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

    console.log('\n🎉 Teacher assignments seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Total assignments created: ${assignments.length}`);
    console.log(`- Teachers with assignments: ${teachers.filter(t => t.teacherProfile).length}`);
    console.log(`- Classes with teachers: ${classes.length}`);
    console.log('\n✨ Teachers can now see their assigned classes in the dashboard!');

  } catch (error) {
    console.error('❌ Error during teacher assignments seeding:', error);
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
