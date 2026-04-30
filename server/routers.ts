import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import * as payment from "./payment";
import * as shipping from "./shipping";

// Helper para verificar si es admin
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ PRODUCTS ============
  products: router({
    getAll: publicProcedure.query(async () => {
      return db.getAllProducts();
    }),

    getByLine: publicProcedure
      .input(z.enum(["Nutriessence", "Strength"]))
      .query(async ({ input }) => {
        return db.getProductsByLine(input);
      }),

    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return db.getProductById(input);
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        line: z.enum(["Nutriessence", "Strength"]),
        description: z.string().optional(),
        price: z.string().regex(/^\d+(\.\d{2})?$/),
        stock: z.number().int().min(0),
        image: z.string().optional(),
        icon: z.string().optional(),
        badge: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createProduct(input);
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        line: z.enum(["Nutriessence", "Strength"]).optional(),
        description: z.string().optional(),
        price: z.string().regex(/^\d+(\.\d{2})?$/).optional(),
        stock: z.number().int().min(0).optional(),
        image: z.string().optional(),
        icon: z.string().optional(),
        badge: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateProduct(id, data);
      }),

    delete: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.deleteProduct(input);
        return { success: true };
      }),
  }),

  // ============ CUSTOMERS ============
  customers: router({
    getAll: adminProcedure.query(async () => {
      return db.getAllCustomers();
    }),

    create: publicProcedure
      .input(z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        address: z.string().min(1),
        city: z.string().min(1),
        province: z.string().min(1),
        postalCode: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        return db.createCustomer(input);
      }),

    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return db.getCustomerById(input);
      }),
  }),

  // ============ ORDERS ============
  orders: router({
    getAll: adminProcedure.query(async () => {
      return db.getAllOrders();
    }),

    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return db.getOrderById(input);
      }),

    getByNumber: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        return db.getOrderByNumber(input);
      }),

    create: publicProcedure
      .input(z.object({
        orderNumber: z.string(),
        customerId: z.number(),
        subtotal: z.string().regex(/^\d+(\.\d{2})?$/),
        shippingCost: z.string().regex(/^\d+(\.\d{2})?$/),
        total: z.string().regex(/^\d+(\.\d{2})?$/),
        paymentMethod: z.enum(["mercadopago", "transfer"]),
        notes: z.string().optional(),
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number().int().min(1),
          price: z.string().regex(/^\d+(\.\d{2})?$/),
        })),
      }))
      .mutation(async ({ input }) => {
        const { items, ...orderData } = input;
        
        // Create order
        const order = await db.createOrder(orderData);
        
        // Create order items
        for (const item of items) {
          await db.createOrderItem({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          });
        }
        
        return order;
        // Trigger notifications and emails
        await db.triggerOrderNotifications(order.id);
      }),

    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        return db.updateOrderStatus(input.id, input.status);
      }),

    updatePaymentStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        paymentStatus: z.enum(["pending", "approved", "rejected", "cancelled"]),
        mercadopagoId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.updateOrderPaymentStatus(input.id, input.paymentStatus, input.mercadopagoId);
      }),
  }),

  // ============ ORDER ITEMS ============
  orderItems: router({
    getByOrderId: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return db.getOrderItems(input);
      }),
  }),

  // ============ SHIPMENTS ============
  shipments: router({
    getAll: adminProcedure.query(async () => {
      return db.getAllShipments();
    }),

    create: adminProcedure
      .input(z.object({
        orderId: z.number(),
        carrier: z.enum(["andreani", "correo_argentino"]),
        trackingNumber: z.string().optional(),
        carrier_tracking_url: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createShipment(input);
      }),

    getByOrderId: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return db.getShipmentByOrderId(input);
      }),

    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed"]),
        actualDelivery: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.updateShipmentStatus(input.id, input.status, input.actualDelivery);
      }),
  }),

  // ============ PAYMENTS ============
  payments: router({
    createMercadoPagoPreference: publicProcedure
      .input(z.object({
        orderId: z.string(),
        items: z.array(z.object({
          title: z.string(),
          quantity: z.number().int().min(1),
          unit_price: z.number().min(0),
        })),
        payer: z.object({
          name: z.string(),
          email: z.string().email(),
          phone: z.string().optional(),
        }),
        backUrls: z.object({
          success: z.string().url(),
          failure: z.string().url(),
          pending: z.string().url(),
        }),
      }))
      .mutation(async ({ input }) => {
        return payment.createMercadoPagoPreference(input);
      }),

    getMercadoPagoStatus: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        return payment.getMercadoPagoPaymentStatus(input);
      }),
  }),

  // ============ SHIPPING INTEGRATIONS ============
  shippingIntegration: router({
    createAndreaniShipment: adminProcedure
      .input(z.object({
        orderId: z.string(),
        recipientName: z.string(),
        recipientPhone: z.string(),
        recipientEmail: z.string().email(),
        address: z.string(),
        city: z.string(),
        province: z.string(),
        postalCode: z.string(),
        weight: z.number().min(0.1),
        items: z.array(z.object({
          description: z.string(),
          quantity: z.number().int().min(1),
        })),
      }))
      .mutation(async ({ input }) => {
        return shipping.createAndreaniShipment(input);
      }),

    getAndreaniTracking: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        return shipping.getAndreaniTracking(input);
      }),

    createCorreoArgentinoShipment: adminProcedure
      .input(z.object({
        orderId: z.string(),
        recipientName: z.string(),
        recipientPhone: z.string(),
        recipientEmail: z.string().email(),
        address: z.string(),
        city: z.string(),
        province: z.string(),
        postalCode: z.string(),
        weight: z.number().min(0.1),
        items: z.array(z.object({
          description: z.string(),
          quantity: z.number().int().min(1),
        })),
      }))
      .mutation(async ({ input }) => {
        return shipping.createCorreoArgentinoShipment(input);
      }),

    getCorreoArgentinoTracking: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        return shipping.getCorreoArgentinoTracking(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
