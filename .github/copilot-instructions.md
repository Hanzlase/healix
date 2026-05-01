<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Healix (Phase 1) workspace instructions

- Tech stack: Next.js App Router + TypeScript + Tailwind (light theme only) + Prisma(Postgres) + NextAuth + Octokit + Gemini.
- Keep architecture modular: `src/lib/*` for utilities/clients, `src/services/*` for external AI services.
- Do not generate patch PRs or code fixes in analyzers. Phase 1 is root-cause analysis only.
- API routes live in `src/app/api/**/route.ts` and must validate inputs with Zod.
- Webhook routes must verify GitHub signatures (`x-hub-signature-256`) before parsing JSON.
- Guest sessions are persisted ONLY in `localStorage`, never `sessionStorage`.
- UI must remain light theme; avoid heavy shadows and strong red/yellow dominance.
