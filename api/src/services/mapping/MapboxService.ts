/**
 * Mapbox API — 50,000 free map loads/month
 * Better than Google Maps for SA: offline tiles, custom styling
 * Use case: Incident heatmaps, patrol routes, TrustScore™ visualization
 */

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || "";

export interface IncidentHeatmapPoint {
  lat: number;
  lon: number;
  weight: number;
  type: string;
  timestamp: string;
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number; placeName: string } | null> {
  const encoded = encodeURIComponent(address);
  const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?country=ZA&access_token=${MAPBOX_TOKEN}`);
  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) return null;
  return { lat: feature.center[1], lon: feature.center[0], placeName: feature.place_name };
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${MAPBOX_TOKEN}`);
  const data = await res.json();
  return data.features?.[0]?.place_name || `${lat},${lon}`;
}

export function generateHeatmapStyle(incidents: IncidentHeatmapPoint[]): object {
  return {
    type: "heatmap",
    paint: {
      "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 6, 1],
      "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 3],
      "heatmap-color": [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(33,102,172,0)", 0.2, "rgb(103,169,207)",
        0.4, "rgb(209,229,240)", 0.6, "rgb(253,219,199)",
        0.8, "rgb(239,138,98)", 1, "rgb(178,24,43)",
      ],
      "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 9, 20],
    },
  };
}

// Isochrone — show 5-min response radius from patrol point
export async function getResponseIsochrone(lat: number, lon: number, minutes = 5): Promise<object> {
  const res = await fetch(`https://api.mapbox.com/isochrone/v1/mapbox/driving/${lon},${lat}?contours_minutes=${minutes}&polygons=true&access_token=${MAPBOX_TOKEN}`);
  return res.json();
}
