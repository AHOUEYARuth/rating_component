const API_KEY = import.meta.env.VITE_WEXGO_API_KEY;
const BASE_URL = import.meta.env.VITE_WEXGO_BASE_URL;

export interface Destination {
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  recipientName: string;
  recipientPhone: string;
  packageDescription?: string;
  packageCategory?: string;
  images?: string[];
}

export interface DeliveryRequest {
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupContactName: string;
  pickupContactPhone: string;
  vehicleTypeCode?: string;
  deliveryType?: 'express' | 'freight';
  helpLoadingAtPickup?: boolean;
  helpUnloadingAtDropoff?: boolean;
  destinations: Destination[];
}

export interface QuoteResponse {
  pricing: {
    total: {
      amount: number;
      currency: string;
    };
  };
  metrics: {
    totalDistanceKm: string;
  };
}

export interface DeliveryResponse {
  deliveryNumber: string;
  status: string;
  id?: string; // Some APIs might return ID
}

class WexgoService {
  private headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  async getPackageCategories(lat: number, lng: number, type: string = 'express') {
    const params = new URLSearchParams({
      pickupLatitude: lat.toString(),
      pickupLongitude: lng.toString(),
      deliveryType: type,
    });
    const response = await fetch(`${BASE_URL}/reference/package-categories?${params}`, {
      headers: this.headers,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }

  async getVehicleTypes(lat: number, lng: number, type: string = 'express') {
    const params = new URLSearchParams({
      pickupLatitude: lat.toString(),
      pickupLongitude: lng.toString(),
      deliveryType: type,
    });
    const response = await fetch(`${BASE_URL}/reference/vehicle-types?${params}`, {
      headers: this.headers,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }

  async getQuote(data: DeliveryRequest): Promise<QuoteResponse> {
    const response = await fetch(`${BASE_URL}/quotes`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  async createDelivery(data: DeliveryRequest): Promise<DeliveryResponse> {
    const response = await fetch(`${BASE_URL}/deliveries`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  async trackDelivery(deliveryNumber: string) {
    const response = await fetch(`${BASE_URL}/deliveries/${deliveryNumber}`, {
      headers: this.headers,
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  async simulateStatus(deliveryId: string, status: string) {
    const response = await fetch(`${BASE_URL}/sandbox/deliveries/${deliveryId}/simulate-status`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }
}

export const wexgoService = new WexgoService();
