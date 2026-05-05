---
title: "CI/CD Pipeline"
description: "Automate 'merge → test → build → deploy' — a baseline of modern engineering."
icon: workflow
order: 1
chapter: automation
chapterTitle: "Automation & Delivery"
chapterOrder: 4
tags: [CI, CD, Automation]
---

<KeyIdea>
**In one line**: CI (continuous integration) = lint/test/build on every commit; CD (continuous delivery / deployment) = passed artifacts are auto- or semi-auto-shipped to environments. The core goal is **main branch is always releasable**.
</KeyIdea>

## What it is

```yaml
# .github/workflows/ci.yml (illustrative)
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

## Analogy

<Analogy>
Without CI/CD: **a fresh queue and manual signatures every release**.
With CI/CD: **an assembly line + QA stations** — every commit auto-tested; failed ones never enter the warehouse; passed ones **are packaged and shipped**.
</Analogy>

## Key concepts

<Terms items={[
  { term: "Trunk-based", en: "Trunk-based dev", def: "Short branches + frequent merges to main. Pair with feature flags." },
  { term: "Artifact", en: "Build artifact", def: "Image / tarball / wheel — **reproducible, traceable** to a commit." },
  { term: "Environments", en: "dev / staging / prod", def: "Auto-deploy each tier; the closer to prod, the stricter." },
  { term: "Canary / Blue-Green", en: "Canary / Blue-Green", def: "Validate the new version on a small slice of traffic before flipping all." },
  { term: "Rollback", en: "Rollback", def: "Image tag / Helm release / Argo Rollouts — **always have a one-click rollback**." },
  { term: "Cache", en: "Build cache", def: "Dependencies / image-layer cache — the key to fast CI." },
]} />

## A good pipeline

```mermaid
flowchart LR
    Dev[Developer commits] --> PR[PR + Lint/Test/Typecheck]
    PR -->|pass| Merge[Merge to main]
    Merge --> Build[Build image + push registry]
    Build --> Sign[Sign / SBOM]
    Sign --> Stg[Auto-deploy staging]
    Stg --> Smoke[Smoke / e2e tests]
    Smoke -->|manual or auto| Canary[Canary deploy 5%]
    Canary -->|healthy| Prod[Promote to 100%]
    Prod -->|failure| RB[One-click rollback]
```

## Practical notes

- **Fast > comprehensive**: slow CI → people skip / force-push. **< 10 min is the healthy line**.
- **Cache dependencies + image layers**: GitHub Actions / GitLab CI / BuildKit all support it.
- **Test pyramid**: unit (many) → integration (some) → e2e (few). e2e is slow — **run on staging only**.
- **Never ssh from CI to type commands** — use Ansible / Argo CD / Kustomize / Helm — reproducible flows.
- **Secrets**: CI's built-in secrets store (never echo); use Vault / cloud KMS in production.
- **Quality gates**: coverage, vulnerability scans (Trivy / Grype), license checks — block merges that fail.
- **PR preview environments**: each PR gets an isolated environment (Vercel / Cloudflare Pages / Helm preview).
- **Sign and trace**: sign images with cosign + generate SBOM — **friendly for compliance**.

## Three CD cadences

<Compare
  leftTitle="Continuous Deployment"
  rightTitle="Continuous Delivery"
  left={<>
    Tests pass → **straight to prod**.<br />
    Requires strong tests + canary + monitoring.
  </>}
  right={<>
    Tests pass → staging; **human clicks** to promote.<br />
    Keeps a human in the loop.
  </>}
/>

## Further reading

- [Infrastructure as Code](/ops/advanced/iac)
- [GitHub Actions](/ops/ecosystem/github-actions)
- [Argo CD](/ops/ecosystem/argocd)
