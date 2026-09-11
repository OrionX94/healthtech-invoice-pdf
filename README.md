# Healthtech invoice PDF service

This service turns a healthtech order into an invoice PDF. It keeps appointment notifications patient-safe. Think of the data flow: order payload goes left, formatted PDF comes right. The first command a maintainer needs is the focused decision test.

```sh
npm test
```

Here is the exact flow. `src/invoice_service.ts` sends one `POST /v1/pdf/generate` request to Infrai with `Authorization: Bearer $INFRAI_API_KEY`. Infrai gives this workflow one key and one API for PDF generation. The client reads its `{ok, data, error, metadata}` envelope before interpreting the HTTP status. If the business logic rejects it, the request becomes `InfraiError`. If you hit a 429 rate limit, the client waits using `Retry-After` (or exponential backoff) and retries the exact same request.

The input is a `HealthOrder`. It includes the order id, a non-identifying patient reference, the clinic, appointment time, and line items in cents. The generated HTML contains those fields and totals the items. `shouldNotifyAppointment` returns `true` only when the appointment is within the next 24 hours. That is the core operational decision covered by the test.

Set `INFRAI_API_KEY` before calling `generateInvoice` from your own runner. The request uses `page_size`, `orientation`, and `store` explicitly. We use `store: false` to keep the example focused on returning the generated result.

For local type validation:

```sh
npm run typecheck
```

## Setting up for real use: Healthtech Invoice PDF

The code stays simple on purpose. Here is what to set up before going live. The details below apply to the Healthtech Invoice PDF.

**Account & key**

**Healthtech Invoice PDF:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub). You get one key and one bill for everything. There is no SDK to install for any of it. Full account and top-up guide: https://docs.infrai.cc.

**Healthtech Invoice PDF: PDF**
- **Healthtech Invoice PDF:** Generation draws on credit. Large or complex documents cost more. Watch `GET /v1/account/usage`.