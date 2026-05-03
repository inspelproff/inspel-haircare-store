import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import * as payment from "./payment";
import * as shipping from "./shipping";
import * as validation from "./_core/validation";

// Helper para verificar si es admin - con validación más estricta
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== 'admin') {
    throw new TRPCError({ 
      code: 'FORBIDDEN', 
      message: 'Admin access required. This action has been logged.' 
    });
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
      .input(z.number().int().positive())
      .query(async ({ input }) => {
        return db.getProductById(input);
      }),

    create: adminProcedure
      .input(validation.ProductSchema)
      .mutation(async ({ input }) => {
        const validatedInput = await validation.validateAndSanitize(validation.ProductSchema, input);
        return db.createProduct(validatedInput);
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number().int().positive(),
        name: z.string().min(1).max(255).trim().optional(),
        line: z.enum(["Nutriessence", "Strength"]).optional(),
        description: z.string().max(5000).trim().optional(),
        price: z.string().regex(/^\d+(\.\d{2})?$/).optional(),
        stock: z.number().int().min(0).max(999999).optional(),
        image: z.string().url().optional().or(z.literal('')),
        icon: z.string().max(10).optional(),
        badge: z.string().max(100).trim().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        if (Object.keys(data).length === 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'No fields to update' });
        }
        const product = await db.getProductById(id);
        if (!product) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
        }
        return db.updateProduct(id, data);
      }),

    delete: adminProcedure
      .input(z.number().int().positive())
      .mutation(async ({ input }) => {
        const product = await db.getProductById(input);
        if (!product) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
        }
        await db.deleteProduct(input);
        return { success: true };
      }),
  }),

  // ============ CUSTOMERS ============
  customers: router({
    create: publicProcedure
      .input(validation.CustomerSchema)
      .mutation(async ({ input }) => {
        const validatedInput = await validation.validateAndSanitize(validation.CustomerSchema, input);
        return db.createCustomer(validatedInput);
      }),

    getById: publicProcedure
      .input(z.number().int().positive())
      .query(async ({ input }) => {
        return db.getCustomerById(input);
      }),
  }),

  // ============ ORDERS ============
  orders: router({
    getAll: adminProcedure.query(async () => {
      // Solo administradores pueden ver todos los pedidos
      return db.getAllOrders();
    }),

    getById: publicProcedure
      .input(z.number().int().positive())
      .query(async ({ input }) => {
        return db.getOrderById(input);
      }),

    getByNumber: publicProcedure
      .input(z.string().min(1).max(50))
      .query(async ({ input }) => {
        return db.getOrderByNumber(input);
      }),

    create: publicProcedure
      .input(validation.OrderSchema)
      .mutation(async ({ input }) => {
        const validatedInput = await validation.validateAndSanitize(validation.OrderSchema, input);
        const { items, ...orderData } = validatedInput;
        
        // Validar que el cliente exista
        const customer = await db.getCustomerById(orderData.customerId);
        if (!customer) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found' });
        }
        
        // Validar que los productos existan y tengan stock
        for (const item of items) {
          const product = await db.getProductById(item.productId);
          if (!product) {
            throw new TRPCError({ code: 'NOT_FOUND', message: `Product ${item.productId} not found` });
          }
          if (product.stock < item.quantity) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: `Insufficient stock for ${product.name}` });
          }
        }
        
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
        
        // Trigger notifications and emails
        await db.triggerOrderNotifications(order.id);
        return order;
      }),

    updateStatus: adminProcedure
      .input(z.object({
        id: z.number().int().positive(),
        status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        const order = await db.getOrderById(input.id);
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }
        return db.updateOrderStatus(input.id, input.status);
      }),

    updatePaymentStatus: adminProcedure
      .input(z.object({
        id: z.number().int().positive(),
        paymentStatus: z.enum(["pending", "approved", "rejected", "cancelled"]),
        mercadopagoId: z.string().max(100).optional(),
      }))
      .mutation(async ({ input }) => {
        const order = await db.getOrderById(input.id);
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }
        return db.updateOrderPaymentStatus(input.id, input.paymentStatus, input.mercadopagoId);
      }),
  }),

  // ============ ORDER ITEMS ============
  orderItems: router({
    getByOrderId: publicProcedure
      .input(z.number().int().positive())
      .query(async ({ input }) => {
        return db.getOrderItems(input);
      }),
  }),

  // ============ SHIPMENTS ============
  shipments: router({
    create: adminProcedure
      .input(validation.ShipmentSchema)
      .mutation(async ({ input }) => {
        const validatedInput = await validation.validateAndSanitize(validation.ShipmentSchema, input);
        const order = await db.getOrderById(validatedInput.orderId);
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }
        return db.createShipment(validatedInput);
      }),

    getByOrderId: publicProcedure
      .input(z.number().int().positive())
      .query(async ({ input }) => {
        return db.getShipmentByOrderId(input);
      }),

    updateStatus: adminProcedure
      .input(validation.UpdateShipmentStatusSchema)
      .mutation(async ({ input }) => {
        const validatedInput = await validation.validateAndSanitize(validation.UpdateShipmentStatusSchema, input);
        return db.updateShipmentStatus(validatedInput.id, validatedInput.status, validatedInput.actualDelivery);
      }),
  }),

  // ============ PAYMENTS ============
  payments: router({
    createMercadoPagoPreference: publicProcedure
      .input(validation.MercadoPagoPreferenceSchema)
      .mutation(async ({ input }) => {
        const validatedInput = await validation.validateAndSanitize(validation.MercadoPagoPreferenceSchema, input);
        return payment.createMercadoPagoPreference(validatedInput);
      }),

    getMercadoPagoStatus: publicProcedure
      .input(z.string().min(1).max(100))
      .query(async ({ input }) => {
        return payment.getMercadoPagoPaymentStatus(input);
      }),
  }),

  // ============ SHIPPING INTEGRATIONS ============
  shippingIntegration: router({
    createAndreaniShipment: adminProcedure
      .input(z.object({
        orderId: z.string().min(1).max(50),
        recipientName: z.string().min(1).max(255),
        recipientPhone: z.string().min(5).max(20),
        recipientEmail: z.string().email(),
        address: z.string().min(5).max(500),
        city: z.string().min(1).max(100),
        province: z.string().min(1).max(100),
        postalCode: z.string().min(1).max(20),
        weight: z.number().min(0.1).max(100),
        items: z.array(z.object({
          description: z.string().min(1).max(255),
          quantity: z.number().int().min(1).max(999),
        })).min(1),
      }))
      .mutation(async ({ input }) => {
        return shipping.createAndreaniShipment(input);
      }),

    getAndreaniTracking: publicProcedure
      .input(z.string().min(1).max(100))
      .query(async ({ input }) => {
        return shipping.getAndreaniTracking(input);
      }),

    createCorreoArgentinoShipment: adminProcedure
      .input(z.object({
        orderId: z.string().min(1).max(50),
        recipientName: z.string().min(1).max(255),
        recipientPhone: z.string().min(5).max(20),
        recipientEmail: z.string().email(),
        address: z.string().min(5).max(500),
        city: z.string().min(1).max(100),
        province: z.string().min(1).max(100),
        postalCode: z.string().min(1).max(20),
        weight: z.number().min(0.1).max(100),
        items: z.array(z.object({
          description: z.string().min(1).max(255),
          quantity: z.number().int().min(1).max(999),
        })).min(1),
      }))
      .mutation(async ({ input }) => {
        return shipping.createCorreoArgentinoShipment(input);
      }),

    getCorreoArgentinoTracking: publicProcedure
      .input(z.string().min(1).max(100))
      .query(async ({ input }) => {
        return shipping.getCorreoArgentinoTracking(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
