import { Loader } from '@googlemaps/js-api-loader';

export interface SiteLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  type: string;
  restrictions?: string[];
  notes?: string;
}

export class GeoLocationService {
  private googleMapsLoader: Loader;
  private geocoder: google.maps.Geocoder | null = null;

  constructor() {
    this.googleMapsLoader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
      version: 'weekly',
      libraries: ['places']
    });
  }

  private async initGeocoder(): Promise<google.maps.Geocoder> {
    if (!this.geocoder) {
      await this.googleMapsLoader.load();
      this.geocoder = new google.maps.Geocoder();
    }
    return this.geocoder;
  }

  async getSiteInformation(siteId: string): Promise<SiteLocation> {
    try {
      // In a real app, this would fetch from your database
      // For now, return mock data
      return {
        id: siteId,
        name: 'Construction Site A',
        latitude: 39.7684,
        longitude: -86.1581,
        address: '100 Monument Circle, Indianapolis, IN 46204',
        type: 'construction',
        restrictions: ['hard hat required', 'safety vest required'],
        notes: 'Active construction zone'
      };
    } catch (error) {
      
      throw new Error('Failed to fetch site information');
    }
  }

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    const geocoder = await this.initGeocoder();
    
    try {
      const response = await geocoder.geocode({ address });
      
      if (!response.results[0]) {
        throw new Error('No results found');
      }
      
      const { lat, lng } = response.results[0].geometry.location;
      return { lat: lat(), lng: lng() };
    } catch (error) {
      
      throw new Error('Failed to geocode address');
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    const geocoder = await this.initGeocoder();
    
    try {
      const response = await geocoder.geocode({
        location: { lat: latitude, lng: longitude }
      });
      
      if (!response.results[0]) {
        throw new Error('No results found');
      }
      
      return response.results[0].formatted_address;
    } catch (error) {
      
      throw new Error('Failed to reverse geocode location');
    }
  }
}