# Política de Seguridad - Inspel Hair Care Store

## Resumen Ejecutivo

Esta plataforma implementa estándares de seguridad de nivel empresarial para proteger los datos de clientes, pedidos y operaciones administrativas.

---

## 1. Autenticación y Autorización

### 🔐 Sistema de Autenticación
- **OAuth 2.0**: Integración con servidor OAuth centralizado
- **JWT (JSON Web Tokens)**: Tokens firmados con algoritmo HS256
- **Sesiones Seguras**: Cookies HTTP-only con expiración de 1 año
- **Validación en Servidor**: Cada solicitud se valida en el servidor

### 👤 Control de Acceso por Rol
- **Usuarios Públicos**: Pueden ver catálogo, crear pedidos, ver estado de pedidos
- **Administradores**: Acceso completo a panel, gestión de productos, pedidos y envíos
- **Rutas Protegidas**: El panel de admin (`/admin`) requiere autenticación como administrador
  - Si un usuario no autenticado intenta acceder, es redirigido a inicio
  - Si un usuario autenticado pero no admin intenta acceder, es redirigido a inicio

### 🛡️ Protección de Procedimientos tRPC
```typescript
// adminProcedure - Solo administradores
// protectedProcedure - Solo usuarios autenticados
// publicProcedure - Acceso público
```

---

## 2. Validación de Datos

### ✅ Esquemas Zod Estrictos
Todos los datos de entrada se validan con esquemas Zod que incluyen:

#### Productos
- Nombre: 1-255 caracteres
- Precio: Formato decimal válido (XX.XX)
- Stock: 0-999,999 unidades
- Descripción: Máximo 5000 caracteres
- URLs de imagen: Deben ser URLs válidas

#### Clientes
- Nombres: 1-100 caracteres
- Email: Formato válido
- Teléfono: 5-20 caracteres, solo números y símbolos válidos
- Dirección: 5-500 caracteres
- Ciudad/Provincia: 1-100 caracteres

#### Órdenes
- Validación de cliente existente
- Validación de productos existentes
- Validación de stock disponible
- Montos en formato decimal válido

#### Pagos (Mercado Pago)
- IDs de orden: 1-50 caracteres
- Nombres de pagador: 1-255 caracteres
- URLs de callback: Deben ser URLs válidas

### 🚫 Prevención de Inyecciones
- **SQL Injection**: Uso de Drizzle ORM con parámetros preparados
- **XSS (Cross-Site Scripting)**: Sanitización de strings, límites de longitud
- **NoSQL Injection**: Validación estricta de tipos con Zod
- **HTML/Script Injection**: Remoción de caracteres peligrosos (`<`, `>`)

---

## 3. Protección del Carrito

### 💾 Persistencia Segura
- Carrito almacenado en `localStorage` del navegador
- No se transmite información sensible en el carrito
- Validación completa en el servidor al crear órdenes

### 🔄 Flujo de Checkout Seguro
1. Cliente agrega productos al carrito (localStorage)
2. Cliente navega a checkout
3. Cliente completa formulario con datos personales
4. **Servidor valida**:
   - Existencia del cliente
   - Existencia de productos
   - Stock disponible
   - Montos correctos
5. Orden se crea en base de datos
6. Redirección a Mercado Pago para pago

---

## 4. Gestión de Órdenes y Pagos

### 📋 Estados de Órdenes
- **pending**: Recién creada, esperando pago
- **confirmed**: Pago confirmado
- **processing**: Preparando envío
- **shipped**: Enviada
- **delivered**: Entregada
- **cancelled**: Cancelada

### 💳 Integración Mercado Pago
- Tokens de acceso almacenados en variables de entorno
- Preferencias creadas con URLs de callback validadas
- IDs de transacción almacenados para auditoría
- Solo administradores pueden actualizar estado de pago

### 📧 Notificaciones Seguras
- Emails de confirmación enviados al cliente
- Emails de envío con tracking
- Notificaciones al administrador
- Todos los datos sanitizados antes de enviar

---

## 5. Panel de Administración

