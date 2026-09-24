import PDFDocument from "pdfkit";

const toNum = (decimalOrNumber) =>
  decimalOrNumber === null || decimalOrNumber === undefined
    ? 0
    : parseFloat(decimalOrNumber.toString());

const money = (value) => toNum(value).toFixed(2);
export const streamInvoicePdf = ({ res, business, sale, store, customer }) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("content-type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${sale.invoiceNumber}.pdf`,
  );

  doc.pipe(res);
  doc.fontSize(18).text(business?.name || "Invoice", { align: "left" });
  if (store) {
    doc.fontSize(10).text(`${store.name} (${store.code})`);
  }
  if (business?.contactEmail) {
    doc.fontSize(10).text(business.contactEmail);
  }
  doc.moveDown();
  doc.fontSize(14).text(`Invoice ${sale.invoiceNumber}`, { align: "right" });
  doc
    .fontSize(10)
    .text(`Date: ${new Date(sale.createdAt).toLocaleDateString()}`, {
      align: "right",
    });
  doc.moveDown();
  if (customer) {
    doc.fontSize(11).text(`Bill To: ${customer.name}`);
    if (customer.phone) doc.fontSize(10).text(customer.phone);
    if (customer.email) doc.fontSize(10).text(customer.email);
  } else {
    doc.fontSize(11).text("Bill To: Walk-in Customer ");
  }
  doc.moveDown();

  const tableTop = doc.y;
  doc.fontSize(10);
  doc.text("Item", 50, tableTop);
  doc.text("Qty", 300, tableTop);
  doc.text("Price", 360, tableTop);
  doc.text("subtotal", 450, tableTop);
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  sale.items.forEach((item) => {
    const y = doc.y;
    doc.text(item.productName, 50, y, { width: 240 });
    doc.text(String(item.quantity), 300, y);
    doc.text(money(item.sellingPrice), 360, y);
    doc.text(money(item.subtotal), 450, y);
    doc.moveDown();
  });

  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  doc
    .fontSize(10)
    .text(`subtotal: ${money(sale.subtotal)}`, { align: "right" });
  doc.text(`Discount: ${money(sale.discount)}`, { align: "right" });
  doc.text(`Tax: ${money(sale.tax)}`, { align: "right" });
  doc
    .fontSize(12)
    .text(`Total: ${money(sale.totalAmount)}`, { align: "right" });
  doc
    .fontSize(10)
    .text(`Amount Paid: ${money(sale.amountPaid)}`, { align: "right" });
  doc.text(`Amount Due: ${money(sale.amountDue)}`, { align: "right" });

  if (toNum(sale.amountRefuned) > 0) {
    doc.text(`Refunded: ${money(sale.amountRefuned)}`, { align: "right" });
  }
  doc.moveDown(2);
  doc.fontSize(9).text("Thank Your for your business:", { align: "center" });
  doc.end();
};
