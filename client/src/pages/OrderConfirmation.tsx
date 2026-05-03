import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useRoute } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function OrderConfirmation() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/order/:orderNumber');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const orderNumber = params?.orderNumber;
  const { data: order } = trpc.orders.getByNumber.useQuery(orderNumber || '', {
    enabled: !!orderNumber,
  });

  const { data: orderItems } = trpc.orderItems.getByOrderId.useQuery(order?.id || 0, {
    enabled: !!order?.id,
  });

  const { data: shipment } = trpc.shipments.getByOrderId.useQuery(order?.id || 0, {
    enabled: !!order?.id,
  });

  useEffect(() => {
    if (orderNumber) {
      setLoading(false);
    }
  }, [orderNumber]);

  if (!match) {
    return (
      <div className="min-h-screen bg-[var(--black)] text-[var(--white)] p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-3xl font-light mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Página no encontrada
          </h1>
          <Button
            onClick={() => setLocation('/')}
            className="bg-[var(--gold)] text-[var(--black)] hover:bg-[var(--gold-light)]"
          >
            Volver al Inicio
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--black)] text-[var(--white)] p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="mx-auto mb-4 animate-spin text-[var(--gold)]" />
          <p className="text-[var(--white-dim)]">Cargando información del pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[var(--black)] text-[var(--white)] p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[var(--black-mid)] border border-[rgba(201,168,76,0.13)] p-8 rounded-lg text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-light mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Pedido no encontrado
            </h1>
            <p className="text-[var(--white-dim)] mb-6">
              No pudimos encontrar el pedido con número {orderNumber}
            </p>
            <Button
              onClick={() => setLocation('/')}
              className="bg-[var(--gold)] text-[var(--black)] hover:bg-[var(--gold-light)]"
            >
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isApproved = order.paymentStatus === 'approved';

  return (
    <div className="min-h-screen bg-[var(--black)] text-[var(--white)] p-6">
      <div className="max-w-3xl mx-auto">
        {/* Status Header */}
        <div className="bg-[var(--black-mid)] border border-[rgba(201,168,76,0.13)] p-8 rounded-lg mb-8 text-center">
          {isApproved ? (
            <>
              <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
              <h1 className="text-3xl font-light mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                ¡Pedido Confirmado!
              </h1>
              <p className="text-[var(--white-dim)] mb-4">
                Tu pago ha sido procesado exitosamente
              </p>
            </>
          ) : (
            <>
              <AlertCircle size={64} className="mx-auto mb-4 text-yellow-500" />
              <h1 className="text-3xl font-light mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Pedido Pendiente
              </h1>
              <p className="text-[var(--white-dim)] mb-4">
                Tu pedido está siendo procesado
              </p>
            </>
          )}
          <p className="text-[var(--gold)] text-lg font-medium">
            Número de pedido: <span className="font-semibold">{order.orderNumber}</span>
          </p>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Order Items */}
          <div className="bg-[var(--black-mid)] border border-[rgba(201,168,76,0.13)] p-6 rounded-lg">
            <h2 className="text-xl font-light mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Productos
            </h2>
            <div className="space-y-3">
              {orderItems?.map(item => (
                <div key={item.id} className="flex justify-between text-sm pb-3 border-b border-[rgba(201,168,76,0.13)]">
                  <div>
                    <div className="text-white">Producto ID: {item.productId}</div>
                    <div className="text-[var(--white-dim)] text-xs">Cantidad: {item.quantity}</div>
                  </div>
                  <div className="text-[var(--gold)]">
                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-[var(--black-mid)] border border-[rgba(201,168,76,0.13)] p-6 rounded-lg">
            <h2 className="text-xl font-light mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Resumen
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--white-dim)]">Subtotal</span>
                <span className="text-white">${order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--white-dim)]">Envío</span>
                <span className="text-white">${order.shippingCost}</span>
              </div>
              <div className="flex justify-between text-lg border-t border-[rgba(201,168,76,0.13)] pt-3 mt-3">
                <span className="text-[var(--white-dim)]">Total</span>
                <span className="text-[var(--gold)]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  ${order.total}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Info */}
        {shipment && (
          <div className="bg-[var(--black-mid)] border border-[rgba(201,168,76,0.13)] p-6 rounded-lg mb-8">
            <h2 className="text-xl font-light mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Información de Envío
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--white-dim)]">Transportista</span>
                <span className="text-white capitalize">{shipment.carrier.replace('_', ' ')}</span>
              </div>
              {shipment.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-[var(--white-dim)]">Número de Seguimiento</span>
                  <span className="text-[var(--gold)]">{shipment.trackingNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--white-dim)]">Estado</span>
                <span className="text-white capitalize">{shipment.status.replace('_', ' ')}</span>
              </div>
              {shipment.estimatedDelivery && (
                <div className="flex justify-between">
                  <span className="text-[var(--white-dim)]">Entrega Estimada</span>
                  <span className="text-white">
                    {new Date(shipment.estimatedDelivery).toLocaleDateString('es-AR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Info */}
        <div className="bg-[var(--black-mid)] border border-[rgba(201,168,76,0.13)] p-6 rounded-lg mb-8">
          <h2 className="text-xl font-light mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Estado del Pedido
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--white-dim)]">Estado de Pago</span>
              <span className={`capitalize ${isApproved ? 'text-green-500' : 'text-yellow-500'}`}>
                {order.paymentStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--white-dim)]">Estado del Pedido</span>
              <span className="text-white capitalize">{order.status}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={() => setLocation('/')}
            className="flex-1 bg-[var(--gold)] text-[var(--black)] hover:bg-[var(--gold-light)]"
          >
            Continuar Comprando
          </Button>
        </div>
      </div>
    </div>
  );
}
