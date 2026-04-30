import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { X, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';

interface CartItem {
  productId: number;
  name: string;
  price: string;
  quantity: number;
  icon: string;
}

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentLine, setCurrentLine] = useState<'Nutriessence' | 'Strength'>('Nutriessence');
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState('');

  // Fetch products
  const { data: products = [], isLoading } = trpc.products.getByLine.useQuery(currentLine);

  // Show toast notification
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  // Add to cart
  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        icon: product.icon || '💇',
      }]);
    }
    showToast(`${product.name} agregado al carrito`);
  };

  // Update quantity
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  // Remove from cart
  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => {
    return sum + (parseFloat(item.price) * item.quantity);
  }, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      showToast('El carrito está vacío');
      return;
    }
    setLocation('/checkout');
  };

  const handleAdminPanel = () => {
    setLocation('/admin');
  };

  return (
    <div className="min-h-screen bg-[var(--black)] text-[var(--white)]">
      {/* Header */}
      <header className="bg-[var(--black)] border-b border-[rgba(201,168,76,0.2)] sticky top-0 z-40 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16">
          <div className="flex flex-col leading-none">
            <span className="text-xl font-medium text-[var(--gold)] tracking-widest" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Inspel
            </span>
            <span className="text-xs font-light tracking-widest text-[var(--white-dim)] uppercase mt-1">
              Premium Hair Care
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === 'admin' && (
              <button
                onClick={handleAdminPanel}
                className="bg-none border border-[rgba(59,130,196,0.35)] text-[var(--blue)] px-4 py-2 text-xs font-light tracking-widest uppercase cursor-pointer transition-all duration-300 hover:bg-[rgba(59,130,196,0.1)] hover:border-[var(--blue)]"
              >
                Admin
              </button>
            )}
            <button
              onClick={() => setCartOpen(!cartOpen)}
              className="bg-none border border-[rgba(201,168,76,0.35)] text-[var(--gold)] px-4 py-2 text-xs font-light tracking-widest uppercase cursor-pointer flex items-center gap-2 transition-all duration-300 hover:bg-[rgba(201,168,76,0.1)] hover:border-[var(--gold)]"
            >
              <span>Carrito</span>
              <span className="bg-[var(--gold)] text-[var(--black)] w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <p className="hero-eyebrow">Dos líneas · Un solo estándar</p>
        <h1 className="hero h1">
          El cuidado que tu cabello<br />
          <em>merece</em>
        </h1>
        <p className="hero-p">
          Fórmulas de alta calidad con ingredientes activos para cada necesidad. Sin parabenos, sin sulfatos.
        </p>
        <div className="cert-row">
          <span className="cert">Sin parabenos</span>
          <span className="cert">Sin sulfatos</span>
          <span className="cert">pH 5.5</span>
        </div>
        <div className="divider-line">
          <span>✦</span>
        </div>
      </section>

      {/* Products Section */}
      <div className="section">
        {/* Tabs */}
        <div className="tabs">
          <button
            onClick={() => setCurrentLine('Nutriessence')}
            className={`tab ${currentLine === 'Nutriessence' ? 'active gold' : ''}`}
          >
            Nutriessence · Argán
          </button>
          <button
            onClick={() => setCurrentLine('Strength')}
            className={`tab ${currentLine === 'Strength' ? 'active blue' : ''}`}
          >
            Strength · Reparación
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="pgrid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="pcard gold-card animate-pulse">
                <div className="pimg" style={{ height: '120px', background: 'rgba(201,168,76,0.1)' }} />
                <div className="pinfo" style={{ height: '150px', background: 'rgba(201,168,76,0.05)' }} />
              </div>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && products.length > 0 && (
          <div className="pgrid">
            {products.map((product: any) => (
              <div
                key={product.id}
                className={`pcard ${currentLine === 'Strength' ? 'blue-card' : 'gold-card'}`}
              >
                <div className={`pimg ${currentLine === 'Strength' ? 'blue-bg' : ''}`}>
                  <div className="picon">{product.icon || '💇'}</div>
                  <div className={`pml ${currentLine === 'Strength' ? 'blue-ml' : ''}`}>
                    {product.line}
                  </div>
                </div>
                {product.badge && (
                  <div className={`pbadge ${currentLine === 'Strength' ? 'blue' : 'gold'}`}>
                    {product.badge}
                  </div>
                )}
                <div className={`pinfo ${currentLine === 'Strength' ? 'blue-border' : ''}`}>
                  <div className="pname" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    {product.name}
                  </div>
                  <div className="pdesc">{product.description}</div>
                  <div className="pfooter">
                    <div className={`pprice ${currentLine === 'Strength' ? 'blue' : 'gold'}`} style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                      ${product.price}
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className={`abtn ${currentLine === 'Strength' ? 'blue' : 'gold'}`}
                    >
                      Agregar al carrito
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>No hay productos disponibles</p>
            <p style={{ fontSize: '14px' }}>Vuelve pronto para ver nuestras nuevas líneas</p>
          </div>
        )}
      </div>

      {/* Benefits Section */}
      <div className="benefits-wrap">
        <div className="bgrid">
          <div className="bitem">
            <div className="bicon">🌿</div>
            <div className="btitle gold">Ingredientes Naturales</div>
            <div className="btext">Fórmulas con extractos naturales de máxima calidad</div>
          </div>
          <div className="bitem">
            <div className="bicon">✨</div>
            <div className="btitle gold">Sin Químicos Dañinos</div>
            <div className="btext">Libre de parabenos, sulfatos y silicones</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: 'rgba(201,168,76,0.05)', borderTop: '1px solid rgba(201,168,76,0.2)', padding: '40px 20px', textAlign: 'center', color: '#999', fontSize: '12px' }}>
        <p>&copy; 2026 Inspel - Premium Hair Care. Todos los derechos reservados.</p>
      </footer>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'var(--gold)',
          color: 'var(--black)',
          padding: '12px 20px',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 50,
          animation: 'slideIn 0.3s ease-out'
        }}>
          {toast}
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '400px',
          height: '100vh',
          background: 'var(--black)',
          borderLeft: '1px solid rgba(201,168,76,0.2)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          {/* Cart Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px',
            borderBottom: '1px solid rgba(201,168,76,0.2)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--gold)', fontFamily: 'Cormorant Garamond, serif' }}>
              Mi Carrito
            </h2>
            <button
              onClick={() => setCartOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--gold)',
                cursor: 'pointer',
                fontSize: '20px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Cart Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', paddingTop: '40px' }}>
                <ShoppingCart size={40} style={{ margin: '0 auto 20px', opacity: 0.5 }} />
                <p>Tu carrito está vacío</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.productId} style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '15px',
                  borderBottom: '1px solid rgba(201,168,76,0.1)',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '24px' }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--white)' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      ${item.price} c/u
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      style={{
                        background: 'rgba(201,168,76,0.1)',
                        border: '1px solid rgba(201,168,76,0.3)',
                        color: 'var(--gold)',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        borderRadius: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}
                    >
                      −
                    </button>
                    <span style={{ width: '20px', textAlign: 'center', fontSize: '12px' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      style={{
                        background: 'rgba(201,168,76,0.1)',
                        border: '1px solid rgba(201,168,76,0.3)',
                        color: 'var(--gold)',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        borderRadius: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      style={{
                        background: 'rgba(200,50,50,0.1)',
                        border: '1px solid rgba(200,50,50,0.3)',
                        color: '#ff6b6b',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        borderRadius: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        marginLeft: '4px'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div style={{
              borderTop: '1px solid rgba(201,168,76,0.2)',
              padding: '20px',
              background: 'rgba(201,168,76,0.05)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '15px',
                fontSize: '14px'
              }}>
                <span>Subtotal:</span>
                <span style={{ color: 'var(--gold)' }}>${subtotal.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                style={{
                  width: '100%',
                  background: 'var(--gold)',
                  color: 'var(--black)',
                  border: 'none',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'all 0.3s',
                  marginBottom: '10px'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.background = 'rgba(201,168,76,0.8)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.background = 'var(--gold)';
                }}
              >
                Ir a Checkout
              </button>
              <button
                onClick={() => setCartOpen(false)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: 'var(--gold)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.background = 'rgba(201,168,76,0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                Continuar Comprando
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cart Overlay */}
      {cartOpen && (
        <div
          onClick={() => setCartOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40
          }}
        />
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
