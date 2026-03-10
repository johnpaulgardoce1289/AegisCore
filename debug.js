const { execSync } = require('child_process');
try {
    execSync('npx prisma validate', { stdio: 'pipe' });
} catch (e) {
    const fs = require('fs');
    fs.writeFileSync('error_full.txt', e.message + '\n\nSTDOUT:\n' + e.stdout.toString() + '\n\nSTDERR:\n' + e.stderr.toString());
}
