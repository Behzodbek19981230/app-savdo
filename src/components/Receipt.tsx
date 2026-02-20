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

	const rows = items
		.map((it, i) => {
			const priceInUsd = Math.round(Number(it.price || 0) / usdRate);
			const totalPriceInUsd = Math.round(Number(it.totalPrice || 0) / usdRate);
			const model = (it as any).modelName || '-';
			const unit = it.unit || (it as any).unitCode || '-';
			return `
        <tr>
          <td style="border:1px solid #000;padding:6px;text-align:center">${i + 1}</td>
          <td style="border:1px solid #000;padding:6px;text-align:center">${escapeHtml(model)}</td>
          <td style="border:1px solid #000;padding:6px;text-align:center">${escapeHtml(String(it.name || '-'))}</td>
          <td style="border:1px solid #000;padding:6px;text-align:center">${Number(it.quantity || 0)}</td>
          <td style="border:1px solid #000;padding:6px;text-align:center">${escapeHtml(unit)}</td>
          <td style="border:1px solid #000;padding:6px;text-align:center">${priceInUsd}</td>
          <td style="border:1px solid #000;padding:6px;text-align:center">${totalPriceInUsd}</td>
        </tr>`;
		})
		.join('\n');

	return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Receipt ${orderNumber}</title>
    <style>
      @page { size: A4 landscape; margin: 10mm; }
      body { font-family: "Times New Roman", serif; margin:0; padding:0; background:#fff }
      .page { width: 297mm; padding: 10mm; box-sizing: border-box }
      img.print-logo { display:block; width:120px; height:auto; margin-bottom:12px }
      table { width:100%; border-collapse:collapse; margin-top:25px; font-size:14px }
      th, td { border:1px solid #000; padding:6px; text-align:center }
      th { background:#f5f5f5; font-weight:bold }
    </style>
  </head>
  <body>
    <div id="receipt-print" class="page">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div style="width:140px;flex-shrink:0">
          <img class="print-logo" src="${logoUrl}" alt="Logo" onerror="this.style.display='none'" />
        </div>
        <div style="flex:1;text-align:center;padding:0 10px">
          <div style="font-size:20px;font-weight:bold;margin-bottom:6px">${formattedDate}</div>
          <div style="font-size:20px;font-weight:bold;color:red">${escapeHtml(customerName)}</div>
        </div>
        <div style="width:140px"></div>
      </div>
      <hr style="margin:20px 0 30px" />

      <div style="display:flex;justify-content:space-between;gap:40px;font-size:15px">
        <div style="width:48%">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-weight:bold">Do'kon:</span><span style="text-align:right">Elegant</span></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-weight:bold">Firma:</span><span style="text-align:right">Elegant</span></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-weight:bold">Telefon nomer1:</span><span style="text-align:right">+99899-811-00-23</span></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-weight:bold"></span><span style="text-align:right">+99890-812-94-44</span></div>
        </div>
        <div style="width:48%">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-weight:bold">Supermarket 1-2 Do'kon</span><span></span></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-weight:bold;color:green">Dollar kursi:</span><span style="text-align:right;color:green;font-weight:bold">${Number(usdRate).toLocaleString()} so'm</span></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-weight:bold">Manzil:</span><span style="text-align:right">Toshkent viloyati, Chirchiq shahri</span></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-weight:bold">Telefon:</span><span style="text-align:right">+99899-793-62-87</span></div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>№</th>
            <th>MODEL</th>
            <th>NOMI</th>
            <th>SONI</th>
            <th>TIP</th>
            <th>NARXI ($)</th>
            <th>UMUMIY NARXI ($)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr>
            <td colspan="6" style="text-align:center"><b>Jami</b></td>
            <td style="text-align:center"><b>${totalInUsd.toFixed(2)}</b></td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top:30px;display:flex;justify-content:space-between;font-size:16px">
        <div style="width:60%">
          <div style="color:orange;font-weight:bold;font-size:18px">Ostatka ($): ${totalInUsd.toFixed(2)} $</div>
          <div>Olingan tovarlar summasi ($): ${totalInUsd.toFixed(2)} $</div>
          <div>Jami to'langan summa ($): ${paidInUsd.toFixed(2)} $</div>
        </div>
        <div style="width:38%;text-align:right">To'langan summa dollarda ($): ${paidInUsd.toFixed(2)} $</div>
      </div>

      <div style="color:red;font-weight:bold;font-size:20px;margin-top:20px">Qolgan qarz ($): ${remainingInUsd.toFixed(2)} $</div>
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
        @page { size: A4 landscape; margin: 10mm; }
        .page { width: 1024px; margin: 12px auto; background: #fff; padding: 20px; }
        img.print-logo { display:block; width:120px; height:auto; margin-bottom:12px }
        table { width:100%; border-collapse:collapse; margin-top:25px; font-size:14px }
        th, td { border:1px solid #000; padding:6px; text-align:center }
        th { background:#f5f5f5; font-weight:bold }
      `}</style>
			<div className='page'>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						marginBottom: 10,
					}}
				>
					<div style={{ width: 140, flexShrink: 0 }}>
						<img
							className='print-logo'
							src={logoUrl}
							alt='Logo'
							onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
						/>
					</div>
					<div style={{ flex: 1, textAlign: 'center', padding: '0 10px' }}>
						<div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 6 }}>{formattedDate}</div>
						<div style={{ fontSize: 20, fontWeight: 'bold', color: 'red' }}>{customerName}</div>
					</div>
					<div style={{ width: 140 }} />
				</div>

				<hr style={{ margin: '20px 0 30px' }} />

				<div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, fontSize: 15 }}>
					<div style={{ width: '48%' }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
							<span style={{ fontWeight: 'bold' }}>Do'kon:</span>
							<span style={{ textAlign: 'right' }}>Elegant</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
							<span style={{ fontWeight: 'bold' }}>Firma:</span>
							<span style={{ textAlign: 'right' }}>Elegant</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
							<span style={{ fontWeight: 'bold' }}>Telefon nomer1:</span>
							<span style={{ textAlign: 'right' }}>+99899-811-00-23</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
							<span style={{ fontWeight: 'bold' }}></span>
							<span style={{ textAlign: 'right' }}>+99890-812-94-44</span>
						</div>
					</div>
					<div style={{ width: '48%' }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
							<span style={{ fontWeight: 'bold' }}>Supermarket 1-2 Do'kon</span>
							<span></span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
							<span style={{ fontWeight: 'bold', color: 'green' }}>Dollar kursi:</span>
							<span style={{ textAlign: 'right', color: 'green', fontWeight: 'bold' }}>
								{Number(usdRate).toLocaleString()} so'm
							</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
							<span style={{ fontWeight: 'bold' }}>Manzil:</span>
							<span style={{ textAlign: 'right' }}>Toshkent viloyati, Chirchiq shahri</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
							<span style={{ fontWeight: 'bold' }}>Telefon:</span>
							<span style={{ textAlign: 'right' }}>+99899-793-62-87</span>
						</div>
					</div>
				</div>

				<table>
					<thead>
						<tr>
							<th>№</th>
							<th>MODEL</th>
							<th>NOMI</th>
							<th>SONI</th>
							<th>TIP</th>
							<th>NARXI ($)</th>
							<th>UMUMIY NARXI ($)</th>
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
									<td>{i + 1}</td>
									<td>{model}</td>
									<td>{it.name}</td>
									<td>{it.quantity}</td>
									<td>{unit}</td>
									<td>{priceInUsd}</td>
									<td>{totalPriceInUsd}</td>
								</tr>
							);
						})}
						<tr>
							<td colSpan={6} style={{ textAlign: 'center' }}>
								<b>Jami</b>
							</td>
							<td style={{ textAlign: 'center' }}>
								<b>{totalInUsd.toFixed(2)}</b>
							</td>
						</tr>
					</tbody>
				</table>

				<div style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
					<div style={{ width: '60%' }}>
						<div style={{ color: 'orange', fontWeight: 'bold', fontSize: 18 }}>
							Ostatka ($): {totalInUsd.toFixed(2)} $
						</div>
						<div>Olingan tovarlar summasi ($): {totalInUsd.toFixed(2)} $</div>
						<div>Jami to'langan summa ($): {paidInUsd.toFixed(2)} $</div>
					</div>
					<div style={{ width: '38%', textAlign: 'right' }}>
						To'langan summa dollarda ($): {paidInUsd.toFixed(2)} $
					</div>
				</div>

				<div style={{ color: 'red', fontWeight: 'bold', fontSize: 20, marginTop: 20 }}>
					Qolgan qarz ($): {remainingInUsd.toFixed(2)} $
				</div>
			</div>
		</div>
	);
}

export default Receipt;