### 🔒 Acceso Restringido
- Requiere autenticación OAuth
- Requiere rol de administrador
- ProtectedRoute valida permisos antes de renderizar
- Redirección automática si no tiene permisos

### 🎛️ Funcionalidades del Admin
1. **Gestión de Productos**
   - Crear, editar, eliminar productos
   - Controlar stock
   - Validación de precios y descripciones

2. **Gestión de Pedidos**
   - Ver todos los pedidos
   - Cambiar estado de pedidos
   - Ver detalles de cliente y productos
   - Actualizar estado de pago

3. **Gestión de Envíos**
   - Crear envíos (Andreani, Correo Argentino)
   - Actualizar tracking
   - Ver estado de entrega

---

## 6. Protección de Datos Sensibles

### 🔑 Variables de Entorno
- `DATABASE_URL`: Conexión a base de datos
- `MERCADO_PAGO_ACCESS_TOKEN`: Token de Mercado Pago
- `COOKIE_SECRET`: Secreto para firmar JWT
- `OAUTH_SERVER_URL`: URL del servidor OAuth

**Nunca** se deben commitear variables de entorno al repositorio.

### 🗄️ Base de Datos
- Contraseñas: **No se almacenan** (OAuth)
- Tokens: Firmados con JWT, no se almacenan en BD
- Datos de tarjeta: **No se almacenan** (Mercado Pago)
- Datos personales: Encriptados en tránsito (HTTPS)

---

## 7. Comunicación Segura

### 🔐 HTTPS
- Todas las comunicaciones deben ser HTTPS en producción
- Certificados SSL/TLS válidos
- Headers de seguridad configurados

### 🚀 Headers de Seguridad
```
Content-Security-Policy: Previene XSS
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: Fuerza HTTPS
```

---

## 8. Auditoría y Logging

### 📊 Eventos Auditados
- Intentos de acceso al panel de admin
- Creación, edición, eliminación de productos
- Creación de órdenes
- Cambios de estado de órdenes
- Cambios de estado de pago
- Creación de envíos

### 📝 Logs
- Todos los errores se registran
- Intentos de acceso no autorizado se registran
- Cambios administrativos se registran con timestamp

---

## 9. Mejores Prácticas de Desarrollo

### ✅ Checklist de Seguridad
- [ ] Nunca commitear variables de entorno
- [ ] Validar todos los datos de entrada
- [ ] Usar adminProcedure para operaciones administrativas
- [ ] Verificar permisos en el servidor, no solo en el cliente
- [ ] Sanitizar datos antes de mostrar en UI
- [ ] Usar HTTPS en producción
- [ ] Mantener dependencias actualizadas
- [ ] Realizar auditorías de seguridad regularmente

### 🔄 Actualizaciones de Dependencias
```bash
npm audit
npm update
```

---

## 10. Respuesta a Incidentes de Seguridad

### 🚨 Procedimiento
1. **Detectar**: Monitorear logs y alertas
2. **Contener**: Aislar el problema
3. **Investigar**: Determinar el alcance
4. **Remediar**: Aplicar parches
5. **Comunicar**: Notificar a usuarios si es necesario
6. **Documentar**: Registrar el incidente

### 📞 Contacto de Seguridad
Para reportar vulnerabilidades de seguridad, contactar al equipo de desarrollo.

---

## 11. Cumplimiento Normativo

### 📋 Regulaciones
- **GDPR**: Protección de datos personales (EU)
- **CCPA**: Privacidad del consumidor (California)
- **Ley de Protección de Datos**: Cumplimiento local

### 🔐 Derechos de Usuarios
- Derecho a acceder sus datos
- Derecho a solicitar eliminación
- Derecho a portabilidad de datos
- Derecho a revocar consentimiento

---

## 12. Recursos Adicionales

### 📚 Referencias
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Zod Validation](https://zod.dev/)
- [Mercado Pago Security](https://www.mercadopago.com.ar/developers/es/docs)

---

**Última actualización**: Mayo 2, 2026

**Versión**: 1.0

**Responsable**: Equipo de Seguridad
