import React from 'react';
import { CartItem, Customer } from '@/types';

interface ReceiptProps {
	items: CartItem[];
	totalAmount: number;
	usdAmount: string;
	usdRate: number;
	customer?: Customer;
	kassirName?: string;
	orderNumber: string;
	date: Date;
	paidAmount?: number;
	remainingDebt?: number;
	filialLogo?: string | null;
	hodimLayout?: boolean;
}

function formatDate(date: Date) {
	return date
		.toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		})
		.replace(/\//g, '.');
}

export function renderReceiptHtml(props: ReceiptProps) {
	const {
		items,
		totalAmount,
		usdRate,
		customer,
		kassirName,
		orderNumber,
		date,
		paidAmount = 0,
		remainingDebt,
		filialLogo,
		filialName = 'Elegant',
		filialAddress = '',
		filialPhone = '',
	} = props;

	const totalInUsd = totalAmount / usdRate;
	const paidInUsd = paidAmount / usdRate;
	const remaining = remainingDebt !== undefined ? remainingDebt : Math.max(0, totalAmount - paidAmount);
	const remainingInUsd = remaining / usdRate;

	const formattedDate = formatDate(date);
	const formattedDateTime = `${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU', {
		hour: '2-digit',
		minute: '2-digit',
	})}`;
	const customerName = (customer as any)?.name || 'Mijoz';
	const logoUrl = filialLogo
		? filialLogo.startsWith('http')
			? filialLogo
			: filialLogo.startsWith('/')
				? filialLogo
				: '/' + filialLogo
		: '/logo.png';

	const rows = items
		.map((it, i) => {
			const priceInUsd = Math.round(Number(it.price || 0) / usdRate);
			const totalPriceInUsd = Math.round(Number((it as any).totalPrice ?? it.priceSum ?? 0) / usdRate);
			const model = (it as any).modelName || '-';
			const unit = it.unit || (it as any).unitCode || '-';
			return `
        <tr>
						<td class="cell cell-center">${i + 1}</td>
						<td class="cell cell-left">${escapeHtml(model)}</td>
						<td class="cell cell-left">${escapeHtml(String(it.name || '-'))}</td>
						<td class="cell cell-center">${Number(it.quantity || 0)}</td>
						<td class="cell cell-center">${escapeHtml(unit)}</td>
						<td class="cell cell-right">${priceInUsd}</td>
						<td class="cell cell-right">${totalPriceInUsd}</td>
        </tr>`;
		})
		.join('\n');

	// If hodimLayout requested, build a simplified rows string using JOY, MODEL, NOMI, TIP, SONI
	const hodimRows = items
		.map((it) => {
			const joy = escapeHtml(((it as any).joy as string) || '');
			const model = escapeHtml(((it as any).modelName as string) || '-');
			const name = escapeHtml(String(it.name || '-'));
			const tip = escapeHtml(((it as any).unit as string) || '');
			const soni = Number(it.quantity || 0);
			return `
					<tr style="background:#e6fff0">
						<td style="border:1px solid #000;padding:6px;text-align:left">${joy}</td>
						<td style="border:1px solid #000;padding:6px;text-align:left">${model}</td>
						<td style="border:1px solid #000;padding:6px;text-align:left">${name}</td>
						<td style="border:1px solid #000;padding:6px;text-align:center">${tip}</td>
						<td style="border:1px solid #000;padding:6px;text-align:center">${soni}</td>
					</tr>`;
		})
		.join('\n');

	if (!props.hodimLayout) {
		const totalCount = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
		return `<!doctype html>
	<html>
	<head>
		<meta charset="utf-8" />
		<title>Order ${orderNumber}</title>
		<style>
			/* Force color printing where supported */
			* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
			@media print { * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
			@page { size: A4; margin: 15mm; }
			body { font-family: "Times New Roman", serif; margin:0; padding:0; background:#fff }
			.page { width:210mm; padding: 10mm; box-sizing: border-box }
			table { width:100%; border-collapse:collapse; margin-top:20px; font-size:14px }
			th, td { border:1px solid #000; padding:8px; }
			th { background:#2f8f6f; color:#fff; font-weight:bold }
			tr { background: transparent }
			tr:nth-child(odd) td { }
			.center { text-align:center }
			.right { text-align:right }
			.signature { margin-top:60px }
		</style>
	</head>
	<body>
		<div class="page">
			<div style="text-align:center;margin-bottom:10px">
				<div style="font-weight:bold">Buyurtma sanasi: <span style="color:#d33">${escapeHtml(formattedDateTime)}</span></div>
				<div style="font-weight:bold">Mijoz: <span style="color:#d33">${escapeHtml(customer?.name || '')}</span> ${escapeHtml((customer as any)?.phone || '')}</div>
			</div>

			<table>
				<thead>
					<tr>
						<th>JOY</th>
						<th>MODEL</th>
						<th>NOMI</th>
						<th>TIP</th>
						<th>SONI</th>
					</tr>
				</thead>
				<tbody>
					${hodimRows}
					<tr>
						<td colspan="4" style="font-weight:bold">Jami</td>
						<td style="text-align:center;font-weight:bold">${totalCount}</td>
					</tr>
				</tbody>
			</table>

			<div class="signature">
				<div style="width:200px;border-top:1px solid #000;padding-top:6px">Shafyor: ${escapeHtml(kassirName || '')}</div>
			</div>
		</div>
	</body>
	</html>`;
	}

	return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Receipt ${orderNumber}</title>
    <style>
			* {
				box-sizing: border-box;
				-webkit-print-color-adjust: exact !important;
				print-color-adjust: exact !important;
				color-adjust: exact !important;
			}
			@page { size: A4 portrait; margin: 10mm; }
			body { font-family: "Times New Roman", serif; margin:0; padding:0; background:#fff; color:#000 }
			.page { width: 190mm; padding: 0; margin: 0 auto; }
			img.print-logo { display:block; width:90px; height:auto; margin-bottom:8px }
			table { width:100%; border-collapse:collapse; margin-top:16px; font-size:10px; table-layout:fixed }
			th, td {
				border:1px solid #000;
				padding:3px 2px;
				text-align:center;
				vertical-align:middle;
				word-break:break-word;
				overflow-wrap:anywhere;
			}
			th { background:#e9eef8 !important; font-weight:bold; font-size:9.5px; line-height:1.2 }
			.cell { border:1px solid #000; padding:3px 2px; }
			.cell-left { text-align:left; }
			.cell-center { text-align:center; }
			.cell-right { text-align:right; }
			.col-no { width:7% }
			.col-model { width:19% }
			.col-name { width:25% }
			.col-qty { width:9% }
			.col-type { width:14% }
			.col-price { width:13% }
			.col-total { width:13% }
			.head-wrap { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px }
			.info-wrap { display:flex; justify-content:space-between; gap:20px; font-size:12px }
			.summary { margin-top:18px; display:flex; justify-content:space-between; gap:14px; font-size:12px; line-height:1.35 }
			.summary-main { width:62% }
			.summary-side { width:36%; text-align:right }
			.debt { color:red; font-weight:bold; font-size:16px; margin-top:12px }

			@media print {
				html, body { width: 210mm; height: 297mm; }
				body { background:#fff !important; }
				.page { width: 190mm !important; }
				table { page-break-inside:auto; }
				tr { page-break-inside:avoid; page-break-after:auto; }
				thead { display:table-header-group; }
				th { background:#e9eef8 !important; }
			}
    </style>
  </head>
  <body>
    <div id="receipt-print" class="page">
			<div class="head-wrap">
				<div style="width:95px;flex-shrink:0">
          <img class="print-logo" src="${logoUrl}" alt="Logo" onerror="this.style.display='none'" />
        </div>
        <div style="flex:1;text-align:center;padding:0 10px">
					<div style="font-size:16px;font-weight:bold;margin-bottom:4px">${formattedDate}</div>
					<div style="font-size:17px;font-weight:bold;color:red">${escapeHtml(customerName)}</div>
        </div>
				<div style="width:95px"></div>
      </div>
			<hr style="margin:10px 0 14px" />

			<div class="info-wrap">
        <div style="width:48%">
					<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-weight:bold">Do'kon:</span><span style="text-align:right">${escapeHtml(filialName)}</span></div>
					<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-weight:bold">Firma:</span><span style="text-align:right">${escapeHtml(filialName)}</span></div>
					${filialPhone ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-weight:bold">Telefon:</span><span style="text-align:right">${escapeHtml(filialPhone)}</span></div>` : ''}
        </div>
        <div style="width:48%">
					<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-weight:bold">${escapeHtml(filialName)}</span><span></span></div>
					<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-weight:bold;color:green">Dollar kursi:</span><span style="text-align:right;color:green;font-weight:bold">${Number(usdRate).toLocaleString()} so'm</span></div>
					${filialAddress ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-weight:bold">Manzil:</span><span style="text-align:right">${escapeHtml(filialAddress)}</span></div>` : ''}
					${filialPhone ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-weight:bold">Telefon:</span><span style="text-align:right">${escapeHtml(filialPhone)}</span></div>` : ''}
        </div>
      </div>

			<table>
				<colgroup>
					<col class="col-no" />
					<col class="col-model" />
					<col class="col-name" />
					<col class="col-qty" />
					<col class="col-type" />
					<col class="col-price" />
					<col class="col-total" />
				</colgroup>
        <thead>
          <tr>
						<th class="col-no">№</th>
						<th class="col-model">MODEL</th>
						<th class="col-name">NOMI</th>
						<th class="col-qty">SONI</th>
						<th class="col-type">TIP</th>
						<th class="col-price">NARXI ($)</th>
						<th class="col-total">UMUMIY NARXI ($)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr>
						<td colspan="6" class="cell cell-center"><b>Jami</b></td>
						<td class="cell cell-right"><b>${totalInUsd.toFixed(2)}</b></td>
          </tr>
        </tbody>
      </table>

			<div class="summary">
				<div class="summary-main">
					<div style="color:orange;font-weight:bold;font-size:14px">Ostatka ($): ${totalInUsd.toFixed(2)} $</div>
          <div>Olingan tovarlar summasi ($): ${totalInUsd.toFixed(2)} $</div>
          <div>Jami to'langan summa ($): ${paidInUsd.toFixed(2)} $</div>
        </div>
				<div class="summary-side">To'langan summa dollarda ($): ${paidInUsd.toFixed(2)} $</div>
      </div>

			<div class="debt">Qolgan qarz ($): ${remainingInUsd.toFixed(2)} $</div>
    </div>
  </body>
  </html>`;
}

function escapeHtml(str: string) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export function Receipt(props: ReceiptProps) {
	const {
		items,
		totalAmount,
		usdRate,
		customer,
		kassirName,
		orderNumber,
		date,
		paidAmount = 0,
		remainingDebt,
		filialLogo,
	} = props;

	const totalInUsd = totalAmount / usdRate;
	const paidInUsd = paidAmount / usdRate;
	const remaining = remainingDebt !== undefined ? remainingDebt : Math.max(0, totalAmount - paidAmount);
	const remainingInUsd = remaining / usdRate;

	const formattedDate = formatDate(date);
	const customerName = (customer as any)?.name || 'Mijoz';
	const logoUrl = filialLogo
		? filialLogo.startsWith('http')
			? filialLogo
			: filialLogo.startsWith('/')
				? filialLogo
				: '/' + filialLogo
		: '/logo.png';

	return (
		<div id='receipt-print' style={{ fontFamily: '"Times New Roman", serif', margin: 0, padding: 0 }}>
			<style>{`
        @page { size: A4 landscape; margin: 8mm; }
        .page { width: 281mm; margin: 0 auto; background: #fff; padding: 8mm; box-sizing: border-box; }
        img.print-logo { display:block; width:80px; height:auto; margin-bottom:8px }
        table { border-collapse:collapse; margin-top:12px; font-size:10px }
        th, td { border:1px solid #000; text-align:center }
        th { background:#f5f5f5; font-weight:bold; font-size:9px }
        td { font-size:9px }
      `}</style>
			<div className='page'>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						marginBottom: 6,
					}}
				>
					<div style={{ width: 100, flexShrink: 0 }}>
						<img
							className='print-logo'
							src={logoUrl}
							alt='Logo'
							onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
						/>
					</div>
					<div style={{ flex: 1, textAlign: 'center', padding: '0 8px' }}>
						<div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>{formattedDate}</div>
						<div style={{ fontSize: 16, fontWeight: 'bold', color: 'red' }}>{customerName}</div>
					</div>
					<div style={{ width: 100 }} />
				</div>

				<hr style={{ margin: '10px 0 12px', border: 0, borderTop: '1px solid #000' }} />

				<div
					style={{ display: 'flex', justifyContent: 'space-between', gap: 20, fontSize: 11, marginBottom: 8 }}
				>
					<div style={{ width: '48%' }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
							<span style={{ fontWeight: 'bold' }}>Do'kon:</span>
							<span style={{ textAlign: 'right' }}>Elegant</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
							<span style={{ fontWeight: 'bold' }}>Firma:</span>
							<span style={{ textAlign: 'right' }}>Elegant</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
							<span style={{ fontWeight: 'bold' }}>Telefon nomer1:</span>
							<span style={{ textAlign: 'right' }}>+99899-811-00-23</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
							<span style={{ fontWeight: 'bold' }}></span>
							<span style={{ textAlign: 'right' }}>+99890-812-94-44</span>
						</div>
					</div>
					<div style={{ width: '48%' }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
							<span style={{ fontWeight: 'bold' }}>Supermarket 1-2 Do'kon</span>
							<span></span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
							<span style={{ fontWeight: 'bold', color: 'green' }}>Dollar kursi:</span>
							<span style={{ textAlign: 'right', color: 'green', fontWeight: 'bold' }}>
								{Number(usdRate).toLocaleString()} so'm
							</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
							<span style={{ fontWeight: 'bold' }}>Manzil:</span>
							<span style={{ textAlign: 'right' }}>Toshkent viloyati, Chirchiq shahri</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
							<span style={{ fontWeight: 'bold' }}>Telefon:</span>
							<span style={{ textAlign: 'right' }}>+99899-793-62-87</span>
						</div>
					</div>
				</div>

				<table>
					<thead>
						<tr>
							<th style={{ width: 20 }}>№</th>
							<th style={{ width: 100 }}>MODEL</th>
							<th style={{ width: 100 }}>NOMI</th>
							<th style={{ width: 100 }}>SONI</th>
							<th style={{ width: 100 }}>TIP</th>
							<th style={{ width: 100 }}>NARXI ($)</th>
							<th style={{ width: 100 }}>UMUMIY NARXI ($)</th>
						</tr>
					</thead>
					<tbody>
						{items.map((it, i) => {
							const priceInUsd = Math.round(Number(it.price || 0) / usdRate);
							const totalPriceInUsd = Math.round(Number(it.totalPrice || 0) / usdRate);
							const model = (it as any).modelName || '-';
							const unit = it.unit || (it as any).unitCode || '-';
							return (
								<tr key={it.id}>
									<td className='px-2 py-1'>{i + 1}</td>
									<td className='px-2 py-1'>{model}</td>
									<td className='px-2 py-1'>{it.name}</td>
									<td className='px-2 py-1'>{it.quantity}</td>
									<td className='px-2 py-1'>{unit}</td>
									<td className='px-2 py-1'>{priceInUsd}</td>
									<td className='px-2 py-1'>{totalPriceInUsd}</td>
								</tr>
							);
						})}
						<tr>
							<td colSpan={6} className='px-2 py-1' style={{ textAlign: 'center' }}>
								<b>Jami</b>
							</td>
							<td className='px-2 py-1' style={{ textAlign: 'center' }}>
								<b>{totalInUsd.toFixed(2)}</b>
							</td>
						</tr>
					</tbody>
				</table>

				<div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
					<div style={{ width: '60%' }}>
						<div style={{ color: 'orange', fontWeight: 'bold', fontSize: 13 }}>
							Ostatka ($): {totalInUsd.toFixed(2)} $
						</div>
						<div style={{ fontSize: 11 }}>Olingan tovarlar summasi ($): {totalInUsd.toFixed(2)} $</div>
						<div style={{ fontSize: 11 }}>Jami to'langan summa ($): {paidInUsd.toFixed(2)} $</div>
					</div>
					<div style={{ width: '38%', textAlign: 'right', fontSize: 11 }}>
						To'langan summa dollarda ($): {paidInUsd.toFixed(2)} $
					</div>
				</div>

				<div style={{ color: 'red', fontWeight: 'bold', fontSize: 14, marginTop: 12 }}>
					Qolgan qarz ($): {remainingInUsd.toFixed(2)} $
				</div>
			</div>
		</div>
	);
}

export default Receipt;
