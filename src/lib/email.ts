import { db } from "./db";

/**
 * Mock email service for the demo phase.
 * In production, replace with Nodemailer + SMTP (Resend/SendGrid).
 */
export type EmailTemplate =
  | "booking_confirmation"
  | "booking_checkin"
  | "booking_checkout"
  | "booking_cancelled"
  | "order_placed"
  | "order_ready"
  | "order_delivered"
  | "delivery_assigned"
  | "service_request_update"
  | "payment_receipt"
  | "welcome";

interface SendEmailParams {
  propertyId?: string | null;
  to: string;
  subject: string;
  body: string;
  template?: EmailTemplate;
}

export async function sendEmail(params: SendEmailParams) {
  const useMock = process.env.EMAIL_MOCK !== "false";

  if (useMock) {
    // Log to console (visible in dev terminal)
    // eslint-disable-next-line no-console
    console.log("\n📧 [EMAIL MOCK] ----------------------------");
    // eslint-disable-next-line no-console
    console.log(`To:      ${params.to}`);
    // eslint-disable-next-line no-console
    console.log(`Subject: ${params.subject}`);
    // eslint-disable-next-line no-console
    console.log(`Template: ${params.template ?? "custom"}`);
    // eslint-disable-next-line no-console
    console.log(`Body:\n${params.body}`);
    // eslint-disable-next-line no-console
    console.log("------------------------------------------------\n");
  }

  try {
    const log = await db.emailLog.create({
      data: {
        propertyId: params.propertyId ?? null,
        toEmail: params.to,
        subject: params.subject,
        body: params.body,
        template: params.template,
        status: useMock ? "SENT" : "QUEUED",
      },
    });
    return { success: true, id: log.id };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to log email:", error);
    return { success: false, error };
  }
}

// =========================================
//  Email template builders
// =========================================

export function bookingConfirmationEmail(opts: {
  guestName: string;
  bookingCode: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  total: string;
}) {
  return {
    subject: `Booking Confirmed - ${opts.bookingCode}`,
    body: `Dear ${opts.guestName},

Your booking ${opts.bookingCode} has been confirmed.

Check-in:  ${opts.checkIn}
Check-out: ${opts.checkOut}
Room type: ${opts.roomType}
Total:     ${opts.total}

We look forward to welcoming you to IHG.

Warm regards,
IHG Team`,
  };
}

export function orderPlacedEmail(opts: {
  customerName: string;
  orderNumber: string;
  total: string;
  orderType: string;
}) {
  return {
    subject: `Order Placed - ${opts.orderNumber}`,
    body: `Hi ${opts.customerName},

Your ${opts.orderType} order ${opts.orderNumber} has been received.
Total: ${opts.total}

We'll notify you when it's ready.

Thank you,
IHG Team`,
  };
}

export function orderReadyEmail(opts: {
  customerName: string;
  orderNumber: string;
  orderType: string;
}) {
  return {
    subject: `Your order is ready - ${opts.orderNumber}`,
    body: `Hi ${opts.customerName},

Great news! Your ${opts.orderType} order ${opts.orderNumber} is ready.

${opts.orderType === "DELIVERY" ? "Our delivery agent is on the way." : "Your waiter will serve it shortly."}

IHG Team`,
  };
}

export function deliveryAssignedEmail(opts: {
  agentName: string;
  orderNumber: string;
  customerAddress: string;
}) {
  return {
    subject: `New delivery assigned - ${opts.orderNumber}`,
    body: `Hi ${opts.agentName},

You have been assigned a new delivery:
Order:      ${opts.orderNumber}
Address:    ${opts.customerAddress}

Please pick up the order and proceed to delivery.

IHG Team`,
  };
}
