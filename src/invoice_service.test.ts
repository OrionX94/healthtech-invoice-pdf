import assert from "node:assert/strict";
import { shouldNotifyAppointment } from "./invoice_service.ts";

const order = { orderId: "o-17", patientReference: "P-204", clinicName: "North Clinic", appointmentDate: "2026-09-01T12:00:00Z", items: [{ description: "Consultation", amountCents: 12500 }] };
assert.equal(shouldNotifyAppointment(order, new Date("2026-09-01T00:00:00Z")), true);
assert.equal(shouldNotifyAppointment(order, new Date("2026-08-30T00:00:00Z")), false);
console.log("appointment notification decision: passed");
