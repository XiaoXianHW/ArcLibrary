---
title: "CI/CD 流水线"
description: "把「代码合入 → 测试 → 构建 → 部署」做成自动化流水 —— 现代研发的标配。"
icon: workflow
order: 1
chapter: automation
chapterTitle: "自动化与交付"
chapterOrder: 4
tags: [CI, CD, 自动化]
---

<KeyIdea>
**一句话**：CI（持续集成）= 提交即跑 lint/test/build；CD（持续交付 / 部署）= 通过的产物自动 / 半自动**送达环境**。**主分支永远可发布**是核心目标。
</KeyIdea>

## 是什么

```yaml
# .github/workflows/ci.yml （示意）
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test --coverage
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: ghcr.io/me/web:${{ github.sha }}
```

## 打个比方

<Analogy>
没有 CI/CD = **每次发版都临时排个队，手工签字盖章**。  
有 CI/CD = **流水线** + **质检站**：每次提交都自动过质检，过不了的不让进仓库；通过的**直接打包送站**。
</Analogy>

## 关键概念

<Terms items={[
  { term: "Trunk-based", en: "主干开发", def: "短分支 + 频繁合 main。配合 feature flag。" },
  { term: "构建产物", en: "Artifact", def: "镜像 / tarball / wheel —— **可重现、可追溯**到某次提交。" },
  { term: "环境分层", en: "dev / staging / prod", def: "每层都自动部署，越靠近 prod 越严格。" },
  { term: "Canary / Blue-Green", en: "金丝雀 / 蓝绿", def: "新版本先放小流量验证，再全量切。" },
  { term: "回滚", en: "Rollback", def: "镜像 tag / Helm release / Argo Rollouts —— **永远要有一键回退**。" },
  { term: "Cache", en: "构建缓存", def: "依赖 / 镜像层缓存，CI 速度的关键。" },
]} />

## 一条理想流水

```mermaid
flowchart LR
    Dev[开发提交] --> PR[PR + Lint/Test/Typecheck]
    PR -->|通过| Merge[合入 main]
    Merge --> Build[镜像构建 + 推 registry]
    Build --> Sign[签名 / SBOM]
    Sign --> Stg[Staging 自动部署]
    Stg --> Smoke[Smoke 测试 / e2e]
    Smoke -->|手动 / 自动| Canary[Canary 部署 5%]
    Canary -->|健康| Prod[全量 prod]
    Prod -->|失败| RB[一键回滚]
```

## 实操要点

- **快比全更重要**：CI 慢 → 大家不愿等 → 跳过 / 强 push。**< 10 min 是健康线**。
- **缓存依赖 + 镜像层**：GitHub Actions / GitLab CI / BuildKit 都支持。
- **测试金字塔**：单元（多）→ 集成（中）→ e2e（少）。e2e 慢，**只在 staging 跑**。
- **不要在 CI 里 ssh 到服务器手敲命令**：用 Ansible / Argo CD / Kustomize / Helm 等可重现方式。
- **Secrets**：用 CI 内置 secrets store（never echo），生产用 Vault / cloud KMS。
- **质量门**：覆盖率、漏洞扫描（Trivy / Grype）、license 检查 —— 不达标拒绝合入。
- **PR 预览环境**：每个 PR 自动起一个隔离环境（Vercel / Cloudflare Pages / Helm preview）。
- **签名与可追溯**：cosign 给镜像签名 + 生成 SBOM，**安全合规友好**。

## CD 三种节奏

<Compare
  leftTitle="持续部署 (Continuous Deployment)"
  rightTitle="持续交付 (Continuous Delivery)"
  left={<>
    通过测试**直接到生产**。<br />
    需强 Test + Canary + 监控。
  </>}
  right={<>
    通过测试到 staging，**人工点按钮**到生产。<br />
    保留人在回路。
  </>}
/>

## 延伸阅读

- [基础设施即代码](/ops/advanced/iac)
- [GitHub Actions](/ops/ecosystem/github-actions)
- [Argo CD](/ops/ecosystem/argocd)
