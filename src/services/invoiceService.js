import jsPDF from 'jspdf';

/**
 * Generate and auto-download a professional PDF invoice.
 * Uses jsPDF with the EcoPower green theme.
 */
export function generateInvoicePDF(invoice, user) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = 0;

    // ─── GREEN HEADER BAR ────────────────────────────────────
    doc.setFillColor(0, 200, 100); // #00C864
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Header text — white
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('⚡ EcoPower', margin, 22);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('TAX INVOICE', pageWidth - margin, 22, { align: 'right' });

    y = 45;

    // ─── TWO COLUMN SECTION ──────────────────────────────────
    const colWidth = contentWidth / 2 - 5;

    // Left column: Customer Details
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.text(user.name || 'Customer', margin, y);
    y += 5;

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const address = user.address || '';
    const cityState = [user.city, user.state, user.pincode].filter(Boolean).join(', ');
    doc.text(address, margin, y);
    y += 4;
    doc.text(cityState, margin, y);
    y += 6;

    doc.setTextColor(80, 80, 80);
    doc.text(`Connection ID: ${user.connectionId || '—'}`, margin, y);
    y += 4;
    doc.text(`Meter No: ${user.meterNo || '—'}`, margin, y);
    y += 4;
    doc.text(`Plan: ${invoice.planName || '—'}`, margin, y);

    // Right column: Invoice Details
    let ry = 45;
    const rightX = margin + colWidth + 10;

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE DETAILS', rightX, ry);
    ry += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);

    const invoiceDetails = [
        ['Invoice No:', invoice.invoiceNo || '—'],
        ['Date:', new Date().toLocaleDateString('en-IN')],
        ['Period:', invoice.period || '—'],
        ['Due Date:', invoice.dueDate || '—'],
        ['Status:', (invoice.status || 'pending').toUpperCase()],
    ];

    invoiceDetails.forEach(([label, value]) => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.text(label, rightX, ry);
        doc.setTextColor(40, 40, 40);
        doc.text(value, rightX + 30, ry);
        ry += 5;
    });

    // ─── SEPARATOR ───────────────────────────────────────────
    y = Math.max(y, ry) + 10;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // ─── ITEMIZED TABLE ──────────────────────────────────────
    const tableHeaders = ['Description', 'Details', 'Amount (₹)'];
    const colWidths = [contentWidth * 0.45, contentWidth * 0.3, contentWidth * 0.25];

    // Table header
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 4, contentWidth, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);

    let tx = margin + 2;
    tableHeaders.forEach((header, i) => {
        const align = i === 2 ? 'right' : 'left';
        const xPos = i === 2 ? margin + contentWidth - 2 : tx;
        doc.text(header, xPos, y, { align });
        tx += colWidths[i];
    });

    y += 8;

    // Parse numeric values
    const planFee = parseFloat(invoice.planFee) || 0;
    const importKwh = parseFloat(invoice.gridImportKwh) || 0;
    const importRate = parseFloat(invoice.gridImportRate) || 8;
    const importCharge = parseFloat(invoice.gridImportCharge) || 0;
    const exportKwh = parseFloat(invoice.gridExportKwh) || 0;
    const exportRate = parseFloat(invoice.gridExportRate) || 5;
    const exportCredit = parseFloat(invoice.gridExportCredit) || 0;
    const taxRate = parseFloat(invoice.serviceTax) || 18;
    const totalAmount = parseFloat(invoice.totalAmount) || 0;

    const subtotal = planFee + importCharge - exportCredit;
    const taxAmount = (subtotal * taxRate) / 100;

    // Table rows
    const rows = [
        ['Solar Service Fee', '1 month', `₹${planFee.toFixed(2)}`],
        ['Grid Import', `${importKwh} kWh × ₹${importRate}`, `₹${importCharge.toFixed(2)}`],
        ['Grid Export Credit', `-${exportKwh} kWh × ₹${exportRate}`, `-₹${exportCredit.toFixed(2)}`],
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    rows.forEach((row) => {
        doc.setTextColor(60, 60, 60);
        doc.text(row[0], margin + 2, y);
        doc.setTextColor(100, 100, 100);
        doc.text(row[1], margin + colWidths[0] + 2, y);
        doc.setTextColor(40, 40, 40);
        doc.text(row[2], margin + contentWidth - 2, y, { align: 'right' });

        // Row separator
        y += 3;
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;
    });

    // Subtotal row
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
    y += 2;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Sub-total', margin + 2, y);
    doc.text(`₹${subtotal.toFixed(2)}`, margin + contentWidth - 2, y, { align: 'right' });
    y += 6;

    // Tax row
    doc.text(`Service Tax (${taxRate}%)`, margin + 2, y);
    doc.text(`₹${taxAmount.toFixed(2)}`, margin + contentWidth - 2, y, { align: 'right' });
    y += 3;
    doc.setDrawColor(0, 200, 100);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Total row — bold green
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 200, 100);
    doc.text('TOTAL AMOUNT', margin + 2, y);
    doc.text(`₹${totalAmount.toFixed(2)}`, margin + contentWidth - 2, y, { align: 'right' });
    y += 4;

    // ─── PAID WATERMARK ──────────────────────────────────────
    if (invoice.status === 'paid') {
        doc.setTextColor(0, 200, 100);
        doc.setFontSize(60);
        doc.setFont('helvetica', 'bold');
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.12 }));
        // Rotated "PAID" watermark
        const centerX = pageWidth / 2;
        const centerY = 140;
        doc.text('PAID', centerX, centerY, {
            align: 'center',
            angle: 45,
        });
        doc.restoreGraphicsState();
    }

    // ─── FOOTER ──────────────────────────────────────────────
    const footerY = doc.internal.pageSize.getHeight() - 20;

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(
        'EcoPower  |  GSTIN: 24AABCE1234F1Z5  |  1800-ECO-POWER  |  support@ecopower.in',
        pageWidth / 2,
        footerY,
        { align: 'center' }
    );
    doc.text('Energy as a Service — Powering a Sustainable Future', pageWidth / 2, footerY + 4, {
        align: 'center',
    });

    // ─── AUTO-DOWNLOAD ───────────────────────────────────────
    const filename = `EcoPower-Invoice-${invoice.invoiceNo || 'draft'}.pdf`;
    doc.save(filename);
    console.log('[Invoice] Generated:', filename);

    return true;
}
