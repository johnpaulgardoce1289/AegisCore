import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'johnpaulgardoce7@gmail.com';

    // Try to find the user
    let user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        // Attempt to create user if they haven't logged in yet
        user = await prisma.user.create({
            data: {
                email,
                name: 'Creator',
                role: 'PRO',
            },
        });
        console.log(`Created new PRO user: ${email}`);
    } else {
        // Update existing user
        user = await prisma.user.update({
            where: { email },
            data: {
                role: 'PRO',
            },
        });
        console.log(`Updated existing user to PRO: ${email}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
