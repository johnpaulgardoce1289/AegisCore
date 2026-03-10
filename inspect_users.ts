
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        include: {
            accounts: true
        }
    })
    console.log('--- USERS ---')
    users.forEach(u => {
        console.log(`Email: ${u.email}, Role: ${u.role}, Providers: ${u.accounts.map(a => a.provider).join(', ') || 'None (Credentials/OTP)'}`)
    })
}

main().catch(console.error).finally(() => prisma.$disconnect())
