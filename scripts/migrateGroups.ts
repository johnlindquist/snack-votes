/**
 * Migrate existing pairs => single default group per poll
 */

import { PrismaClient } from '@prisma/client';

// Create a new PrismaClient instance for this script
const prisma = new PrismaClient();

async function migrateGroups() {
  try {
    console.log('Starting migration of pairs to groups...');

    // 1. Get all polls
    const polls = await prisma.poll.findMany({
      include: {
        pairs: true,
      },
    });

    console.log(`Found ${polls.length} polls to process`);

    for (const poll of polls) {
      console.log(
        `Processing poll ID ${poll.id}: "${poll.title}" with ${poll.pairs.length} pairs`,
      );

      // 2. Create a "default" group for each poll
      const defaultGroup = await prisma.group.create({
        data: {
          title: 'Default Group',
          pollId: poll.id,
        },
      });

      console.log(
        `Created default group ID ${defaultGroup.id} for poll ID ${poll.id}`,
      );

      // 3. Update each pair to reference the new group
      if (poll.pairs.length > 0) {
        const updateResults = await prisma.$transaction(
          poll.pairs.map((pair) =>
            prisma.pair.update({
              where: { id: pair.id },
              data: { groupId: defaultGroup.id },
            }),
          ),
        );

        console.log(
          `Updated ${updateResults.length} pairs to reference group ID ${defaultGroup.id}`,
        );
      }
    }

    console.log(
      'Migration complete! All existing pairs have been moved into default groups.',
    );
  } catch (error) {
    console.error('Error migrating pairs to groups:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateGroups()
  .then(() => console.log('Migration script completed'))
  .catch((e) => console.error('Migration script failed:', e));
