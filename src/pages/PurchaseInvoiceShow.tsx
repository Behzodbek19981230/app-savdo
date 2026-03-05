/**
 * PurchaseInvoiceShow Page
 * /purchase-invoices/:id
 * Faktura va unga tegishli mahsulotlar tarixi
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePurchaseInvoice, useDeletePurchaseInvoice } from '@/hooks/api/usePurchaseInvoice';
import { PurchaseInvoiceType, PurchaseInvoiceTypeLabels } from '@/types/purchaseInvoice';
import { useProductHistories } from '@/hooks/api/useProductHistory';
import {
    ArrowLeft,
    Package,
    Calendar,
    User,
    Building2,
    Warehouse,
    Truck,
    DollarSign,
    FileText,
    Hash,
    ShoppingCart,
    Trash2,
    Loader2,
} from 'lucide-react';
import moment from 'moment';

export default function PurchaseInvoiceShow() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const invoiceId = Number(id);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

    // Faktura ma'lumotlari
    const { data: invoice, isLoading: isInvoiceLoading } = usePurchaseInvoice(invoiceId);
    const deleteMutation = useDeletePurchaseInvoice();

    // Mahsulotlar tarixi (faktura bo'yicha)
    const { data: productHistoriesData, isLoading: isProductsLoading } = useProductHistories({
        purchase_invoice: invoiceId,
        perPage: 1000,
    });

    const productHistories = productHistoriesData?.results || [];

    // Valyuta formatlash
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('uz-UZ').format(value);
    };

    // Dollar formatlash
    const formatDollar = (value: number | string) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
    };

    // Jami summani hisoblash
    const totalSum = productHistories.reduce((sum, p) => {
        const price = typeof p.real_price === 'string' ? parseFloat(p.real_price) : p.real_price;
        return sum + p.count * (price || 0);
    }, 0);
    const totalCount = productHistories.reduce((sum, p) => sum + p.count, 0);

    const handleBekorQilish = async () => {
        try {
            await deleteMutation.mutateAsync(invoiceId);
            navigate('/purchase-invoices');
        } catch {
            // xato toast hook orqali chiqadi
        }
        setIsCancelDialogOpen(false);
    };

    if (isInvoiceLoading) {
        return (
            <div className='space-y-6'>
                <div className='flex items-center gap-4'>
                    <Skeleton className='h-9 w-10' />
                    <Skeleton className='h-8 w-64' />
                </div>
                <Skeleton className='h-48 w-full' />
                <Skeleton className='h-96 w-full' />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className='flex flex-col items-center justify-center py-20'>
                <FileText className='h-16 w-16 text-muted-foreground/50 mb-4' />
                <h2 className='text-xl font-semibold mb-2'>Faktura topilmadi</h2>
                <p className='text-muted-foreground mb-4'>Ushbu ID bilan faktura mavjud emas</p>
                <Button onClick={() => navigate('/purchase-invoices')}>
                    <ArrowLeft className='mr-2 h-4 w-4' />
                    Orqaga qaytish
                </Button>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                    <Button variant='ghost' size='icon' onClick={() => navigate('/purchase-invoices')}>
                        <ArrowLeft className='h-5 w-5' />
                    </Button>
                    <div>
                        <h1 className='text-xl font-bold tracking-tight'>Faktura #{invoice.id}</h1>
                        <p className='text-muted-foreground'>
                            {moment(invoice.date).format('DD.MM.YYYY')} sanasida kiritilgan
                            {invoice.is_karzinka && (
                                <span className='ml-2 text-amber-600 dark:text-amber-400 font-medium'>— Karzinkada (tasdiqlanmagan)</span>
                            )}
                        </p>
                    </div>
                </div>
                <div className='flex items-center gap-2'>
                    {invoice.is_karzinka && (
                        <Badge variant='outline' className='text-sm border-amber-500 dark:border-amber-500/50 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'>
                            <ShoppingCart className='h-3.5 w-3.5 mr-1' />
                            Karzinka
                        </Badge>
                    )}
                    <Badge
                        variant={invoice.type === PurchaseInvoiceType.EXTERNAL ? 'default' : 'default'}
                        className={`text-sm ${invoice.type === PurchaseInvoiceType.EXTERNAL ? 'bg-green-600' : 'bg-blue-600'}`}
                    >
                        {invoice.type === PurchaseInvoiceType.EXTERNAL
                            ? PurchaseInvoiceTypeLabels[PurchaseInvoiceType.EXTERNAL]
                            : PurchaseInvoiceTypeLabels[PurchaseInvoiceType.INTERNAL]}
                    </Badge>
                    {invoice.is_karzinka && (
                        <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => setIsCancelDialogOpen(true)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                                <Trash2 className='h-4 w-4 mr-1' />
                            )}
                            Bekor qilish
                        </Button>
                    )}
                </div>
            </div>

            {/* Faktura ma'lumotlari */}
            <Card>
                <CardHeader className='pb-4'>
                    <CardTitle className='flex items-center gap-2 text-lg'>
                        <FileText className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                        Faktura ma'lumotlari
                    </CardTitle>
                    {invoice.is_karzinka && (
                        <CardDescription className='flex items-center gap-2 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-3 mt-2'>
                            <ShoppingCart className='h-4 w-4 shrink-0' />
                            Bu faktura karzinkada — hali tasdiqlanmagan. Mahsulotlar qo'shilgan, amalga oshirish yoki "Bekor qilish" orqali o'chirish mumkin.
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                        {/* Sana */}
                        <div className='flex items-start gap-3'>
                            <div className='p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg'>
                                <Calendar className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                            </div>
                            <div>
                                <p className='text-sm text-muted-foreground'>Sana</p>
                                <p className='font-medium'>{moment(invoice.date).format('DD.MM.YYYY')}</p>
                            </div>
                        </div>

                        {/* Ta'minotchi / Qaysi ombor (ichki kirimda) */}
                        <div className='flex items-start gap-3'>
                            <div className='p-2 bg-green-100 dark:bg-green-500/20 rounded-lg'>
                                <Truck className='h-4 w-4 text-green-600 dark:text-green-400' />
                            </div>
                            <div>
                                <p className='text-sm text-muted-foreground'>
                                    {invoice.type === PurchaseInvoiceType.INTERNAL ? 'Qaysi ombor' : "Ta'minotchi"}
                                </p>
                                <p className='font-medium'>
                                    {invoice.type === PurchaseInvoiceType.INTERNAL
                                        ? (invoice as unknown as { sklad_outgoing_detail?: { name: string } })
                                            .sklad_outgoing_detail?.name || '-'
                                        : invoice.supplier_detail?.name || '-'}
                                </p>
                            </div>
                        </div>

                        {/* Filial */}
                        <div className='flex items-start gap-3'>
                            <div className='p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg'>
                                <Building2 className='h-4 w-4 text-purple-600 dark:text-purple-400' />
                            </div>
                            <div>
                                <p className='text-sm text-muted-foreground'>Filial</p>
                                <p className='font-medium'>{invoice.filial_detail?.name || '-'}</p>
                            </div>
                        </div>

                        {/* Ombor */}
                        <div className='flex items-start gap-3'>
                            <div className='p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg'>
                                <Warehouse className='h-4 w-4 text-orange-600 dark:text-orange-400' />
                            </div>
                            <div>
                                <p className='text-sm text-muted-foreground'>Ombor</p>
                                <p className='font-medium'>{invoice.sklad_detail?.name || '-'}</p>
                            </div>
                        </div>

                        {/* Xodim */}
                        <div className='flex items-start gap-3'>
                            <div className='p-2 bg-cyan-100 dark:bg-cyan-500/20 rounded-lg'>
                                <User className='h-4 w-4 text-cyan-600 dark:text-cyan-400' />
                            </div>
                            <div>
                                <p className='text-sm text-muted-foreground'>Xodim</p>
                                <p className='font-medium'>
                                    {invoice.employee_detail?.full_name ||
                                        (invoice.is_karzinka ? 'Kiritilmagan (karzinka)' : '-')}
                                </p>
                            </div>
                        </div>

                        {/* Mahsulotlar soni */}
                        <div className='flex items-start gap-3'>
                            <div className='p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg'>
                                <Hash className='h-4 w-4 text-indigo-600 dark:text-indigo-400' />
                            </div>
                            <div>
                                <p className='text-sm text-muted-foreground'>Mahsulotlar soni</p>
                                <p className='font-medium'>{invoice.product_count} ta</p>
                            </div>
                        </div>

                        {/* Jami summa */}
                        <div className='flex items-start gap-3'>
                            <div className='p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg'>
                                <DollarSign className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />
                            </div>
                            <div>
                                <p className='text-sm text-muted-foreground'>Jami summa</p>
                                <p className='font-medium text-emerald-600 dark:text-emerald-400'>
                                    ${formatDollar(invoice.all_product_summa)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* To'lov ma'lumotlari */}
                    {(invoice.given_summa_dollar > 0 ||
                        invoice.given_summa_naqt > 0 ||
                        invoice.given_summa_terminal > 0 ||
                        invoice.given_summa_transfer > 0) && (
                            <div className='mt-6 pt-6 border-t'>
                                <h4 className='font-medium mb-4'>To'lov ma'lumotlari</h4>
                                <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                                    {invoice.given_summa_dollar > 0 && (
                                        <div className='p-3 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/30'>
                                            <p className='text-xs text-muted-foreground'>Dollar</p>
                                            <p className='font-semibold text-green-600 dark:text-green-400'>
                                                ${formatDollar(invoice.given_summa_dollar)}
                                            </p>
                                        </div>
                                    )}
                                    {invoice.given_summa_naqt > 0 && (
                                        <div className='p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/30'>
                                            <p className='text-xs text-muted-foreground'>Naqd</p>
                                            <p className='font-semibold text-blue-600 dark:text-blue-400'>
                                                {formatCurrency(invoice.given_summa_naqt)} so'm
                                            </p>
                                        </div>
                                    )}
                                    {invoice.given_summa_terminal > 0 && (
                                        <div className='p-3 bg-purple-50 dark:bg-purple-500/10 rounded-lg border border-purple-200 dark:border-purple-500/30'>
                                            <p className='text-xs text-muted-foreground'>Terminal</p>
                                            <p className='font-semibold text-purple-600 dark:text-purple-400'>
                                                {formatCurrency(invoice.given_summa_terminal)} so'm
                                            </p>
                                        </div>
                                    )}
                                    {invoice.given_summa_transfer > 0 && (
                                        <div className='p-3 bg-orange-50 dark:bg-orange-500/10 rounded-lg border border-orange-200 dark:border-orange-500/30'>
                                            <p className='text-xs text-muted-foreground'>Transfer</p>
                                            <p className='font-semibold text-orange-600 dark:text-orange-400'>
                                                {formatCurrency(invoice.given_summa_transfer)} so'm
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    {/* Qancha to'lanmagan - faqat tashqi kirim uchun */}
                    {invoice.type === PurchaseInvoiceType.EXTERNAL && invoice.all_product_summa > 0 && (() => {
                        const allProductSumma = parseFloat(String(invoice.all_product_summa || 0));
                        const givenSummaTotal = parseFloat(String(invoice.given_summa_total_dollar || 0));
                        const remaining = allProductSumma - givenSummaTotal;
                        return remaining > 0 ? (
                            <div className='mt-6 pt-6 border-t'>
                                <h4 className='font-medium mb-4'>Qancha to'lanmagan</h4>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                    <div className='p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/30'>
                                        <p className='text-xs text-muted-foreground'>Jami to'langan</p>
                                        <p className='font-semibold text-emerald-600 dark:text-emerald-400'>
                                            ${formatDollar(givenSummaTotal)}
                                        </p>
                                    </div>
                                    <div className='p-3 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/30'>
                                        <p className='text-xs text-muted-foreground'>Qancha to'lanmagan</p>
                                        <p className='font-semibold text-red-600 dark:text-red-400'>
                                            ${formatDollar(remaining)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : null;
                    })()}

                    {/* Qarz ma'lumotlari */}
                    {(invoice.total_debt_old > 0 || invoice.total_debt > 0) && (
                        <div className='mt-6 pt-6 border-t'>
                            <h4 className='font-medium mb-4'>Qarz ma'lumotlari</h4>
                            <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
                                <div className='p-3 bg-gray-50 dark:bg-gray-500/10 rounded-lg border border-gray-200 dark:border-gray-500/30'>
                                    <p className='text-xs text-muted-foreground'>Eski qarz</p>
                                    <p className='font-semibold dark:text-foreground'>${formatDollar(invoice.total_debt_old)}</p>
                                </div>
                                <div className='p-3 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/30'>
                                    <p className='text-xs text-muted-foreground'>Qolgan qarz</p>
                                    <p className='font-semibold text-red-600 dark:text-red-400'>${formatDollar(invoice.total_debt)}</p>
                                </div>
                                <div className='p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/30'>
                                    <p className='text-xs text-muted-foreground'>Bugungi qarz</p>
                                    <p className='font-semibold text-amber-600 dark:text-amber-400'>
                                        ${formatDollar(invoice.total_debt_today)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Mahsulotlar ro'yxati */}
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Package className='h-5 w-5' />
                        Mahsulotlar
                    </CardTitle>
                    <CardDescription>Fakturaga kiritilgan mahsulotlar ro'yxati</CardDescription>
                </CardHeader>
                <CardContent>
                    {isProductsLoading ? (
                        <div className='space-y-2'>
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className='h-12 w-full' />
                            ))}
                        </div>
                    ) : productHistories.length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-lg'>
                            <Package className='h-12 w-12 text-muted-foreground/50 mb-4' />
                            <p className='text-muted-foreground'>Mahsulotlar topilmadi</p>
                        </div>
                    ) : (
                        <>
                            <div className='rounded-md border'>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className='w-[50px]'>#</TableHead>
                                            <TableHead>Bo'lim</TableHead>
                                            <TableHead>Kategoriya turi</TableHead>
                                            <TableHead>Brend</TableHead>
                                            <TableHead>Mahsulot</TableHead>
                                            <TableHead>O'lcham</TableHead>
                                            <TableHead>Filial</TableHead>
                                            <TableHead className='text-right'>Miqdori</TableHead>
                                            <TableHead className='text-right'>Narxi ($)</TableHead>
                                            <TableHead className='text-right'>Min narx ($)</TableHead>
                                            <TableHead className='text-right'>Jami ($)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {productHistories.map((p, index) => {
                                            const realPrice =
                                                typeof p.real_price === 'string'
                                                    ? parseFloat(p.real_price)
                                                    : p.real_price;
                                            return (
                                                <TableRow key={p.id}>
                                                    <TableCell className='text-muted-foreground'>{index + 1}</TableCell>
                                                    <TableCell>{p.branch_detail?.name || '-'}</TableCell>
                                                    <TableCell>{p.branch_category_detail?.name ?? '-'}</TableCell>
                                                    <TableCell>{p.model_detail?.name || '-'}</TableCell>
                                                    <TableCell className='font-medium'>
                                                        {p.type_detail?.name || '-'}
                                                    </TableCell>
                                                    <TableCell>{p.size_detail?.size ?? '-'}</TableCell>
                                                    <TableCell>{p.filial_detail?.name || '-'}</TableCell>
                                                    <TableCell className='text-right'>{p.count}</TableCell>
                                                    <TableCell className='text-right'>
                                                        ${formatDollar(p.real_price)}
                                                    </TableCell>
                                                    <TableCell className='text-right'>
                                                        ${formatDollar(p.min_price)}
                                                    </TableCell>
                                                    <TableCell className='text-right font-semibold'>
                                                        ${formatDollar(p.count * (realPrice || 0))}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Jami */}
                            <div className='mt-4 flex justify-end'>
                                <div className='bg-muted p-4 rounded-lg min-w-[250px]'>
                                    <div className='flex items-center justify-between gap-4 mb-2'>
                                        <span className='text-muted-foreground'>Mahsulotlar:</span>
                                        <Badge variant='outline'>{productHistories.length} ta</Badge>
                                    </div>
                                    <div className='flex items-center justify-between gap-4 mb-2'>
                                        <span className='text-muted-foreground'>Jami miqdor:</span>
                                        <span className='font-medium'>{formatCurrency(totalCount)}</span>
                                    </div>
                                    <div className='flex items-center justify-between gap-4 pt-2 border-t'>
                                        <span className='text-muted-foreground'>Jami summa:</span>
                                        <span className='text-xl font-bold text-green-600 dark:text-green-400'>
                                            ${formatDollar(totalSum)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Bekor qilish (o'chirish) tasdiq oynasi */}
            <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Karzinkani bekor qilish</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu faktura butunlay o‘chiriladi. Amalni davom ettirasizmi?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Yo‘q</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBekorQilish}
                            disabled={deleteMutation.isPending}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        >
                            {deleteMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            Ha, o‘chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
