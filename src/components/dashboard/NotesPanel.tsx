import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateNote, useDeleteNote, useNotes, useUpdateNote } from '@/hooks/api/useNotes';
import { getNotesWsUrl, type NoteItem } from '@/services/note.service';

type WsNotePayload = {
	type?: string;
	action?: string;
	note?: NoteItem;
	id?: number;
	note_id?: number;
} & Partial<NoteItem>;

const shortDate = (rawDate?: string) => {
	if (!rawDate) return '—';
	const d = new Date(rawDate);
	if (Number.isNaN(d.getTime())) return '—';
	const day = String(d.getDate()).padStart(2, '0');
	const mon = String(d.getMonth() + 1).padStart(2, '0');
	const h = String(d.getHours()).padStart(2, '0');
	const m = String(d.getMinutes()).padStart(2, '0');
	return `${day}.${mon} ${h}:${m}`;
};

const getDefaultReminderDate = () => {
	const date = new Date();
	date.setMinutes(date.getMinutes() + 5);
	return date;
};

const toTimeValue = (date: Date) => {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const parseReminder = (rawDate?: string) => {
	const fallback = getDefaultReminderDate();
	if (!rawDate) return { date: fallback, time: toTimeValue(fallback) };
	const date = new Date(rawDate);
	if (Number.isNaN(date.getTime())) return { date: fallback, time: toTimeValue(fallback) };
	return { date, time: toTimeValue(date) };
};

const toIsoFromDateAndTime = (date: Date, time: string) => {
	const [hourStr, minuteStr] = time.split(':');
	const hour = Number(hourStr);
	const minute = Number(minuteStr);
	const next = new Date(date);
	next.setHours(Number.isNaN(hour) ? 0 : hour, Number.isNaN(minute) ? 0 : minute, 0, 0);
	return next.toISOString();
};

const isDueNow = (rawDate?: string) => {
	if (!rawDate) return false;
	const d = new Date(rawDate);
	return !Number.isNaN(d.getTime()) && d.getTime() <= Date.now();
};

const upsertNote = (current: NoteItem[], note: NoteItem) => {
	const idx = current.findIndex((n) => n.id === note.id);
	if (idx === -1) return [note, ...current];
	const next = [...current];
	next[idx] = { ...next[idx], ...note };
	return next;
};

const statusDot: Record<string, string> = {
	done: 'bg-emerald-500',
	expired: 'bg-red-500',
	new: 'bg-amber-500',
};

const statusLabel: Record<string, string> = {
	done: 'Bajarilgan',
	expired: "Muddati o'tgan",
	new: 'Yangi',
};

export function NotesPanel() {
	const { data, isLoading } = useNotes({});
	const createNote = useCreateNote();
	const updateNote = useUpdateNote();
	const deleteNote = useDeleteNote();
	const [notes, setNotes] = useState<NoteItem[]>([]);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
	const [title, setTitle] = useState('');
	const [text, setText] = useState('');
	const initialReminder = getDefaultReminderDate();
	const [reminderDate, setReminderDate] = useState<Date | undefined>(initialReminder);
	const [reminderTime, setReminderTime] = useState(toTimeValue(initialReminder));
	const reconnectRef = useRef<number | null>(null);

	useEffect(() => {
		if (data) setNotes(data);
	}, [data]);

	useEffect(() => {
		let isMounted = true;
		let socket: WebSocket | null = null;
		const connect = () => {
			try {
				socket = new WebSocket(getNotesWsUrl());
				socket.onmessage = (event) => {
					if (!isMounted) return;
					let payload: WsNotePayload | null = null;
					try {
						payload = JSON.parse(event.data);
					} catch {
						payload = null;
					}
					if (!payload) return;
					const action = payload.action || payload.type;
					const note = payload.note || (payload.id ? (payload as NoteItem) : null);
					if (action === 'delete' || action === 'deleted') {
						const removeId = payload.note_id || payload.id;
						if (removeId) setNotes((prev) => prev.filter((item) => item.id !== removeId));
						return;
					}
					if (note?.id) setNotes((prev) => upsertNote(prev, note));
				};
				socket.onclose = () => {
					if (isMounted) reconnectRef.current = window.setTimeout(connect, 3000);
				};
			} catch {
				reconnectRef.current = window.setTimeout(connect, 5000);
			}
		};
		connect();
		return () => {
			isMounted = false;
			if (reconnectRef.current) window.clearTimeout(reconnectRef.current);
			if (socket && socket.readyState !== WebSocket.CLOSED) socket.close();
		};
	}, []);

	const isMutating = createNote.isPending || updateNote.isPending || deleteNote.isPending;
	const unreadCount = useMemo(() => notes.filter((n) => n.is_read === false).length, [notes]);

	const sortedNotes = useMemo(() => {
		return [...notes].sort((a, b) => {
			const aU = a.is_read === false ? 0 : 1;
			const bU = b.is_read === false ? 0 : 1;
			if (aU !== bU) return aU - bU;
			const aT = new Date(a.date || a.updated_at || a.created_at || 0).getTime();
			const bT = new Date(b.date || b.updated_at || b.created_at || 0).getTime();
			return bT - aT;
		});
	}, [notes]);

	const editingNote = useMemo(
		() => (editingNoteId ? notes.find((n) => n.id === editingNoteId) || null : null),
		[editingNoteId, notes],
	);

	const resetForm = () => {
		setEditingNoteId(null);
		setTitle('');
		setText('');
		const next = getDefaultReminderDate();
		setReminderDate(next);
		setReminderTime(toTimeValue(next));
	};

	const openCreate = () => {
		resetForm();
		setIsDialogOpen(true);
	};

	const openEdit = (note: NoteItem) => {
		const r = parseReminder(note.date);
		setEditingNoteId(note.id);
		setTitle(note.title || '');
		setText(note.text || '');
		setReminderDate(r.date);
		setReminderTime(r.time);
		setIsDialogOpen(true);
	};

	const onSave = async () => {
		const trimmedTitle = title.trim();
		if (!trimmedTitle || !reminderDate || !reminderTime) return;
		const payload = {
			date: toIsoFromDateAndTime(reminderDate, reminderTime),
			title: trimmedTitle,
			text: text.trim(),
			sorting: 0,
			status: editingNote?.status || 'new',
			is_delete: false,
		};
		if (editingNoteId) {
			await updateNote.mutateAsync({ id: editingNoteId, payload });
		} else {
			await createNote.mutateAsync(payload);
		}
		setIsDialogOpen(false);
		resetForm();
	};

	const onDelete = async (noteId: number) => {
		if (!window.confirm("Eslatmani o'chirishni tasdiqlaysizmi?")) return;
		await deleteNote.mutateAsync(noteId);
	};

	const onDone = async (note: NoteItem) => {
		await updateNote.mutateAsync({
			id: note.id,
			payload: {
				sorting: note.sorting ?? 0,
				date: note.date || new Date().toISOString(),
				title: note.title,
				text: note.text || '',
				status: 'done',
				is_delete: note.is_delete ?? false,
			},
		});
	};

	return (
		<div className='rounded-xl border border-border bg-card shadow-sm'>
			{/* Header */}
			<div className='flex items-center justify-between gap-2 border-b border-border px-4 py-2.5'>
				<div className='flex items-center gap-2'>
					<h3 className='text-sm font-semibold text-foreground'>Eslatmalar</h3>
					{unreadCount > 0 && (
						<span className='flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/15 px-1.5 text-[10px] font-bold text-amber-700 dark:text-amber-400'>
							{unreadCount}
						</span>
					)}
				</div>
				<Button size='sm' variant='ghost' className='h-7 gap-1 px-2 text-xs' onClick={openCreate}>
					<Plus className='h-3.5 w-3.5' />
					Qo'shish
				</Button>
			</div>

			{/* List */}
			<div className='max-h-[320px] overflow-y-auto'>
				{isLoading ? (
					<p className='px-4 py-6 text-center text-xs text-muted-foreground'>Yuklanmoqda...</p>
				) : sortedNotes.length === 0 ? (
					<p className='px-4 py-6 text-center text-xs text-muted-foreground'>Eslatma mavjud emas</p>
				) : (
					<div className='divide-y divide-border'>
						{sortedNotes.map((note) => {
							const st = note.status || 'new';
							const canDone = st !== 'done' && isDueNow(note.date);
							return (
								<div
									key={note.id}
									className={`group flex items-center gap-2.5 px-4 py-2 transition-colors hover:bg-muted/50 ${
										note.is_read === false ? 'bg-amber-50/60 dark:bg-amber-950/15' : ''
									}`}
								>
									{/* Status dot */}
									<span
										className={`h-2 w-2 flex-shrink-0 rounded-full ${statusDot[st] || statusDot.new}`}
										title={statusLabel[st] || 'Yangi'}
									/>

									{/* Content */}
									<div className='min-w-0 flex-1'>
										<div className='flex items-center gap-1.5'>
											<span className='truncate text-[13px] font-medium text-foreground'>
												{note.title || 'Sarlavha'}
											</span>
											{note.is_read === false && (
												<span className='flex-shrink-0 rounded bg-blue-500/15 px-1 py-px text-[9px] font-semibold text-blue-600 dark:text-blue-400'>
													yangi
												</span>
											)}
										</div>
										<div className='flex items-center gap-2 text-[11px] text-muted-foreground'>
											<span className='inline-flex items-center gap-1'>
												<Clock className='h-3 w-3' />
												{shortDate(note.date || note.created_at)}
											</span>
											{note.created_by_detail?.full_name && (
												<>
													<span>·</span>
													<span className='truncate'>{note.created_by_detail.full_name}</span>
												</>
											)}
											{note.text && (
												<>
													<span>·</span>
													<span className='truncate max-w-[120px]'>{note.text}</span>
												</>
											)}
										</div>
									</div>

									{/* Actions — visible on hover */}
									<div className='flex flex-shrink-0 items-center gap-0.5 transition-opacity opacity-100'>
										{canDone && (
											<Button
												size='icon'
												variant='ghost'
												className='h-6 w-6 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400'
												title='Bajarildi'
												onClick={() => onDone(note)}
											>
												<Check className='h-3.5 w-3.5' />
											</Button>
										)}
										<Button
											size='icon'
											variant='ghost'
											className='h-6 w-6'
											title='Tahrirlash'
											onClick={() => openEdit(note)}
										>
											<Pencil className='h-3 w-3' />
										</Button>
										<Button
											size='icon'
											variant='ghost'
											className='h-6 w-6 text-destructive hover:text-destructive'
											title="O'chirish"
											onClick={() => onDelete(note.id)}
										>
											<Trash2 className='h-3 w-3' />
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Dialog */}
			<Dialog
				open={isDialogOpen}
				onOpenChange={(open) => {
					setIsDialogOpen(open);
					if (!open) resetForm();
				}}
			>
				<DialogContent className='sm:max-w-[460px]'>
					<DialogHeader>
						<DialogTitle className='text-base'>
							{editingNoteId ? 'Eslatmani tahrirlash' : "Yangi eslatma qo'shish"}
						</DialogTitle>
					</DialogHeader>
					<div className='grid gap-3 py-1'>
						<Input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder='Sarlavha'
							className='h-9 text-sm'
						/>
						<div className='flex gap-2'>
							<DatePicker date={reminderDate} onDateChange={setReminderDate} placeholder='Sana' />
							<Input
								type='time'
								value={reminderTime}
								onChange={(e) => setReminderTime(e.target.value)}
								className='h-9 w-[110px] text-sm'
							/>
						</div>
						<Textarea
							value={text}
							onChange={(e) => setText(e.target.value)}
							placeholder='Izoh'
							rows={3}
							className='text-sm'
						/>
					</div>
					<DialogFooter>
						<Button size='sm' variant='outline' onClick={() => setIsDialogOpen(false)}>
							Bekor qilish
						</Button>
						<Button
							size='sm'
							onClick={onSave}
							disabled={isMutating || !title.trim() || !reminderDate || !reminderTime}
						>
							Saqlash
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
