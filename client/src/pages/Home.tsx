import { useState, useEffect } from 'react';
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
  const { data: products = [] } = trpc.products.getByLine.useQuery(currentLine);

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

  return (
    <div className="min-h-screen bg-[var(--black)] text-[var(--white)]">
      {/* Header */}
      <header className="bg-[var(--black)] border-b border-[rgba(201,168,76,0.2)] sticky top-0 z-40 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16">
          <div className="flex flex-col leading-none">
            <span className="text-xl font-medium text-[var(--gold)] tracking-widest" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '36px', fontWeight: '800' }}>
              Inspel
            </span>
            <span className="text-xs font-light tracking-widest text-[var(--white-dim)] uppercase mt-1">
              Premium Hair Care
            </span>
          </div>
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

        {/* Products Grid */}
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
      <footer>
        <div className="flogo" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Inspel
        </div>
        <div className="fclaims">
          <span>Premium Hair Care</span>
          <span>Made in Argentina</span>
          <span>© 2026</span>
        </div>
        <div className="fcopy">
          Todos los derechos reservados
        </div>
      </footer>

      {/* Cart Overlay */}
      <div className={`cart-overlay ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)} />

      {/* Cart Drawer */}
      <div className={`drawer ${cartOpen ? 'open' : ''}`}>
        <div className="dhdr">
          <div className="dtitle" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Carrito
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="xbtn"
          >
            <X size={20} />
          </button>
        </div>

        <div className="ditems">
          {cart.length === 0 ? (
            <div className="dempty">
              Tu carrito está vacío
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="ditem">
                <div className="dicon">{item.icon}</div>
                <div className="dinfo">
                  <div className="dname">{item.name}</div>
                  <div className="dline">{item.price} ARS</div>
                  <div className="dprice gold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </div>
                  <div className="dqty">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="qbtn"
                    >
                      <Minus size={14} />
                    </button>
                    <div className="qnum">{item.quantity}</div>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="qbtn"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="rbtn"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="dftr">
          <div className="total-row">
            <div className="total-lbl">Subtotal</div>
            <div className="total-amt" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              ${subtotal.toFixed(2)}
            </div>
          </div>
          <button
            onClick={() => setLocation('/checkout')}
            className="checkout-btn"
          >
            Ir al Checkout
          </button>
          <button
            onClick={() => setCartOpen(false)}
            className="cont-btn"
          >
            Continuar Comprando
          </button>
        </div>
      </div>

      {/* Toast */}
      <div className={`toast ${toast ? 'show' : ''}`}>
        {toast}
      </div>
    </div>
  );
}
