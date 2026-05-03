import "dotenv/config";
import express from "express";
import crypto from "crypto";
import helmet from "helmet";
import cors from "cors";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import * as db from "../db";
import * as payment from "../payment";
import { Order } from "../../drizzle/schema";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Middleware de seguridad
  app.use(helmet());
  app.use(cors({
    origin: process.env.NODE_ENV === "production" ? "https://inspel.com" : "*", // Ajustar en producción
    credentials: true,
  }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
    // Mercado Pago Webhook
  app.post("/webhooks/mercadopago", async (req, res) => {
    try {
      // Aquí se procesará la notificación de Mercado Pago
      // Se espera que Mercado Pago envíe un 'id' y un 'topic' en el cuerpo de la solicitud.
      // El 'id' será el ID del pago o de la preferencia, dependiendo del 'topic'.
      // El 'topic' indica el tipo de evento (e.g., 'payment', 'merchant_order').
      // Para este caso, nos enfocaremos en el 'topic' 'payment' para actualizar el estado del pedido.
      const { id, topic } = req.body;
      const signature = req.headers["x-signature"] as string;
      const timestamp = req.headers["x-request-id"] as string; // Mercado Pago usa x-request-id como timestamp

      if (!signature || !timestamp) {
        console.warn("Mercado Pago Webhook: Firma o Timestamp faltante en las cabeceras.", req.headers);
        return res.status(400).send("Bad Request: Missing signature or timestamp");
      }

      const secret = ENV.mercadoPagoWebhookSecret;
      if (!secret) {
        console.error("Mercado Pago Webhook: MERCADO_PAGO_WEBHOOK_SECRET no configurado.");
        return res.status(500).send("Server Error: Webhook secret not configured");
      }

      const dataToHash = `id:${id};topic:${topic};timestamp:${timestamp};`;
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(dataToHash);
      const expectedSignature = hmac.digest("hex");

      if (expectedSignature !== signature) {
        console.warn("Mercado Pago Webhook: Firma inválida.", { received: signature, expected: expectedSignature });
        return res.status(403).send("Forbidden: Invalid signature");
      }

      if (!id || !topic) {
        console.warn("Mercado Pago Webhook: ID o Topic faltante en el body.", req.body);
        return res.status(400).send("Bad Request: Missing ID or Topic");
      }

      if (topic === "payment") {
        // El ID recibido es el ID del pago de Mercado Pago
        const paymentId = id;
        const paymentDetails = await payment.getMercadoPagoPaymentStatus(paymentId);

        if (paymentDetails && paymentDetails.externalReference) {
          const orderNumber = paymentDetails.externalReference;
          const order = await db.getOrderByNumber(orderNumber);

          if (order) {
            let newPaymentStatus: Order["paymentStatus"];
            let newOrderStatus: Order["status"] = order.status;

            switch (paymentDetails.status) {
              case "approved":
                newPaymentStatus = "approved";
                newOrderStatus = "confirmed"; // O el estado que corresponda tras el pago
                break;
              case "pending":
                newPaymentStatus = "pending";
                break;
              case "rejected":
                newPaymentStatus = "rejected";
                break;
              case "cancelled":
                newPaymentStatus = "cancelled";
                break;
              default:
                newPaymentStatus = "pending";
            }

            await db.updateOrderPaymentStatus(order.id, newPaymentStatus, paymentId);
            if (newOrderStatus !== order.status) {
              await db.updateOrderStatus(order.id, newOrderStatus);
            }
            console.log(`Pedido ${order.id} actualizado: paymentStatus=${newPaymentStatus}, status=${newOrderStatus}`);
          } else {
            console.warn(`Mercado Pago Webhook: Pedido con externalReference ${orderNumber} no encontrado.`);
          }
        } else {
          console.warn("Mercado Pago Webhook: No se pudieron obtener detalles de pago o externalReference.", paymentDetails);
        }
      } else {
        console.log(`Mercado Pago Webhook: Topic ${topic} recibido, no procesado.`);
      }
      res.status(200).send("OK");
    } catch (error) {
      console.error("Error en el webhook de Mercado Pago:", error);
      res.status(500).send("Error interno del servidor");
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
