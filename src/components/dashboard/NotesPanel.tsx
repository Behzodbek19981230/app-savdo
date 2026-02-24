import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Pencil, Plus, Quote, Trash2, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    useCreateNote,
    useDeleteNote,
    useNotes,
    useUpdateNote,
} from '@/hooks/api/useNotes';
import { getNotesWsUrl, type NoteItem } from '@/services/note.service';
import moment from 'moment';

type WsNotePayload = {
    type?: string;
    action?: string;
    note?: NoteItem;
    id?: number;
    note_id?: number;
} & Partial<NoteItem>;



const formatDate = (rawDate?: string) => {
    if (!rawDate) return 'Sana';
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return 'Sana';
    return new Intl.DateTimeFormat('uz-UZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
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
    if (!rawDate) {
        return {
            date: fallback,
            time: toTimeValue(fallback),
        };
    }
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) {
        return {
            date: fallback,
            time: toTimeValue(fallback),
        };
    }
    return {
        date,
        time: toTimeValue(date),
    };
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
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return false;
    return date.getTime() <= Date.now();
};

const upsertNote = (current: NoteItem[], note: NoteItem) => {
    const idx = current.findIndex((n) => n.id === note.id);
    if (idx === -1) return [note, ...current];
    const next = [...current];
    next[idx] = { ...next[idx], ...note };
    return next;
};

