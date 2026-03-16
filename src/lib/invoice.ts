import { jsPDF } from "jspdf";
import QRCode from "qrcode";

interface InvoiceData {
  merchantName: string;
  vatNumber: string;
  invoiceDate: string;
  totalAmount: number;
  vatAmount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}

/**
 * Generates a ZATCA compliant TLV (Tag-Length-Value) string for the QR code
 */
function generateTLV(tags: { tag: number; value: string }[]): string {
  const tlvParts = tags.map(({ tag, value }) => {
    const tagBuf = Buffer.from([tag]);
    const valBuf = Buffer.from(value, 'utf8');
    const lenBuf = Buffer.from([valBuf.length]);
    return Buffer.concat([tagBuf, lenBuf, valBuf]);
  });
  return Buffer.concat(tlvParts).toString('base64');
}

/**
 * Generates a ZATCA compliant PDF invoice
 */
export async function generateZatcaInvoice(data: InvoiceData): Promise<string> {
  const doc = new jsPDF();
  const { merchantName, vatNumber, invoiceDate, totalAmount, vatAmount, items } = data;

  // Header
  doc.setFontSize(20);
  doc.text("Electronic Invoice", 105, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.text(`Merchant: ${merchantName}`, 20, 40);
  doc.text(`VAT Number: ${vatNumber}`, 20, 48);
  doc.text(`Date: ${invoiceDate}`, 20, 56);

  // Table Header
  doc.line(20, 65, 190, 65);
  doc.text("Item", 20, 72);
  doc.text("Qty", 100, 72);
  doc.text("Price", 130, 72);
  doc.text("Total", 160, 72);
  doc.line(20, 75, 190, 75);

  // Items
  let y = 82;
  items.forEach(item => {
    doc.text(item.name, 20, y);
    doc.text(item.quantity.toString(), 100, y);
    doc.text(item.price.toFixed(2), 130, y);
    doc.text((item.price * item.quantity).toFixed(2), 160, y);
    y += 8;
  });

  // Totals
  doc.line(20, y, 190, y);
  y += 10;
  doc.text(`Subtotal: ${(totalAmount - vatAmount).toFixed(2)} SAR`, 130, y);
  y += 8;
  doc.text(`VAT (15%): ${vatAmount.toFixed(2)} SAR`, 130, y);
  y += 8;
  doc.setFontSize(14);
  doc.text(`Total: ${totalAmount.toFixed(2)} SAR`, 130, y);

  // ZATCA QR Code Generation (TLV Encoded)
  const tlvData = generateTLV([
    { tag: 1, value: merchantName },
    { tag: 2, value: vatNumber },
    { tag: 3, value: invoiceDate },
    { tag: 4, value: totalAmount.toFixed(2) },
    { tag: 5, value: vatAmount.toFixed(2) }
  ]);

  const qrCodeUrl = await QRCode.toDataURL(tlvData);
  doc.addImage(qrCodeUrl, "PNG", 20, y - 20, 40, 40);

  return doc.output("datauristring");
}
