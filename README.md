# Thangka NFT Assets

唐卡 NFT 的链上元数据与主图托管仓库。

- `metadata/` — 每个 tokenId 的 `tokenURI` 目标（`10000.json`、`10001.json`…）
- `images/` — NFT 主图（`10000.jpg`、`10001.jpg`…）

## 命名与 baseURI 约定

合约 `ThangkaNFT.setBaseURI(BaseUrl)` 设定后，`tokenURI(tokenId)` 返回：

```
{BaseUrl}/metadata/{tokenId}.json
```

元数据内的 `image` 字段指向同一 Pages 站点的 `/images/{tokenId}.jpg`。

## 生成与发布

- 新增 token：运行 `scripts/gen-metadata.mjs`（需 Node + sharp），按 tokenId 生成 metadata + 压缩图。
- 发布：`git add .` → `git commit` → `git push`；仓库公开且开启 GitHub Pages（默认分支根目录）后即可用。

## 注意

- 仓库必须保持 public，否则链上 `tokenURI` 全部 404。
- 上线主网建议迁 IPFS（`setBaseURI("ipfs://<cid>/")`）消除单点 host 依赖。
