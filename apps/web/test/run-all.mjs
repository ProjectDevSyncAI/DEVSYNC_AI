import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = fs.readdirSync(__dirname)
  .filter(f => f.endsWith('.spec.ts'))
  .map(f => path.join(__dirname, f));

console.log(`Discovered ${files.length} test suites in ${__dirname}`);

const testStream = run({ files });
testStream.compose(new spec()).pipe(process.stdout);

testStream.on('test:fail', () => {
  process.exitCode = 1;
});
