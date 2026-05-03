/**
 * Configuración de costos de envío por transportista y provincia
 * Estos valores son placeholders y deben ser actualizados con los precios reales
 */

export const SHIPPING_COSTS = {
  andreani: {
    // Costo base + costo por provincia
    base: 100,
    provinces: {
      'Buenos Aires': 150,
      'CABA': 120,
      'Córdoba': 200,
      'Rosario': 180,
      'Mendoza': 250,
      'La Plata': 140,
      'Mar del Plata': 180,
      'Tucumán': 280,
      'Salta': 300,
      'Misiones': 320,
      'Corrientes': 300,
      'Entre Ríos': 220,
      'Santa Fe': 200,
      'Santiago del Estero': 280,
      'Formosa': 320,
      'Chaco': 300,
      'Jujuy': 320,
      'Catamarca': 300,
      'La Rioja': 280,
      'San Luis': 260,
      'San Juan': 280,
      'Neuquén': 350,
      'Río Negro': 350,
      'Chubut': 380,
      'Santa Cruz': 400,
      'Tierra del Fuego': 450,
    },
  },
  correo_argentino: {
    // Costo base + costo por provincia
    base: 110,
    provinces: {
      'Buenos Aires': 160,
      'CABA': 130,
      'Córdoba': 210,
      'Rosario': 190,
      'Mendoza': 260,
      'La Plata': 150,
      'Mar del Plata': 190,
      'Tucumán': 290,
      'Salta': 310,
      'Misiones': 330,
      'Corrientes': 310,
      'Entre Ríos': 230,
      'Santa Fe': 210,
      'Santiago del Estero': 290,
      'Formosa': 330,
      'Chaco': 310,
      'Jujuy': 330,
      'Catamarca': 310,
      'La Rioja': 290,
      'San Luis': 270,
      'San Juan': 290,
      'Neuquén': 360,
      'Río Negro': 360,
      'Chubut': 390,
      'Santa Cruz': 410,
      'Tierra del Fuego': 460,
    },
  },
};

/**
 * Calcula el costo de envío basado en el transportista y la provincia
 * @param carrier - Transportista ('andreani' o 'correo_argentino')
 * @param province - Provincia de destino
 * @returns Costo de envío en pesos argentinos
 */
export function calculateShippingCost(
  carrier: 'andreani' | 'correo_argentino',
  province: string
): number {
  const carrierCosts = SHIPPING_COSTS[carrier];
  if (!carrierCosts) {
    throw new Error(`Transportista no válido: ${carrier}`);
  }

  const provinceCost = carrierCosts.provinces[province as keyof typeof carrierCosts.provinces];
  if (provinceCost === undefined) {
    // Si la provincia no está en la lista, usar el costo base
    console.warn(`Provincia no encontrada: ${province}, usando costo base`);
    return carrierCosts.base;
  }

  return provinceCost;
}

/**
 * Obtiene todas las provincias disponibles para un transportista
 * @param carrier - Transportista ('andreani' o 'correo_argentino')
 * @returns Array de provincias disponibles
 */
export function getAvailableProvinces(carrier: 'andreani' | 'correo_argentino'): string[] {
  const carrierCosts = SHIPPING_COSTS[carrier];
  if (!carrierCosts) {
    throw new Error(`Transportista no válido: ${carrier}`);
  }

  return Object.keys(carrierCosts.provinces);
}
