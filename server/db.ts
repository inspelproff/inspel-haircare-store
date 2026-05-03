import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  products,
  orders,
  orderItems,
  customers,
  shipments,
  type Product,
  type Order,
  type Customer,
  type OrderItem,
  type Shipment
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ PRODUCTS ============

export async function getAllProducts(): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(products).where(eq(products.active, true));
}

export async function getProductsByLine(line: "Nutriessence" | "Strength"): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(products).where(
    and(eq(products.line, line), eq(products.active, true))
  );
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProduct(data: {
  name: string;
  line: "Nutriessence" | "Strength";
  description?: string;
  price: string;
  stock: number;
  image?: string;
  icon?: string;
  badge?: string;
}): Promise<Product> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(products).values({
    name: data.name,
    line: data.line,
    description: data.description,
    price: data.price,
    stock: data.stock,
    image: data.image,
    icon: data.icon,
    badge: data.badge,
    active: true,
  });
  
  const id = Number((result as any).insertId);
  const product = await getProductById(id);
  if (!product) throw new Error("Failed to create product");
  return product;
}

export async function updateProduct(id: number, data: Partial<{
  name: string;
  line: "Nutriessence" | "Strength";
  description: string;
  price: string;
  stock: number;
  image: string;
  icon: string;
  badge: string;
  active: boolean;
}>): Promise<Product> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(products).set(data).where(eq(products.id, id));
  
  const product = await getProductById(id);
  if (!product) throw new Error("Failed to update product");
  return product;
}

export async function deleteProduct(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(products).set({ active: false }).where(eq(products.id, id));
}

// ============ CUSTOMERS ============

export async function createCustomer(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
}): Promise<Customer> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(customers).values(data);
  const id = Number((result as any).insertId);
  
  const customer = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!customer.length) throw new Error("Failed to create customer");
  return customer[0];
}

export async function getCustomerById(id: number): Promise<Customer | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ ORDERS ============

export async function createOrder(data: {
  orderNumber: string;
  customerId: number;
  subtotal: string;
  shippingCost: string;
  total: string;
  paymentMethod: "mercadopago" | "transfer";
  notes?: string;
  items: Array<{
    productId: number;
    quantity: number;
    price: string;
  }>;
}): Promise<Order> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Iniciar una transacción para asegurar la atomicidad
  return db.transaction(async (tx) => {
    // 1. Verificar y descontar stock
    for (const item of data.items) {
      const product = await tx.select().from(products).where(eq(products.id, item.productId)).for("update").limit(1);
      if (!product.length || product[0].stock < item.quantity) {
        throw new Error(`Stock insuficiente para el producto ${item.productId}`);
      }
      await tx.update(products).set({ stock: product[0].stock - item.quantity }).where(eq(products.id, item.productId));
    }

    // 2. Crear el pedido
    const result = await tx.insert(orders).values({
      orderNumber: data.orderNumber,
      customerId: data.customerId,
      subtotal: data.subtotal,
      shippingCost: data.shippingCost,
      total: data.total,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      status: "pending",
      paymentStatus: "pending",
    });

    const orderId = Number((result as any).insertId);

    // 3. Crear los ítems del pedido
    for (const item of data.items) {
      await tx.insert(orderItems).values({
        orderId: orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      });
    }

    const newOrder = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!newOrder.length) throw new Error("Failed to retrieve created order");
    return newOrder[0];
  });
}

export async function getOrderById(id: number): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllOrders(): Promise<Order[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(id: number, status: Order["status"]): Promise<Order> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(orders).set({ status }).where(eq(orders.id, id));
  
  const order = await getOrderById(id);
  if (!order) throw new Error("Failed to update order");
  return order;
}

export async function updateOrderPaymentStatus(
  id: number, 
  paymentStatus: Order["paymentStatus"],
  mercadopagoId?: string
): Promise<Order> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { paymentStatus };
  if (mercadopagoId) updateData.mercadopagoId = mercadopagoId;
  
  await db.update(orders).set(updateData).where(eq(orders.id, id));
  
  const order = await getOrderById(id);
  if (!order) throw new Error("Failed to update order payment status");
  return order;
}

// ============ ORDER ITEMS ============

// createOrderItem ya no es llamada directamente desde el router, se maneja dentro de createOrder transactional.

export async function getOrderItems(orderId: number): Promise<OrderItem[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

// ============ SHIPMENTS ============

export async function createShipment(data: {
  orderId: number;
  carrier: "andreani" | "correo_argentino";
  trackingNumber?: string;
  carrier_tracking_url?: string;
}): Promise<Shipment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(shipments).values({
    ...data,
    status: "pending",
  });
  
  const id = Number((result as any).insertId);
  const shipment = await db.select().from(shipments).where(eq(shipments.id, id)).limit(1);
  if (!shipment.length) throw new Error("Failed to create shipment");
  return shipment[0];
}

