<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Deployment-Critical Git Identity

This repository deploys through GitHub/Vercel. Before making any commit or push, every agent must verify and use this Git identity:

```bash
git config user.name "Vijendrapratap"
git config user.email "44225657+Vijendrapratap@users.noreply.github.com"
```

Do not commit as `mrpratap`, `AI Bot`, `bot@example.com`, `pratap@example.com`, or any generic agent identity. If a commit is accidentally created with the wrong author before pushing, amend it with the correct identity before push.
