#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

console.log('🚀 [Orca Agent Quality Gate] Starting full verification...');

const run = (cmd, label) => {
  console.log(`\n⏳ Running ${label} (${cmd})...`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ ${label} PASSED.`);
  } catch (err) {
    console.error(`❌ ${label} FAILED.`);
    process.exit(1);
  }
};

// 1. Check PRD.md & DESIGN.md exist
console.log('\n📄 Checking Single Source of Truth files...');
if (!existsSync(resolve(process.cwd(), 'PRD.md')) || !existsSync(resolve(process.cwd(), 'DESIGN.md'))) {
  console.error('❌ PRD.md or DESIGN.md missing!');
  process.exit(1);
}
console.log('✅ PRD.md and DESIGN.md present.');

// 2. Unit tests
run('npm run test', 'Unit Tests (Vitest)');

// 3. Build verification
run('npm run build', 'Next.js Production Build');

console.log('\n🎉 [Orca Agent Quality Gate] All checks passed successfully! Project is High-End ready.\n');
