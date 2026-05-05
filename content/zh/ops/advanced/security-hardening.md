---
title: "服务器与容器安全加固"
description: "把默认配置变成「敌意环境下也不容易出事」 —— 简单但不可省略的几件事。"
icon: shield-alert
order: 3
chapter: reliability
chapterTitle: "可靠性与安全"
chapterOrder: 5
tags: [安全, 加固, 容器]
---

<KeyIdea>
**一句话**：80% 的入侵都是**默认配置 + 弱口令 + 不打补丁**导致的。这篇列出每一台生产服务器和容器的**最低安全清单** —— 不解决高级攻防，**只是让你不在低级问题上失分**。
</KeyIdea>

## 服务器最低清单

<Steps>
  <Step title="SSH 公钥登录">关掉 PasswordAuthentication，禁 root 登录，端口可改。</Step>
  <Step title="自动安全更新">unattended-upgrades / dnf-automatic 至少打安全补丁。</Step>
  <Step title="最小防火墙">默认拒绝入站，只开 22 / 80 / 443 等必需。ufw / nftables / 安全组。</Step>
  <Step title="fail2ban">封禁暴破 IP（SSH / nginx）。</Step>
  <Step title="服务用专属用户">不用 root 跑服务；systemd 加沙箱字段。</Step>
  <Step title="日志中心化 + 监控告警">本机被改也能有外部痕迹。</Step>
  <Step title="备份 + 演练">见上一篇。</Step>
</Steps>

## 容器最低清单

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

并搭配：

- **镜像扫描**（Trivy / Grype）：CI 阻断高危 CVE。
- **签名 + SBOM**（cosign + syft）：拒绝来历不明镜像。
- **NetworkPolicy**：默认 deny all，逐步放行。
- **资源限制**：CPU/Mem/PID 限额，避免单 Pod 撑爆。
- **PSP 替代品 PSA / Kyverno / OPA Gatekeeper**：策略校验。

## 打个比方

<Analogy>
默认装一台服务器像**新房没装锁也没安保**：第二天小偷上门是默认结果。这份清单就是**装个锁 + 摄像头 + 燃气报警 + 灭火器**。
</Analogy>

## 关键概念

<Terms items={[
  { term: "最小权限", en: "Least Privilege", def: "进程 / 用户 / IAM 角色都给到刚好够用。" },
  { term: "纵深防御", en: "Defense in Depth", def: "网络 + 主机 + 应用 + 监控多层，**任一层失守不致命**。" },
  { term: "Zero Trust", en: "零信任", def: "不信任内网。每次访问验证身份与策略。" },
  { term: "Secrets Hygiene", en: "机密管理", def: "禁止硬编码、定期轮换、密钥短期化。" },
  { term: "WAF", en: "Web 应用防火墙", def: "Cloudflare / nginx + ModSecurity，挡 SQL 注入 / XSS。" },
]} />

## 实操要点

- **永远不要把数据库 / Redis 直接暴露公网**：私网 + 安全组 + 强密码。
- **禁用密码登录** > 强密码：弱密码字典是大盘攻防 #1。
- **容器内**：只读根文件系统 + 非 root 用户 + 最小 capability。
- **K8s**：开启 audit log，敏感操作（exec / port-forward）有迹可循。
- **Secrets 别进 git**：CI 用环境变量；运行时用 Vault / SOPS / cloud KMS / external-secrets。
- **依赖清单 + 自动扫描**：dependabot / renovate + trivy 镜像扫描。
- **演练**：定期模拟「某台机器被入侵」，看是否能从 IAM / 防火墙 / 应用层及时发现并止损。
- **日志保留 90 天 +**：事后取证用。

## 常见错误

- **`chmod 777`** 解决问题 —— 等于把锁拆了。
- **生产开 sudo NOPASSWD ALL** —— 一个被 phishing 的工程师等于整个集群。
- **服务监听 0.0.0.0 但没防火墙**：加防火墙或绑 127.0.0.1 + 反代。
- **Docker socket 挂进容器** —— 容器逃逸 = 宿主 root。
- **K8s 默认 ServiceAccount 自动挂载** —— 配 `automountServiceAccountToken: false`。
- **CI runner 跑公网 PR 代码** —— 代码注入即拿到内部密钥。

## 易混点

<Compare
  leftTitle="可用性"
  rightTitle="安全"
  left={<>
    服务跑得好不好。<br />
    SLA / SLO 衡量。
  </>}
  right={<>
    服务**被坏人**搞不出事。<br />
    可观测的安全指标少，**靠流程 + 演练**。
  </>}
/>

## 延伸阅读

- [SSH 与密钥](/ops/beginner/ssh)
- [备份与恢复](/ops/advanced/backup-restore)
- [Docker 容器入门](/ops/advanced/docker)
