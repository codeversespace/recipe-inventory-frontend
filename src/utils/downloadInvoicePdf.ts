import { buildInvoiceHtml, type BizProfile, type InvoiceSale } from "./printInvoice";

/** invoice_17_Ayesha Khan.pdf — strips characters illegal in file names. */
export function invoiceFilename(sale: InvoiceSale): string {
  const raw = (sale.customer_name || "walk-in customer").trim() || "walk-in customer";
  const safe = raw
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "walk-in customer";
  return `invoice_${sale.id}_${safe}.pdf`;
}

function waitForImages(doc: Document): Promise<void> {
  const imgs = Array.from(doc.images);
  if (!imgs.length) return Promise.resolve();
  return Promise.race([
    Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
      ),
    ).then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, 3000)),
  ]);
}

/** Render the invoice to a real PDF file and trigger a download. */
export async function downloadInvoicePdf(sale: InvoiceSale, biz?: BizProfile): Promise<string> {
  const filename = invoiceFilename(sale);
  const html = buildInvoiceHtml(sale, biz).replace(/<script[\s\S]*?<\/script>/gi, "");
  // Lazy-load the heavy PDF libs only when the user actually downloads.
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:-10000px;top:0;width:800px;height:100px;border:0;background:#ffffff;";
  document.body.appendChild(iframe);
  try {
    const doc = iframe.contentDocument;
    if (!doc) throw new Error("Could not prepare the invoice for download.");
    doc.open();
    doc.write(html);
    doc.close();
    // Screen-only toolbar must not appear in the PDF.
    doc.querySelectorAll(".no-print").forEach((el) => el.remove());
    await waitForImages(doc);
    try {
      await (doc as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready;
    } catch {
      // fonts API optional — continue with fallback fonts
    }
    // Let layout settle (web fonts / images) before capture.
    await new Promise((resolve) => setTimeout(resolve, 250));

    const body = doc.body;
    const canvas = await html2canvas(body, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: 800,
    });

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    // JPEG at high quality: flat invoice graphics compress ~10x smaller than
    // lossless PNG (which is what produced multi-MB files), text stays crisp.
    const imgData = canvas.toDataURL("image/jpeg", 0.9);

    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save(filename);
    return filename;
  } finally {
    iframe.remove();
  }
}
