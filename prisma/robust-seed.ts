import { PrismaClient, UserType, AccessScope, SystemStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// Constants
const DEFAULT_PASSWORD = 'Password123!';
const MAIN_INSTITUTION_CODE = 'MAIN';
const MAIN_CAMPUS_CODE = 'MAIN-CAMPUS';

async function main() {
  console.log('🚀 Starting robust database seeding...\n');

  try {
    const hashedPassword = await hash(DEFAULT_PASSWORD, 12);

    // Step 1: Create Main Institution
    console.log('📍 Step 1: Creating main institution...');
    const institution = await prisma.institution.upsert({
      where: { code: MAIN_INSTITUTION_CODE },
      update: {
        name: 'Main Educational Institution',
        status: SystemStatus.ACTIVE,
      },
      create: {
        code: MAIN_INSTITUTION_CODE,
        name: 'Main Educational Institution',
        status: SystemStatus.ACTIVE,
      },
    });
    console.log(`✅ Institution created: ${institution.name}\n`);

    // Step 2: Create Main Campus
    console.log('🏫 Step 2: Creating main campus...');
    const campus = await prisma.campus.upsert({
      where: { code: MAIN_CAMPUS_CODE },
      update: {
        name: 'Main Campus',
        status: SystemStatus.ACTIVE,
        institutionId: institution.id,
        address: {
          street: '123 Education Street',
          city: 'Education City',
          state: 'Education State',
          country: 'Education Country',
          postalCode: '12345',
        },
        contact: {
          phone: '+1-234-567-8900',
          email: 'info@maincampus.edu',
        },
      },
      create: {
        code: MAIN_CAMPUS_CODE,
        name: 'Main Campus',
        status: SystemStatus.ACTIVE,
        institutionId: institution.id,
        address: {
          street: '123 Education Street',
          city: 'Education City',
          state: 'Education State',
          country: 'Education Country',
          postalCode: '12345',
        },
        contact: {
          phone: '+1-234-567-8900',
          email: 'info@maincampus.edu',
        },
      },
    });
    console.log(`✅ Campus created: ${campus.name}\n`);

    // Step 3: Create Academic Cycle (will be created after admin user)
    console.log('📅 Step 3: Academic cycle will be created after admin user...\n');

    // Step 4: Create Demo Users (aligned with login page)
    console.log('👤 Step 4: Creating demo users...');
    const users = [];

    // System Admin
    const systemAdmin = await prisma.user.upsert({
      where: { username: 'sys_admin' },
      update: {
        name: 'System Administrator',
        username: 'sys_admin',
        userType: UserType.SYSTEM_ADMIN,
        accessScope: AccessScope.SYSTEM,
        status: SystemStatus.ACTIVE,
        primaryCampusId: campus.id,
        institutionId: institution.id,
      },
      create: {
        email: 'sys.admin@maincampus.edu',
        name: 'System Administrator',
        username: 'sys_admin',
        password: hashedPassword,
        userType: UserType.SYSTEM_ADMIN,
        accessScope: AccessScope.SYSTEM,
        status: SystemStatus.ACTIVE,
        primaryCampusId: campus.id,
        institutionId: institution.id,
      },
    });
    users.push(systemAdmin);

    // Program Coordinator
    const coordinator = await prisma.user.upsert({
      where: { username: 'alex_johnson' },
      update: {
        name: 'Alex Johnson',
        username: 'alex_johnson',
        userType: UserType.COORDINATOR,
        accessScope: AccessScope.MULTI_CAMPUS,
        status: SystemStatus.ACTIVE,
        primaryCampusId: campus.id,
        institutionId: institution.id,
      },
      create: {
        email: 'alex.johnson@maincampus.edu',
        name: 'Alex Johnson',
        username: 'alex_johnson',
        password: hashedPassword,
        userType: UserType.COORDINATOR,
        accessScope: AccessScope.MULTI_CAMPUS,
        status: SystemStatus.ACTIVE,
        primaryCampusId: campus.id,
        institutionId: institution.id,
      },
    });
    users.push(coordinator);

    // Boys Campus Admin
    const boysCampusAdmin = await prisma.user.upsert({
      where: { username: 'michael_smith' },
      update: {
        name: 'Michael Smith',
        username: 'michael_smith',
        userType: UserType.ADMINISTRATOR,
        accessScope: AccessScope.SINGLE_CAMPUS,
        status: SystemStatus.ACTIVE,
        primaryCampusId: campus.id,
        institutionId: institution.id,
      },
      create: {
        email: 'michael.smith@maincampus.edu',
        name: 'Michael Smith',
        username: 'michael_smith',
        password: hashedPassword,
        userType: UserType.ADMINISTRATOR,
        accessScope: AccessScope.SINGLE_CAMPUS,
        status: SystemStatus.ACTIVE,
        primaryCampusId: campus.id,
        institutionId: institution.id,
      },
    });
    users.push(boysCampusAdmin);

    // Girls Campus Admin
    const girlsCampusAdmin = await prisma.user.upsert({
      where: { username: 'sarah_williams' },
      update: {
        name: 'Sarah Williams',
        username: 'sarah_williams',
        userType: UserType.ADMINISTRATOR,
        accessScope: AccessScope.SINGLE_CAMPUS,
        status: SystemStatus.ACTIVE,
        primaryCampusId: campus.id,
        institutionId: institution.id,
      },
      create: {
        email: 'sarah.williams@maincampus.edu',
        name: 'Sarah Williams',
        username: 'sarah_williams',
        password: hashedPassword,
        userType: UserType.ADMINISTRATOR,
        accessScope: AccessScope.SINGLE_CAMPUS,
        status: SystemStatus.ACTIVE,
        primaryCampusId: campus.id,
        institutionId: institution.id,
      },
    });
    users.push(girlsCampusAdmin);

    // Create demo student accounts (matching login page exactly)
    const demoStudents = [
      {
        email: 'john.smith.student@maincampus.edu',
        name: 'John Smith (Student)',
        username: 'john_smith',
        userType: UserType.STUDENT,
      },
      {
        email: 'emily.johnson.student@maincampus.edu',
        name: 'Emily Johnson (Student)',
        username: 'emily_johnson',
        userType: UserType.STUDENT,
      },
    ];

    for (const studentData of demoStudents) {
      const student = await prisma.user.upsert({
        where: { username: studentData.username },
        update: {
          name: studentData.name,
          username: studentData.username,
          userType: studentData.userType,
          accessScope: AccessScope.SINGLE_CAMPUS,
          status: SystemStatus.ACTIVE,
          primaryCampusId: campus.id,
          institutionId: institution.id,
        },
        create: {
          email: studentData.email,
          name: studentData.name,
          username: studentData.username,
          password: hashedPassword,
          userType: studentData.userType,
          accessScope: AccessScope.SINGLE_CAMPUS,
          status: SystemStatus.ACTIVE,
          primaryCampusId: campus.id,
          institutionId: institution.id,
        },
      });
      users.push(student);
    }

    // Use the first admin for academic cycle creation
    const campusAdmin = systemAdmin;
    console.log(`✅ Demo users created: ${users.length}\n`);

    // Step 3.5: Create Academic Cycle with proper creator
    console.log('📅 Step 3.5: Creating academic cycle...');
    const academicCycle = await prisma.academicCycle.upsert({
      where: { code: 'AC-2024' },
      update: {
        name: 'Academic Year 2024',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        duration: 365,
        status: SystemStatus.ACTIVE,
        institutionId: institution.id,
        updatedBy: campusAdmin.id,
      },
      create: {
        code: 'AC-2024',
        name: 'Academic Year 2024',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        duration: 365,
        status: SystemStatus.ACTIVE,
        institutionId: institution.id,
        createdBy: campusAdmin.id,
        updatedBy: campusAdmin.id,
      },
    });
    console.log(`✅ Academic cycle created: ${academicCycle.name}\n`);

    // Step 5: Create Programs
    console.log('🎓 Step 5: Creating programs...');
    const programs = [];
    
    const programsData = [
      {
        code: 'ELEM',
        name: 'Elementary Program',
        type: 'STANDARD',
        level: 1,
        duration: 6,
      },
      {
        code: 'MIDDLE',
        name: 'Middle School Program',
        type: 'STANDARD',
        level: 2,
        duration: 3,
      },
      {
        code: 'HIGH',
        name: 'High School Program',
        type: 'STANDARD',
        level: 3,
        duration: 4,
      },
    ];

    for (const programData of programsData) {
      const program = await prisma.program.upsert({
        where: { code: programData.code },
        update: {
          ...programData,
          status: SystemStatus.ACTIVE,
          institutionId: institution.id,
        },
        create: {
          ...programData,
          status: SystemStatus.ACTIVE,
          institutionId: institution.id,
        },
      });
      programs.push(program);

      // Create program-campus association
      await prisma.programCampus.upsert({
        where: {
          programId_campusId: {
            programId: program.id,
            campusId: campus.id,
          },
        },
        update: {
          status: SystemStatus.ACTIVE,
        },
        create: {
          programId: program.id,
          campusId: campus.id,
          status: SystemStatus.ACTIVE,
        },
      });
    }
    console.log(`✅ Programs created: ${programs.length}\n`);

    // Step 6: Create Courses
    console.log('📚 Step 6: Creating courses...');
    const courses = [];
    
    const coursesData = [
      // Elementary courses
      { code: 'ELEM-G1', name: 'Grade 1', programCode: 'ELEM', level: 1, credits: 30 },
      { code: 'ELEM-G2', name: 'Grade 2', programCode: 'ELEM', level: 2, credits: 30 },
      { code: 'ELEM-G3', name: 'Grade 3', programCode: 'ELEM', level: 3, credits: 30 },
      // Middle school courses
      { code: 'MIDDLE-G6', name: 'Grade 6', programCode: 'MIDDLE', level: 1, credits: 35 },
      { code: 'MIDDLE-G7', name: 'Grade 7', programCode: 'MIDDLE', level: 2, credits: 35 },
      { code: 'MIDDLE-G8', name: 'Grade 8', programCode: 'MIDDLE', level: 3, credits: 35 },
      // High school courses
      { code: 'HIGH-G9', name: 'Grade 9', programCode: 'HIGH', level: 1, credits: 40 },
      { code: 'HIGH-G10', name: 'Grade 10', programCode: 'HIGH', level: 2, credits: 40 },
      { code: 'HIGH-G11', name: 'Grade 11', programCode: 'HIGH', level: 3, credits: 40 },
      { code: 'HIGH-G12', name: 'Grade 12', programCode: 'HIGH', level: 4, credits: 40 },
    ];

    for (const courseData of coursesData) {
      const { programCode, ...courseInfo } = courseData;
      const program = programs.find(p => p.code === programCode);
      
      if (program) {
        const course = await prisma.course.upsert({
          where: { code: courseData.code },
          update: {
            ...courseInfo,
            description: `${courseInfo.name} curriculum`,
            status: SystemStatus.ACTIVE,
            programId: program.id,
          },
          create: {
            ...courseInfo,
            description: `${courseInfo.name} curriculum`,
            status: SystemStatus.ACTIVE,
            programId: program.id,
          },
        });
        courses.push(course);
      }
    }
    console.log(`✅ Courses created: ${courses.length}\n`);

    // Step 6.5: Create Course-Campus associations
    console.log('🔗 Step 6.5: Creating course-campus associations...');
    const courseCampuses = [];

    for (const course of courses) {
      const program = programs.find(p => p.id === course.programId);
      if (program) {
        const programCampus = await prisma.programCampus.findFirst({
          where: {
            programId: program.id,
            campusId: campus.id,
          },
        });

        if (programCampus) {
          const courseCampus = await prisma.courseCampus.upsert({
            where: {
              courseId_campusId_programCampusId: {
                courseId: course.id,
                campusId: campus.id,
                programCampusId: programCampus.id,
              },
            },
            update: {
              status: SystemStatus.ACTIVE,
            },
            create: {
              courseId: course.id,
              campusId: campus.id,
              programCampusId: programCampus.id,
              status: SystemStatus.ACTIVE,
            },
          });
          courseCampuses.push(courseCampus);
        }
      }
    }
    console.log(`✅ Course-campus associations created: ${courseCampuses.length}\n`);

    // Step 7: Create Subjects
    console.log('📖 Step 7: Creating subjects...');
    const subjects = [];

    const subjectsData = [
      // Core subjects for all levels
      { code: 'MATH', name: 'Mathematics', credits: 4.0 },
      { code: 'ENG', name: 'English Language Arts', credits: 4.0 },
      { code: 'SCI', name: 'Science', credits: 3.0 },
      { code: 'HIST', name: 'History', credits: 3.0 },
      { code: 'GEO', name: 'Geography', credits: 2.0 },
      { code: 'ART', name: 'Arts & Crafts', credits: 2.0 },
      { code: 'PE', name: 'Physical Education', credits: 2.0 },
      { code: 'MUS', name: 'Music', credits: 1.0 },
      // Advanced subjects for high school
      { code: 'CHEM', name: 'Chemistry', credits: 4.0 },
      { code: 'PHYS', name: 'Physics', credits: 4.0 },
      { code: 'BIO', name: 'Biology', credits: 4.0 },
      { code: 'COMP', name: 'Computer Science', credits: 3.0 },
    ];

    for (const subjectData of subjectsData) {
      // Create subject for each course
      for (const course of courses) {
        const subjectCode = `${course.code}-${subjectData.code}`;
        const subject = await prisma.subject.upsert({
          where: { code: subjectCode },
          update: {
            name: subjectData.name,
            credits: subjectData.credits,
            status: SystemStatus.ACTIVE,
            courseId: course.id,
          },
          create: {
            code: subjectCode,
            name: subjectData.name,
            credits: subjectData.credits,
            status: SystemStatus.ACTIVE,
            courseId: course.id,
          },
        });
        subjects.push(subject);
      }
    }
    console.log(`✅ Subjects created: ${subjects.length}\n`);

    // Step 8: Create Subject Topics
    console.log('📝 Step 8: Creating subject topics...');
    const subjectTopics = [];

    const topicsData = [
      // Math topics
      { subjectCode: 'MATH', title: 'Numbers and Operations', description: 'Basic arithmetic and number sense' },
      { subjectCode: 'MATH', title: 'Algebra', description: 'Variables, equations, and expressions' },
      { subjectCode: 'MATH', title: 'Geometry', description: 'Shapes, measurements, and spatial reasoning' },
      { subjectCode: 'MATH', title: 'Statistics', description: 'Data analysis and probability' },

      // English topics
      { subjectCode: 'ENG', title: 'Reading Comprehension', description: 'Understanding and analyzing texts' },
      { subjectCode: 'ENG', title: 'Writing Skills', description: 'Grammar, composition, and creative writing' },
      { subjectCode: 'ENG', title: 'Literature', description: 'Poetry, novels, and literary analysis' },
      { subjectCode: 'ENG', title: 'Speaking & Listening', description: 'Oral communication and presentation skills' },

      // Science topics
      { subjectCode: 'SCI', title: 'Life Science', description: 'Living organisms and ecosystems' },
      { subjectCode: 'SCI', title: 'Physical Science', description: 'Matter, energy, and forces' },
      { subjectCode: 'SCI', title: 'Earth Science', description: 'Weather, geology, and environmental science' },
      { subjectCode: 'SCI', title: 'Scientific Method', description: 'Observation, hypothesis, and experimentation' },
    ];

    for (const topicData of topicsData) {
      // Find subjects that match the subject code pattern
      const matchingSubjects = subjects.filter(s => s.code.includes(topicData.subjectCode));

      for (const subject of matchingSubjects) {
        const topicCode = `${subject.code}-${topicData.title.replace(/\s+/g, '').toUpperCase()}`;
        const topic: any = await prisma.subjectTopic.upsert({
          where: {
            subjectId_code: {
              subjectId: subject.id,
              code: topicCode,
            }
          },
          update: {
            title: topicData.title,
            description: topicData.description,
            status: SystemStatus.ACTIVE,
          },
          create: {
            code: topicCode,
            title: topicData.title,
            description: topicData.description,
            nodeType: 'TOPIC',
            status: SystemStatus.ACTIVE,
            subjectId: subject.id,
            orderIndex: subjectTopics.length + 1,
          },
        });
        subjectTopics.push(topic);
      }
    }
    console.log(`✅ Subject topics created: ${subjectTopics.length}\n`);

    // Step 9: Create Teachers (aligned with demo credentials)
    console.log('👨‍🏫 Step 9: Creating teachers...');
    const teachers = [];

    const teachersData = [
      { email: 'robert.brown@maincampus.edu', name: 'Robert Brown', username: 'robert_brown', specialization: 'Mathematics (Boys)' },
      { email: 'jennifer.davis@maincampus.edu', name: 'Jennifer Davis', username: 'jennifer_davis', specialization: 'Mathematics (Girls)' },
      { email: 'james.anderson@maincampus.edu', name: 'James Anderson', username: 'james_anderson', specialization: 'Science' },
      { email: 'lisa.wilson@maincampus.edu', name: 'Lisa Wilson', username: 'lisa_wilson', specialization: 'English' },
      { email: 'david.taylor@maincampus.edu', name: 'David Taylor', username: 'david_taylor', specialization: 'Physical Education' },
      { email: 'emma.clark@maincampus.edu', name: 'Emma Clark', username: 'emma_clark', specialization: 'Arts' },
    ];

    for (const teacherData of teachersData) {
      const teacher = await prisma.user.upsert({
        where: { username: teacherData.username },
        update: {
          name: teacherData.name,
          username: teacherData.username,
          userType: UserType.TEACHER,
          accessScope: AccessScope.SINGLE_CAMPUS,
          status: SystemStatus.ACTIVE,
          primaryCampusId: campus.id,
          institutionId: institution.id,
        },
        create: {
          email: teacherData.email,
          name: teacherData.name,
          username: teacherData.username,
          password: hashedPassword,
          userType: UserType.TEACHER,
          accessScope: AccessScope.SINGLE_CAMPUS,
          status: SystemStatus.ACTIVE,
          primaryCampusId: campus.id,
          institutionId: institution.id,
        },
      });
      teachers.push(teacher);

      // Create teacher profile
      await prisma.teacherProfile.upsert({
        where: { userId: teacher.id },
        update: {
          specialization: teacherData.specialization,
        },
        create: {
          userId: teacher.id,
          specialization: teacherData.specialization,
        },
      });
    }
    console.log(`✅ Teachers created: ${teachers.length}\n`);

    // Step 10: Create Classes
    console.log('🏛️ Step 10: Creating classes...');
    const classes = [];

    // Create terms for each course
    const terms = [];
    for (const course of courses) {
      const term = await prisma.term.upsert({
        where: { code: `${course.code}-FALL-2024` },
        update: {
          name: `${course.name} - Fall Semester 2024`,
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-06-15'),
          status: SystemStatus.ACTIVE,
        },
        create: {
          code: `${course.code}-FALL-2024`,
          name: `${course.name} - Fall Semester 2024`,
          termType: 'SEMESTER',
          termPeriod: 'FALL',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-06-15'),
          courseId: course.id,
          academicCycleId: academicCycle.id,
          status: SystemStatus.ACTIVE,
        },
      });
      terms.push(term);
    }

    const classesData = [
      { code: 'G1-A', name: 'Grade 1 Section A', courseCode: 'ELEM-G1', capacity: 25 },
      { code: 'G1-B', name: 'Grade 1 Section B', courseCode: 'ELEM-G1', capacity: 25 },
      { code: 'G2-A', name: 'Grade 2 Section A', courseCode: 'ELEM-G2', capacity: 25 },
      { code: 'G3-A', name: 'Grade 3 Section A', courseCode: 'ELEM-G3', capacity: 25 },
      { code: 'G6-A', name: 'Grade 6 Section A', courseCode: 'MIDDLE-G6', capacity: 30 },
      { code: 'G7-A', name: 'Grade 7 Section A', courseCode: 'MIDDLE-G7', capacity: 30 },
      { code: 'G8-A', name: 'Grade 8 Section A', courseCode: 'MIDDLE-G8', capacity: 30 },
      { code: 'G9-A', name: 'Grade 9 Section A', courseCode: 'HIGH-G9', capacity: 35 },
      { code: 'G10-A', name: 'Grade 10 Section A', courseCode: 'HIGH-G10', capacity: 35 },
    ];

    for (const classData of classesData) {
      const course = courses.find(c => c.code === classData.courseCode);
      const term = terms.find(t => t.courseId === course?.id);

      if (course && term) {
        // Find course-campus association
        const courseCampus = courseCampuses.find(cc => cc.courseId === course.id);

        if (courseCampus) {
          const classObj = await prisma.class.upsert({
            where: { code: classData.code },
            update: {
              name: classData.name,
              maxCapacity: classData.capacity,
              minCapacity: 1,
              status: SystemStatus.ACTIVE,
              campusId: campus.id,
              courseCampusId: courseCampus.id,
              termId: term.id,
            },
            create: {
              code: classData.code,
              name: classData.name,
              maxCapacity: classData.capacity,
              minCapacity: 1,
              status: SystemStatus.ACTIVE,
              campusId: campus.id,
              courseCampusId: courseCampus.id,
              termId: term.id,
            },
          });
          classes.push(classObj);
        }
      }
    }
    console.log(`✅ Classes created: ${classes.length}\n`);

    // Step 11: Create Students
    console.log('👨‍🎓 Step 11: Creating students...');
    const students = [];

    // Additional students for enrollment (demo students already created above)
    const additionalStudentsData = [
      { email: 'charlie.brown@student.maincampus.edu', name: 'Charlie Brown', username: 'charlie_brown_student', enrollmentNumber: 'MAIN-STD-003', classCode: 'G1-B' },
      { email: 'diana.prince@student.maincampus.edu', name: 'Diana Prince', username: 'diana_prince_student', enrollmentNumber: 'MAIN-STD-004', classCode: 'G2-A' },
      { email: 'ethan.hunt@student.maincampus.edu', name: 'Ethan Hunt', username: 'ethan_hunt_student', enrollmentNumber: 'MAIN-STD-005', classCode: 'G3-A' },
      { email: 'fiona.green@student.maincampus.edu', name: 'Fiona Green', username: 'fiona_green_student', enrollmentNumber: 'MAIN-STD-006', classCode: 'G6-A' },
      { email: 'george.washington@student.maincampus.edu', name: 'George Washington', username: 'george_washington_student', enrollmentNumber: 'MAIN-STD-007', classCode: 'G7-A' },
      { email: 'helen.troy@student.maincampus.edu', name: 'Helen Troy', username: 'helen_troy_student', enrollmentNumber: 'MAIN-STD-008', classCode: 'G8-A' },
      { email: 'ivan.petrov@student.maincampus.edu', name: 'Ivan Petrov', username: 'ivan_petrov_student', enrollmentNumber: 'MAIN-STD-009', classCode: 'G9-A' },
      { email: 'jane.doe@student.maincampus.edu', name: 'Jane Doe', username: 'jane_doe_student', enrollmentNumber: 'MAIN-STD-010', classCode: 'G10-A' },
    ];

    // First, enroll the demo students that were already created
    const demoStudentUsers = users.filter(u => u.userType === UserType.STUDENT);
    for (let i = 0; i < demoStudentUsers.length; i++) {
      const student = demoStudentUsers[i];
      const targetClass = classes[0]; // Enroll demo students in first class

      if (targetClass) {
        // Create student profile
        const enrollmentNumber = `MAIN-DEMO-00${i + 1}`;
        const studentProfile = await prisma.studentProfile.upsert({
          where: { userId: student.id },
          update: {
            enrollmentNumber: enrollmentNumber,
            currentGrade: targetClass.name,
          },
          create: {
            userId: student.id,
            enrollmentNumber: enrollmentNumber,
            currentGrade: targetClass.name,
          },
        });

        // Create student enrollment
        await prisma.studentEnrollment.upsert({
          where: {
            studentId_classId: {
              studentId: studentProfile.id,
              classId: targetClass.id,
            },
          },
          update: {
            status: SystemStatus.ACTIVE,
            updatedById: campusAdmin.id,
          },
          create: {
            studentId: studentProfile.id,
            classId: targetClass.id,
            status: SystemStatus.ACTIVE,
            createdById: campusAdmin.id,
          },
        });
        students.push(student);
      }
    }

    // Now create additional students
    for (const studentData of additionalStudentsData) {
      const targetClass = classes.find(c => c.code === studentData.classCode);

      if (targetClass) {
        // Create user
        const student = await prisma.user.upsert({
          where: { username: studentData.username },
          update: {
            name: studentData.name,
            username: studentData.username,
            userType: UserType.STUDENT,
            accessScope: AccessScope.SINGLE_CAMPUS,
            status: SystemStatus.ACTIVE,
            primaryCampusId: campus.id,
            institutionId: institution.id,
          },
          create: {
            email: studentData.email,
            name: studentData.name,
            username: studentData.username,
            password: hashedPassword,
            userType: UserType.STUDENT,
            accessScope: AccessScope.SINGLE_CAMPUS,
            status: SystemStatus.ACTIVE,
            primaryCampusId: campus.id,
            institutionId: institution.id,
          },
        });

        // Create student profile
        const studentProfile = await prisma.studentProfile.upsert({
          where: { userId: student.id },
          update: {
            enrollmentNumber: studentData.enrollmentNumber,
            currentGrade: targetClass.name,
          },
          create: {
            userId: student.id,
            enrollmentNumber: studentData.enrollmentNumber,
            currentGrade: targetClass.name,
          },
        });

        // Create student enrollment
        await prisma.studentEnrollment.upsert({
          where: {
            studentId_classId: {
              studentId: studentProfile.id,
              classId: targetClass.id,
            },
          },
          update: {
            status: SystemStatus.ACTIVE,
            updatedById: campusAdmin.id,
          },
          create: {
            studentId: studentProfile.id,
            classId: targetClass.id,
            status: SystemStatus.ACTIVE,
            createdById: campusAdmin.id,
          },
        });

        students.push(student);
      }
    }
    console.log(`✅ Students created: ${students.length}\n`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Final Summary:');
    console.log(`- Institution: ${institution.name}`);
    console.log(`- Campus: ${campus.name}`);
    console.log(`- Academic Cycle: ${academicCycle.name}`);
    console.log(`- Demo Users: ${users.length + teachers.length}`);
    console.log(`- Programs: ${programs.length}`);
    console.log(`- Courses: ${courses.length}`);
    console.log(`- Subjects: ${subjects.length}`);
    console.log(`- Subject Topics: ${subjectTopics.length}`);
    console.log(`- Teachers: ${teachers.length}`);
    console.log(`- Classes: ${classes.length}`);
    console.log(`- Students: ${students.length}`);
    console.log('\n🔑 Demo Login Credentials (aligned with login page):');
    console.log('\n📋 System Level:');
    console.log(`- System Admin: sys_admin / ${DEFAULT_PASSWORD}`);
    console.log(`- Program Coordinator: alex_johnson / ${DEFAULT_PASSWORD}`);
    console.log('\n🏫 Campus Level:');
    console.log(`- Boys Campus Admin: michael_smith / ${DEFAULT_PASSWORD}`);
    console.log(`- Girls Campus Admin: sarah_williams / ${DEFAULT_PASSWORD}`);
    console.log('\n👨‍🏫 Teachers:');
    console.log(`- Math Teacher (Boys): robert_brown / ${DEFAULT_PASSWORD}`);
    console.log(`- Math Teacher (Girls): jennifer_davis / ${DEFAULT_PASSWORD}`);
    console.log(`- Science Teacher: james_anderson / ${DEFAULT_PASSWORD}`);
    console.log('\n👨‍🎓 Students:');
    console.log(`- Boy Student: john_smith / ${DEFAULT_PASSWORD}`);
    console.log(`- Girl Student: emily_johnson / ${DEFAULT_PASSWORD}`);
    console.log(`- Additional Students: ${students.length - 2} more students created`);
    console.log('\n✨ Your Supabase database is now ready for use!');
    console.log('🎯 All demo accounts from the login page are now available!');

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
