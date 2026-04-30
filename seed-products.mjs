import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const products = [
  // Nutriessence - Argán
  {
    name: 'Shampoo Nutriessence',
    line: 'Nutriessence',
    description: 'Limpieza profunda con aceite de argán puro',
    price: '450.00',
    stock: 50,
    icon: '🧴',
    badge: 'Bestseller',
  },
  {
    name: 'Acondicionador Nutriessence',
    line: 'Nutriessence',
    description: 'Hidratación intensiva y brillo natural',
    price: '480.00',
    stock: 45,
    icon: '💆',
    badge: 'Recomendado',
  },
  {
    name: 'Mascarilla Nutriessence',
    line: 'Nutriessence',
    description: 'Tratamiento reparador de 15 minutos',
    price: '520.00',
    stock: 30,
    icon: '✨',
    badge: null,
  },
  {
    name: 'Aceite Capilar Nutriessence',
    line: 'Nutriessence',
    description: 'Aceite puro de argán para puntas',
    price: '380.00',
    stock: 40,
    icon: '🌿',
    badge: null,
  },
  // Strength - Reparación
  {
    name: 'Shampoo Strength',
    line: 'Strength',
    description: 'Fortalecimiento y protección capilar',
    price: '450.00',
    stock: 50,
    icon: '💪',
    badge: 'Bestseller',
  },
  {
    name: 'Acondicionador Strength',
    line: 'Strength',
    description: 'Reparación profunda de daños',
    price: '480.00',
    stock: 45,
    icon: '🔧',
    badge: 'Recomendado',
  },
  {
    name: 'Mascarilla Strength',
    line: 'Strength',
    description: 'Tratamiento intensivo reparador',
    price: '520.00',
    stock: 35,
    icon: '🛡️',
    badge: null,
  },
  {
    name: 'Sérum Strength',
    line: 'Strength',
    description: 'Sérum reparador para cabello dañado',
    price: '390.00',
    stock: 40,
    icon: '💧',
    badge: null,
  },
];

for (const product of products) {
  await connection.execute(
    'INSERT INTO products (name, line, description, price, stock, icon, badge, active) VALUES (?, ?, ?, ?, ?, ?, ?, true)',
    [product.name, product.line, product.description, product.price, product.stock, product.icon, product.badge]
  );
}

console.log('✅ Productos insertados exitosamente');
await connection.end();
