---
title: "Server & Container Hardening"
description: "Turn defaults into 'survives a hostile environment' — simple but unskippable basics."
icon: shield-alert
order: 3
chapter: reliability
chapterTitle: "Reliability & Security"
chapterOrder: 5
tags: [Security, Hardening, Containers]
---

<KeyIdea>
**In one line**: 80 % of breaches come from **default configs + weak passwords + missing patches**. This is the **minimum security checklist** for every production server and container — not advanced offensive/defensive work; just **don't fail at easy stuff**.
</KeyIdea>

## Server minimum checklist

<Steps>
  <Step title="SSH pubkey-only">Disable PasswordAuthentication, ban root login, change port if you wish.</Step>
  <Step title="Auto security updates">unattended-upgrades / dnf-automatic — at least security patches.</Step>
  <Step title="Minimal firewall">Default-deny inbound; allow only what's needed (22 / 80 / 443). ufw / nftables / cloud SG.</Step>
  <Step title="fail2ban">Ban brute-force IPs (SSH / nginx).</Step>
  <Step title="Dedicated service users">No root for services; add systemd sandbox fields.</Step>
  <Step title="Centralized logs + alerts">Even if the host is tampered, external evidence remains.</Step>
  <Step title="Backups + drills">See the previous article.</Step>
</Steps>

## Container minimum checklist

```dockerfile
# Dockerfile
USER 1000
COPY --chown=1000:1000 app /app
```

```yaml
# K8s securityContext
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
  seccompProfile: { type: RuntimeDefault }
```

Pair with:

- **Image scanning** (Trivy / Grype): CI blocks high-severity CVEs.
- **Signing + SBOM** (cosign + syft): reject untrusted images.
- **NetworkPolicy**: default deny-all, allowlist explicitly.
- **Resource limits**: CPU/Mem/PID caps so one Pod can't take the node down.
- **PSA / Kyverno / OPA Gatekeeper** (PSP replacements): policy enforcement.

## Analogy

<Analogy>
A default server install is **a new house with no locks and no security** — burglars are the default outcome. This checklist is **a lock + camera + gas alarm + fire extinguisher**.
</Analogy>

## Key concepts

<Terms items={[
  { term: "Least privilege", en: "Least Privilege", def: "Processes / users / IAM roles get exactly what they need — nothing more." },
  { term: "Defense in depth", en: "Defense in Depth", def: "Network + host + app + monitoring layers — **no single failure is fatal**." },
  { term: "Zero Trust", en: "Zero Trust", def: "Don't trust the internal network. Verify identity + policy on every access." },
  { term: "Secrets hygiene", en: "Secrets Hygiene", def: "No hardcoding, regular rotation, short-lived credentials." },
  { term: "WAF", en: "Web Application Firewall", def: "Cloudflare / nginx + ModSecurity — blocks SQL injection / XSS." },
]} />

## Practical notes

- **Never expose DB / Redis to the public internet** — private subnet + SG + strong passwords.
- **Disable password login** > strong password — weak-password dictionaries are attack #1.
- **Inside containers**: read-only root filesystem + non-root user + minimal capabilities.
- **K8s**: enable audit log — sensitive operations (exec / port-forward) have a paper trail.
- **Don't put secrets in git** — CI uses env vars; runtime uses Vault / SOPS / cloud KMS / external-secrets.
- **Dependency manifest + auto-scan**: dependabot / renovate + trivy image scan.
- **Drills**: simulate "this host is compromised" periodically — verify IAM / firewall / app layers detect and contain in time.
- **Retain logs 90+ days** — for forensic analysis.

## Common mistakes

- **`chmod 777`** to solve problems — equivalent to removing the lock.
- **`sudo NOPASSWD ALL` in production** — one phished engineer = whole cluster compromised.
- **Service binds 0.0.0.0 but no firewall** — add the firewall or bind 127.0.0.1 + reverse proxy.
- **Mounting Docker socket into a container** — escape = host root.
- **Default ServiceAccount auto-mounted in K8s** — set `automountServiceAccountToken: false`.
- **CI runner executes public PR code** — code injection grabs internal secrets.

## Easy confusions

<Compare
  leftTitle="Availability"
  rightTitle="Security"
  left={<>
    Whether the service runs well.<br />
    Measured by SLA / SLO.
  </>}
  right={<>
    Whether **adversaries** can break it.<br />
    Few observable metrics — relies on **process + drills**.
  </>}
/>

## Further reading

- [SSH & keys](/ops/beginner/ssh)
- [Backup & restore](/ops/advanced/backup-restore)
- [Docker basics](/ops/advanced/docker)