export async function getShipmentByOrderId(orderId: number): Promise<Shipment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(shipments).where(eq(shipments.orderId, orderId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateShipmentStatus(
  id: number,
  status: Shipment["status"],
  actualDelivery?: Date
): Promise<Shipment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (actualDelivery) updateData.actualDelivery = actualDelivery;
  
  await db.update(shipments).set(updateData).where(eq(shipments.id, id));
  
  const shipment = await db.select().from(shipments).where(eq(shipments.id, id)).limit(1);
  if (!shipment.length) throw new Error("Failed to update shipment");
  return shipment[0];
}


// ============ HELPER FUNCTIONS FOR NOTIFICATIONS & EMAILS ============

export async function triggerOrderNotifications(orderId: number) {
  try {
    const db = await getDb();
    if (!db) return;

    // Get order with items and customer
    const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order.length) return;

    const customer = await db.select().from(customers).where(eq(customers.id, order[0].customerId)).limit(1);
    if (!customer.length) return;

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    
    // Import here to avoid circular dependencies
    const { notifyNewOrder } = await import('./notifications');
    const { sendOrderConfirmationEmail } = await import('./email');

    const itemDetails = await Promise.all(
      items.map(async (item) => {
        const product = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
        return {
          name: product[0]?.name || 'Producto',
          quantity: item.quantity,
          price: item.price,
        };
      })
    );

    // Send notification to owner
    await notifyNewOrder({
      orderNumber: order[0].orderNumber,
      customerName: `${customer[0].firstName} ${customer[0].lastName}`,
      customerEmail: customer[0].email,
      total: order[0].total,
      itemCount: items.length,
      items: itemDetails.map((item) => ({ name: item.name, quantity: item.quantity })),
    });

    // Send confirmation email to customer
    await sendOrderConfirmationEmail({
      customerEmail: customer[0].email,
      customerName: customer[0].firstName,
      orderNumber: order[0].orderNumber,
      items: itemDetails,
      subtotal: order[0].subtotal,
      shippingCost: order[0].shippingCost,
      total: order[0].total,
    });
  } catch (error) {
    console.error('[DB] Error triggering order notifications:', error);
  }
}

export async function triggerShippingNotification(shipmentId: number) {
  try {
    const db = await getDb();
    if (!db) return;

    const shipment = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
    if (!shipment.length) return;

    const order = await db.select().from(orders).where(eq(orders.id, shipment[0].orderId)).limit(1);
    if (!order.length) return;

    const customer = await db.select().from(customers).where(eq(customers.id, order[0].customerId)).limit(1);
    if (!customer.length) return;

    const { notifyOrderShipped } = await import('./notifications');
    const { sendShippingNotificationEmail } = await import('./email');

    await notifyOrderShipped({
      orderNumber: order[0].orderNumber,
      customerName: customer[0].firstName,
      carrier: shipment[0].carrier,
      trackingNumber: shipment[0].trackingNumber || 'N/A',
    });

    await sendShippingNotificationEmail({
      customerEmail: customer[0].email,
      customerName: customer[0].firstName,
      orderNumber: order[0].orderNumber,
      carrier: shipment[0].carrier,
      trackingNumber: shipment[0].trackingNumber || '',
      trackingUrl: shipment[0].carrier_tracking_url || undefined,
    });
  } catch (error) {
    console.error('[DB] Error triggering shipping notification:', error);
  }
}

export async function triggerDeliveryNotification(shipmentId: number) {
  try {
    const db = await getDb();
    if (!db) return;

    const shipment = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
    if (!shipment.length) return;

    const order = await db.select().from(orders).where(eq(orders.id, shipment[0].orderId)).limit(1);
    if (!order.length) return;

    const customer = await db.select().from(customers).where(eq(customers.id, order[0].customerId)).limit(1);
    if (!customer.length) return;

    const { notifyOrderDelivered } = await import('./notifications');
    const { sendDeliveryNotificationEmail } = await import('./email');

    const deliveryDate = shipment[0].actualDelivery 
      ? new Date(shipment[0].actualDelivery).toLocaleDateString('es-AR')
      : new Date().toLocaleDateString('es-AR');

    await notifyOrderDelivered({
      orderNumber: order[0].orderNumber,
      customerName: customer[0].firstName,
      deliveryDate,
    });

    await sendDeliveryNotificationEmail({
      customerEmail: customer[0].email,
      customerName: customer[0].firstName,
      orderNumber: order[0].orderNumber,
      deliveryDate,
    });
  } catch (error) {
    console.error('[DB] Error triggering delivery notification:', error);
  }
}
