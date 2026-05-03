import { TRPCError } from '@trpc/server';
import { ENV } from './_core/env';

export async function getGoogleMapsScriptUrl(libraries: string) {
  const apiKey = ENV.forgeApiKey; // Usar la API Key del backend
  const forgeBaseUrl = ENV.forgeApiUrl; // Usar la URL base de Forge del backend

  if (!apiKey || !forgeBaseUrl) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Google Maps API not configured. Please add BUILT_IN_FORGE_API_KEY and BUILT_IN_FORGE_API_URL to environment variables.',
    });
  }

  const mapsProxyUrl = `${forgeBaseUrl}/v1/maps/proxy`;
  return `${mapsProxyUrl}/maps/api/js?key=${apiKey}&v=weekly&libraries=${libraries}`;
}
