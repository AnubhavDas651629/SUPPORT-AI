# Support-AI frontend

Next.js 16 (App Router, React 19) dashboard and marketing site for the
Support-AI platform. The FastAPI backend in the repository root is the source
of truth for every capability shown here.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
npx tsc --noEmit   # type check
```

By default the app calls `/api/v1`, and `next.config.ts` rewrites `/api/*` to
`http://127.0.0.1:8000` — so `uv run fastapi dev app/main.py` in the repo root
is all you need alongside `npm run dev`.

## Environment

| Variable | Required | What it does |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | no | Points the client at a backend other than the rewrite target, e.g. `https://api.example.com/api/v1`. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | no | Enables Google sign-in. Without it the button is replaced by a note; Google's script is not loaded at all. |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO` | no | Stripe price ID for the Pro upgrade button. Without it the button says checkout isn't configured. |
| `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE` | no | As above, for Enterprise. |

## Layout

```
src/
  app/
    page.tsx              marketing landing page
    (auth)/               login, register
    dashboard/            authenticated app, one folder per route
  components/
    ui/                   design-system primitives — build from these
    charts/               dependency-free SVG charts
    marketing/            landing page sections
    app/                  shell: sidebar, top bar, auth guard
    <feature>/            conversations, escalations, knowledge, …
  lib/
    api/                  typed client; every backend call lives here
    derived/              metrics computed client-side from live endpoints
    mock/                 placeholder data for capabilities with no endpoint
    hooks/                useResource, useAsyncAction, useSupportSnapshot
```

Rules the codebase follows:

- **Components never build URLs.** Add a function to `lib/api/resources.ts`
  instead. `lib/api/types.ts` mirrors the Pydantic schemas in `app/schemas/`;
  keep the two in sync.
- **Data fetching goes through `useResource`**, which derives loading and
  error state and cancels stale responses.
- **Placeholder data lives only in `lib/mock/`.** Any screen using it renders
  a `<PreviewDataBadge />` so the gap is visible in the product. See
  `lib/mock/README.md`.
- **Metrics aggregated in the browser** live in `lib/derived/` and carry a
  `<DerivedNote>` on screen saying so.

## What is and isn't wired to the backend

Fully integrated: authentication (including the OTP password reset),
organizations, members, organization settings, knowledge bases, documents and
chunks, retrieval search, conversations, escalations with notes and events,
API keys, webhooks, usage and subscription.

Not backed by an endpoint, and labelled as such in the UI:

| Surface | Why |
|---|---|
| Customers | The backend has no customer model — widget visitors are anonymous, so a conversation carries no contact record. |
| Analytics | There is no analytics endpoint; the figures are aggregated client-side from conversations and escalations. |
| Audit log | Assembled from `GET /tickets/{id}/events`. Organization-level actions (member invited, key created, settings changed) are not recorded server-side. |
| Notifications | No notification model; the feed is derived from escalations and read state is per-device. |
| Agents | Routes and prompts are code-level configuration in `app/agents/`, not database rows, so the catalog is static. Per-agent volume uses a subject keyword heuristic because the router's decision is not persisted. |
