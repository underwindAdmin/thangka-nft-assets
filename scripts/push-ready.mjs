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

if (!existsSync(meta)) {
  console.error(`缺少 metadata，无法 push：\n  ${meta}`);
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

// metadata_json 模式：image 可以是商品图外部 URL，此时没有本地 images/{tokenId}.jpg。
// 本地图存在则 metadata+图一起提交；不存在则只提交 metadata（image 字段必须已通过校验）。
const hasLocalImage = existsSync(img);
const add = hasLocalImage
  ? ['add', `metadata/${tokenId}.json`, `images/${tokenId}.jpg`]
  : ['add', `metadata/${tokenId}.json`];
const commit = [
  'commit',
  '-m',
  hasLocalImage
    ? `Add metadata and image for token ${tokenId}`
    : `Add metadata for token ${tokenId}`,
];
const push = ['push', 'origin', 'main'];

console.log(`✅ 文件就绪: #${tokenId}`);
console.log(`   ${meta}`);
if (hasLocalImage) console.log(`   ${img}`);
else console.log(`   image=${parsed.image}（外部 URL，无本地图）`);
console.log('');
console.log('执行以下命令推送（本脚本不持有 GitHub 凭据）：');
console.log(`  cd ${ROOT}`);
console.log(`  git ${add.join(' ')}`);
console.log(`  git ${commit.join(' ')}`);
console.log(`  git ${push.join(' ')}`);

function run(args) {
  execFileSync('git', args, { cwd: ROOT, stdio: 'inherit' });
}

function tryRun(args) {
  try {
    run(args);
    return true;
  } catch {
    return false;
  }
}

if (process.argv.includes('--yes')) {
  console.log('\n[--yes] 执行 git add/commit/push（幂等：已提交则只 push）...');
  run(add);
  // 幂等关键：暂存区无变更（文件已 commit 过）时跳过 commit，否则 git commit 非零退出
  const hasStaged = !tryRun(['diff', '--cached', '--quiet']);
  if (hasStaged) {
    run(commit);
    console.log(`[--yes] 已提交: ${commit[2]}`);
  } else {
    console.log('[--yes] 无新变更，跳过 commit（此前已提交）');
  }
  if (!tryRun(push)) {
    // 兜底：远端有新提交导致 non-fast-forward → rebase 后重试一次
    console.log('[--yes] push 被拒，pull --rebase 后重试 ...');
    run(['pull', '--rebase', 'origin', 'main']);
    run(push);
  }
  console.log('✅ 已推送');
}
