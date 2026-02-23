import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { noteService, type NotePayload } from '@/services/note.service';

export const noteKeys = {
	all: ['notes'] as const,
};

export function useNotes() {
	return useQuery({
		queryKey: noteKeys.all,
		queryFn: noteService.getNotes,
	});
}

export function useCreateNote() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: NotePayload) => noteService.createNote(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: noteKeys.all });
			toast.success("Eslatma qo'shildi");
		},
		onError: () => {
			toast.error("Eslatma qo'shishda xatolik");
		},
	});
}

export function useUpdateNote() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: NotePayload }) => noteService.updateNote(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: noteKeys.all });
			toast.success('Eslatma yangilandi');
		},
		onError: () => {
			toast.error('Eslatmani yangilashda xatolik');
		},
	});
}

export function useDeleteNote() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => noteService.deleteNote(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: noteKeys.all });
			toast.success("Eslatma o'chirildi");
		},
		onError: () => {
			toast.error("Eslatmani o'chirishda xatolik");
		},
	});
}
