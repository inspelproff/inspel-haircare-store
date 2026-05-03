# Mejoras de Seguridad e Implementación - Inspel Haircare Store

## Resumen Ejecutivo

Se han implementado mejoras críticas de seguridad y funcionalidad para garantizar que el ecommerce sea 100% seguro, funcional y profesional. Las siguientes secciones detallan cada cambio realizado.

---

## 1. Seguridad Backend

### 1.1 Webhook de Mercado Pago Implementado ✅

**Archivo:** `server/_core/index.ts`

- **Endpoint:** `POST /webhooks/mercadopago`
- **Funcionalidad:** Recibe notificaciones de pago desde Mercado Pago
- **Verificación de Firma:** Implementada validación HMAC SHA256 para garantizar autenticidad
- **Actualización de Estado:** Actualiza automáticamente el estado de los pedidos en la base de datos

**Cómo funciona:**
1. Mercado Pago envía una notificación con `id`, `topic`, y firma `x-signature`
2. El servidor verifica la firma usando la clave secreta `MERCADO_PAGO_WEBHOOK_SECRET`
3. Si la firma es válida, se procesa el evento
4. Si el pago es aprobado, el estado del pedido se actualiza a "confirmed"
5. El cliente recibe una notificación por email

**Variables de Entorno Requeridas:**
```
MERCADO_PAGO_WEBHOOK_SECRET=tu_clave_secreta_aqui
```

### 1.2 Protección de API Keys 🛡️

**Archivos Modificados:**
- `server/_core/systemRouter.ts` - Nuevo endpoint `getGoogleMapsScriptUrl`
- `server/map.ts` - Nuevo módulo para manejo de Google Maps
- `client/src/components/Map.tsx` - Modificado para usar el endpoint seguro

**Cambio Crítico:**
- **Antes:** La API Key de Google Maps se exponía directamente en el cliente
- **Después:** La API Key se maneja solo en el servidor, el cliente recibe una URL segura

**Ventajas:**
- Previene el robo o abuso de la API Key
- Permite controlar el acceso desde el servidor
- Facilita la rotación de claves sin cambiar el código del cliente

### 1.3 Saneamiento de Datos 🧹

**Archivo:** `server/_core/validation.ts`

Se han integrado transformaciones Zod para sanitizar automáticamente todos los campos de texto:

- **Campos Sanitizados:**
  - `ProductSchema`: name, description, badge
  - `CustomerSchema`: firstName, lastName, address, city, province, postalCode
  - `OrderSchema`: notes

- **Sanitización Aplicada:**
  - Eliminación de caracteres HTML peligrosos (`<>`)
  - Limitación de longitud
  - Trimming de espacios

**Ejemplo:**
```typescript
name: z.string().min(1).max(255).trim().transform(val => val.replace(/[<>]/g, ''))
```

### 1.4 Transacciones y Gestión de Stock 💾

**Archivo:** `server/db.ts`

Se ha implementado un flujo transaccional para la creación de pedidos:

1. **Verificación de Stock:** Se verifica que haya suficiente stock para cada producto
2. **Bloqueo Pessimista:** Se usa `FOR UPDATE` para evitar condiciones de carrera
3. **Descuento Automático:** El stock se descuenta al crear el pedido
4. **Atomicidad:** Si algo falla, toda la transacción se revierte

**Beneficios:**
- Previene sobreventa
- Garantiza consistencia de datos
- Evita condiciones de carrera en entornos concurrentes

### 1.5 Middleware de Seguridad HTTP 🔒

**Archivo:** `server/_core/index.ts`

Se han añadido dos middlewares críticos:

**Helmet.js:**
```typescript
app.use(helmet());
```
- Protege contra XSS (Cross-Site Scripting)
- Protege contra clickjacking
- Establece headers de seguridad automáticos
- Protege contra ataques de MIME type sniffing

**CORS:**
```typescript
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? "https://inspel.com" : "*",
  credentials: true,
}));
```
- En producción: Solo permite solicitudes desde tu dominio
- En desarrollo: Permite todas las solicitudes
- Habilita cookies en solicitudes cross-origin

