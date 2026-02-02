/**
 * Location Hooks
 * Hududlar uchun React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationService, type LocationQueryParams, type Country, type Region, type District } from '@/services/location.service';
import { toast } from '@/hooks/use-toast';

// Helper function to format error messages
const formatErrorMessage = (error: unknown): string => {
  const err = error as Record<string, unknown>;
  
  // Check if error has message object with field errors
  if (err.message && typeof err.message === 'object') {
    const fieldErrors: string[] = [];
    
    Object.entries(err.message).forEach(([, messages]) => {
      if (Array.isArray(messages)) {
        messages.forEach((msg) => {
          fieldErrors.push(String(msg));
        });
      } else if (typeof messages === 'string') {
        fieldErrors.push(messages);
      }
    });
    
    if (fieldErrors.length > 0) {
      return fieldErrors.join('\n');
    }
  }
  
  // Check if error has errorMessage
  if (err.errorMessage && typeof err.errorMessage === 'string') {
    return err.errorMessage;
  }
  
  // Check if error has message string
  if (typeof err.message === 'string') {
    return err.message;
  }
  
  return 'Xatolik yuz berdi';
};

// Query Keys
export const LOCATION_KEYS = {
  countries: ['countries'] as const,
  countriesList: (params?: LocationQueryParams) => [...LOCATION_KEYS.countries, 'list', params] as const,
  countryDetail: (id: number) => [...LOCATION_KEYS.countries, 'detail', id] as const,
  
  regions: ['regions'] as const,
  regionsList: (params?: LocationQueryParams) => [...LOCATION_KEYS.regions, 'list', params] as const,
  regionDetail: (id: number) => [...LOCATION_KEYS.regions, 'detail', id] as const,
  
  districts: ['districts'] as const,
  districtsList: (params?: LocationQueryParams) => [...LOCATION_KEYS.districts, 'list', params] as const,
  districtDetail: (id: number) => [...LOCATION_KEYS.districts, 'detail', id] as const,
};

// ==================== COUNTRIES ====================

/**
 * Mamlakatlar ro'yxatini olish
 */
export function useCountries(params?: LocationQueryParams) {
  return useQuery({
    queryKey: LOCATION_KEYS.countriesList(params),
    queryFn: () => locationService.getCountries(params),
  });
}

/**
 * Bitta mamlakatni olish
 */
export function useCountry(id: number) {
  return useQuery({
    queryKey: LOCATION_KEYS.countryDetail(id),
    queryFn: () => locationService.getCountryById(id),
    enabled: !!id,
  });
}

/**
 * Mamlakat yaratish
 */
export function useCreateCountry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Country>) => locationService.createCountry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATION_KEYS.countries });
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Mamlakat qo\'shildi',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = formatErrorMessage(error);
      toast({
        title: 'Xatolik!',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mamlakatni yangilash
 */
export function useUpdateCountry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Country> }) => 
      locationService.updateCountry(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOCATION_KEYS.countries });
      queryClient.invalidateQueries({ queryKey: LOCATION_KEYS.countryDetail(variables.id) });
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Mamlakat yangilandi',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = formatErrorMessage(error);
      toast({
        title: 'Xatolik!',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mamlakatni o'chirish
 */
export function useDeleteCountry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => locationService.deleteCountry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATION_KEYS.countries });
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Mamlakat o\'chirildi',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = formatErrorMessage(error);
      toast({
        title: 'Xatolik!',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
}

// ==================== REGIONS ====================

/**
 * Viloyatlar ro'yxatini olish
 */
export function useRegions(params?: LocationQueryParams) {
  return useQuery({
    queryKey: LOCATION_KEYS.regionsList(params),
    queryFn: () => locationService.getRegions(params),
  });
}

/**
 * Bitta viloyatni olish
 */
export function useRegion(id: number) {
  return useQuery({
    queryKey: LOCATION_KEYS.regionDetail(id),
    queryFn: () => locationService.getRegionById(id),
    enabled: !!id,
  });
}

/**
 * Viloyat yaratish
 */
export function useCreateRegion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Region>) => locationService.createRegion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATION_KEYS.regions });
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Viloyat qo\'shildi',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = formatErrorMessage(error);
      toast({
        title: 'Xatolik!',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Viloyatni yangilash
 */
export function useUpdateRegion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Region> }) => 
      locationService.updateRegion(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOCATION_KEYS.regions });
      queryClient.invalidateQueries({ queryKey: LOCATION_KEYS.regionDetail(variables.id) });
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Viloyat yangilandi',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = formatErrorMessage(error);
      toast({
        title: 'Xatolik!',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Viloyatni o'chirish
 */
export function useDeleteRegion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => locationService.deleteRegion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATION_KEYS.regions });
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Viloyat o\'chirildi',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = formatErrorMessage(error);
      toast({
        title: 'Xatolik!',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
}

// ==================== DISTRICTS ====================

/**
 * Tumanlar ro'yxatini olish
 */
export function useDistricts(params?: LocationQueryParams) {
  return useQuery({
    queryKey: LOCATION_KEYS.districtsList(params),
    queryFn: () => locationService.getDistricts(params),
  });
}

/**
 * Bitta tumanni olish
 */
export function useDistrict(id: number) {
  return useQuery({
    queryKey: LOCATION_KEYS.districtDetail(id),
    queryFn: () => locationService.getDistrictById(id),
    enabled: !!id,
  });
}

/**
 * Tuman yaratish
 */
export function useCreateDistrict() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<District>) => locationService.createDistrict(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATION_KEYS.districts });
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Tuman qo\'shildi',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = formatErrorMessage(error);
      toast({
        title: 'Xatolik!',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Tumanni yangilash
 */
export function useUpdateDistrict() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<District> }) => 
      locationService.updateDistrict(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOCATION_KEYS.districts });
      queryClient.invalidateQueries({ queryKey: LOCATION_KEYS.districtDetail(variables.id) });
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Tuman yangilandi',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = formatErrorMessage(error);
      toast({
        title: 'Xatolik!',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Tumanni o'chirish
 */
export function useDeleteDistrict() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => locationService.deleteDistrict(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATION_KEYS.districts });
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Tuman o\'chirildi',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = formatErrorMessage(error);
      toast({
        title: 'Xatolik!',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
}
