/** Qibla: the great-circle bearing from a point to the Kaaba, and the distance. */
export const KAABA = { latitude: 21.422487, longitude: 39.826206 } as const;

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Initial bearing from (lat, lon) to the Kaaba, in degrees clockwise from true north (0..360). */
export const qiblaBearing = (latitude: number, longitude: number): number => {
  const φ1 = rad(latitude), φ2 = rad(KAABA.latitude), Δλ = rad(KAABA.longitude - longitude);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (deg(Math.atan2(y, x)) + 360) % 360;
};

/** Great-circle distance to the Kaaba in kilometres. */
export const distanceToKaabaKm = (latitude: number, longitude: number): number => {
  const R = 6371.0088;
  const φ1 = rad(latitude), φ2 = rad(KAABA.latitude), Δφ = rad(KAABA.latitude - latitude), Δλ = rad(KAABA.longitude - longitude);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
};

/** Signed smallest rotation (−180..180) to turn from `heading` to `bearing`; 0 means the phone points at the Kaaba. */
export const qiblaOffset = (heading: number, bearing: number): number => ((bearing - heading + 540) % 360) - 180;

/** Compass point for a bearing, e.g. "SE". */
export const compassPoint = (bearing: number): string => ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round((((bearing % 360) + 360) % 360) / 45) % 8];
