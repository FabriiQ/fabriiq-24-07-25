import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBrandingSettings() {
  console.log('🎨 Seeding branding settings...');

  // Find a system admin user to use as the creator
  const systemAdmin = await prisma.user.findFirst({
    where: {
      userType: 'SYSTEM_ADMIN',
    },
  });

  if (!systemAdmin) {
    console.log('❌ No system admin found. Please create a system admin user first.');
    return;
  }

  // Default branding settings
  const brandingSettings = [
    {
      key: 'branding.systemName',
      value: 'FabriiQ LXP',
      description: 'The name of the learning management system',
      category: 'branding',
      isPublic: true,
    },
    {
      key: 'branding.logoUrl',
      value: '', // Empty by default - can be configured by admin
      description: 'URL to the system logo image',
      category: 'branding',
      isPublic: true,
    },
    {
      key: 'branding.faviconUrl',
      value: '', // Empty by default - can be configured by admin
      description: 'URL to the system favicon',
      category: 'branding',
      isPublic: true,
    },
    {
      key: 'branding.primaryColor',
      value: '#3B82F6', // Default blue color
      description: 'Primary brand color (hex format)',
      category: 'branding',
      isPublic: true,
    },
    {
      key: 'branding.secondaryColor',
      value: '#64748B', // Default slate color
      description: 'Secondary brand color (hex format)',
      category: 'branding',
      isPublic: true,
    },
    {
      key: 'branding.footerText',
      value: '© 2024 FabriiQ. All rights reserved.',
      description: 'Footer text displayed across the system',
      category: 'branding',
      isPublic: true,
    },
  ];

  // Create or update branding settings
  for (const setting of brandingSettings) {
    await prisma.systemConfig.upsert({
      where: { key: setting.key },
      create: {
        ...setting,
        createdById: systemAdmin.id,
      },
      update: {
        value: setting.value,
        description: setting.description,
        category: setting.category,
        isPublic: setting.isPublic,
        updatedById: systemAdmin.id,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Created/updated branding setting: ${setting.key}`);
  }

  console.log('🎨 Branding settings seeded successfully!');
}

async function main() {
  try {
    await seedBrandingSettings();
  } catch (error) {
    console.error('❌ Error seeding branding settings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { seedBrandingSettings };
