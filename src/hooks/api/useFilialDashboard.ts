import { useQuery } from '@tanstack/react-query';
import { filialDashboardService } from '@/services/filialDashboard.service';

export const FILIAL_DASHBOARD_KEYS = {
	all: ['filial-dashboard'] as const,
	detail: (filialId: number | null) => [...FILIAL_DASHBOARD_KEYS.all, filialId] as const,
};

export function useFilialDashboard(filialId: number | null) {
	const hasValidFilialId = typeof filialId === 'number' && Number.isFinite(filialId) && filialId > 0;

	return useQuery({
		queryKey: FILIAL_DASHBOARD_KEYS.detail(filialId),
		queryFn: () => filialDashboardService.get(filialId as number),
		enabled: hasValidFilialId,
		staleTime: 5 * 60 * 1000,
	});
}
