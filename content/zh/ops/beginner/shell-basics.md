---
title: "Shell 脚本与排错"
description: "shebang、变量、循环、错误处理 —— 写一个不会坑自己的 bash 脚本。"
icon: file-code
order: 1
chapter: shell
chapterTitle: "Shell 与排查"
chapterOrder: 2
tags: [Shell, bash, 脚本]
---

<KeyIdea>
**一句话**：bash 脚本写起来快、坑也多。**`set -euo pipefail`** + 引号习惯 + shellcheck 三件套，能避掉 90% 的隐藏 bug。
</KeyIdea>

## 是什么

最小可用脚本：

```bash
#!/usr/bin/env bash
set -euo pipefail

NAME="${1:-world}"
echo "Hello, $NAME"

for f in *.log; do
  echo "处理 $f"
  gzip "$f"
done
```

`#!/usr/bin/env bash` 比 `#!/bin/bash` 兼容性更好（用 PATH 找）。

## 打个比方

<Analogy>
bash 像**胶水语言**：把各种小工具粘在一起。**别用它写复杂逻辑** —— 上 100 行就该考虑 Python / Go。
</Analogy>

## 关键概念

<Terms items={[
  { term: "shebang", en: "#!", def: "脚本第一行告诉内核用什么解释器。" },
  { term: "set -e", en: "errexit", def: "一旦某条命令返回非 0 就立刻退出。" },
  { term: "set -u", en: "nounset", def: "用未定义变量直接报错（避免 rm -rf $UNDEFINED/）。" },
  { term: "set -o pipefail", en: "pipefail", def: "管道任意一段失败整条都失败（默认只看最后一段）。" },
  { term: "trap", en: "信号 / 退出钩子", def: "trap cleanup EXIT —— 脚本退出前清临时文件。" },
  { term: "$1 / $@ / $#", en: "位置参数", def: "$1 第一个参数；$@ 全部；$# 个数。" },
  { term: "$(cmd)", en: "命令替换", def: "把 cmd 输出嵌进字符串（比反引号清晰）。" },
]} />

## 常用模板

```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

log() { echo "[$(date +%T)] $*" >&2; }

cleanup() {
  rm -f "$tmp"
}
trap cleanup EXIT

tmp=$(mktemp)
log "开始"

# 防止变量为空时炸：
: "${API_KEY:?需要 API_KEY}"

# 安全引号：路径含空格也不会炸
for f in "$dir"/*.log; do
  [[ -e "$f" ]] || continue
  gzip "$f"
done

log "完成"
```

## 调试套路

```mermaid
flowchart LR
    Bug[脚本异常] --> SC[shellcheck script.sh<br/>静态查错]
    SC --> X["bash -x script.sh<br/>逐行打印执行"]
    X --> Set[在脚本里 set -x 局部段]
    Set --> Trap[trap 'echo line $LINENO' ERR]
```

`shellcheck` 是必装：能查出未引号、误用 `==`、`[ ]` vs `[[ ]]` 之类一堆坑。

## 实操要点

- **永远引号包变量**：`"$var"` —— 含空格 / 通配符的字符串不会变成多个参数。
- **`[[ ]]` 优于 `[ ]`**：现代 bash 测试条件，**不需要引号**也安全。
- **善用 `${var:-default}` / `${var:?msg}`**：参数兜底 / 必填校验。
- **不要用 ls 解析文件名**：用 `for f in *` 或 `find ... -print0 | xargs -0`。
- **错误别忽略**：`cmd || die "msg"`、`if ! cmd; then ... fi`。
- **临时文件用 mktemp**：避免 race condition 和 shared /tmp 冲突。
- **复杂逻辑请改 Python**：bash > 100 行通常意味着选错语言。

## 易混点

<Compare
  leftTitle="bash 脚本"
  rightTitle="ad-hoc 命令"
  left={<>
    放到文件、加 shebang、`set -euo pipefail`。<br />
    适合复用、CI 中跑。
  </>}
  right={<>
    一次性命令链，`cmd1 | cmd2 | cmd3`。<br />
    临时排查可以，**不要复制粘贴当生产脚本**。
  </>}
/>

## 延伸阅读

- [Linux 速通](/ops/beginner/linux-quickstart)
- [进程与信号](/ops/beginner/process-signal)
- [日志系统](/ops/beginner/log-system)
