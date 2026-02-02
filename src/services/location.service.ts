/**
 * Location Service
 * Hududlar (Country, Region, District) bilan ishlash uchun service
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

// Types
export interface Country {
  id: number;
  code: string;
  name: string;
  geo_json?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Region {
  id: number;
  code: string;
  name: string;
  geo_json?: string;
  created_at?: string;
  updated_at?: string;
}

export interface District {
  id: number;
  code: string;
  name: string;
  region?: string | number;
  region_detail?: Region;
  geo_json?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginationMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface LocationListResponse<T> {
  pagination: PaginationMeta;
  results: T[];
  filters: unknown;
}

export interface LocationQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  ordering?: string;
}

// Country Service
export const locationService = {
  // Countries
  getCountries: async (params?: LocationQueryParams) => {
    return api.get<LocationListResponse<Country>>(API_ENDPOINTS.locations.countries, {
      params,
    });
  },

  getCountryById: async (id: number) => {
    return api.get<Country>(API_ENDPOINTS.locations.countryById(id.toString()));
  },

  createCountry: async (data: Partial<Country>) => {
    return api.post<Country>(API_ENDPOINTS.locations.countries, data);
  },

  updateCountry: async (id: number, data: Partial<Country>) => {
    return api.patch<Country>(API_ENDPOINTS.locations.countryById(id.toString()), data);
  },

  deleteCountry: async (id: number) => {
    return api.delete(API_ENDPOINTS.locations.countryById(id.toString()));
  },

  // Regions
  getRegions: async (params?: LocationQueryParams) => {
    return api.get<LocationListResponse<Region>>(API_ENDPOINTS.locations.regions, {
      params,
    });
  },

  getRegionById: async (id: number) => {
    return api.get<Region>(API_ENDPOINTS.locations.regionById(id.toString()));
  },

  createRegion: async (data: Partial<Region>) => {
    return api.post<Region>(API_ENDPOINTS.locations.regions, data);
  },

  updateRegion: async (id: number, data: Partial<Region>) => {
    return api.patch<Region>(API_ENDPOINTS.locations.regionById(id.toString()), data);
  },

  deleteRegion: async (id: number) => {
    return api.delete(API_ENDPOINTS.locations.regionById(id.toString()));
  },

  // Districts
  getDistricts: async (params?: LocationQueryParams) => {
    return api.get<LocationListResponse<District>>(API_ENDPOINTS.locations.districts, {
      params,
    });
  },

  getDistrictById: async (id: number) => {
    return api.get<District>(API_ENDPOINTS.locations.districtById(id.toString()));
  },

  createDistrict: async (data: Partial<District>) => {
    return api.post<District>(API_ENDPOINTS.locations.districts, data);
  },

  updateDistrict: async (id: number, data: Partial<District>) => {
    return api.patch<District>(API_ENDPOINTS.locations.districtById(id.toString()), data);
  },

  deleteDistrict: async (id: number) => {
    return api.delete(API_ENDPOINTS.locations.districtById(id.toString()));
  },
};
