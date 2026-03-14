// InvoicePDF.js — EcoPower branded PDF generator
// Single invoice + bulk "all invoices" export

async function loadJsPDF() {
  const [{ jsPDF }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  return jsPDF;
}

export async function downloadInvoicePDF(inv) {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  renderInvoicePage(doc, inv, 1, 1);
  doc.save(`EcoPower-Invoice-${inv.invoiceId?.slice(-8).toUpperCase() || 'INV'}.pdf`);
}

export async function downloadAllInvoicesPDF(invoices, userLabel = 'Account') {
  if (!invoices || invoices.length === 0) return;
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  renderCoverPage(doc, invoices, userLabel);
  invoices.forEach((inv, idx) => {
    doc.addPage();
    renderInvoicePage(doc, inv, idx + 1, invoices.length);
  });
  doc.addPage();
  renderSummaryPage(doc, invoices);

  doc.save(`EcoPower-All-Invoices-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function drawHeader(doc) {
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
  doc.text('Energy as a Service Platform', 14, 23);
  doc.setTextColor(203, 213, 225);
  doc.text('EcoPower Energy Services Pvt. Ltd.', 210 - 14, 12, { align: 'right' });
  doc.text('Ahmedabad, Gujarat, India - 380001', 210 - 14, 17, { align: 'right' });
  doc.text('support@ecopower.in  |  +91 79 4000 1234', 210 - 14, 22, { align: 'right' });
}

function drawFooter(doc, pageNum, totalPages) {
  const y = 285;
  doc.setFillColor(248, 250, 252);
  doc.rect(0, y - 4, 210, 16, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(0, y - 4, 210, y - 4);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Computer-generated invoice. No signature required.', 14, y + 2);
  doc.text(`Page ${pageNum} of ${totalPages}`, 210 - 14, y + 2, { align: 'right' });
  doc.text('GST Reg: 24AABCE1234F1Z5  |  CIN: U40100GJ2020PTC123456', 105, y + 7, { align: 'center' });
}

function statusColors(status) {
  if (status === 'Paid') return { bg: [240, 253, 244], text: [22, 163, 74], label: 'PAID' };
  if (status === 'Overdue') return { bg: [254, 242, 242], text: [220, 38, 38], label: 'OVERDUE' };
  return { bg: [254, 252, 232], text: [161, 98, 7], label: 'PENDING' };
}

function renderInvoicePage(doc, inv, pageNum, totalPages) {
  drawHeader(doc);
  const sc = statusColors(inv.status);
  let y = 40;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TAX INVOICE', 14, y);

  doc.setFillColor(...sc.bg);
  doc.roundedRect(210 - 14 - 32, y - 7, 32, 10, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...sc.text);
  doc.text(sc.label, 210 - 14 - 16, y - 1, { align: 'center' });

  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);
  y += 8;

  const metaLeft = [
    ['Invoice Number', `#${inv.invoiceId?.slice(-8).toUpperCase() || 'N/A'}`],
    ['Billing Period', inv.billingPeriod || 'N/A'],
    ['Issue Date', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
    ['Due Date', inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'],
  ];
  const metaRight = [
    ['Energy Consumed', `${inv.energyUsedKwh || 0} kWh`],
    ['Rate per kWh', inv.baseAmount && inv.energyUsedKwh ? `Rs.${(inv.baseAmount / inv.energyUsedKwh).toFixed(2)}` : '-'],
    ['Subscription ID', inv.subscriptionId?.slice(-8).toUpperCase() || 'N/A'],
    ['Payment Mode', 'Online / UPI / Card'],
  ];

  doc.setFontSize(8.5);
  metaLeft.forEach(([label, val], i) => {
    const rowY = y + i * 9;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(label, 14, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(val, 75, rowY);
  });
  metaRight.forEach(([label, val], i) => {
    const rowY = y + i * 9;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(label, 115, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(val, 175, rowY);
  });

  y += metaLeft.length * 9 + 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Charges Breakdown', 14, y);
  y += 6;

  doc.autoTable({
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Description', 'Unit', 'Rate', 'Amount']],
    body: [
      ['Energy Consumption', `${inv.energyUsedKwh || 0} kWh`, inv.baseAmount && inv.energyUsedKwh ? `Rs.${(inv.baseAmount / inv.energyUsedKwh).toFixed(2)}/kWh` : '-', `Rs.${(inv.baseAmount || 0).toLocaleString('en-IN')}`],
      ['GST @ 18%', '-', '18%', `Rs.${(inv.tax || 0).toLocaleString('en-IN')}`],
      ['Discount / Rebate', '-', '-', `- Rs.${(inv.discount || 0).toLocaleString('en-IN')}`],
    ],
    foot: [['', '', 'TOTAL PAYABLE', `Rs.${(inv.totalAmount || 0).toLocaleString('en-IN')}`]],
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
    footStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 3: { halign: 'right' }, 2: { halign: 'right' } },
  });

  y = doc.lastAutoTable.finalY + 12;

  // Energy usage bar
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Energy Usage', 14, y);
  y += 6;
  const usedPct = Math.min((inv.energyUsedKwh || 0) / 500, 1);
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 8, 2, 2, 'F');
  if (usedPct > 0) {
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(14, y, 182 * usedPct, 8, 2, 2, 'F');
  }
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${inv.energyUsedKwh || 0} kWh used`, 14, y + 14);
  doc.text('500 kWh limit', 14 + 182, y + 14, { align: 'right' });
  y += 22;

  // Summary card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 28, 4, 4, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 28, 4, 4, 'S');
  const cols = [
    ['Base Amount', `Rs.${(inv.baseAmount || 0).toLocaleString('en-IN')}`],
    ['GST (18%)', `Rs.${(inv.tax || 0).toLocaleString('en-IN')}`],
    ['Discount', `- Rs.${(inv.discount || 0).toLocaleString('en-IN')}`],
    ['Total', `Rs.${(inv.totalAmount || 0).toLocaleString('en-IN')}`],
  ];
  const colW = 182 / 4;
  cols.forEach(([label, val], i) => {
    const cx = 14 + i * colW + colW / 2;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(label, cx, y + 9, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(i === 3 ? 22 : 15, i === 3 ? 163 : 23, i === 3 ? 74 : 42);
    doc.text(val, cx, y + 20, { align: 'center' });
  });
  y += 36;

  if (inv.status !== 'Paid') {
    doc.setFillColor(254, 252, 232);
    doc.roundedRect(14, y, 182, 18, 3, 3, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(161, 98, 7);
    doc.text('Payment Instructions', 20, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Pay via EcoPower portal  |  UPI: ecopower@hdfc  |  NEFT: HDFC0001234 / A/C: 50100123456789', 20, y + 13);
  } else {
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14, y, 182, 18, 3, 3, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 74);
    doc.text('Payment Received - Thank you for your timely payment!', 20, y + 11);
  }

  drawFooter(doc, pageNum, totalPages);
}

function renderCoverPage(doc, invoices, userLabel) {
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setFillColor(34, 197, 94);
  doc.rect(0, 100, 210, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text('EcoPower', 105, 80, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Energy as a Service Platform', 105, 90, { align: 'center' });

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Invoice Statement', 105, 120, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(userLabel, 105, 132, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 105, 140, { align: 'center' });

  const paid = invoices.filter(i => i.status === 'Paid');
  const pending = invoices.filter(i => i.status !== 'Paid');
  const totalAmt = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalEnergy = invoices.reduce((s, i) => s + (i.energyUsedKwh || 0), 0);

  const stats = [
    ['Total', invoices.length],
    ['Paid', paid.length],
    ['Pending', pending.length],
    ['Amount', `Rs.${(totalAmt / 1000).toFixed(1)}K`],
    ['Energy', `${totalEnergy.toFixed(0)} kWh`],
  ];
  const boxW = 36;
  const startX = (210 - stats.length * boxW - (stats.length - 1) * 4) / 2;
  stats.forEach((s, i) => {
    const bx = startX + i * (boxW + 4);
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(bx, 158, boxW, 28, 3, 3, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(String(s[0]), bx + boxW / 2, 166, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text(String(s[1]), bx + boxW / 2, 178, { align: 'center' });
  });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('EcoPower Energy Services Pvt. Ltd.  |  Ahmedabad, Gujarat  |  support@ecopower.in', 105, 280, { align: 'center' });
  doc.text('GST: 24AABCE1234F1Z5  |  CIN: U40100GJ2020PTC123456', 105, 287, { align: 'center' });
}

function renderSummaryPage(doc, invoices) {
  drawHeader(doc);
  let y = 42;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Account Summary', 14, y);
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);
  y += 10;

  const totalAmt = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalEnergy = invoices.reduce((s, i) => s + (i.energyUsedKwh || 0), 0);

  doc.autoTable({
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Invoice', 'Period', 'Energy', 'Base', 'GST', 'Total', 'Status']],
    body: invoices.map(inv => [
      `#${inv.invoiceId?.slice(-8).toUpperCase() || 'N/A'}`,
      inv.billingPeriod || '-',
      `${inv.energyUsedKwh || 0} kWh`,
      `Rs.${(inv.baseAmount || 0).toLocaleString('en-IN')}`,
      `Rs.${(inv.tax || 0).toLocaleString('en-IN')}`,
      `Rs.${(inv.totalAmount || 0).toLocaleString('en-IN')}`,
      inv.status,
    ]),
    foot: [['', `${invoices.length} invoices`, `${totalEnergy.toFixed(0)} kWh`, '', '', `Rs.${totalAmt.toLocaleString('en-IN')}`, '']],
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [51, 65, 85] },
    footStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const s = data.cell.raw;
        if (s === 'Paid') data.cell.styles.textColor = [22, 163, 74];
        else if (s === 'Overdue') data.cell.styles.textColor = [220, 38, 38];
        else data.cell.styles.textColor = [161, 98, 7];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  const totalPages = doc.internal.getNumberOfPages();
  drawFooter(doc, totalPages, totalPages);
}
