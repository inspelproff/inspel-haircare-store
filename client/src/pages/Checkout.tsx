import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { cart, subtotal, clearCart } = useCart();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    carrier: 'andreani' as 'andreani' | 'correo_argentino',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const createCustomerMutation = trpc.customers.create.useMutation();
  const createOrderMutation = trpc.orders.create.useMutation();
  const createMercadoPagoPreferenceMutation = trpc.payments.createMercadoPagoPreference.useMutation();

  const shippingCost = 150; // Placeholder - should be calculated based on carrier and location
  const total = subtotal + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Create customer
      const customer = await createCustomerMutation.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
      });

      // Generate order number
      const orderNumber = `INS-${Date.now()}`;

      // Create order
      const order = await createOrderMutation.mutateAsync({
        orderNumber,
        customerId: customer.id,
        subtotal: subtotal.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        total: total.toFixed(2),
        paymentMethod: 'mercadopago',
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      // Create Mercado Pago preference
      const backUrl = `${window.location.origin}/order/${orderNumber}`;
      const preference = await createMercadoPagoPreferenceMutation.mutateAsync({
        orderId: orderNumber,
        items: cart.map(item => ({
          title: item.name,
          quantity: item.quantity,
          unit_price: parseFloat(item.price),
        })),
        payer: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
        },
        backUrls: {
          success: backUrl,
          failure: backUrl,
          pending: backUrl,
        },
      });

      // Redirect to Mercado Pago
      if (preference.initPoint) {
        clearCart();
        window.location.href = preference.initPoint;
      } else if (preference.sandboxInitPoint) {
        clearCart();
        window.location.href = preference.sandboxInitPoint;
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--black)] text-[var(--white)] p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 text-[var(--gold)] mb-8 hover:text-[var(--gold-light)]"
          >
            <ArrowLeft size={20} />
            Volver
          </button>
          <div className="text-center py-12">
            <h1 className="text-3xl font-light mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Carrito Vacío
            </h1>
            <p className="text-[var(--white-dim)] mb-6">
              Agrega productos antes de proceder al checkout
            </p>
            <Button
              onClick={() => setLocation('/')}
              className="bg-[var(--gold)] text-[var(--black)] hover:bg-[var(--gold-light)]"
            >
              Continuar Comprando
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--black)] text-[var(--white)] p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 text-[var(--gold)] mb-8 hover:text-[var(--gold-light)]"
        >
          <ArrowLeft size={20} />
          Volver
        </button>

        <h1 className="text-4xl font-light mb-8" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div className="bg-[var(--black-mid)] border border-[rgba(201,168,76,0.13)] p-6 rounded-lg">
                <h2 className="text-xl font-light mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Información Personal
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Nombre"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="bg-[var(--black-soft)] border-[rgba(201,168,76,0.2)] text-white"
                    required
                  />
                  <Input
                    placeholder="Apellido"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="bg-[var(--black-soft)] border-[rgba(201,168,76,0.2)] text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-[var(--black-soft)] border-[rgba(201,168,76,0.2)] text-white"
                    required
                  />
                  <Input
                    placeholder="Teléfono"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-[var(--black-soft)] border-[rgba(201,168,76,0.2)] text-white"
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div className="bg-[var(--black-mid)] border border-[rgba(201,168,76,0.13)] p-6 rounded-lg">
                <h2 className="text-xl font-light mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Dirección de Envío
                </h2>
                <Input
                  placeholder="Dirección"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-[var(--black-soft)] border-[rgba(201,168,76,0.2)] text-white mb-4"
                  required
                />
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    placeholder="Ciudad"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="bg-[var(--black-soft)] border-[rgba(201,168,76,0.2)] text-white"
                    required
                  />
                  <Input
                    placeholder="Provincia"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="bg-[var(--black-soft)] border-[rgba(201,168,76,0.2)] text-white"
                    required
                  />
                  <Input
                    placeholder="Código Postal"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="bg-[var(--black-soft)] border-[rgba(201,168,76,0.2)] text-white"
                    required
                  />
                </div>
              </div>

              {/* Shipping */}
              <div className="bg-[var(--black-mid)] border border-[rgba(201,168,76,0.13)] p-6 rounded-lg">
                <h2 className="text-xl font-light mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Método de Envío
                </h2>
                <Select value={formData.carrier} onValueChange={(value: any) => setFormData({ ...formData, carrier: value })}>
                  <SelectTrigger className="bg-[var(--black-soft)] border-[rgba(201,168,76,0.2)] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--black-mid)] border-[rgba(201,168,76,0.2)]">
                    <SelectItem value="andreani">Andreani - $150</SelectItem>
                    <SelectItem value="correo_argentino">Correo Argentino - $150</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full bg-[var(--gold)] text-[var(--black)] hover:bg-[var(--gold-light)] py-3 text-lg"
                disabled={isProcessing}
              >
                {isProcessing ? 'Procesando...' : 'Proceder al Pago'}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-[var(--black-mid)] border border-[rgba(201,168,76,0.13)] p-6 rounded-lg h-fit">
            <h2 className="text-xl font-light mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Resumen del Pedido
            </h2>

            <div className="space-y-3 mb-6 pb-6 border-b border-[rgba(201,168,76,0.13)]">
              {cart.map(item => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <div>
                    <div className="text-white">{item.name}</div>
                    <div className="text-[var(--white-dim)] text-xs">x{item.quantity}</div>
                  </div>
                  <div className="text-[var(--gold)]">
                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--white-dim)]">Subtotal</span>
                <span className="text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--white-dim)]">Envío</span>
                <span className="text-white">${shippingCost.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between text-lg border-t border-[rgba(201,168,76,0.13)] pt-4">
              <span className="text-[var(--white-dim)]">Total</span>
              <span className="text-[var(--gold)]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
