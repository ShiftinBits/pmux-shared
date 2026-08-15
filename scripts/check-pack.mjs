// Publish guard: fail if the npm tarball would ship anything beyond dist/ and
// the standard metadata files. Keeps dev-only tooling (vite/vitest/tsx/postcss/
// esbuild and their CVEs) out of what consumers install.
// ponytail: allowlist check; `files: ["dist"]` in package.json is the real
// enforcement — this just proves it stays true at publish time.
import { execFileSync } from 'node:child_process';

const ALLOWED_ROOTS = ['dist/'];
const ALLOWED_FILES = ['package.json', 'README.md', 'LICENSE'];

const out = execFileSync('npm', ['pack', '--dry-run', '--json'], { encoding: 'utf8' });
const files = JSON.parse(out)[0].files.map((f) => f.path);

const leaked = files.filter(
  (p) => !ALLOWED_FILES.includes(p) && !ALLOWED_ROOTS.some((r) => p.startsWith(r)),
);

if (leaked.length > 0) {
  console.error('publish blocked — unexpected files in tarball:\n  ' + leaked.join('\n  '));
  process.exit(1);
}
console.log(`pack guard ok — ${files.length} files, all within dist/ + metadata`);
