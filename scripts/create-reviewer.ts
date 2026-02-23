import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// Manually load .env if it exists
try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
        const env = fs.readFileSync(envPath, "utf-8");
        env.split("\n").forEach((line) => {
            const parts = line.split("=");
            if (parts.length === 2) {
                process.env[parts[0].trim()] = parts[1].trim();
            }
        });
    }
} catch (e) {
    console.warn("Could not load .env file manually:", e);
}

const prisma = new PrismaClient();

async function main() {
    const email = "review@gpsonwaves.com";
    const password = "Review123!";
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            isPro: true,
            emailVerified: new Date(),
        },
        create: {
            email,
            password: hashedPassword,
            isPro: true,
            emailVerified: new Date(),
        },
    });

    console.log(`User ${user.email} created/updated successfully with Pro status.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
