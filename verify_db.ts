
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        await prisma.$connect()
        console.log('Successfully connected to database')
        const users = await prisma.user.count()
        console.log('User count:', users)
    } catch (e) {
        console.error('Database connection failed:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
