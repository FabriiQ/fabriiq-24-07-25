import { PrismaClient } from '@prisma/client';

/**
 * Check Question Bank Script
 * 
 * This script checks if a specific question bank exists and provides debugging information.
 * 
 * Usage:
 * npx ts-node scripts/check-question-bank.ts [questionBankId]
 */

async function main() {
  const prisma = new PrismaClient();
  
  try {
    const questionBankId = process.argv[2] || 'cmca9dsj40001ejmog01xzx4k';
    
    console.log('Checking question bank with ID:', questionBankId);
    
    // Check if the specific question bank exists
    const questionBank = await prisma.questionBank.findUnique({
      where: { id: questionBankId },
      include: {
        questions: {
          take: 5,
          select: {
            id: true,
            title: true,
            questionType: true,
          }
        }
      }
    });
    
    if (questionBank) {
      console.log('✅ Question bank found!');
      console.log('Name:', questionBank.name);
      console.log('Description:', questionBank.description);
      console.log('Institution ID:', questionBank.institutionId);
      console.log('Created by:', questionBank.createdById);
      console.log('Status:', questionBank.status);
      console.log('Questions count:', questionBank.questions.length);
      
      if (questionBank.questions.length > 0) {
        console.log('Sample questions:');
        questionBank.questions.forEach((q, i) => {
          console.log(`  ${i + 1}. ${q.title} (${q.questionType})`);
        });
      }
    } else {
      console.log('❌ Question bank not found!');
      
      // Show some existing question banks for reference
      console.log('\nExisting question banks:');
      const existingBanks = await prisma.questionBank.findMany({
        select: {
          id: true,
          name: true,
          institutionId: true,
          status: true,
          createdAt: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
      
      if (existingBanks.length === 0) {
        console.log('No question banks found in the database.');
        
        // Check if we have the necessary data to create one
        console.log('\nChecking for institutions and users...');
        
        const institutions = await prisma.institution.findMany({
          select: { id: true, name: true },
          take: 5
        });
        
        const users = await prisma.user.findMany({
          select: { id: true, name: true, email: true },
          take: 5
        });
        
        console.log('Institutions:', institutions.length);
        console.log('Users:', users.length);
        
        if (institutions.length > 0 && users.length > 0) {
          console.log('\n🔧 Creating a sample question bank...');
          
          const sampleBank = await prisma.questionBank.create({
            data: {
              name: 'Sample Question Bank',
              description: 'A sample question bank for testing',
              institutionId: institutions[0].id,
              status: 'ACTIVE',
              partitionKey: `inst_${institutions[0].id}`,
              createdById: users[0].id,
            }
          });
          
          console.log('✅ Created sample question bank with ID:', sampleBank.id);
          console.log('You can now use this ID to test question creation.');
        }
      } else {
        existingBanks.forEach((bank, i) => {
          console.log(`  ${i + 1}. ${bank.name} (ID: ${bank.id})`);
          console.log(`     Institution: ${bank.institutionId}, Status: ${bank.status}`);
        });
        
        console.log(`\n💡 Try using one of these existing question bank IDs instead.`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log('\nCheck completed!'))
  .catch((error) => {
    console.error('Error in check script:', error);
    process.exit(1);
  });
