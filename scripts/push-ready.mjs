// 校验某个 token 的 metadata + 图是否就绪，并打印 git 推送命令。
// 用法：node scripts/push-ready.mjs <tokenId> [--yes]
//   --yes  直接执行 git add/commit/push（依赖本机已有 git 凭据；脚本本身不持有任何凭据）
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tokenId = process.argv[2];
if (!tokenId) {
  console.error('用法: node scripts/push-ready.mjs <tokenId> [--yes]');
  process.exit(1);
}

const meta = join(ROOT, 'metadata', `${tokenId}.json`);
const img = join(ROOT, 'images', `${tokenId}.jpg`);

const missing = [meta, img].filter((file) => !existsSync(file));
if (missing.length > 0) {
  console.error(`缺少文件，无法 push：\n${missing.map((f) => `  ${f}`).join('\n')}`);
  process.exit(1);
}

// 校验 JSON 合法 + 必填字段
let parsed;
try {
  parsed = JSON.parse(readFileSync(meta, 'utf8'));
} catch (e) {
  console.error(`metadata JSON 解析失败: ${e.message}`);
  process.exit(1);
}
for (const key of ['name', 'image']) {
  if (!parsed[key]) {
    console.error(`metadata 缺少字段: ${key}`);
    process.exit(1);
  }
}

const add = ['add', `metadata/${tokenId}.json`, `images/${tokenId}.jpg`];
const commit = ['commit', '-m', `Add metadata and image for token ${tokenId}`];
const push = ['push', 'origin', 'main'];

console.log(`✅ 文件就绪: #${tokenId}`);
console.log(`   ${meta}`);
console.log(`   ${img}`);
console.log('');
console.log('执行以下命令推送（本脚本不持有 GitHub 凭据）：');
console.log(`  cd ${ROOT}`);
console.log(`  git ${add.join(' ')}`);
console.log(`  git ${commit.join(' ')}`);
console.log(`  git ${push.join(' ')}`);

if (process.argv.includes('--yes')) {
  console.log('\n[--yes] 直接执行 git add/commit/push ...');
  execFileSync('git', add, { cwd: ROOT, stdio: 'inherit' });
  execFileSync('git', commit, { cwd: ROOT, stdio: 'inherit' });
  execFileSync('git', push, { cwd: ROOT, stdio: 'inherit' });
  console.log('✅ 已推送');
}
