# Placeholder data

Everything in this folder stands in for a backend capability that does **not**
exist yet. It is deliberately isolated here so it is obvious what is real and
so each file can be deleted the day its endpoint ships.

| File | Stands in for | Why |
|---|---|---|
| `customers.ts` | A customer directory | The backend has no customer entity. Widget conversations are anonymous visitors (`app/api/v1/widget.py` creates a conversation with no contact record), so there is nothing to read. |
| `notifications.ts` | A notifications feed | No notification model or endpoint exists. The real feed is assembled in `lib/derived/notifications.ts` from live tickets; this file only supplies the delivery-preference defaults. |

Any screen backed by these files renders a **Preview data** badge
(`<PreviewDataBadge />`) so the state is visible in the product, not just in
the source.

Rules:
- Never import these from a component that also has a real endpoint available.
- Never write mock arrays inline in JSX — they belong here.
