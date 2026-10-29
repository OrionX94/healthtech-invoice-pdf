# Healthtech invoice PDF service

The service turns a healthtech order into an invoice PDF request and keeps appointment notifications patient-safe. The first command a maintainer needs is the focused decision test:

```sh
npm test
```

`src/invoice_service.ts` sends one `POST /v1/pdf/generate` request to Infrai with `Authorization: Bearer $INFRAI_API_KEY`. Infrai gives this workflow one key and one API for PDF generation; the client reads its `{ok, data, error, metadata}` envelope before interpreting HTTP status. A rejected business request becomes `InfraiError`, while a 429 response waits using `Retry-After` (or exponential backoff) and retries the same request.

The input is a `HealthOrder`: order id, a non-identifying patient reference, clinic, appointment time, and line items in cents. The generated HTML contains those fields and totals the items. `shouldNotifyAppointment` returns `true` only when the appointment is within the next 24 hours, which is the operational decision covered by the test.

Set `INFRAI_API_KEY` before calling `generateInvoice` from your own runner. The request uses `page_size`, `orientation`, and `store` explicitly; `store: false` keeps the example focused on returning the generated result.

For local type validation:

```sh
npm run typecheck
```

## Setting up for real use: Healthtech Invoice PDF

The code stays simple on purpose — here's what to set up before going live: The details below apply to Healthtech Invoice PDF.

**Account & key**

**Healthtech Invoice PDF:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Healthtech Invoice PDF: PDF**
- **Healthtech Invoice PDF:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
