import { TRPCError } from '@trpc/server';

/**
 * Mercado Pago Payment Integration
 * This module handles payment processing with Mercado Pago
 * 
 * To enable:
 * 1. Add MERCADO_PAGO_ACCESS_TOKEN to environment variables
 * 2. Set up webhook for payment notifications
 */

export async function createMercadoPagoPreference(params: {
  orderId: string;
  items: Array<{
    title: string;
    quantity: number;
    unit_price: number;
  }>;
  payer: {
    name: string;
    email: string;
    phone?: string;
  };
  backUrls: {
    success: string;
    failure: string;
    pending: string;
  };
}) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Mercado Pago not configured. Please add MERCADO_PAGO_ACCESS_TOKEN to environment variables.',
    });
  }

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        items: params.items,
        payer: params.payer,
        back_urls: params.backUrls,
        auto_return: 'approved',
        external_reference: params.orderId,
        notification_url: `${process.env.VITE_FRONTEND_FORGE_API_URL || 'https://api.manus.im'}/webhooks/mercadopago`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mercado Pago API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      preferenceId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point,
    };
  } catch (error) {
    console.error('Error creating Mercado Pago preference:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create payment preference',
    });
  }
}

export async function getMercadoPagoPaymentStatus(paymentId: string) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Mercado Pago not configured',
    });
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Mercado Pago API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      status: data.status,
      statusDetail: data.status_detail,
      transactionAmount: data.transaction_amount,
      externalReference: data.external_reference,
    };
  } catch (error) {
    console.error('Error fetching payment status:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch payment status',
    });
  }
}
