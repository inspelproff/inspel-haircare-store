import { TRPCError } from '@trpc/server';

/**
 * Email Service Integration
 * Handles transactional emails for order confirmations, shipping updates, etc.
 * 
 * To enable:
 * 1. Add EMAIL_PROVIDER (sendgrid, resend, mailgun) to environment variables
 * 2. Add EMAIL_API_KEY to environment variables
 * 3. Add FROM_EMAIL to environment variables
 */

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendEmail(params: EmailParams): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER || 'resend';
  const apiKey = process.env.EMAIL_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'noreply@inspel.com';

  if (!apiKey) {
    console.warn('[Email] Email service not configured. Skipping email send.');
    return;
  }

  try {
    if (provider === 'resend') {
      await sendViaResend(params, apiKey, fromEmail);
    } else if (provider === 'sendgrid') {
      await sendViaSendGrid(params, apiKey, fromEmail);
    } else if (provider === 'mailgun') {
      await sendViaMailgun(params, apiKey, fromEmail);
    } else {
      throw new Error(`Unknown email provider: ${provider}`);
    }
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    // Don't throw - email failures shouldn't block order processing
  }
}

async function sendViaResend(
  params: EmailParams,
  apiKey: string,
  fromEmail: string
): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend API error: ${response.statusText}`);
  }
}

async function sendViaSendGrid(
  params: EmailParams,
  apiKey: string,
  fromEmail: string
): Promise<void> {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: params.to }],
          subject: params.subject,
        },
      ],
      from: { email: fromEmail },
      content: [
        {
          type: 'text/html',
          value: params.html,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`SendGrid API error: ${response.statusText}`);
  }
}

async function sendViaMailgun(
  params: EmailParams,
  apiKey: string,
  fromEmail: string
): Promise<void> {
  const domain = process.env.MAILGUN_DOMAIN || 'mail.inspel.com';
  const formData = new FormData();
  formData.append('from', fromEmail);
  formData.append('to', params.to);
  formData.append('subject', params.subject);
  formData.append('html', params.html);
  if (params.text) {
    formData.append('text', params.text);
  }

  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Mailgun API error: ${response.statusText}`);
  }
}

// ============ EMAIL TEMPLATES ============

export async function sendOrderConfirmationEmail(params: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  subtotal: string;
  shippingCost: string;
  total: string;
}) {
  const itemsHtml = params.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.price}</td>
        </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Jost', sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0A0A0A; color: #C9A84C; padding: 20px; text-align: center; }
          .header h1 { margin: 0; font-family: 'Cormorant Garamond', serif; font-size: 28px; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-number { font-size: 14px; color: #666; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .total-row { font-weight: bold; font-size: 16px; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
          .button { display: inline-block; background: #C9A84C; color: #0A0A0A; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Inspel</h1>
            <p style="margin: 5px 0; font-size: 12px;">Premium Hair Care</p>
          </div>
          
          <div class="content">
            <p>¡Hola ${params.customerName}!</p>
            <p>Gracias por tu compra. Tu pedido ha sido confirmado.</p>
            
            <div class="order-number">
              <strong>Número de pedido:</strong> ${params.orderNumber}
            </div>
            
            <h3 style="margin-top: 20px;">Resumen del pedido:</h3>
            <table>
              <thead>
                <tr style="background: #f0f0f0;">
                  <th style="padding: 8px; text-align: left;">Producto</th>
                  <th style="padding: 8px; text-align: center;">Cantidad</th>
                  <th style="padding: 8px; text-align: right;">Precio</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <table style="margin-top: 20px;">
              <tr>
                <td style="padding: 8px;">Subtotal:</td>
                <td style="padding: 8px; text-align: right;">$${params.subtotal}</td>
              </tr>
              <tr>
                <td style="padding: 8px;">Envío:</td>
                <td style="padding: 8px; text-align: right;">$${params.shippingCost}</td>
              </tr>
              <tr class="total-row" style="border-top: 2px solid #C9A84C;">
                <td style="padding: 8px;">Total:</td>
                <td style="padding: 8px; text-align: right;">$${params.total}</td>
              </tr>
            </table>
            
            <p>Pronto recibirás un email con la información de tu envío.</p>
            <p style="color: #999; font-size: 12px;">Si tienes preguntas, contáctanos a support@inspel.com</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2026 Inspel - Premium Hair Care. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: params.customerEmail,
    subject: `Confirmación de pedido #${params.orderNumber}`,
    html,
  });
}

