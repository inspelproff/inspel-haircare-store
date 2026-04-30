import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, LogOut } from 'lucide-react';

type AdminTab = 'productos' | 'pedidos' | 'clientes' | 'envios';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<AdminTab>('productos');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    line: 'Nutriessence' as 'Nutriessence' | 'Strength',
    description: '',
    price: '',
    stock: '',
    icon: '',
    badge: '',
  });

  // Queries
  const { data: products = [] } = trpc.products.getAll.useQuery();
  const { data: orders = [] } = trpc.orders.getAll.useQuery();
  const { data: customers = [] } = trpc.customers.getAll.useQuery();
  const { data: shipments = [] } = trpc.shipments.getAll.useQuery();

  // Mutations
  const createProduct = trpc.products.create.useMutation();
  const updateProduct = trpc.products.update.useMutation();
  const deleteProduct = trpc.products.delete.useMutation();

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        <p>Acceso denegado. Solo administradores pueden acceder.</p>
        <Button onClick={() => setLocation('/')}>Volver al inicio</Button>
      </div>
    );
  }

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price || !formData.stock) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          ...formData,
          stock: parseInt(formData.stock),
        });
      } else {
        await createProduct.mutateAsync({
          ...formData,
          stock: parseInt(formData.stock),
        });
      }
      setShowProductForm(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        line: 'Nutriessence',
        description: '',
        price: '',
        stock: '',
        icon: '',
        badge: '',
      });
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar el producto');
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      line: product.line,
      description: product.description || '',
      price: product.price,
      stock: product.stock.toString(),
      icon: product.icon || '',
      badge: product.badge || '',
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await deleteProduct.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error al eliminar el producto');
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--white)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--black)',
        borderBottom: '1px solid rgba(201,168,76,0.2)',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div>
          <h1 style={{ fontSize: '24px', color: 'var(--gold)', fontFamily: 'Cormorant Garamond, serif', margin: 0 }}>
            Panel de Administración
          </h1>
          <p style={{ fontSize: '12px', color: '#999', margin: '5px 0 0 0' }}>
            Bienvenido, {user.name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            onClick={() => setLocation('/')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(201,168,76,0.3)',
              color: 'var(--gold)',
              padding: '8px 16px',
              fontSize: '12px',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          >
            Volver a Tienda
          </Button>
          <Button
            onClick={handleLogout}
            style={{
              background: 'rgba(200,50,50,0.1)',
              border: '1px solid rgba(200,50,50,0.3)',
              color: '#ff6b6b',
              padding: '8px 16px',
              fontSize: '12px',
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <LogOut size={14} /> Salir
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(201,168,76,0.2)',
        background: 'rgba(201,168,76,0.02)',
        padding: '0 20px',
      }}>
        {(['productos', 'pedidos', 'clientes', 'envios'] as AdminTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === tab ? 'var(--gold)' : '#999',
              padding: '15px 20px',
              fontSize: '14px',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid var(--gold)' : 'none',
              transition: 'all 0.3s',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* PRODUCTOS TAB */}
        {activeTab === 'productos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', color: 'var(--gold)', margin: 0 }}>Gestión de Productos</h2>
              <Button
                onClick={() => {
                  setEditingProduct(null);
                  setFormData({
                    name: '',
                    line: 'Nutriessence',
                    description: '',
                    price: '',
                    stock: '',
                    icon: '',
                    badge: '',
                  });
                  setShowProductForm(true);
                }}
                style={{
                  background: 'var(--gold)',
                  color: 'var(--black)',
                  border: 'none',
                  padding: '10px 16px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 'bold',
                }}
              >
                <Plus size={16} /> Nuevo Producto
              </Button>
            </div>

            {/* Product Form */}
            {showProductForm && (
              <div style={{
                background: 'rgba(201,168,76,0.05)',
                border: '1px solid rgba(201,168,76,0.2)',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
              }}>
                <h3 style={{ color: 'var(--gold)', marginTop: 0 }}>
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(201,168,76,0.2)',
                        color: 'var(--white)',
                        padding: '8px',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                      Línea
                    </label>
                    <select
                      value={formData.line}
                      onChange={(e) => setFormData({ ...formData, line: e.target.value as 'Nutriessence' | 'Strength' })}
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(201,168,76,0.2)',
                        color: 'var(--white)',
                        padding: '8px',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="Nutriessence">Nutriessence</option>
                      <option value="Strength">Strength</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                      Precio
                    </label>
                    <input
                      type="text"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="450.00"
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(201,168,76,0.2)',
                        color: 'var(--white)',
                        padding: '8px',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                      Stock
                    </label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(201,168,76,0.2)',
                        color: 'var(--white)',
                        padding: '8px',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                      Ícono (emoji)
                    </label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="🧴"
                      maxLength={2}
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(201,168,76,0.2)',
                        color: 'var(--white)',
                        padding: '8px',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                      Badge
                    </label>
                    <input
                      type="text"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="Bestseller"
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(201,168,76,0.2)',
                        color: 'var(--white)',
                        padding: '8px',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(201,168,76,0.2)',
                      color: 'var(--white)',
                      padding: '8px',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                      minHeight: '80px',
                      fontFamily: 'Jost, sans-serif',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <Button
                    onClick={handleSaveProduct}
                    style={{
                      background: 'var(--gold)',
                      color: 'var(--black)',
                      border: 'none',
                      padding: '10px 16px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                    }}
                  >
                    Guardar
                  </Button>
                  <Button
                    onClick={() => setShowProductForm(false)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(201,168,76,0.3)',
                      color: 'var(--gold)',
                      padding: '10px 16px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Products Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px',
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.05)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--gold)' }}>Nombre</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--gold)' }}>Línea</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--gold)' }}>Precio</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--gold)' }}>Stock</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--gold)' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product: any) => (
                    <tr key={product.id} style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                      <td style={{ padding: '12px' }}>
                        <span style={{ marginRight: '8px' }}>{product.icon}</span>
                        {product.name}
                      </td>
                      <td style={{ padding: '12px' }}>{product.line}</td>
                      <td style={{ padding: '12px', color: 'var(--gold)' }}>${product.price}</td>
                      <td style={{ padding: '12px', color: product.stock < 10 ? '#ff6b6b' : '#fff' }}>
                        {product.stock}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleEditProduct(product)}
                            style={{
                              background: 'rgba(59,130,196,0.1)',
                              border: '1px solid rgba(59,130,196,0.3)',
                              color: 'var(--blue)',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              borderRadius: '3px',
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Edit2 size={12} /> Editar
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            style={{
                              background: 'rgba(200,50,50,0.1)',
                              border: '1px solid rgba(200,50,50,0.3)',
                              color: '#ff6b6b',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              borderRadius: '3px',
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Trash2 size={12} /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PEDIDOS TAB */}
        {activeTab === 'pedidos' && (
          <div>
            <h2 style={{ fontSize: '20px', color: 'var(--gold)', marginBottom: '20px' }}>Gestión de Pedidos</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px',
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.05)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--gold)' }}>Número</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--gold)' }}>Cliente</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--gold)' }}>Total</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--gold)' }}>Estado</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--gold)' }}>Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        No hay pedidos aún
                      </td>
                    </tr>
                  ) : (
                    orders.map((order: any) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                        <td style={{ padding: '12px', color: 'var(--gold)' }}>{order.orderNumber}</td>
                        <td style={{ padding: '12px' }}>-</td>
                        <td style={{ padding: '12px' }}>${order.total}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            background: order.status === 'completed' ? 'rgba(76,175,80,0.1)' : 'rgba(201,168,76,0.1)',
                            color: order.status === 'completed' ? '#4caf50' : 'var(--gold)',
                            padding: '4px 8px',
                            borderRadius: '3px',
                            fontSize: '11px',
                          }}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            background: order.paymentStatus === 'completed' ? 'rgba(76,175,80,0.1)' : 'rgba(255,107,107,0.1)',
                            color: order.paymentStatus === 'completed' ? '#4caf50' : '#ff6b6b',
                            padding: '4px 8px',
                            borderRadius: '3px',
                            fontSize: '11px',
                          }}>
                            {order.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CLIENTES TAB */}
        {activeTab === 'clientes' && (
          <div>
            <h2 style={{ fontSize: '20px', color: 'var(--gold)', marginBottom: '20px' }}>Gestión de Clientes</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px',
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.05)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--gold)' }}>Nombre</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--gold)' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--gold)' }}>Teléfono</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--gold)' }}>Ciudad</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        No hay clientes aún
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer: any) => (
                      <tr key={customer.id} style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                        <td style={{ padding: '12px' }}>{customer.firstName} {customer.lastName}</td>
                        <td style={{ padding: '12px' }}>{customer.email}</td>
                        <td style={{ padding: '12px' }}>{customer.phone}</td>
                        <td style={{ padding: '12px' }}>{customer.city}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ENVIOS TAB */}
        {activeTab === 'envios' && (
          <div>
            <h2 style={{ fontSize: '20px', color: 'var(--gold)', marginBottom: '20px' }}>Gestión de Envíos</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px',
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.05)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--gold)' }}>Número de Seguimiento</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--gold)' }}>Transportista</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--gold)' }}>Estado</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--gold)' }}>Fecha Estimada</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        No hay envíos aún
                      </td>
                    </tr>
                  ) : (
                    shipments.map((shipment: any) => (
                      <tr key={shipment.id} style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                        <td style={{ padding: '12px', color: 'var(--gold)' }}>{shipment.trackingNumber}</td>
                        <td style={{ padding: '12px' }}>{shipment.carrier === 'andreani' ? 'Andreani' : 'Correo Argentino'}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            background: 'rgba(201,168,76,0.1)',
                            color: 'var(--gold)',
                            padding: '4px 8px',
                            borderRadius: '3px',
                            fontSize: '11px',
                          }}>
                            {shipment.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          {shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString('es-AR') : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
