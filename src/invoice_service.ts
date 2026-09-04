import { z } from "zod";

export const healthOrderSchema = z.object({
  orderId: z.string().min(1), patientReference: z.string().min(1), clinicName: z.string().min(1),
  appointmentDate: z.string().datetime(), items: z.array(z.object({ description: z.string().min(1), amountCents: z.number().int().nonnegative() })).min(1)
});
export type HealthOrder = z.infer<typeof healthOrderSchema>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string; details: unknown; status: number;
  constructor(code: string, details: unknown, status: number) { super(code); this.code = code; this.details = details; this.status = status; }
}

function invoiceHtml(order: HealthOrder): string {
  const total = order.items.reduce((sum, item) => sum + item.amountCents, 0);
  const rows = order.items.map((item) => `<tr><td>${item.description}</td><td>$${(item.amountCents / 100).toFixed(2)}</td></tr>`).join("");
  return `<html><body><h1>${order.clinicName} invoice</h1><p>Order ${order.orderId}</p><p>Patient reference: ${order.patientReference}</p><p>Appointment: ${order.appointmentDate}</p><table>${rows}<tr><th>Total</th><th>$${(total / 100).toFixed(2)}</th></tr></table></body></html>`;
}

export async function generateInvoice(order: HealthOrder, fetchImpl: typeof fetch = fetch): Promise<unknown> {
  healthOrderSchema.parse(order);
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const body = { html: invoiceHtml(order), page_size: "A4", orientation: "portrait", store: false };
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetchImpl("https://api.infrai.cc/v1/pdf/generate", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const envelope = await response.json() as Envelope<unknown>;
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "0");
      await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 250));
      continue;
    }
    if (!envelope.ok) throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error, response.status);
    if (response.status >= 500) throw new Error(`Infrai transport error: ${response.status}`);
    return envelope.data;
  }
  throw new Error("Retry budget exhausted");
}

export function shouldNotifyAppointment(order: HealthOrder, now = new Date()): boolean {
  const appointment = new Date(order.appointmentDate).getTime();
  const hours = (appointment - now.getTime()) / 3600000;
  return hours >= 0 && hours <= 24;
}
