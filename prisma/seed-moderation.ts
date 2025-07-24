/**
 * Moderation Seed Data
 * Creates sample reports and moderation logs for testing the moderation dashboard
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedModerationData() {
  console.log('\n🛡️ Seeding moderation data...');

  // Find existing class and users
  const testClass = await prisma.class.findFirst({
    where: {
      OR: [
        { name: { contains: 'Computer Science' } },
        { status: 'ACTIVE' }
      ]
    },
  });

  if (!testClass) {
    console.log('❌ No active class found. Please ensure there is at least one active class.');
    return;
  }

  const teacherUsers = await prisma.user.findMany({
    where: { userType: 'TEACHER' },
    take: 2,
  });

  const studentUsers = await prisma.user.findMany({
    where: { userType: 'STUDENT' },
    take: 10,
  });

  const existingPosts = await prisma.socialPost.findMany({
    where: { classId: testClass.id },
    take: 5,
  });

  const existingComments = await prisma.socialComment.findMany({
    where: { 
      post: { classId: testClass.id }
    },
    take: 5,
  });

  if (teacherUsers.length === 0 || studentUsers.length === 0 || existingPosts.length === 0) {
    console.log('❌ Required users or posts not found. Please run social wall seed first.');
    return;
  }

  // Create sample reports
  const reportReasons = [
    'INAPPROPRIATE_CONTENT',
    'SPAM',
    'HARASSMENT',
    'BULLYING',
    'HATE_SPEECH',
    'MISINFORMATION',
    'OTHER'
  ];

  const reportStatuses = ['PENDING', 'RESOLVED', 'DISMISSED'];

  const reports = [];
  
  // Create 15 reports with varied data
  for (let i = 0; i < 15; i++) {
    const isPostReport = Math.random() > 0.5;
    const targetContent = isPostReport 
      ? existingPosts[Math.floor(Math.random() * existingPosts.length)]
      : existingComments[Math.floor(Math.random() * existingComments.length)];
    
    const reporter = studentUsers[Math.floor(Math.random() * studentUsers.length)];
    const reason = reportReasons[Math.floor(Math.random() * reportReasons.length)];
    const status = reportStatuses[Math.floor(Math.random() * reportStatuses.length)];
    
    // Create reports from different time periods
    const daysAgo = Math.floor(Math.random() * 30); // 0-30 days ago
    const createdAt = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
    
    const reportData: any = {
      reason: reason as any,
      description: `Sample report for ${reason.toLowerCase().replace('_', ' ')}`,
      status: status as any,
      reporterId: reporter.id,
      classId: testClass.id,
      createdAt,
      updatedAt: createdAt,
    };

    if (isPostReport) {
      reportData.postId = targetContent.id;
    } else {
      reportData.commentId = targetContent.id;
    }

    // If resolved, add moderator and resolution time
    if (status === 'RESOLVED' || status === 'DISMISSED') {
      const moderator = teacherUsers[Math.floor(Math.random() * teacherUsers.length)];
      const resolutionDelay = Math.floor(Math.random() * 48 * 60 * 60 * 1000); // 0-48 hours
      
      reportData.moderatorId = moderator.id;
      reportData.resolvedAt = new Date(createdAt.getTime() + resolutionDelay);
      reportData.moderationNotes = `Resolved: ${status === 'RESOLVED' ? 'Action taken' : 'No action needed'}`;
    }

    const report = await prisma.socialReport.create({
      data: reportData,
    });
    
    reports.push(report);
  }

  console.log(`📋 Created ${reports.length} reports`);

  // Create moderation logs
  const moderationActions = [
    'HIDE_POST',
    'DELETE_POST', 
    'HIDE_COMMENT',
    'DELETE_COMMENT',
    'WARN_USER',
    'RESTRICT_USER',
    'RESTORE_POST',
    'RESTORE_COMMENT'
  ];

  const logs = [];

  // Create 20 moderation logs
  for (let i = 0; i < 20; i++) {
    const action = moderationActions[Math.floor(Math.random() * moderationActions.length)];
    const moderator = teacherUsers[Math.floor(Math.random() * teacherUsers.length)];
    const targetUser = studentUsers[Math.floor(Math.random() * studentUsers.length)];
    
    // Create logs from different time periods
    const daysAgo = Math.floor(Math.random() * 30); // 0-30 days ago
    const createdAt = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
    
    const logData: any = {
      action: action as any,
      reason: `Moderation action: ${action.toLowerCase().replace('_', ' ')}`,
      notes: `Sample moderation log for ${action}`,
      moderatorId: moderator.id,
      targetUserId: targetUser.id,
      classId: testClass.id,
      createdAt,
    };

    // Randomly assign to post or comment
    if (action.includes('POST')) {
      const targetPost = existingPosts[Math.floor(Math.random() * existingPosts.length)];
      logData.postId = targetPost.id;
    } else if (action.includes('COMMENT')) {
      const targetComment = existingComments[Math.floor(Math.random() * existingComments.length)];
      logData.commentId = targetComment.id;
    }

    const log = await prisma.socialModerationLog.create({
      data: logData,
    });
    
    logs.push(log);
  }

  console.log(`📝 Created ${logs.length} moderation logs`);

  console.log('\n✅ Moderation seed data created successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Class: ${testClass.name}`);
  console.log(`- Reports: ${reports.length}`);
  console.log(`- Moderation Logs: ${logs.length}`);
  console.log(`- Pending Reports: ${reports.filter(r => r.status === 'PENDING').length}`);
  console.log(`- Resolved Reports: ${reports.filter(r => r.status === 'RESOLVED').length}`);
  console.log(`- Dismissed Reports: ${reports.filter(r => r.status === 'DISMISSED').length}`);
}

// Run if called directly
if (require.main === module) {
  seedModerationData()
    .catch((e) => {
      console.error('❌ Error seeding moderation data:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
