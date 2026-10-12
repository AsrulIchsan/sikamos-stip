const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

function updateProvider(targetProvider) {
  let schema = fs.readFileSync(schemaPath, 'utf8');
  schema = schema.replace(
    /datasource\s+db\s*\{[\s\S]*?provider\s*=\s*"[^"]*"[\s\S]*?\}/,
    `datasource db {\n  provider = "${targetProvider}"\n  url      = env("DATABASE_URL")\n}`
  );
  fs.writeFileSync(schemaPath, schema, 'utf8');
  console.log(`✓ [Prisma Config] Provider skema database diset ke: "${targetProvider}"`);
}

const arg = process.argv[2];
if (arg === 'postgres' || arg === 'postgresql') {
  updateProvider('postgresql');
  process.exit(0);
} else if (arg === 'sqlite') {
  updateProvider('sqlite');
  process.exit(0);
}

// Auto-detection based on environment variable DATABASE_URL
const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

if (isPostgres) {
  console.log('⚡ [Prisma Auto-Detect] Terdeteksi DATABASE_URL PostgreSQL (Cloud/Vercel/Neon/Supabase).');
  updateProvider('postgresql');
} else {
  console.log('⚡ [Prisma Auto-Detect] Menggunakan konfigurasi database saat ini.');
}

