import { TRPCError } from '@trpc/server';

/**
 * Shipping Integration Module
 * Handles integration with Argentine shipping carriers: Andreani and Correo Argentino
 * 
 * To enable:
 * 1. Add ANDREANI_API_KEY and ANDREANI_API_URL to environment variables
 * 2. Add CORREO_ARGENTINO_API_KEY and CORREO_ARGENTINO_API_URL to environment variables
 */

// ============ ANDREANI INTEGRATION ============

export async function createAndreaniShipment(params: {
  orderId: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  weight: number; // in kg
  items: Array<{
    description: string;
    quantity: number;
  }>;
}) {
  const apiKey = process.env.ANDREANI_API_KEY;
  const apiUrl = process.env.ANDREANI_API_URL;

  if (!apiKey || !apiUrl) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Andreani not configured. Please add ANDREANI_API_KEY and ANDREANI_API_URL to environment variables.',
    });
  }

  try {
    const response = await fetch(`${apiUrl}/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        externalReference: params.orderId,
        recipient: {
          name: params.recipientName,
          phone: params.recipientPhone,
          email: params.recipientEmail,
        },
        address: {
          street: params.address,
          city: params.city,
          province: params.province,
          postalCode: params.postalCode,
        },
        weight: params.weight,
        items: params.items,
      }),
    });

    if (!response.ok) {
      throw new Error(`Andreani API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      trackingNumber: data.trackingNumber,
      shipmentId: data.id,
      estimatedDelivery: data.estimatedDelivery,
    };
  } catch (error) {
    console.error('Error creating Andreani shipment:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create shipment with Andreani',
    });
  }
}

export async function getAndreaniTracking(trackingNumber: string) {
  const apiKey = process.env.ANDREANI_API_KEY;
  const apiUrl = process.env.ANDREANI_API_URL;

  if (!apiKey || !apiUrl) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Andreani not configured',
    });
  }

  try {
    const response = await fetch(`${apiUrl}/tracking/${trackingNumber}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Andreani API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      status: data.status,
      lastUpdate: data.lastUpdate,
      location: data.location,
      events: data.events || [],
    };
  } catch (error) {
    console.error('Error fetching Andreani tracking:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch tracking information',
    });
  }
}

// ============ CORREO ARGENTINO INTEGRATION ============

export async function createCorreoArgentinoShipment(params: {
  orderId: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  weight: number; // in kg
  items: Array<{
    description: string;
    quantity: number;
  }>;
}) {
  const apiKey = process.env.CORREO_ARGENTINO_API_KEY;
  const apiUrl = process.env.CORREO_ARGENTINO_API_URL;

  if (!apiKey || !apiUrl) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Correo Argentino not configured. Please add CORREO_ARGENTINO_API_KEY and CORREO_ARGENTINO_API_URL to environment variables.',
    });
  }

  try {
    const response = await fetch(`${apiUrl}/envios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        referencia_externa: params.orderId,
        destinatario: {
          nombre: params.recipientName,
          telefono: params.recipientPhone,
          email: params.recipientEmail,
        },
        domicilio: {
          calle: params.address,
          localidad: params.city,
          provincia: params.province,
          codigo_postal: params.postalCode,
        },
        peso: params.weight,
        items: params.items,
      }),
    });

    if (!response.ok) {
      throw new Error(`Correo Argentino API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      trackingNumber: data.numero_seguimiento,
      shipmentId: data.id,
      estimatedDelivery: data.entrega_estimada,
    };
  } catch (error) {
    console.error('Error creating Correo Argentino shipment:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create shipment with Correo Argentino',
    });
  }
}

export async function getCorreoArgentinoTracking(trackingNumber: string) {
  const apiKey = process.env.CORREO_ARGENTINO_API_KEY;
  const apiUrl = process.env.CORREO_ARGENTINO_API_URL;

  if (!apiKey || !apiUrl) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Correo Argentino not configured',
    });
  }

  try {
    const response = await fetch(`${apiUrl}/seguimiento/${trackingNumber}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Correo Argentino API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      estado: data.estado,
      ultima_actualizacion: data.ultima_actualizacion,
      ubicacion: data.ubicacion,
      eventos: data.eventos || [],
    };
  } catch (error) {
    console.error('Error fetching Correo Argentino tracking:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch tracking information',
    });
  }
}
