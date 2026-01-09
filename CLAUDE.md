# ADT-SGTM

Cloud Run proxy for Server-side Google Tag Manager (sGTM).

## Architecture

```
Browser → Custom Domain → sgtm-proxy (Cloud Run) → server-side-tagging
```

## Stack

- **Runtime:** Bun + TypeScript
- **Infrastructure:** Terraform + Google Cloud
- **CI/CD:** Cloud Build (trigger on push to `master`)

## Project Structure

```
src/server.ts              # Proxy server
terraform/                 # Infrastructure as code
Dockerfile                 # Container build
cloudbuild.yaml            # CI/CD pipeline
```

## Proxy Rules

| Path            | Action |
|-----------------|--------|
| `/g/*`          | Proxy  |
| `/gtm.js`       | Proxy  |
| `/gtag/js`      | Proxy  |
| Everything else | 404    |

## Limits

- Request size: 2MB max (413)
- Upstream timeout: 10s (504)
- Upstream error: 502

## Commands

```bash
bun install                # Install deps
bun run dev                # Local dev (watch)
bun run typecheck          # Type check

cd terraform && terraform apply   # Deploy infra
```

## Guidelines

- Conventional Commits (`feat:`, `fix:`, `chore:`)
- No frameworks (Bun native only)
- Streaming (no buffering)
- JSON logs to stdout