export async function sendShippingNotificationEmail(params: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}) {
  const carrierName = params.carrier === 'andreani' ? 'Andreani' : 'Correo Argentino';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Jost', sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0A0A0A; color: #C9A84C; padding: 20px; text-align: center; }
          .header h1 { margin: 0; font-family: 'Cormorant Garamond', serif; font-size: 28px; }
          .content { padding: 20px; background: #f9f9f9; }
          .tracking-box { background: white; border: 1px solid #C9A84C; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .tracking-label { font-size: 12px; color: #999; text-transform: uppercase; }
          .tracking-number { font-size: 18px; font-weight: bold; color: #0A0A0A; margin: 5px 0; font-family: monospace; }
          .button { display: inline-block; background: #C9A84C; color: #0A0A0A; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Inspel</h1>
            <p style="margin: 5px 0; font-size: 12px;">Premium Hair Care</p>
          </div>
          
          <div class="content">
            <p>¡Hola ${params.customerName}!</p>
            <p>Tu pedido #${params.orderNumber} ha sido enviado.</p>
            
            <div class="tracking-box">
              <div class="tracking-label">Número de seguimiento</div>
              <div class="tracking-number">${params.trackingNumber}</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">Transportista: ${carrierName}</div>
              ${params.estimatedDelivery ? `<div style="font-size: 12px; color: #666; margin-top: 5px;">Entrega estimada: ${params.estimatedDelivery}</div>` : ''}
            </div>
            
            ${params.trackingUrl ? `<p><a href="${params.trackingUrl}" class="button">Rastrear mi pedido</a></p>` : ''}
            
            <p>Puedes rastrear tu pedido en cualquier momento usando el número de seguimiento anterior.</p>
            <p style="color: #999; font-size: 12px;">Si tienes preguntas, contáctanos a support@inspel.com</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2026 Inspel - Premium Hair Care. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: params.customerEmail,
    subject: `Tu pedido #${params.orderNumber} ha sido enviado`,
    html,
  });
}

export async function sendDeliveryNotificationEmail(params: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  deliveryDate: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Jost', sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0A0A0A; color: #C9A84C; padding: 20px; text-align: center; }
          .header h1 { margin: 0; font-family: 'Cormorant Garamond', serif; font-size: 28px; }
          .content { padding: 20px; background: #f9f9f9; }
          .success-box { background: #e8f5e9; border: 1px solid #4caf50; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center; }
          .success-icon { font-size: 32px; margin-bottom: 10px; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Inspel</h1>
            <p style="margin: 5px 0; font-size: 12px;">Premium Hair Care</p>
          </div>
          
          <div class="content">
            <div class="success-box">
              <div class="success-icon">✓</div>
              <h2 style="margin: 0; color: #4caf50;">¡Pedido entregado!</h2>
            </div>
            
            <p>¡Hola ${params.customerName}!</p>
            <p>Tu pedido #${params.orderNumber} ha sido entregado exitosamente el ${params.deliveryDate}.</p>
            
            <p>Esperamos que disfrutes de nuestros productos. Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos.</p>
            
            <p><strong>¿Cómo fue tu experiencia?</strong></p>
            <p>Tu opinión es importante para nosotros. Nos encantaría saber qué te pareció.</p>
            
            <p style="color: #999; font-size: 12px;">Si tienes preguntas, contáctanos a support@inspel.com</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2026 Inspel - Premium Hair Care. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: params.customerEmail,
    subject: `Tu pedido #${params.orderNumber} ha sido entregado`,
    html,
  });
}
