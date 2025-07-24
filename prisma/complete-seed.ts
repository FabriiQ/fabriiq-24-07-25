import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runCompleteSeeding() {
  console.log('🚀 Starting complete FabriiQ database seeding...\n');
  
  try {
    console.log('📋 Step 1: Running robust seed (users, programs, courses, classes)...');
    const { stdout: robustOutput, stderr: robustError } = await execAsync('npm run db:robust-seed');
    
    if (robustError) {
      console.error('❌ Error in robust seed:', robustError);
      throw new Error(robustError);
    }
    
    console.log(robustOutput);
    console.log('✅ Robust seed completed successfully!\n');
    
    console.log('📚 Step 2: Running learning content seed (outcomes, activities, assessments)...');
    const { stdout: contentOutput, stderr: contentError } = await execAsync('npm run db:learning-content-seed');

    if (contentError) {
      console.error('❌ Error in learning content seed:', contentError);
      throw new Error(contentError);
    }

    console.log(contentOutput);
    console.log('✅ Learning content seed completed successfully!\n');

    console.log('👨‍🏫 Step 3: Running teacher assignments seed...');
    const { stdout: assignmentOutput, stderr: assignmentError } = await execAsync('npm run db:teacher-assignments-seed');

    if (assignmentError) {
      console.error('❌ Error in teacher assignments seed:', assignmentError);
      throw new Error(assignmentError);
    }

    console.log(assignmentOutput);
    console.log('✅ Teacher assignments seed completed successfully!\n');
    
    console.log('🎉 COMPLETE SEEDING FINISHED SUCCESSFULLY! 🎉');
    console.log('\n📊 Your FabriiQ database now contains:');
    console.log('👥 Users: System admin, coordinators, campus admins, teachers, students');
    console.log('🏫 Structure: Institution, campus, programs, courses, classes');
    console.log('📚 Content: 210 learning outcomes, 162 activities, 432 assessments');
    console.log('👨‍🏫 Assignments: Teachers assigned to classes (33+ assignments)');
    console.log('🎯 Features: Bloom\'s taxonomy integration, realistic educational content');
    console.log('\n🔑 Demo Login Credentials:');
    console.log('- System Admin: sys_admin / Password123!');
    console.log('- Program Coordinator: alex_johnson / Password123!');
    console.log('- Campus Admins: michael_smith, sarah_williams / Password123!');
    console.log('- Teachers: robert_brown, jennifer_davis, james_anderson / Password123!');
    console.log('- Students: john_smith, emily_johnson / Password123!');
    console.log('\n✨ Your FabriiQ platform is now ready for demonstration and development!');
    
  } catch (error) {
    console.error('❌ Complete seeding failed:', error);
    process.exit(1);
  }
}

runCompleteSeeding();
