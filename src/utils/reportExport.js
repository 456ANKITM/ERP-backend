import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

const money = (value) => Number(value ?? 0).toFixed(2);

// Every report's data is flattened here into one shape:
// { title, meta: [{label,value}], columns: [{key,label}], rows: [[...]] }
// so the PDF/Excel renderers below never need to know which report
// they're rendering.

export const toReportTable = (type, data) => {
  const dateRange = data.range
    ? `${new Date(data.range.startDate).toLocaleDateString()} – ${new Date(data.range.endDate).toLocaleDateString()}`
    : null;

  switch (type) {
    case "sales-summary": {
      const rows = data.breakdown.map((b) => [
        b.period,
        b.orders,
        money(b.revenue),
        money(b.refunded),
        money(b.netRevenue),
      ]);
      return {
        title: "Sales Summary",
        meta: [
          { label: "Date range", value: dateRange },
          { label: "Group by", value: data.range.groupBy },
          { label: "Total orders", value: data.summary.totalOrders },
          { label: "Net revenue", value: money(data.summary.netRevenue) },
        ],
        columns: [
          { key: "period", label: "Period" },
          { key: "orders", label: "Orders" },
          { key: "revenue", label: "Revenue" },
          { key: "refunded", label: "Refunded" },
          { key: "netRevenue", label: "Net Revenue" },
        ],
        rows,
      };
    }

    case "inventory-valuation": {
      const source = data.byStore || [
        { storeName: "All Stores", ...data.summary },
      ];
      const rows = source.map((s) => [
        s.storeName,
        s.totalSkus,
        s.totalUnits,
        money(s.totalCostValue),
        money(s.totalSellingValue),
        money(s.potentialProfit),
      ]);
      return {
        title: "Inventory Valuation",
        meta: [
          { label: "As of", value: new Date(data.asOf).toLocaleString() },
          { label: "Low stock items", value: data.summary.lowStockCount },
          { label: "Out of stock items", value: data.summary.outOfStockCount },
        ],
        columns: [
          { key: "storeName", label: "Store" },
          { key: "totalSkus", label: "SKUs" },
          { key: "totalUnits", label: "Units" },
          { key: "totalCostValue", label: "Cost Value" },
          { key: "totalSellingValue", label: "Selling Value" },
          { key: "potentialProfit", label: "Potential Profit" },
        ],
        rows,
      };
    }

    case "profit-loss": {
      const source = data.byStore || [
        { storeName: data.storeId ? "Selected Store" : "Consolidated", ...data.consolidated },
      ];
      const rows = source.map((s) => [
        s.storeName,
        money(s.revenue),
        money(s.refunded),
        money(s.netRevenue),
        money(s.cogs),
        money(s.grossProfit),
        `${s.grossMarginPercent}%`,
      ]);
      return {
        title: "Profit & Loss",
        meta: [
          { label: "Date range", value: dateRange },
          { label: "Consolidated gross profit", value: money(data.consolidated.grossProfit) },
          { label: "Note", value: data.note },
        ],
        columns: [
          { key: "storeName", label: "Store" },
          { key: "revenue", label: "Revenue" },
          { key: "refunded", label: "Refunded" },
          { key: "netRevenue", label: "Net Revenue" },
          { key: "cogs", label: "COGS" },
          { key: "grossProfit", label: "Gross Profit" },
          { key: "grossMarginPercent", label: "Margin %" },
        ],
        rows,
      };
    }

    case "top-products": {
      const rows = data.products.map((p, i) => [
        i + 1,
        p.productName,
        p.sku,
        p.quantitySold,
        money(p.revenue),
      ]);
      return {
        title: "Top Products",
        meta: [
          { label: "Date range", value: dateRange },
          { label: "Sorted by", value: data.sortBy },
        ],
        columns: [
          { key: "rank", label: "#" },
          { key: "productName", label: "Product" },
          { key: "sku", label: "SKU" },
          { key: "quantitySold", label: "Qty Sold" },
          { key: "revenue", label: "Revenue" },
        ],
        rows,
      };
    }

    case "store-comparison": {
      const rows = data.stores.map((s) => [
        s.rank,
        s.storeName,
        s.orders,
        money(s.revenue),
        money(s.netRevenue),
        money(s.grossProfit),
        `${s.grossMarginPercent}%`,
        money(s.inventoryCostValue),
        s.lowStockCount,
      ]);
      return {
        title: "Store Comparison",
        meta: [{ label: "Date range", value: dateRange }],
        columns: [
          { key: "rank", label: "#" },
          { key: "storeName", label: "Store" },
          { key: "orders", label: "Orders" },
          { key: "revenue", label: "Revenue" },
          { key: "netRevenue", label: "Net Revenue" },
          { key: "grossProfit", label: "Gross Profit" },
          { key: "grossMarginPercent", label: "Margin %" },
          { key: "inventoryCostValue", label: "Inventory Cost" },
          { key: "lowStockCount", label: "Low Stock" },
        ],
        rows,
      };
    }

    case "staff-performance": {
      const rows = data.staff.map((s) => [
        s.rank,
        s.name,
        s.storeName || "—",
        s.orders,
        money(s.revenue),
        money(s.netRevenue),
        money(s.avgOrderValue),
      ]);
      return {
        title: "Staff Performance",
        meta: [
          { label: "Date range", value: dateRange },
          { label: "Note", value: data.note },
        ],
        columns: [
          { key: "rank", label: "#" },
          { key: "name", label: "Manager" },
          { key: "storeName", label: "Store" },
          { key: "orders", label: "Orders" },
          { key: "revenue", label: "Revenue" },
          { key: "netRevenue", label: "Net Revenue" },
          { key: "avgOrderValue", label: "Avg Order Value" },
        ],
        rows,
      };
    }

    default:
      throw new Error(`No export mapping for report type: ${type}`);
  }
};

