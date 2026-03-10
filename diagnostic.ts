
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- SYSTEM DIAGNOSTIC ---')

    // 1. Check Database Users
    try {
        const users = await prisma.user.findMany({
            include: { accounts: true }
        })
        console.log(`Database: Connected. Total Users: ${users.length}`)
        users.forEach(u => {
            console.log(`- User: ${u.email} | Role: ${u.role} | ID: ${u.id} | Providers: ${u.accounts.map(a => a.provider).join(', ') || 'OTP'}`)
        })
    } catch (e) {
        console.error('Database Error:', e)
    }

    // 2. Check for "Ghost" Conversations (IDs that don't match users)
    try {
        const orphans = await prisma.conversation.findMany({
            where: {
                NOT: {
                    user: { id: { not: '' } }
                }
            }
        })
        if (orphans.length > 0) {
            console.log(`Warning: Found ${orphans.length} orphan conversations.`)
        } else {
            console.log('Integrity: No orphan conversations found.')
        }
    } catch (e) {
        console.log('Integrity Check Error:', e)
    }
}

main().catch(console.error).finally(() => prisma.$disconnect())
