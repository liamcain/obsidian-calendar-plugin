/**
 * GeoLocator — determines user's geographic coordinates for weather lookups.
 * Strategy: IP geolocation → fallback to user manual input.
 * User manual input always takes priority.
 */

import { requestUrl } from "obsidian";

export interface IGeoLocation {
  latitude: number;
  longitude: number;
  city: string;
  source: "ip" | "manual";
}

interface IGeoIpResponse {
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  city?: string;
  regionName?: string;
  country?: string;
  status?: string;
}

interface IGeocodeResponse {
  results?: Array<{
    latitude: number;
    longitude: number;
    name: string;
    country?: string;
    admin1?: string;
  }>;
}

export class GeoLocator {
  /** Try IP-based geolocation */
  async locateByIP(): Promise<IGeoLocation | null> {
    // Try ip-api.com first (more reliable for China)
    try {
      const resp = await requestUrl({
        url: "http://ip-api.com/json/?fields=status,lat,lon,city,regionName,country",
        method: "GET",
      });
      if (resp.status === 200) {
        const data = resp.json as IGeoIpResponse;
        if (data.status === "success" && data.lat !== undefined && data.lon !== undefined) {
          return {
            latitude: data.lat,
            longitude: data.lon,
            city: data.city || data.regionName || "Unknown",
            source: "ip",
          };
        }
      }
    } catch (e) {
      console.warn("[Calendar+] ip-api.com geolocation failed:", e);
    }

    // Fallback: ipapi.co
    try {
      const resp = await requestUrl({
        url: "https://ipapi.co/json/",
        method: "GET",
      });
      if (resp.status === 200) {
        const data = resp.json as IGeoIpResponse;
        if (data.latitude !== undefined && data.longitude !== undefined) {
          return {
            latitude: data.latitude,
            longitude: data.longitude,
            city: data.city || "Unknown",
            source: "ip",
          };
        }
      }
    } catch (e) {
      console.warn("[Calendar+] ipapi.co geolocation failed:", e);
    }

    return null;
  }

  /** Search city by name using Open-Meteo Geocoding API */
  async searchCity(cityName: string): Promise<IGeoLocation | null> {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=zh&format=json`;
      const resp = await requestUrl({ url, method: "GET" });
      if (resp.status === 200) {
        const data = resp.json as IGeocodeResponse;
        if (data.results && data.results.length > 0) {
          const r = data.results[0];
          return {
            latitude: r.latitude,
            longitude: r.longitude,
            city: r.name + (r.admin1 ? `, ${r.admin1}` : ""),
            source: "manual",
          };
        }
      }
    } catch (e) {
      console.warn("[Calendar+] City search failed:", e);
    }
    return null;
  }

  /**
   * Get location with priority: manualInput > ipGeolocation
   * If manualInput is provided and valid, use it.
   * Otherwise try IP.
   */
  async getLocation(manualCity?: string): Promise<IGeoLocation | null> {
    if (manualCity && manualCity.trim()) {
      const manual = await this.searchCity(manualCity.trim());
      if (manual) return manual;
    }
    return this.locateByIP();
  }
}
