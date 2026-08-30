// 新 token 一键补元数据 + 压缩图。用法：node scripts/gen-metadata.mjs <tokenId> <category> <源图路径> <名称>
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const [, , tokenId, category, src, name] = process.argv;
if (!tokenId || !category || !src || !name) {
  console.error('用法: node scripts/gen-metadata.mjs <tokenId> <category> <源图路径> <名称>');
  process.exit(1);
}

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const BASE = 'https://underwindAdmin.github.io/thangka-nft-assets';

const imgOut = path.join(ROOT, 'images', `${tokenId}.jpg`);
await sharp(src).resize({ width: 1024, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(imgOut);

const meta = {
  name: `Thangka #${tokenId} — ${name}`,
  description: `唐卡数字藏品 #${tokenId} · ${category}`,
  image: `${BASE}/images/${tokenId}.jpg`,
  external_url: 'https://thangkaart.cn/',
  attributes: [
    { trait_type: 'Collection', value: 'Thangka' },
    { trait_type: 'Category', value: category },
    { trait_type: 'Edition', value: 'Genesis' },
  ],
};
fs.writeFileSync(path.join(ROOT, 'metadata', `${tokenId}.json`), JSON.stringify(meta, null, 2));
console.log(`生成 #${tokenId} 完成`);
