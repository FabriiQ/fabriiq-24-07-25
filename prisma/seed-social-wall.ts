/**
 * Social Wall Seed Data
 * Creates realistic test data for social wall features
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Social Wall data...');

  // Get existing campus, course, and class data
  const campus = await prisma.campus.findFirst();
  if (!campus) {
    throw new Error('No campus found. Please run main seed first.');
  }

  const courseCampus = await prisma.courseCampus.findFirst();
  if (!courseCampus) {
    throw new Error('No course campus found. Please run main seed first.');
  }

  const term = await prisma.term.findFirst();
  if (!term) {
    throw new Error('No term found. Please run main seed first.');
  }

  // Use existing class or create test class if it doesn't exist
  let testClass = await prisma.class.findFirst({
    where: {
      OR: [
        { name: 'Computer Science 101 - Social Wall Test' },
        { status: 'ACTIVE' }
      ]
    }
  });

  if (!testClass) {
    testClass = await prisma.class.create({
      data: {
        code: 'CS101-SW',
        name: 'Computer Science 101 - Social Wall Test',
        courseCampusId: courseCampus.id,
        termId: term.id,
        status: 'ACTIVE',
      },
    });
  }

  console.log(`📚 Using test class: ${testClass.name}`);

  // Create test teachers
  const teacherUsers = [];
  const teacherNames = [
    { name: 'Dr. Sarah Johnson', email: 'sarah.johnson@test.edu' },
    { name: 'Prof. Michael Chen', email: 'michael.chen@test.edu' },
    { name: 'Dr. Emily Rodriguez', email: 'emily.rodriguez@test.edu' },
  ];

  for (const teacher of teacherNames) {
    let user = await prisma.user.findUnique({
      where: { email: teacher.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: teacher.name,
          email: teacher.email,
          username: teacher.email.split('@')[0],
          userType: 'TEACHER',
          primaryCampusId: campus.id,
          password: await bcrypt.hash('password123', 10),
        },
      });

      // Create teacher profile
      const teacherProfile = await prisma.teacherProfile.create({
        data: {
          userId: user.id,
          campusId: campus.id,
        },
      });

      // Assign teacher to class
      await prisma.teacherAssignment.create({
        data: {
          teacherId: teacherProfile.id,
          classId: testClass.id,
          status: 'ACTIVE',
        },
      });
    }

    teacherUsers.push(user);
  }

  console.log(`👨‍🏫 Created ${teacherUsers.length} teachers`);

  // Create test students
  const studentUsers = [];
  const studentNames = [
    { name: 'Alex Thompson', email: 'alex.thompson@student.edu' },
    { name: 'Maria Garcia', email: 'maria.garcia@student.edu' },
    { name: 'James Wilson', email: 'james.wilson@student.edu' },
    { name: 'Priya Patel', email: 'priya.patel@student.edu' },
    { name: 'David Kim', email: 'david.kim@student.edu' },
    { name: 'Sophie Brown', email: 'sophie.brown@student.edu' },
    { name: 'Ryan O\'Connor', email: 'ryan.oconnor@student.edu' },
    { name: 'Zara Ahmed', email: 'zara.ahmed@student.edu' },
    { name: 'Lucas Silva', email: 'lucas.silva@student.edu' },
    { name: 'Emma Davis', email: 'emma.davis@student.edu' },
  ];

  for (const student of studentNames) {
    let user = await prisma.user.findUnique({
      where: { email: student.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: student.name,
          email: student.email,
          username: student.email.split('@')[0],
          userType: 'STUDENT',
          primaryCampusId: campus.id,
          password: await bcrypt.hash('password123', 10),
        },
      });

      // Create student profile
      const studentProfile = await prisma.studentProfile.create({
        data: {
          userId: user.id,
          enrollmentNumber: `STU${Math.random().toString().substr(2, 6)}`,
        },
      });

      // Enroll student in class
      await prisma.studentEnrollment.create({
        data: {
          studentId: studentProfile.id,
          classId: testClass.id,
          status: 'ACTIVE',
        },
      });
    }

    studentUsers.push(user);
  }

  console.log(`👨‍🎓 Created ${studentUsers.length} students`);

  // Create social wall posts
  const postContents = [
    {
      content: 'Welcome to Computer Science 101! I\'m excited to have you all in this class. We\'ll be covering fundamental programming concepts, data structures, and algorithms. Please introduce yourselves in the comments below! 🎉',
      postType: 'ANNOUNCEMENT',
      author: teacherUsers[0],
    },
    {
      content: 'Great job on the first assignment, everyone! The average score was 87%, which shows excellent understanding of basic programming concepts. Keep up the good work! 📊',
      postType: 'REGULAR',
      author: teacherUsers[0],
    },
    {
      content: 'Congratulations to Maria Garcia for achieving the highest score on the midterm exam! 🏆 Her dedication and hard work are truly inspiring. Well done, Maria!',
      postType: 'ACHIEVEMENT',
      author: teacherUsers[1],
    },
    {
      content: 'Reminder: The next assignment on data structures is due this Friday. Please make sure to test your code thoroughly and include proper documentation. If you have any questions, feel free to ask in the comments or during office hours.',
      postType: 'ANNOUNCEMENT',
      author: teacherUsers[0],
    },
    {
      content: 'I\'ve uploaded the lecture slides from today\'s class on algorithms. You can find them in the course materials section. We covered sorting algorithms and their time complexities. 📚',
      postType: 'REGULAR',
      author: teacherUsers[2],
    },
  ];

  const createdPosts = [];
  for (let i = 0; i < postContents.length; i++) {
    const postData = postContents[i];
    const post = await prisma.socialPost.create({
      data: {
        content: postData.content,
        contentType: 'TEXT',
        postType: postData.postType as any,
        classId: testClass.id,
        authorId: postData.author.id,
        status: 'ACTIVE',
        createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Spread posts over days
      },
    });
    createdPosts.push(post);
  }

  console.log(`📝 Created ${createdPosts.length} posts`);

  // Create comments for posts (testing the show more functionality)
  const commentTexts = [
    'Thank you for the warm welcome, Professor! I\'m really looking forward to this class.',
    'Hi everyone! I\'m Alex, a sophomore majoring in Computer Science. Excited to learn!',
    'Hello class! I\'m Maria from Spain. This is my first programming course and I\'m nervous but excited!',
    'Hey everyone! James here. I have some experience with Python, happy to help anyone who needs it.',
    'Hi! I\'m Priya, and I love problem-solving. Can\'t wait to dive into algorithms!',
    'Hello! David here. I\'m particularly interested in machine learning applications.',
    'Hi class! Sophie here. I\'m coming from a math background, so this is new territory for me.',
    'Hey everyone! Ryan here. I\'ve been coding as a hobby, excited to formalize my knowledge.',
    'Hello! I\'m Zara, and I\'m fascinated by how code can solve real-world problems.',
    'Hi! Lucas here. I\'m interested in web development and hope to learn the fundamentals here.',
    'Hello everyone! Emma here. I\'m excited to be part of this learning journey with you all!',
    'This looks like a great class! Thanks for the detailed syllabus, Professor.',
    'I appreciate the clear expectations. Looking forward to the first assignment!',
    'The course structure looks well-organized. Thank you for putting this together!',
    'I\'m excited about the practical projects mentioned in the syllabus.',
  ];

  // Add many comments to the first post to test "show more" functionality
  const firstPost = createdPosts[0];
  for (let i = 0; i < 12; i++) { // Create 12 comments to test pagination
    const randomStudent = studentUsers[Math.floor(Math.random() * studentUsers.length)];
    const commentText = commentTexts[i % commentTexts.length];
    
    await prisma.socialComment.create({
      data: {
        content: commentText,
        postId: firstPost.id,
        authorId: randomStudent.id,
        status: 'ACTIVE',
        createdAt: new Date(Date.now() - (i * 2 * 60 * 60 * 1000)), // Spread comments over hours
      },
    });
  }

  // Add fewer comments to other posts
  for (let i = 1; i < createdPosts.length; i++) {
    const post = createdPosts[i];
    const numComments = Math.floor(Math.random() * 5) + 1; // 1-5 comments
    
    for (let j = 0; j < numComments; j++) {
      const randomStudent = studentUsers[Math.floor(Math.random() * studentUsers.length)];
      const commentText = commentTexts[(i * 5 + j) % commentTexts.length];
      
      await prisma.socialComment.create({
        data: {
          content: commentText,
          postId: post.id,
          authorId: randomStudent.id,
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - (j * 30 * 60 * 1000)), // Spread comments over 30 min intervals
        },
      });
    }
  }

  console.log('💬 Created comments for all posts');

  // Add reactions to posts and comments
  const reactionTypes = ['LIKE', 'LOVE', 'CELEBRATE', 'LAUGH', 'SURPRISED'];
  
  for (const post of createdPosts) {
    // Add random reactions from students
    const numReactions = Math.floor(Math.random() * 8) + 2; // 2-9 reactions per post
    const reactingStudents = studentUsers.slice(0, numReactions);
    
    for (const student of reactingStudents) {
      const randomReaction = reactionTypes[Math.floor(Math.random() * reactionTypes.length)];
      
      await prisma.socialReaction.create({
        data: {
          postId: post.id,
          userId: student.id,
          reactionType: randomReaction as any,
        },
      });
    }
  }

  console.log('👍 Added reactions to posts');

  console.log('\n✅ Social Wall seed data created successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Class: ${testClass.name}`);
  console.log(`- Teachers: ${teacherUsers.length}`);
  console.log(`- Students: ${studentUsers.length}`);
  console.log(`- Posts: ${createdPosts.length}`);
  console.log(`- First post has 12 comments (to test "show more")`);
  console.log(`- Other posts have 1-5 comments each`);
  console.log(`- All posts have reactions from students`);
  console.log('\n🔑 Login credentials for testing:');
  console.log('Teachers:');
  teacherUsers.forEach(teacher => {
    console.log(`  - ${teacher.email} / password123`);
  });
  console.log('Students:');
  studentUsers.slice(0, 3).forEach(student => {
    console.log(`  - ${student.email} / password123`);
  });
  console.log('  - (and 7 more students...)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding social wall data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
