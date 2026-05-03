import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Trash2, Plus, Eye } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    line: 'Nutriessence' as 'Nutriessence' | 'Strength',
    description: '',
    price: '',
    stock: '',
    icon: '💇',
    badge: '',
  });

  // Fetch all products
  const { data: allProducts = [], refetch: refetchProducts } = trpc.products.getAll.useQuery();
  
  // Fetch all orders
  const { data: allOrders = [], refetch: refetchOrders } = trpc.orders.getAll.useQuery();

  // Mutations
  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      refetchProducts();
      resetForm();
      setIsOpen(false);
    },
  });

  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      refetchProducts();
      resetForm();
      setIsOpen(false);
    },
  });

  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      refetchProducts();
    },
  });

  const updateOrderStatusMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      refetchOrders();
    },
  });

  // Check admin access
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[var(--black)] text-[var(--white)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Acceso Denegado</h1>
          <p className="mb-6">Solo los administradores pueden acceder a esta página.</p>
          <Button onClick={() => setLocation('/')}>Volver al Inicio</Button>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      name: '',
      line: 'Nutriessence',
      description: '',
      price: '',
      stock: '',
      icon: '💇',
      badge: '',
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        ...formData,
        stock: parseInt(formData.stock),
      });
    } else {
      await createMutation.mutateAsync({
        ...formData,
        stock: parseInt(formData.stock),
      });
    }
  };

  const handleEdit = (product: any) => {
    setFormData({
      name: product.name,
      line: product.line,
      description: product.description || '',
      price: product.price,
      stock: product.stock.toString(),
      icon: product.icon || '💇',
      badge: product.badge || '',
    });
    setEditingId(product.id);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    await updateOrderStatusMutation.mutateAsync({
      id: orderId,
      status: newStatus as any,
    });
  };

  return (
    <div className="min-h-screen bg-[var(--black)] text-[var(--white)] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Panel de Administración
          </h1>
          <p className="text-[var(--white-dim)]">Gestiona el catálogo y pedidos de Inspel</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-[rgba(201,168,76,0.13)]">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-3 text-sm font-medium tracking-widest uppercase transition-colors ${
              activeTab === 'products'
                ? 'text-[var(--gold)] border-b-2 border-[var(--gold)]'
                : 'text-[var(--white-dim)] hover:text-[var(--white)]'
            }`}
          >
            Productos
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-3 text-sm font-medium tracking-widest uppercase transition-colors ${
              activeTab === 'orders'
                ? 'text-[var(--gold)] border-b-2 border-[var(--gold)]'
                : 'text-[var(--white-dim)] hover:text-[var(--white)]'
            }`}
          >
            Pedidos
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            {/* Add Product Button */}
            <div className="mb-6">
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      resetForm();
                      setIsOpen(true);
                    }}
                    className="bg-[var(--gold)] text-[var(--black)] hover:bg-[var(--gold-light)] flex items-center gap-2"
                  >
                    <Plus size={20} />
                    Agregar Producto
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[var(--black-mid)] border-[rgba(201,168,76,0.2)] text-white">
                  <DialogHeader>
                    <DialogTitle className="text-[var(--gold)]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                      {editingId ? 'Editar Producto' : 'Nuevo Producto'}
                    </DialogTitle>
                    <DialogDescription className="text-[var(--white-dim)]">
                      {editingId ? 'Actualiza los datos del producto' : 'Completa los datos del nuevo producto'}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs tracking-widest uppercase text-[var(--gold)] mb-2">
                        Nombre
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-[var(--black-soft)] border-[rgba(201,168,76,0.2)] text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs tracking-widest uppercase text-[var(--gold)] mb-2">
                        Línea
                      </label>
                      <Select value={formData.line} onValueChange={(value: any) => setFormData({ ...formData, line: value })}>
                        <SelectTrigger className="bg-[var(--black-soft)] border-[rgba(201,168,76,0.2)] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--black-mid)] border-[rgba(201,168,76,0.2)]">
                          <SelectItem value="Nutriessence">Nutriessence</SelectItem>
                          <SelectItem value="Strength">Strength</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs tracking-widest uppercase text-[var(--gold)] mb-2">
                        Descripción
                      </label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="bg-[var(--black-soft)] border-[rgba(201,168,76,0.2)] text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs tracking-widest uppercase text-[var(--gold)] mb-2">
                          Precio (ARS)
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="bg-[var(--black-soft)] border-[rgba(201,168,76,0.2)] text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs tracking-widest uppercase text-[var(--gold)] mb-2">
                          Stock
                        </label>
                        <Input
                          type="number"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                          className="bg-[var(--black-soft)] border-[rgba(201,168,76,0.2)] text-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs tracking-widest uppercase text-[var(--gold)] mb-2">
                          Ícono
                        </label>
                        <Input
                          value={formData.icon}
                          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                          className="bg-[var(--black-soft)] border-[rgba(201,168,76,0.2)] text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs tracking-widest uppercase text-[var(--gold)] mb-2">
                          Badge
                        </label>
                        <Input
                          value={formData.badge}
                          onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                          className="bg-[var(--black-soft)] border-[rgba(201,168,76,0.2)] text-white"
                          placeholder="Ej: Bestseller"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        className="flex-1 bg-[var(--gold)] text-[var(--black)] hover:bg-[var(--gold-light)]"
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        {editingId ? 'Actualizar' : 'Crear'} Producto
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setIsOpen(false);
                        }}
                        className="flex-1 bg-[var(--charcoal)] text-white hover:bg-[var(--black-soft)]"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Products Table */}
            <div className="bg-[var(--black-mid)] border border-[rgba(201,168,76,0.13)] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(201,168,76,0.13)] bg-[var(--charcoal)]">
                      <th className="px-6 py-4 text-left text-xs tracking-widest uppercase text-[var(--gold)]">
                        Nombre
                      </th>
                      <th className="px-6 py-4 text-left text-xs tracking-widest uppercase text-[var(--gold)]">
                        Línea
                      </th>
                      <th className="px-6 py-4 text-left text-xs tracking-widest uppercase text-[var(--gold)]">
                        Precio
                      </th>
                      <th className="px-6 py-4 text-left text-xs tracking-widest uppercase text-[var(--gold)]">
                        Stock
                      </th>
                      <th className="px-6 py-4 text-left text-xs tracking-widest uppercase text-[var(--gold)]">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProducts.map((product: any) => (
                      <tr key={product.id} className="border-b border-[rgba(201,168,76,0.13)] hover:bg-[var(--black-soft)] transition-colors">
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{product.icon}</span>
                            {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`text-xs tracking-widest uppercase ${product.line === 'Strength' ? 'text-[var(--blue-light)]' : 'text-[var(--gold)]'}`}>
                            {product.line}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="text-[var(--gold)]">${product.price}</span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={product.stock > 10 ? 'text-green-400' : product.stock > 0 ? 'text-yellow-400' : 'text-red-400'}>
                            {product.stock} unidades
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-2 hover:bg-[rgba(201,168,76,0.1)] rounded transition-colors text-[var(--gold)]"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-2 hover:bg-[rgba(226,75,74,0.1)] rounded transition-colors text-red-500"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {allProducts.length === 0 && (
                <div className="p-8 text-center text-[var(--white-dim)]">
                  No hay productos. Crea el primero para comenzar.
                </div>
              )}
            </div>
          </>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-[var(--black-mid)] border border-[rgba(201,168,76,0.13)] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(201,168,76,0.13)] bg-[var(--charcoal)]">
                    <th className="px-6 py-4 text-left text-xs tracking-widest uppercase text-[var(--gold)]">
                      Número
                    </th>
                    <th className="px-6 py-4 text-left text-xs tracking-widest uppercase text-[var(--gold)]">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-xs tracking-widest uppercase text-[var(--gold)]">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs tracking-widest uppercase text-[var(--gold)]">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs tracking-widest uppercase text-[var(--gold)]">
                      Pago
                    </th>
                    <th className="px-6 py-4 text-left text-xs tracking-widest uppercase text-[var(--gold)]">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.map((order: any) => (
                    <tr key={order.id} className="border-b border-[rgba(201,168,76,0.13)] hover:bg-[var(--black-soft)] transition-colors">
                      <td className="px-6 py-4 text-sm">
                        <span className="text-[var(--gold)] font-medium">{order.orderNumber}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white">
                        {order.customerId}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="text-[var(--gold)]">${order.total}</span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Select value={order.status} onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}>
                          <SelectTrigger className="w-32 bg-[var(--black-soft)] border-[rgba(201,168,76,0.2)] text-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[var(--black-mid)] border-[rgba(201,168,76,0.2)]">
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="confirmed">Confirmado</SelectItem>
                            <SelectItem value="processing">Procesando</SelectItem>
                            <SelectItem value="shipped">Enviado</SelectItem>
                            <SelectItem value="delivered">Entregado</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`text-xs px-2 py-1 rounded ${
                          order.paymentStatus === 'approved' ? 'bg-green-500/20 text-green-400' :
                          order.paymentStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 hover:bg-[rgba(201,168,76,0.1)] rounded transition-colors text-[var(--gold)]"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {allOrders.length === 0 && (
              <div className="p-8 text-center text-[var(--white-dim)]">
                No hay pedidos aún.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
