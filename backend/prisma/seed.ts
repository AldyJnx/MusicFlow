import { PrismaClient, ReverbPreset } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create global EQ presets
  const globalPresets = [
    { id: 'global-flat', name: 'Flat', bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'global-bass-boost', name: 'Bass Boost', bands: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0] },
    { id: 'global-treble-boost', name: 'Treble Boost', bands: [0, 0, 0, 0, 0, 2, 4, 5, 6, 6] },
    { id: 'global-rock', name: 'Rock', bands: [5, 4, 2, 0, -1, 0, 2, 4, 5, 5] },
    { id: 'global-pop', name: 'Pop', bands: [0, 2, 4, 5, 4, 2, 0, -1, -1, 0] },
    { id: 'global-jazz', name: 'Jazz', bands: [3, 2, 0, 2, -2, -2, 0, 2, 3, 4] },
    { id: 'global-classical', name: 'Classical', bands: [4, 3, 2, 1, 0, 0, 0, 2, 3, 4] },
    { id: 'global-electronic', name: 'Electronic', bands: [5, 4, 2, 0, -2, 2, 0, 2, 4, 5] },
    { id: 'global-hip-hop', name: 'Hip-Hop', bands: [6, 5, 3, 0, -1, 0, 2, 0, 2, 3] },
    { id: 'global-vocal', name: 'Vocal', bands: [-2, -1, 0, 3, 5, 5, 3, 0, -1, -2] },
  ];

  for (const preset of globalPresets) {
    await prisma.eQPreset.upsert({
      where: { id: preset.id },
      update: {
        name: preset.name,
        bands: preset.bands,
        isGlobal: true,
      },
      create: {
        id: preset.id,
        name: preset.name,
        bands: preset.bands,
        isGlobal: true,
        bassBoost: 0,
        virtualizer: 0,
        loudness: 0,
        reverbPreset: ReverbPreset.NONE,
        reverbAmount: 0,
      },
    });
  }

  console.log(`Created ${globalPresets.length} global EQ presets`);

  // Create demo admin user (password: Admin123!)
  const bcrypt = await import('bcrypt');
  const adminPassword = await bcrypt.hash('Admin123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@musicflow.app' },
    update: {},
    create: {
      email: 'admin@musicflow.app',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
      isPremium: true,
      preferences: {
        create: {},
      },
    },
  });

  console.log('Created admin user (admin@musicflow.app / Admin123!)');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
