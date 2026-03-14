// ExportUtils.js — Shared export helpers for CSV, PDF, and text downloads
// Used across consumer, enterprise, and admin pages

// ── CSV ──────────────────────────────────────────────────────────────────────
export function downloadCSV(rows, filename) {
  const csv = rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = filename;
  a.click();
}

// ── Text / Certificate ───────────────────────────────────────────────────────
export function downloadText(content, filename) {
  const a = document.createElement('a');
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
  a.download = filename;
  a.click();
}

// ── Shared: load jsPDF + autoTable ───────────────────────────────────────────
async function loadJsPDF() {
  const [{ jsPDF }, autoTable] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  // autoTable attaches itself to jsPDF.prototype on import
  return jsPDF;
}

// ── Shared: draw branded header ───────────────────────────────────────────────
function drawBrandHeader(doc, subtitle = 'Energy as a Service Platform', rightLine1 = '', rightLine2 = '') {
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setFillColor(34, 197, 94);
  doc.rect(0, 28, 210, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('EcoPower', 14, 17);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(subtitle, 14, 23);
  if (rightLine1) {
    doc.setTextColor(203, 213, 225);
    doc.text(rightLine1, 210 - 14, 17, { align: 'right' });
  }
  if (rightLine2) {
    doc.setTextColor(148, 163, 184);
    doc.text(rightLine2, 210 - 14, 23, { align: 'right' });
  }
}

// ── Shared: draw page footer ──────────────────────────────────────────────────
function drawPageFooter(doc, pageNum, totalPages) {
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 281, 210, 16, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(0, 281, 210, 281);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('EcoPower Energy Services Pvt. Ltd.  |  Ahmedabad, Gujarat  |  support@ecopower.in', 14, 288);
  doc.text(`Page ${pageNum} of ${totalPages}`, 210 - 14, 288, { align: 'right' });
}

// ── Consumer Dashboard Full Report (PDF) ────────────────────────────────────
export async function downloadDashboardReport({ user, telemetry, invoices, carbon }) {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const totalGen = (telemetry || []).reduce((s, t) => s + (t.solarGeneration || 0), 0);
  const totalCons = (telemetry || []).reduce((s, t) => s + (t.consumption || 0), 0);
  const totalGrid = (telemetry || []).reduce((s, t) => s + (t.gridImport || 0), 0);
  const savings = (totalGen * 8).toFixed(0);
  const solarPct = totalCons > 0 ? ((totalGen / totalCons) * 100).toFixed(1) : '0.0';
  const totalPaid = (invoices || []).filter(i => i.status === 'Paid').reduce((s, i) => s + (i.totalAmount || 0), 0);

  drawBrandHeader(
    doc,
    'Energy as a Service Platform',
    `Generated: ${new Date().toLocaleDateString('en-IN')}`,
    user?.name || user?.email || 'Consumer'
  );

  let y = 42;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Energy & Billing Report', 14, y);
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);
  y += 10;

  // KPI summary boxes
  const kpis = [
    ['Solar Generated', `${totalGen.toFixed(1)} kWh`],
    ['Total Consumed', `${totalCons.toFixed(1)} kWh`],
    ['Grid Import', `${totalGrid.toFixed(1)} kWh`],
    ['Solar Coverage', `${solarPct}%`],
    ['Money Saved', `Rs.${Number(savings).toLocaleString('en-IN')}`],
    ['CO2 Saved', `${(totalGen * 0.82).toFixed(1)} kg`],
    ['Trees Equivalent', `${carbon?.total_trees_equivalent || 0}`],
    ['Total Paid', `Rs.${totalPaid.toLocaleString('en-IN')}`],
  ];
  const colW = 182 / 4;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const idx = row * 4 + col;
      const bx = 14 + col * colW;
      const by = y + row * 26;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(bx, by, colW - 2, 22, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(kpis[idx][0], bx + (colW - 2) / 2, by + 7, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(kpis[idx][1], bx + (colW - 2) / 2, by + 17, { align: 'center' });
    }
  }
  y += 58;

  // Invoice table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Invoice History', 14, y);
  y += 4;

  const invoiceRows = (invoices || []).map(inv => [
    inv.billingPeriod || '-',
    `${(inv.energyUsedKwh || 0).toFixed(0)} kWh`,
    `Rs.${(inv.baseAmount || 0).toLocaleString('en-IN')}`,
    `Rs.${(inv.tax || 0).toLocaleString('en-IN')}`,
    `Rs.${(inv.totalAmount || 0).toLocaleString('en-IN')}`,
    inv.status,
  ]);

  doc.autoTable({
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Period', 'Energy', 'Base', 'GST', 'Total', 'Status']],
    body: invoiceRows.length > 0 ? invoiceRows : [['No invoices found', '', '', '', '', '']],
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const s = data.cell.raw;
        if (s === 'Paid') data.cell.styles.textColor = [22, 163, 74];
        else if (s === 'Overdue') data.cell.styles.textColor = [220, 38, 38];
        else data.cell.styles.textColor = [161, 98, 7];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawPageFooter(doc, i, pageCount);
  }

  doc.save(`EcoPower-Report-${(user?.name || 'Consumer').replace(/\s/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ── ESG / Sustainability Report (PDF) ────────────────────────────────────────
export async function downloadESGReport({ carbonKg, trees, solar, renewPct, esgScore, userLabel = 'Enterprise' }) {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Cover page
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 110, 210, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('EcoPower', 105, 70, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 250, 229);
  doc.text('Energy as a Service Platform', 105, 82, { align: 'center' });
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('ESG Sustainability Report', 105, 125, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 250, 229);
  doc.text(userLabel, 105, 137, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 105, 145, { align: 'center' });

  const stats = [
    ['CO2 Offset', `${(carbonKg / 1000).toFixed(1)}t`],
    ['Trees', String(trees)],
    ['Solar MWh', `${(solar / 1000).toFixed(1)}`],
    ['Renewable', `${renewPct.toFixed(0)}%`],
    ['ESG Score', `${esgScore.toFixed(0)}/100`],
  ];
  const bw = 30;
  const startX = (210 - stats.length * bw - (stats.length - 1) * 4) / 2;
  stats.forEach((s, i) => {
    const bx = startX + i * (bw + 4);
    doc.setFillColor(5, 150, 105);
    doc.roundedRect(bx, 162, bw, 28, 3, 3, 'F');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(209, 250, 229);
    doc.text(s[0], bx + bw / 2, 170, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(s[1], bx + bw / 2, 182, { align: 'center' });
  });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(167, 243, 208);
  doc.text('EcoPower Energy Services Pvt. Ltd.  |  Ahmedabad, Gujarat  |  support@ecopower.in', 105, 285, { align: 'center' });

  // Page 2 — details table
  doc.addPage();
  drawBrandHeader(doc, 'ESG Sustainability Report');

  doc.autoTable({
    startY: 42,
    margin: { left: 14, right: 14 },
    head: [['ESG Metric', 'Value', 'Benchmark', 'Status']],
    body: [
      ['CO2 Emissions Offset', `${(carbonKg / 1000).toFixed(2)} metric tons`, '> 30 tons/yr', carbonKg / 1000 > 30 ? 'Exceeds' : 'Below'],
      ['Renewable Energy Share', `${renewPct.toFixed(1)}%`, '> 60%', renewPct > 60 ? 'Exceeds' : 'Below'],
      ['Solar Generation', `${(solar / 1000).toFixed(2)} MWh`, '> 40 MWh/yr', solar / 1000 > 40 ? 'Exceeds' : 'Below'],
      ['Forest Equivalent', `${trees} trees`, '> 1000 trees', trees > 1000 ? 'Exceeds' : 'Below'],
      ['ESG Score', `${esgScore.toFixed(0)} / 100`, '> 75', esgScore > 75 ? 'Exceeds' : 'Below'],
    ],
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        data.cell.styles.textColor = data.cell.raw === 'Exceeds' ? [22, 163, 74] : [161, 98, 7];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    if (i > 1) drawPageFooter(doc, i, pageCount);
  }

  doc.save(`EcoPower-ESG-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ── Admin Analytics CSV ───────────────────────────────────────────────────────
export function downloadAnalyticsCSV({ totalRevenue, pendingRevenue, overdueRevenue, collectionRate, activeUsers, totalUsers, totalGen, totalCons, efficiency, uptimePct, carbonOffset, onlineDevices, totalDevices, timeRange }) {
  const rows = [
    ['EcoPower Analytics Report', `Generated: ${new Date().toLocaleString()}`],
    ['Time Range', timeRange],
    [''],
    ['Metric', 'Value'],
    ['Revenue Collected', `Rs.${totalRevenue.toLocaleString()}`],
    ['Pending Revenue', `Rs.${pendingRevenue.toLocaleString()}`],
    ['Overdue Revenue', `Rs.${overdueRevenue.toLocaleString()}`],
    ['Collection Rate', `${collectionRate}%`],
    ['Active Users', activeUsers],
    ['Total Users', totalUsers],
    ['Energy Generated', `${totalGen.toFixed(0)} kWh`],
    ['Energy Consumed', `${totalCons.toFixed(0)} kWh`],
    ['Green Efficiency', `${efficiency}%`],
    ['Device Uptime', `${uptimePct}%`],
    ['Carbon Offset', `${carbonOffset} kg CO2`],
    ['Online Devices', `${onlineDevices}/${totalDevices}`],
  ];
  downloadCSV(rows, `ecopower_analytics_${timeRange}_${Date.now()}.csv`);
}

// ── Subscription Invoice PDF ──────────────────────────────────────────────────
export async function downloadSubscriptionInvoicePDF(inv, isEnterprise = false) {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  drawBrandHeader(
    doc,
    isEnterprise ? 'Enterprise Energy Services' : 'Energy as a Service Platform',
    'EcoPower Energy Services Pvt. Ltd.',
    'support@ecopower.in  |  +91 79 4000 1234'
  );

  let y = 42;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('SUBSCRIPTION INVOICE', 14, y);

  // Status badge
  const isPaid = inv.isPayg || inv.total === 0;
  doc.setFillColor(...(isPaid ? [240, 253, 244] : [254, 252, 232]));
  doc.roundedRect(210 - 14 - 44, y - 7, 44, 10, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(isPaid ? [22, 163, 74] : [161, 98, 7]));
  doc.text(isPaid ? 'ACTIVATION FREE' : 'PAYMENT PENDING', 210 - 14 - 22, y - 1, { align: 'center' });

  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);
  y += 8;

  const meta = [
    ['Invoice ID', `INV-${(inv.invoiceId || '').slice(-6).toUpperCase()}`],
    ['Plan', inv.planName || 'Energy Plan'],
    ['Billing Period', new Date().toLocaleString('default', { month: 'long', year: 'numeric' })],
    ['Due Date', inv.isPayg ? 'End of month' : new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-IN')],
    ['Type', inv.isPayg ? 'Pay As You Use' : 'Fixed Monthly'],
    ['Generated', new Date().toLocaleDateString('en-IN')],
  ];
  meta.forEach(([label, val], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col === 0 ? 14 : 115;
    const ry = y + row * 9;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(label, x, ry);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(val, x + 40, ry);
  });
  y += Math.ceil(meta.length / 2) * 9 + 10;

  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);
  y += 8;

  if (inv.isPayg) {
    doc.setFillColor(237, 233, 254);
    doc.roundedRect(14, y, 182, 24, 4, 4, 'F');
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(109, 40, 217);
    doc.text('Pay As You Use  -  Rs.6.5 per kWh', 105, y + 10, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(124, 58, 237);
    doc.text('You will be billed at the end of each month based on actual consumption', 105, y + 18, { align: 'center' });
  } else {
    doc.autoTable({
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Description', 'Amount']],
      body: [
        ['Base Plan Fee', `Rs.${(inv.base || 0).toLocaleString('en-IN')}`],
        ['GST @ 18%', `Rs.${(inv.tax || 0).toLocaleString('en-IN')}`],
      ],
      foot: [['TOTAL PAYABLE', `Rs.${(inv.total || 0).toLocaleString('en-IN')}`]],
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
      footStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 1: { halign: 'right' } },
    });
  }

  drawPageFooter(doc, 1, 1);
  doc.save(`EcoPower-Subscription-Invoice-${(inv.invoiceId || Date.now()).toString().slice(-8)}.pdf`);
}

// ── DISCOM Certificate PDF ────────────────────────────────────────────────────
export async function downloadDISCOMCertificate() {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Green header
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('EcoPower', 105, 16, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 250, 229);
  doc.text('Net-Metering Approval Certificate', 105, 26, { align: 'center' });
  doc.text('Issued by: Distribution Company (DISCOM) - Gujarat', 105, 34, { align: 'center' });

  let y = 55;
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1.5);
  doc.roundedRect(14, y, 182, 160, 5, 5, 'S');
  doc.setLineWidth(0.2);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('CERTIFICATE OF NET-METERING APPROVAL', 105, y + 14, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('This certifies that the solar installation described below has been approved', 105, y + 22, { align: 'center' });
  doc.text('for net-metering by the Distribution Company (DISCOM).', 105, y + 28, { align: 'center' });

  doc.setDrawColor(226, 232, 240);
  doc.line(28, y + 33, 196, y + 33);

  const fields = [
    ['Certificate No.', 'DISCOM/NM/2026/MH-4821'],
    ['Valid Until', 'December 2028'],
    ['Status', 'APPROVED'],
    ['Solar Capacity', '10 kW'],
    ['Meter Type', 'Bi-directional Smart Meter'],
    ['Grid Sync Date', '18 February 2026'],
    ['Feed-in Tariff Rate', 'Rs.12 per kWh'],
    ['Approval Authority', 'Gujarat Urja Vikas Nigam Ltd. (GUVNL)'],
  ];
  fields.forEach(([label, val], i) => {
    const fy = y + 42 + i * 13;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(label, 28, fy);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(label === 'Status' ? 22 : 15, label === 'Status' ? 163 : 23, label === 'Status' ? 74 : 42);
    doc.text(val, 105, fy);
  });

  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y + 168, 182, 18, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text('Certificate is digitally verified and valid for net-metering operations.', 105, y + 179, { align: 'center' });

  drawPageFooter(doc, 1, 1);
  doc.save('EcoPower-NetMetering-Certificate-DISCOM.pdf');
}

// ── Consumer Dashboard Full Report (PDF) ────────────────────────────────────
export async function downloadDashboardReport({ user, telemetry, invoices, carbon }) {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const totalGen = telemetry.reduce((s, t) => s + (t.solarGeneration || 0), 0);
  const totalCons = telemetry.reduce((s, t) => s + (t.consumption || 0), 0);
  const totalGrid = telemetry.reduce((s, t) => s + (t.gridImport || 0), 0);
  const savings = (totalGen * 8).toFixed(0);
  const solarPct = totalCons > 0 ? ((totalGen / totalCons) * 100).toFixed(1) : '0.0';
  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.totalAmount || 0), 0);

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setFillColor(34, 197, 94);
  doc.rect(0, 28, 210, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('⚡ EcoPower', 14, 17);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Energy as a Service Platform', 14, 23);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 210 - 14, 17, { align: 'right' });
  doc.text(user?.name || user?.email || 'Consumer', 210 - 14, 23, { align: 'right' });

  let y = 42;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Energy & Billing Report', 14, y);
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);
  y += 10;

  // KPI summary boxes
  const kpis = [
    ['Solar Generated', `${totalGen.toFixed(1)} kWh`],
    ['Total Consumed', `${totalCons.toFixed(1)} kWh`],
    ['Grid Import', `${totalGrid.toFixed(1)} kWh`],
    ['Solar Coverage', `${solarPct}%`],
    ['Money Saved', `₹${Number(savings).toLocaleString('en-IN')}`],
    ['CO₂ Saved', `${(totalGen * 0.82).toFixed(1)} kg`],
    ['Trees Equivalent', `${carbon?.total_trees_equivalent || 0}`],
    ['Total Paid', `₹${totalPaid.toLocaleString('en-IN')}`],
  ];
  const colW = 182 / 4;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const idx = row * 4 + col;
      const bx = 14 + col * colW;
      const by = y + row * 26;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(bx, by, colW - 2, 22, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(kpis[idx][0], bx + (colW - 2) / 2, by + 7, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(kpis[idx][1], bx + (colW - 2) / 2, by + 17, { align: 'center' });
    }
  }
  y += 58;

  // Invoice table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Invoice History', 14, y);
  y += 4;

  doc.autoTable({
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Period', 'Energy (kWh)', 'Base', 'GST', 'Total', 'Status']],
    body: invoices.map(inv => [
      inv.billingPeriod || '—',
      (inv.energyUsedKwh || 0).toFixed(0),
      `₹${(inv.baseAmount || 0).toLocaleString('en-IN')}`,
      `₹${(inv.tax || 0).toLocaleString('en-IN')}`,
      `₹${(inv.totalAmount || 0).toLocaleString('en-IN')}`,
      inv.status,
    ]),
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const s = data.cell.raw;
        data.cell.styles.textColor = s === 'Paid' ? [22, 163, 74] : s === 'Overdue' ? [220, 38, 38] : [161, 98, 7];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 281, 210, 16, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(0, 281, 210, 281);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('EcoPower Energy Services Pvt. Ltd. · Ahmedabad, Gujarat', 14, 288);
    doc.text(`Page ${i} of ${pageCount}`, 210 - 14, 288, { align: 'right' });
  }

  doc.save(`EcoPower-Report-${user?.name?.replace(/\s/g, '-') || 'Consumer'}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ── ESG / Sustainability Report (PDF) ────────────────────────────────────────
export async function downloadESGReport({ carbonKg, trees, solar, renewPct, esgScore, userLabel = 'Enterprise' }) {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Cover
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 110, 210, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('⚡ EcoPower', 105, 70, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 250, 229);
  doc.text('Energy as a Service Platform', 105, 82, { align: 'center' });
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('ESG Sustainability Report', 105, 125, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 250, 229);
  doc.text(userLabel, 105, 137, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 105, 145, { align: 'center' });

  const stats = [
    ['CO₂ Offset', `${(carbonKg / 1000).toFixed(1)}t`],
    ['Trees Equiv.', String(trees)],
    ['Solar MWh', `${(solar / 1000).toFixed(1)}`],
    ['Renewable %', `${renewPct.toFixed(0)}%`],
    ['ESG Score', `${esgScore.toFixed(0)}/100`],
  ];
  const bw = 30;
  const startX = (210 - stats.length * bw - (stats.length - 1) * 4) / 2;
  stats.forEach((s, i) => {
    const bx = startX + i * (bw + 4);
    doc.setFillColor(5, 150, 105);
    doc.roundedRect(bx, 162, bw, 28, 3, 3, 'F');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(209, 250, 229);
    doc.text(s[0], bx + bw / 2, 170, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(s[1], bx + bw / 2, 182, { align: 'center' });
  });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(167, 243, 208);
  doc.text('EcoPower Energy Services Pvt. Ltd. · Ahmedabad, Gujarat · support@ecopower.in', 105, 285, { align: 'center' });

  // Page 2 — details
  doc.addPage();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 28, 210, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('⚡ EcoPower', 14, 17);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('ESG Sustainability Report', 14, 23);

  let y = 42;
  doc.autoTable({
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['ESG Metric', 'Value', 'Benchmark', 'Status']],
    body: [
      ['CO₂ Emissions Offset', `${(carbonKg / 1000).toFixed(2)} metric tons`, '> 30 tons/yr', carbonKg / 1000 > 30 ? '✓ Exceeds' : '⚠ Below'],
      ['Renewable Energy Share', `${renewPct.toFixed(1)}%`, '> 60%', renewPct > 60 ? '✓ Exceeds' : '⚠ Below'],
      ['Solar Generation', `${(solar / 1000).toFixed(2)} MWh`, '> 40 MWh/yr', solar / 1000 > 40 ? '✓ Exceeds' : '⚠ Below'],
      ['Forest Equivalent', `${trees} trees`, '> 1000 trees', trees > 1000 ? '✓ Exceeds' : '⚠ Below'],
      ['ESG Score', `${esgScore.toFixed(0)} / 100`, '> 75', esgScore > 75 ? '✓ Exceeds' : '⚠ Below'],
      ['Carbon Intensity', `${(carbonKg / Math.max(solar, 1)).toFixed(3)} kg/kWh`, '< 0.1', (carbonKg / Math.max(solar, 1)) < 0.1 ? '✓ Exceeds' : '⚠ Below'],
    ],
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        data.cell.styles.textColor = data.cell.raw.includes('✓') ? [22, 163, 74] : [161, 98, 7];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  doc.setFillColor(248, 250, 252);
  doc.rect(0, 281, 210, 16, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(0, 281, 210, 281);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('EcoPower Energy Services Pvt. Ltd. · Ahmedabad, Gujarat', 14, 288);
  doc.text('Page 2 of 2', 210 - 14, 288, { align: 'right' });

  doc.save(`EcoPower-ESG-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ── Admin Analytics CSV (already works, just re-export for consistency) ──────
export function downloadAnalyticsCSV({ totalRevenue, pendingRevenue, overdueRevenue, collectionRate, activeUsers, totalUsers, totalGen, totalCons, efficiency, uptimePct, carbonOffset, onlineDevices, totalDevices, timeRange }) {
  const rows = [
    ['EcoPower Analytics Report', `Generated: ${new Date().toLocaleString()}`],
    ['Time Range', timeRange],
    [''],
    ['Metric', 'Value'],
    ['Revenue Collected', `₹${totalRevenue.toLocaleString()}`],
    ['Pending Revenue', `₹${pendingRevenue.toLocaleString()}`],
    ['Overdue Revenue', `₹${overdueRevenue.toLocaleString()}`],
    ['Collection Rate', `${collectionRate}%`],
    ['Active Users', activeUsers],
    ['Total Users', totalUsers],
    ['Energy Generated', `${totalGen.toFixed(0)} kWh`],
    ['Energy Consumed', `${totalCons.toFixed(0)} kWh`],
    ['Green Efficiency', `${efficiency}%`],
    ['Device Uptime', `${uptimePct}%`],
    ['Carbon Offset', `${carbonOffset} kg CO2`],
    ['Online Devices', `${onlineDevices}/${totalDevices}`],
  ];
  downloadCSV(rows, `ecopower_analytics_${timeRange}_${Date.now()}.csv`);
}

// ── Subscription Invoice PDF ─────────────────────────────────────────────────
export async function downloadSubscriptionInvoicePDF(inv, isEnterprise = false) {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setFillColor(34, 197, 94);
  doc.rect(0, 28, 210, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('⚡ EcoPower', 14, 17);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(isEnterprise ? 'Enterprise Energy Services' : 'Energy as a Service Platform', 14, 23);
  doc.setTextColor(203, 213, 225);
  doc.text('EcoPower Energy Services Pvt. Ltd.', 210 - 14, 12, { align: 'right' });
  doc.text('Ahmedabad, Gujarat, India — 380001', 210 - 14, 17, { align: 'right' });
  doc.text('support@ecopower.in  |  +91 79 4000 1234', 210 - 14, 22, { align: 'right' });

  let y = 42;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('SUBSCRIPTION INVOICE', 14, y);

  // Status badge
  const isPaid = inv.isPayg || inv.total === 0;
  doc.setFillColor(...(isPaid ? [240, 253, 244] : [254, 252, 232]));
  doc.roundedRect(210 - 14 - 40, y - 7, 40, 10, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(isPaid ? [22, 163, 74] : [161, 98, 7]));
  doc.text(isPaid ? 'ACTIVATION FREE' : 'PAYMENT PENDING', 210 - 14 - 20, y - 1, { align: 'center' });

  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);
  y += 8;

  // Meta
  const meta = [
    ['Invoice ID', `INV-${(inv.invoiceId || '').slice(-6).toUpperCase()}`],
    ['Plan', inv.planName || 'Energy Plan'],
    ['Billing Period', new Date().toLocaleString('default', { month: 'long', year: 'numeric' })],
    ['Due Date', inv.isPayg ? 'End of month' : new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-IN')],
    ['Type', inv.isPayg ? 'Pay As You Use' : 'Fixed Monthly'],
    ['Generated', new Date().toLocaleDateString('en-IN')],
  ];
  meta.forEach(([label, val], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col === 0 ? 14 : 115;
    const ry = y + row * 9;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(label, x, ry);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(val, x + 40, ry);
  });
  y += Math.ceil(meta.length / 2) * 9 + 10;

  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);
  y += 8;

  if (inv.isPayg) {
    doc.setFillColor(237, 233, 254);
    doc.roundedRect(14, y, 182, 24, 4, 4, 'F');
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(109, 40, 217);
    doc.text('Pay As You Use — ₹6.5 per kWh', 105, y + 10, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(124, 58, 237);
    doc.text('You will be billed at the end of each month based on actual consumption', 105, y + 18, { align: 'center' });
    y += 32;
  } else {
    doc.autoTable({
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Description', 'Amount']],
      body: [
        ['Base Plan Fee', `₹${(inv.base || 0).toLocaleString('en-IN')}`],
        ['GST @ 18%', `₹${(inv.tax || 0).toLocaleString('en-IN')}`],
      ],
      foot: [['TOTAL PAYABLE', `₹${(inv.total || 0).toLocaleString('en-IN')}`]],
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
      footStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 1: { halign: 'right' } },
    });
    y = doc.lastAutoTable.finalY + 12;
  }

  // Footer
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 281, 210, 16, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(0, 281, 210, 281);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('This is a computer-generated invoice. No signature required.', 14, 288);
  doc.text('GST Reg: 24AABCE1234F1Z5  |  CIN: U40100GJ2020PTC123456', 210 - 14, 288, { align: 'right' });

  doc.save(`EcoPower-Subscription-Invoice-${(inv.invoiceId || Date.now()).toString().slice(-8)}.pdf`);
}

// ── DISCOM Certificate PDF ───────────────────────────────────────────────────
export async function downloadDISCOMCertificate() {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Green header
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('⚡ EcoPower', 105, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 250, 229);
  doc.text('Net-Metering Approval Certificate', 105, 28, { align: 'center' });
  doc.text('Issued by: Distribution Company (DISCOM) — Gujarat', 105, 35, { align: 'center' });

  let y = 55;
  // Certificate box
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1.5);
  doc.roundedRect(14, y, 182, 160, 5, 5, 'S');
  doc.setLineWidth(0.2);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('CERTIFICATE OF NET-METERING APPROVAL', 105, y + 14, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('This certifies that the solar installation described below has been approved', 105, y + 22, { align: 'center' });
  doc.text('for net-metering by the Distribution Company (DISCOM).', 105, y + 28, { align: 'center' });

  doc.setDrawColor(226, 232, 240);
  doc.line(28, y + 33, 196, y + 33);

  const fields = [
    ['Certificate No.', 'DISCOM/NM/2026/MH-4821'],
    ['Valid Until', 'December 2028'],
    ['Status', 'APPROVED'],
    ['Solar Capacity', '10 kW'],
    ['Meter Type', 'Bi-directional Smart Meter'],
    ['Grid Sync Date', '18 February 2026'],
    ['Feed-in Tariff Rate', '₹12 per kWh'],
    ['Approval Authority', 'Gujarat Urja Vikas Nigam Ltd. (GUVNL)'],
  ];
  fields.forEach(([label, val], i) => {
    const fy = y + 42 + i * 13;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(label, 28, fy);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(label === 'Status' ? 22 : 15, label === 'Status' ? 163 : 23, label === 'Status' ? 74 : 42);
    doc.text(val, 105, fy);
  });

  // Stamp
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y + 168, 182, 18, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text('✓  This certificate is digitally verified and valid for net-metering operations.', 105, y + 179, { align: 'center' });

  // Footer
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 281, 210, 16, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(0, 281, 210, 281);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('EcoPower Energy Services Pvt. Ltd. · Ahmedabad, Gujarat · support@ecopower.in', 14, 288);
  doc.text(`Printed: ${new Date().toLocaleDateString('en-IN')}`, 210 - 14, 288, { align: 'right' });

  doc.save('EcoPower-NetMetering-Certificate-DISCOM.pdf');
}
