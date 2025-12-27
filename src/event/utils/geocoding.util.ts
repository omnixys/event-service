/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import fetch from 'node-fetch';

export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lon: number }> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    address,
  )}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Omnixys-Event-Service/1.0 (contact: info@omnixys.com)',
      },
    });

    const data = (await res.json()) as any[];

    if (!data.length) {
      throw new Error('Adresse Ungültig!');
    }

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };
  } catch (err) {
    console.error('Geocoding failed:', err);
    throw new Error(`Adresse Ungültig!: ${err as Error}`);
  }
}
