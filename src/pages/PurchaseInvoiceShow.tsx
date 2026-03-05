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
import { ArrowLeft, Package, FileText, ShoppingCart, Trash2, Loader2, Pencil } from 'lucide-react';
import moment from 'moment';
import { formatCurrency } from '@/lib/utils';
// Dollar formatlagich
const formatDollar = (value: number) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};
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
            <div className='space-y-4'>
                <div className='flex items-center gap-4'>
                    <Skeleton className='h-7 w-10' />
                    <Skeleton className='h-8 w-64' />
                </div>
                <Skeleton className='h-48 w-full' />
                <Skeleton className='h-76 w-full' />
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
        <div className='space-y-4'>
            {/* Faktura ma'lumotlari */}
            <Card>
                <CardHeader className='flex flex-row items-center justify-between flex-wrap gap-2'>
                    <CardTitle className='flex items-center gap-2 text-base'>Faktura ma'lumotlari</CardTitle>
                    {invoice.is_karzinka && (
                        <CardDescription className='flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2'>
                            <ShoppingCart className='h-4 w-4 shrink-0' />
                            Bu faktura karzinkada — hali tasdiqlanmagan. Mahsulotlar qo'shilgan, amalga oshirish yoki
                            "Bekor qilish" orqali o'chirish mumkin.
                        </CardDescription>
                    )}
                    <div className='flex items-center gap-2'>
                        <Button variant='outline' onClick={() => navigate('/purchase-invoices')}>
                            <ArrowLeft className='h-4 w-4 mr-2' />
                            Orqaga
                        </Button>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => navigate(`/purchase-invoices/add/${invoice.id}`)}
                        >
                            <Pencil className='h-4 w-4 mr-2' />
                            Tahrirlash
                        </Button>
                        {invoice.is_karzinka && (
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() => setIsCancelDialogOpen(true)}
                                className='text-destructive hover:text-destructive'
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? (
                                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                ) : (
                                    <Trash2 className='h-4 w-4 mr-2' />
                                )}
                                Bekor qilish
                            </Button>
                        )}
                        {invoice.is_karzinka && (
                            <Badge variant='outline' className='text-sm border-amber-500 text-amber-700 bg-amber-50'>
                                <ShoppingCart className='h-3.5 w-3.5 mr-1' />
                                Karzinka
                            </Badge>
                        )}
                        <Badge
                            variant='default'
                            className={`text-sm ${invoice.type === PurchaseInvoiceType.EXTERNAL ? 'bg-green-600' : 'bg-blue-600'}`}
                        >
                            {invoice.type === PurchaseInvoiceType.EXTERNAL
                                ? PurchaseInvoiceTypeLabels[PurchaseInvoiceType.EXTERNAL]
                                : PurchaseInvoiceTypeLabels[PurchaseInvoiceType.INTERNAL]}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <>
                        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-3'>
                            {/* Sana */}
                            <div className='flex items-baseline gap-1.5'>
                                <p className='text-xs text-muted-foreground'>Sana:</p>
                                <p className='font-medium text-sm'>{moment(invoice.date).format('DD.MM.YYYY')}</p>
                            </div>

                            {/* Filial */}
                            <div className='flex items-baseline gap-1.5'>
                                <p className='text-xs text-muted-foreground'>Filial:</p>
                                <p className='font-medium text-sm'>{invoice.filial_detail?.name || '-'}</p>
                            </div>

                            {/* Ichki kirim uchun: Qaysi ombordan va Qaysi omborga */}
                            {invoice.type === PurchaseInvoiceType.INTERNAL ? (
                                <>
                                    <div className='flex items-baseline gap-1.5'>
                                        <p className='text-xs text-muted-foreground'>Ombordan:</p>
                                        <p className='font-medium text-sm'>
                                            {(
                                                invoice as unknown as {
                                                    sklad_outgoing_detail?: { name: string };
                                                }
                                            ).sklad_outgoing_detail?.name || '-'}
                                        </p>
                                    </div>
                                    <div className='flex items-baseline gap-1.5'>
                                        <p className='text-xs text-muted-foreground'>Omborga:</p>
                                        <p className='font-medium text-sm'>{invoice.sklad_detail?.name || '-'}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Tashqi kirim uchun: Ta'minotchi va Ombor */}
                                    <div className='flex items-baseline gap-1.5'>
                                        <p className='text-xs text-muted-foreground'>Ta'minotchi:</p>
                                        <p className='font-medium text-sm'>{invoice.supplier_detail?.name || '-'}</p>
                                    </div>
                                    <div className='flex items-baseline gap-1.5'>
                                        <p className='text-xs text-muted-foreground'>Ombor:</p>
                                        <p className='font-medium text-sm'>{invoice.sklad_detail?.name || '-'}</p>
                                    </div>
                                </>
                            )}
                            <div className='flex items-baseline gap-1.5'>
                                <p className='text-xs text-muted-foreground'>Xodim:</p>
                                <p className='font-medium text-sm'>
                                    {invoice.employee_detail?.full_name || (invoice.is_karzinka ? 'Kiritilmagan' : '-')}
                                </p>
                            </div>
                            <div className='flex items-baseline gap-1.5'>
                                <p className='text-xs text-muted-foreground'>Mahsulotlar:</p>
                                <p className='font-medium text-sm'>{invoice.product_count} ta</p>
                            </div>
                            <div className='flex items-baseline gap-1.5'>
                                <p className='text-xs text-muted-foreground'>Jami summa:</p>
                                <p className='font-medium text-sm text-emerald-600'>
                                    ${formatDollar(invoice.all_product_summa)}
                                </p>
                            </div>
                        </div>

                        {/* To'lov ma'lumotlari */}
                        {(invoice.given_summa_dollar > 0 ||
                            invoice.given_summa_naqt > 0 ||
                            invoice.given_summa_terminal > 0 ||
                            invoice.given_summa_transfer > 0) && (
                                <div className='mt-4 pt-4 border-t'>
                                    <h4 className='font-medium text-sm mb-2'>To'lov ma'lumotlari</h4>
                                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2'>
                                        {invoice.given_summa_dollar > 0 && (
                                            <div className='flex items-baseline gap-1.5'>
                                                <p className='text-xs text-muted-foreground'>Dollar:</p>
                                                <p className='font-semibold text-sm text-green-600'>
                                                    ${formatDollar(invoice.given_summa_dollar)}
                                                </p>
                                            </div>
                                        )}
                                        {invoice.given_summa_naqt > 0 && (
                                            <div className='flex items-baseline gap-1.5'>
                                                <p className='text-xs text-muted-foreground'>Naqd:</p>
                                                <p className='font-semibold text-sm text-blue-600'>
                                                    {formatCurrency(invoice.given_summa_naqt)} so'm
                                                </p>
                                            </div>
                                        )}
                                        {invoice.given_summa_terminal > 0 && (
                                            <div className='flex items-baseline gap-1.5'>
                                                <p className='text-xs text-muted-foreground'>Terminal:</p>
                                                <p className='font-semibold text-sm text-purple-600'>
                                                    {formatCurrency(invoice.given_summa_terminal)} so'm
                                                </p>
                                            </div>
                                        )}
                                        {invoice.given_summa_transfer > 0 && (
                                            <div className='flex items-baseline gap-1.5'>
                                                <p className='text-xs text-muted-foreground'>Transfer:</p>
                                                <p className='font-semibold text-sm text-orange-600'>
                                                    {formatCurrency(invoice.given_summa_transfer)} so'm
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        {/* Qancha to'lanmagan - faqat tashqi kirim uchun */}
                        {invoice.type === PurchaseInvoiceType.EXTERNAL &&
                            invoice.all_product_summa > 0 &&
                            (() => {
                                const allProductSumma = parseFloat(String(invoice.all_product_summa || 0));
                                const givenSummaTotal = parseFloat(String(invoice.given_summa_total_dollar || 0));
                                const remaining = allProductSumma - givenSummaTotal;
                                return remaining > 0 ? (
                                    <div className='mt-4 pt-4 border-t'>
                                        <div className='grid grid-cols-2 gap-4'>
                                            <div className='flex items-baseline gap-1.5'>
                                                <p className='text-xs text-muted-foreground'>Jami to'langan:</p>
                                                <p className='font-semibold text-emerald-600'>
                                                    ${formatDollar(givenSummaTotal)}
                                                </p>
                                            </div>
                                            <div className='flex items-baseline gap-1.5'>
                                                <p className='text-xs text-muted-foreground'>Qancha to'lanmagan:</p>
                                                <p className='font-semibold text-red-600'>${formatDollar(remaining)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : null;
                            })()}

                        {/* Qarz ma'lumotlari */}
                        {(invoice.total_debt_old > 0 || invoice.total_debt > 0 || invoice.total_debt_today > 0) && (
                            <div className='mt-4 pt-4 border-t'>
                                <h4 className='font-medium text-sm mb-2'>Qarz ma'lumotlari</h4>
                                <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
                                    <div className='flex items-baseline gap-1.5'>
                                        <p className='text-xs text-muted-foreground'>Eski qarz:</p>
                                        <p className='font-semibold'>${formatDollar(invoice.total_debt_old)}</p>
                                    </div>
                                    <div className='flex items-baseline gap-1.5'>
                                        <p className='text-xs text-muted-foreground'>Qolgan qarz:</p>
                                        <p className='font-semibold text-red-600'>
                                            ${formatDollar(invoice.total_debt)}
                                        </p>
                                    </div>
                                    <div className='flex items-baseline gap-1.5'>
                                        <p className='text-xs text-muted-foreground'>Bugungi qarz:</p>
                                        <p className='font-semibold text-amber-600'>
                                            ${formatDollar(invoice.total_debt_today)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                </CardContent>
            </Card>

            {/* Mahsulotlar ro'yxati */}
            <Card>
                <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <CardTitle className='flex items-center gap-2 text-base'>
                                <Package className='h-5 w-5' />
                                Mahsulotlar
                            </CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isProductsLoading ? (
                        <div className='flex items-center justify-center py-10'>
                            <Loader2 className='h-8 w-8 animate-spin text-primary' />
                        </div>
                    ) : productHistories.length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-lg'>
                            <Package className='h-12 w-12 text-muted-foreground/50 mb-4' />
                            <p className='text-muted-foreground'>Mahsulotlar qo'shilmagan</p>
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
                                                <TableRow key={`history-${p.id}`}>
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
                                                        $
                                                        {formatDollar(
                                                            typeof p.real_price === 'string'
                                                                ? parseFloat(p.real_price)
                                                                : (p.real_price ?? 0),
                                                        )}
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
                                <div className='bg-muted rounded-lg px-3 py-2.5'>
                                    <div className='flex items-center gap-4 text-sm'>
                                        <div className='flex items-center gap-2'>
                                            <span className='text-xs text-muted-foreground'>Mahsulotlar:</span>
                                            <Badge variant='outline' className='h-5 px-2 text-xs'>
                                                {productHistories.length} ta
                                            </Badge>
                                        </div>
                                        <div className='h-4 w-px bg-border' />
                                        <div className='flex items-center gap-2'>
                                            <span className='text-xs text-muted-foreground'>Jami miqdor:</span>
                                            <span className='font-medium text-sm'>
                                                {formatCurrency(productHistories.reduce((sum, p) => sum + p.count, 0))}
                                            </span>
                                        </div>
                                        <div className='h-4 w-px bg-border' />
                                        <div className='flex items-center gap-2'>
                                            <span className='text-xs text-muted-foreground'>Jami summa:</span>
                                            <span className='text-base font-bold text-green-600'>
                                                $
                                                {formatDollar(
                                                    productHistories.reduce((sum, p) => {
                                                        const price =
                                                            typeof p.real_price === 'string'
                                                                ? parseFloat(p.real_price)
                                                                : p.real_price;
                                                        return sum + p.count * (price || 0);
                                                    }, 0),
                                                )}
                                            </span>
                                        </div>
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
                        <AlertDialogTitle>Fakturani bekor qilish</AlertDialogTitle>
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