export const streamReportPdf = ({ res, table }) => {
  const doc = new PDFDocument({ margin: 40, layout: "landscape" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${table.title.replace(/\s+/g, "-").toLowerCase()}.pdf`);

  doc.pipe(res);

  doc.fontSize(16).text(table.title);
  doc.moveDown(0.5);

  doc.fontSize(9);
  table.meta.forEach((m) => {
    if (m.value !== undefined && m.value !== null) {
      doc.text(`${m.label}: ${m.value}`);
    }
  });

  doc.moveDown();

  const colCount = table.columns.length;
  const usableWidth = doc.page.width - 80;
  const colWidth = usableWidth / colCount;

  const drawRow = (values, y, bold) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
    values.forEach((val, i) => {
      doc.text(String(val ?? ""), 40 + i * colWidth, y, { width: colWidth - 5 });
    });
  };

  let y = doc.y;
  drawRow(table.columns.map((c) => c.label), y, true);
  y += 18;
  doc.moveTo(40, y - 4).lineTo(40 + usableWidth, y - 4).stroke();

  table.rows.forEach((row) => {
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 40;
    }
    drawRow(row, y, false);
    y += 16;
  });

  doc.end();
};

export const streamReportXlsx = async ({ res, table }) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(table.title.slice(0, 31));

  sheet.addRow([table.title]);
  sheet.getRow(1).font = { bold: true, size: 14 };
  sheet.addRow([]);

  table.meta.forEach((m) => {
    if (m.value !== undefined && m.value !== null) {
      sheet.addRow([m.label, String(m.value)]);
    }
  });
  sheet.addRow([]);

  const headerRow = sheet.addRow(table.columns.map((c) => c.label));
  headerRow.font = { bold: true };

  table.rows.forEach((row) => sheet.addRow(row));

  sheet.columns.forEach((col) => {
    col.width = 20;
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${table.title.replace(/\s+/g, "-").toLowerCase()}.xlsx`,
  );

  await workbook.xlsx.write(res);
  res.end();
};