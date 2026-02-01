#!/usr/bin/env bun
/**
 * PardusBot CLI Entry Point
 *
 * This is the main entry point for the npm package.
 * Users can run: npx pardusbot
 *
 * Requires Bun runtime: https://bun.sh
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🦅 PardusBot v1.0.0');
console.log('');
console.log('📋 Enhanced API: http://localhost:13337');
console.log('🌐 React Web UI: http://localhost:13338');
console.log('');
console.log('Press Ctrl+C to stop');
console.log('');

// Get the installation directory (where npm installed the package)
const installDir = __dirname;

// Spawn the server process
const serverPath = join(installDir, 'server.ts');

const server = spawn('bun', ['run', serverPath], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n\n🦅 Shutting down PardusBot...');
  server.kill('SIGTERM');
  process.exit(0);
});

// Handle child process exit
server.on('exit', (code) => {
  process.exit(code || 0);
});
