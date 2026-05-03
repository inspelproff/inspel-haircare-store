import { z } from 'zod';

/**
 * Esquemas de validación estrictos para proteger contra inyecciones y datos maliciosos
 */

// Validación de productos
export const ProductSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  line: z.enum(['Nutriessence', 'Strength']),
  description: z.string().max(5000).trim().optional(),
  price: z.string().regex(/^\d+(\.\d{2})?$/, 'Formato de precio inválido'),
  stock: z.number().int().min(0).max(999999),
  image: z.string().url().optional().or(z.literal('')),
  icon: z.string().max(10).optional(),
  badge: z.string().max(100).trim().optional(),
  active: z.boolean().optional(),
});

// Validación de clientes
export const CustomerSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  email: z.string().email(),
  phone: z.string().min(5).max(20).regex(/^[0-9\s\-\+\(\)]+$/, 'Teléfono inválido'),
  address: z.string().min(5).max(500).trim(),
  city: z.string().min(1).max(100).trim(),
  province: z.string().min(1).max(100).trim(),
  postalCode: z.string().min(1).max(20).trim(),
});

// Validación de órdenes
export const OrderSchema = z.object({
  orderNumber: z.string().min(1).max(50),
  customerId: z.number().int().positive(),
  subtotal: z.string().regex(/^\d+(\.\d{2})?$/),
  shippingCost: z.string().regex(/^\d+(\.\d{2})?$/),
  total: z.string().regex(/^\d+(\.\d{2})?$/),
  paymentMethod: z.enum(['mercadopago', 'transfer']),
  notes: z.string().max(1000).trim().optional(),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().min(1).max(999),
    price: z.string().regex(/^\d+(\.\d{2})?$/),
  })).min(1),
});

// Validación de preferencia de Mercado Pago
export const MercadoPagoPreferenceSchema = z.object({
  orderId: z.string().min(1).max(50),
  items: z.array(z.object({
    title: z.string().min(1).max(255),
    quantity: z.number().int().min(1),
    unit_price: z.number().min(0),
  })).min(1),
  payer: z.object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  backUrls: z.object({
    success: z.string().url(),
    failure: z.string().url(),
    pending: z.string().url(),
  }),
});

// Validación de envíos
export const ShipmentSchema = z.object({
  orderId: z.number().int().positive(),
  carrier: z.enum(['andreani', 'correo_argentino']),
  trackingNumber: z.string().max(100).optional(),
  carrier_tracking_url: z.string().url().optional(),
});

// Validación de actualización de estado de envío
export const UpdateShipmentStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed']),
  actualDelivery: z.date().optional(),
});

// Función para sanitizar strings
export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remover caracteres HTML peligrosos
    .slice(0, 1000); // Limitar longitud
}

// Función para validar y sanitizar entrada
export async function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validación fallida: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}