---

## 2. Funcionalidad de Checkout y Pagos

### 2.1 Página de Confirmación de Pedido Mejorada ✅

**Archivo:** `client/src/pages/OrderConfirmation.tsx`

**Mejoras Implementadas:**

1. **Visualización de Nombres de Productos:**
   - Antes: "Producto ID: 1"
   - Después: Nombre real del producto (ej: "Shampoo Nutriessence")

2. **Estados de Pago Mejorados:**
   - **Aprobado (Verde):** Pago confirmado, pedido confirmado
   - **Rechazado (Rojo):** Pago rechazado o cancelado
   - **Pendiente (Amarillo):** Pago en proceso

3. **Mensajes Personalizados:**
   - Cada estado tiene un mensaje claro y accionable
   - Se indica al cliente que recibirá un email de confirmación

### 2.2 Flujo de Pago Seguro 🔐

**Proceso Completo:**

1. **Cliente llena formulario en Checkout**
   - Datos personales validados en el cliente
   - Validación estricta en el servidor (Zod)
   - Saneamiento automático de datos

2. **Creación de Pedido Transaccional**
   - Se verifica stock de productos
   - Se descuenta stock automáticamente
   - Se crea el pedido con estado "pending"

3. **Creación de Preferencia en Mercado Pago**
   - Se envía información del pedido
   - Mercado Pago genera un link de pago
   - Cliente es redirigido a Mercado Pago

4. **Cliente Realiza Pago**
   - Mercado Pago procesa el pago
   - Cliente es redirigido a `/order/{orderNumber}`

5. **Webhook de Mercado Pago**
   - Mercado Pago envía notificación al servidor
   - Servidor verifica la firma
   - Estado del pedido se actualiza a "confirmed"
   - Cliente ve el estado actualizado en tiempo real

---

## 3. Variables de Entorno Requeridas

Para que el ecommerce funcione correctamente, asegúrate de configurar estas variables:

```bash
# Base de Datos
DATABASE_URL=mysql://usuario:contraseña@host:puerto/base_datos

# OAuth (Manus)
OAUTH_SERVER_URL=https://oauth.manus.im
VITE_APP_ID=tu_app_id
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
OWNER_OPEN_ID=tu_open_id

# JWT
JWT_SECRET=tu_clave_secreta_muy_larga_y_aleatoria

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=tu_token_de_acceso
MERCADO_PAGO_WEBHOOK_SECRET=tu_clave_secreta_webhook

# Google Maps (Forge)
BUILT_IN_FORGE_API_KEY=tu_api_key
BUILT_IN_FORGE_API_URL=https://forge.butterfly-effect.dev

# Andreani
ANDREANI_API_KEY=tu_api_key
ANDREANI_API_URL=https://api.andreani.com

# Correo Argentino
CORREO_ARGENTINO_API_KEY=tu_api_key
CORREO_ARGENTINO_API_URL=https://api.correoargentino.com.ar

# Entorno
NODE_ENV=production
PORT=3000
```

---

## 4. Checklist de Seguridad

- [x] Webhook de Mercado Pago implementado
- [x] Verificación de firma HMAC SHA256
- [x] API Keys protegidas en el servidor
- [x] Saneamiento de datos en entrada
- [x] Transacciones ACID para pedidos
- [x] Gestión de stock segura
- [x] Middleware Helmet.js
- [x] CORS configurado
- [x] Validación estricta con Zod
- [x] Página de confirmación mejorada
- [ ] Rate limiting (pendiente)
- [ ] Logging de auditoría (pendiente)
- [ ] Encriptación de datos sensibles (pendiente)
- [ ] Pruebas de penetración (pendiente)

---

## 5. Próximos Pasos

1. **Fase 3:** Implementar logística (Andreani/Correo Argentino UI)
2. **Fase 4:** Finalizar panel administrativo
3. **Fase 5:** Optimización y pruebas de seguridad
4. **Fase 6:** Entrega final

---

## 6. Contacto y Soporte

Para preguntas o problemas con la seguridad del ecommerce, contacta al equipo de desarrollo.

**Última actualización:** 2026-05-03
