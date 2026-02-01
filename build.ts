#!/usr/bin/env bun
/**
 * Build script for npm publishing
 * Prepares the package for distribution by copying source files
 * Bun will transpile TypeScript at runtime
 */

import { mkdir, copyFile } from 'fs/promises';
import { existsSync, copyFileSync, readdirSync, mkdirSync } from 'fs';
import { spawnSync } from 'child_process';
import { join } from 'path';

console.log('🔨 Building PardusBot for npm publishing...');

// Ensure dist directory exists
if (!existsSync('dist')) {
  await mkdir('dist', { recursive: true });
}

// Copy source files to dist (TypeScript files will be transpiled at runtime by Bun)
console.log('📦 Copying source files...');

const filesToCopy = [
  'cli.ts',
  'server.ts',
  'api-enhanced.ts',
  'web-react-server.ts',
  'index.ts',
];

const dirsToCopy = [
  'db',
  'agent',
  'config',
  'memory',
  'prompt',
  'ui',
  'web-react/dist',
];

async function copyDir(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// Copy individual files
for (const file of filesToCopy) {
  if (existsSync(file)) {
    copyFileSync(file, join('dist', file));
    console.log(`  ✓ ${file}`);
  }
}

// Copy directories
for (const dir of dirsToCopy) {
  if (existsSync(dir)) {
    await copyDir(dir, join('dist', dir));
    console.log(`  ✓ ${dir}/`);
  }
}

console.log('🌐 Building React web UI...');
const reactBuild = spawnSync('bun', ['run', 'build:web'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

if (reactBuild.status !== 0) {
  console.error('❌ Failed to build React UI');
  process.exit(1);
}

// Create JavaScript wrapper for npm bin entry point
console.log('📝 Creating JavaScript wrapper for npm...');
const cliWrapper = `#!/usr/bin/env node
/**
 * PardusBot CLI Entry Point (JavaScript wrapper)
 * This file is required by npm as it doesn't accept .ts files in bin field
 */

const { spawn } = require('child_process');
const { join, dirname } = require('path');
const { fileURLToPath } = require('url');

const filename = fileURLToPath(require('url').pathToFileURL(__filename));
const directory = dirname(filename);

console.log('🦅 PardusBot v1.0.0');
console.log('');
console.log('📋 Enhanced API: http://localhost:13337');
console.log('🌐 React Web UI: http://localhost:13338');
console.log('');
console.log('Press Ctrl+C to stop');
console.log('');

// Get the installation directory
const installDir = directory;

// Spawn the server process
const serverPath = join(installDir, 'cli.ts');

const server = spawn('bun', ['run', serverPath], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\\n\\n🦅 Shutting down PardusBot...');
  server.kill('SIGTERM');
  process.exit(0);
});

// Handle child process exit
server.on('exit', (code) => {
  process.exit(code || 0);
});
`;

const { writeFileSync } = await import('fs');
writeFileSync(join('dist', 'cli.cjs'), cliWrapper, { mode: 0o755 });
console.log('  ✓ cli.cjs (wrapper for npm bin)');

console.log('✅ Build complete!');
console.log('');
console.log('📦 Package ready for distribution!');
console.log('');
console.log('Next steps:');
console.log('  1. Test locally: npm link');
console.log('  2. Check contents: npm publish --dry-run');
console.log('  3. Publish: npm publish');
console.log('  4. Test after publish: npx pardusbot');
