import { notifyOwner } from './_core/notification';

/**
 * Notification Service
 * Sends notifications to the business owner for important events
 */

export async function notifyNewOrder(params: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: string;
  itemCount: number;
  items: Array<{ name: string; quantity: number }>;
}) {
  const itemsList = params.items
    .map((item) => `• ${item.name} (x${item.quantity})`)
    .join('\n');

  const content = `
📦 Nuevo pedido recibido

Número de pedido: ${params.orderNumber}
Cliente: ${params.customerName} (${params.customerEmail})
Total: $${params.total}
Cantidad de ítems: ${params.itemCount}

Productos:
${itemsList}

Accede al panel de administración para procesar este pedido.
  `.trim();

  try {
    await notifyOwner({
      title: `Nuevo pedido #${params.orderNumber}`,
      content,
    });
  } catch (error) {
    console.error('[Notifications] Failed to notify owner of new order:', error);
    // Don't throw - notification failures shouldn't block order processing
  }
}

export async function notifyOrderShipped(params: {
  orderNumber: string;
  customerName: string;
  carrier: string;
  trackingNumber: string;
}) {
  const carrierName = params.carrier === 'andreani' ? 'Andreani' : 'Correo Argentino';

  const content = `
🚚 Pedido enviado

Número de pedido: ${params.orderNumber}
Cliente: ${params.customerName}
Transportista: ${carrierName}
Número de seguimiento: ${params.trackingNumber}

El cliente ha sido notificado con la información de seguimiento.
  `.trim();

  try {
    await notifyOwner({
      title: `Pedido #${params.orderNumber} enviado`,
      content,
    });
  } catch (error) {
    console.error('[Notifications] Failed to notify owner of shipment:', error);
  }
}

export async function notifyOrderDelivered(params: {
  orderNumber: string;
  customerName: string;
  deliveryDate: string;
}) {
  const content = `
✓ Pedido entregado

Número de pedido: ${params.orderNumber}
Cliente: ${params.customerName}
Fecha de entrega: ${params.deliveryDate}

El cliente ha sido notificado de la entrega.
  `.trim();

  try {
    await notifyOwner({
      title: `Pedido #${params.orderNumber} entregado`,
      content,
    });
  } catch (error) {
    console.error('[Notifications] Failed to notify owner of delivery:', error);
  }
}

export async function notifyPaymentApproved(params: {
  orderNumber: string;
  customerName: string;
  amount: string;
  paymentId: string;
}) {
  const content = `
💳 Pago aprobado

Número de pedido: ${params.orderNumber}
Cliente: ${params.customerName}
Monto: $${params.amount}
ID de pago (Mercado Pago): ${params.paymentId}

El pedido está listo para procesar.
  `.trim();

  try {
    await notifyOwner({
      title: `Pago aprobado - Pedido #${params.orderNumber}`,
      content,
    });
  } catch (error) {
    console.error('[Notifications] Failed to notify owner of payment approval:', error);
  }
}

export async function notifyPaymentFailed(params: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: string;
  reason: string;
}) {
  const content = `
❌ Pago rechazado

Número de pedido: ${params.orderNumber}
Cliente: ${params.customerName} (${params.customerEmail})
Monto: $${params.amount}
Razón: ${params.reason}

El cliente debe reintentar el pago o contactar al soporte.
  `.trim();

  try {
    await notifyOwner({
      title: `Pago rechazado - Pedido #${params.orderNumber}`,
      content,
    });
  } catch (error) {
    console.error('[Notifications] Failed to notify owner of payment failure:', error);
  }
}