const getStatusView = (status?: NoteItem['status']) => {
    if (status === 'done') {
        return {
            label: 'Bajarilgan',
            className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        };
    }
    if (status === 'expired') {
        return {
            label: "Muddati o'tgan",
            className: 'bg-destructive/15 text-destructive',
        };
    }
    return {
        label: 'Yangi',
        className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    };
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
                        if (!removeId) return;
                        setNotes((prev) => prev.filter((item) => item.id !== removeId));
                        return;
                    }

                    if (note?.id) {
                        setNotes((prev) => upsertNote(prev, note));
                    }
                };

                socket.onclose = () => {
                    if (!isMounted) return;
                    reconnectRef.current = window.setTimeout(connect, 3000);
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
    const unreadCount = useMemo(() => notes.filter((note) => note.is_read === false).length, [notes]);

    const sortedNotes = useMemo(() => {
        return [...notes].sort((a, b) => {
            const aUnread = a.is_read === false ? 0 : 1;
            const bUnread = b.is_read === false ? 0 : 1;
            if (aUnread !== bUnread) return aUnread - bUnread;
            const aTime = new Date(a.date || a.updated_at || a.created_at || 0).getTime();
            const bTime = new Date(b.date || b.updated_at || b.created_at || 0).getTime();
            return bTime - aTime;
        });
    }, [notes]);

    const editingNote = useMemo(
        () => (editingNoteId ? notes.find((note) => note.id === editingNoteId) || null : null),
        [editingNoteId, notes],
    );

    const resetForm = () => {
        setEditingNoteId(null);
        setTitle('');
        setText('');
        const nextReminder = getDefaultReminderDate();
        setReminderDate(nextReminder);
        setReminderTime(toTimeValue(nextReminder));
    };

    const openCreate = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const openEdit = (note: NoteItem) => {
        const parsedReminder = parseReminder(note.date);
        setEditingNoteId(note.id);
        setTitle(note.title || '');
        setText(note.text || '');
        setReminderDate(parsedReminder.date);
        setReminderTime(parsedReminder.time);
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
        const confirmed = window.confirm("Eslatmani o'chirishni tasdiqlaysizmi?");
        if (!confirmed) return;
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
        <div className='rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 lg:p-5 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20'>
            <div className='flex items-start justify-between gap-3'>
                <div>
                    <h3 className='text-3xl font-extrabold text-foreground'>Eslatmalar</h3>
                    <p className='mt-1 text-xl text-foreground/90'>Oy - Yil</p>
                    <p className='text-sm mt-1 text-muted-foreground'>{moment().format('MMMM YYYY')}</p>
                </div>
                <Quote className='h-10 w-10 text-amber-300/90 dark:text-amber-700/80' />
            </div>

            <div className='mt-4 flex justify-end'>
                <Button size='sm' className='rounded-xl' onClick={openCreate}>
                    <Plus className='mr-1.5 h-4 w-4' />
                    Eslatma qo'shish
                </Button>
            </div>
            <div className='mt-2 text-xs text-muted-foreground'>
                O'qilmaganlar: <span className='font-semibold text-foreground'>{unreadCount}</span>
            </div>

            <div className='mt-3 space-y-3 max-h-[420px] overflow-y-auto pr-1'>
                {isLoading ? (
                    <div className='rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground'>Yuklanmoqda...</div>
                ) : sortedNotes.length === 0 ? (
                    <div className='rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground'>
                        Hozircha eslatma mavjud emas
                    </div>
                ) : (
                    sortedNotes.map((note) => (
                        <div
                            key={note.id}
                            className={`rounded-xl border border-border bg-card p-4 shadow-sm ${note.is_read === false ? 'ring-1 ring-amber-400/60 dark:ring-amber-600/50' : ''
                                }`}
                        >
                            <div className='flex items-start justify-between gap-3'>
                                <h4 className='text-2xl font-extrabold text-foreground break-words'>
                                    {note.title || 'Sarlavha'}
                                </h4>
                                <div className='flex items-center gap-1'>
                                    {(() => {
                                        const statusView = getStatusView(note.status);
                                        return (
                                            <span
                                                className={`mr-2 rounded-full px-2 py-1 text-[11px] font-semibold ${statusView.className}`}
                                            >
                                                {statusView.label}
                                            </span>
                                        );
                                    })()}
                                    {note.is_read === false && (
                                        <span className='mr-2 rounded-full bg-blue-500/15 px-2 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400'>
                                            O'qilmagan
                                        </span>
                                    )}
                                    <Button size='icon' variant='ghost' className='h-8 w-8' onClick={() => openEdit(note)}>
                                        <Pencil className='h-4 w-4' />
                                    </Button>
                                    {note.status !== 'done' && isDueNow(note.date) && (
                                        <Button
                                            variant='outline'
                                            className='h-8 px-2 text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
                                            onClick={() => onDone(note)}
                                        >
                                            Bajarildi
                                        </Button>
                                    )}
                                    <Button
                                        size='icon'
                                        variant='ghost'
                                        className='h-8 w-8 text-destructive'
                                        onClick={() => onDelete(note.id)}
                                    >
                                        <Trash2 className='h-4 w-4' />
                                    </Button>
                                </div>
                            </div>
                            <div className='mt-1 flex items-center gap-3 text-sm text-foreground/80'>
                                <span className='inline-flex items-center gap-1.5'>
                                    <UserCircle2 className='h-4 w-4 text-amber-500 dark:text-amber-400' />
                                    {note.created_by_detail?.full_name || note.author_name || 'Foydalanuvchi'}
                                </span>
                                <span>·</span>
                                <span className='inline-flex items-center gap-1.5'>
                                    <CalendarDays className='h-4 w-4' />
                                    {formatDate(note.date || note.updated_at || note.created_at)}
                                </span>
                            </div>
                            <div className='my-3 h-1 rounded-full bg-amber-500/90 dark:bg-amber-500/70' />
                            <p className='text-lg text-foreground/90 break-words'>{note.text || 'Izoh'}</p>
                        </div>
                    ))
                )}
            </div>

            <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}
            >
                <DialogContent className='sm:max-w-[500px]'>
                    <DialogHeader>
                        <DialogTitle>{editingNoteId ? 'Eslatmani tahrirlash' : "Yangi eslatma qo'shish"}</DialogTitle>
                    </DialogHeader>
                    <div className='grid gap-3 py-2'>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder='Sarlavha' />
                        <DatePicker
                            date={reminderDate}
                            onDateChange={setReminderDate}
                            placeholder='Eslatma sanasi'
                        />
                        <Input
                            type='time'
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            placeholder='Eslatma soati'
                        />
                        <Textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder='Izoh'
                            rows={5}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setIsDialogOpen(false)}>
                            Bekor qilish
                        </Button>
                        <Button onClick={onSave} disabled={isMutating || !title.trim() || !reminderDate || !reminderTime}>
                            Saqlash
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
