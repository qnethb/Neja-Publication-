import PDFDocument from 'pdfkit';
import type { EstateSeasonPerformanceReport } from './reports';

const GREEN = '#1b5e20';
const GOLD = '#a86d14';
const GREY = '#4b5563';

export async function estateSeasonPerformancePdf(
  report: EstateSeasonPerformanceReport,
): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  header(doc, report);
  kpiGrid(doc, report);
  divisionTable(doc, report);
  riskSection(doc, report);
  footer(doc);

  doc.end();
  return done;
}

type Doc = InstanceType<typeof PDFDocument>;

function header(doc: Doc, report: EstateSeasonPerformanceReport) {
  doc.rect(0, 0, doc.page.width, 86).fill(GREEN);
  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(17)
    .text('Estate Season Performance Report', 40, 26);
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#d3e8d4')
    .text('Lalan Rubbers Pvt Ltd — Agri Division — Cinnamon Plantation Monitor', 40, 50);
  doc.fillColor('#000000');
  doc.y = 104;

  doc.font('Helvetica-Bold').fontSize(13).fillColor(GREEN).text(`${report.estate.name} Estate`);
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(GREY)
    .text(
      `Group: ${report.estate.group}   |   Code: ${report.estate.code}   |   Estate Manager: ${
        report.estate.manager ?? 'Unassigned'
      }`,
    )
    .text(
      `Season: ${report.season ?? 'n/a'}   |   Generated: ${new Date(report.generatedAt).toLocaleString('en-GB')}`,
    );
  doc.moveDown(0.8);
}

function kpiGrid(doc: Doc, report: EstateSeasonPerformanceReport) {
  const k = report.kpis;
  const cells: [string, string][] = [
    ['Cinnamon area', `${fmt(k.cinnamonAreaHa, 1)} ha`],
    ['Forecast yield', `${fmt(k.forecastedYieldKgHa, 0)} kg/ha`],
    ['Actual yield', `${fmt(k.actualYieldKgHa, 0)} kg/ha`],
    ['Yield variance', signed(k.yieldVariancePct)],
    ['Forecast accuracy', `${fmt(k.forecastAccuracyPct, 1)}%`],
    ['Cost per kg', `LKR ${fmt(k.costPerKgLkr, 2)}`],
    ['Recommendations done', `${fmt(k.recommendationCompletionRatePct, 0)}%`],
    ['Risk index', `${fmt(k.riskIndex, 0)} (${k.riskLevel})`],
  ];

  sectionTitle(doc, 'Key performance indicators');
  const startY = doc.y;
  const cellW = (doc.page.width - 80) / 4;
  const cellH = 44;

  cells.forEach((cell, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 40 + col * cellW;
    const y = startY + row * (cellH + 6);
    doc.roundedRect(x, y, cellW - 6, cellH, 4).fillAndStroke('#f4f8f4', '#d3e8d4');
    doc.fillColor(GREY).font('Helvetica').fontSize(7.5).text(cell[0].toUpperCase(), x + 8, y + 8, {
      width: cellW - 22,
    });
    doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(12).text(cell[1], x + 8, y + 22, {
      width: cellW - 22,
    });
  });

  doc.y = startY + 2 * (cellH + 6) + 10;
  doc.fillColor('#000000');
}

function divisionTable(doc: Doc, report: EstateSeasonPerformanceReport) {
  sectionTitle(doc, `Division performance — season ${report.season ?? 'n/a'}`);

  const cols = [
    { label: 'Division', width: 92, align: 'left' as const },
    { label: 'Area (ha)', width: 52, align: 'right' as const },
    { label: 'Forecast', width: 56, align: 'right' as const },
    { label: 'Actual', width: 52, align: 'right' as const },
    { label: 'Var %', width: 46, align: 'right' as const },
    { label: 'Produced (kg)', width: 70, align: 'right' as const },
    { label: 'Cost (LKR)', width: 68, align: 'right' as const },
    { label: 'LKR/kg', width: 50, align: 'right' as const },
  ];

  tableHeader(doc, cols);
  report.seasonRows.forEach((row, i) => {
    ensureSpace(doc, 18, () => tableHeader(doc, cols));
    const values = [
      row.division,
      fmt(row.areaHa, 1),
      fmt(row.expectedYieldKgHa, 0),
      fmt(row.actualYieldKgHa, 0),
      signed(row.variancePct),
      fmt(row.producedKg, 0),
      fmt(row.costLkr, 0),
      fmt(row.costPerKgLkr, 2),
    ];
    tableRow(doc, cols, values, i % 2 === 1);
  });
  doc.moveDown(1);
}

function riskSection(doc: Doc, report: EstateSeasonPerformanceReport) {
  const flagged = report.divisions
    .filter((d) => d.riskLevel !== 'LOW' || d.overdueRecommendations > 0)
    .sort((a, b) => b.riskIndex - a.riskIndex);

  sectionTitle(doc, 'Risk and management attention');
  if (flagged.length === 0) {
    doc.font('Helvetica').fontSize(9).fillColor(GREY).text('No divisions flagged for this estate.');
    doc.moveDown(0.6);
    return;
  }

  flagged.forEach((d) => {
    ensureSpace(doc, 42);
    doc
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor(d.riskLevel === 'HIGH' ? '#b91c1c' : GOLD)
      .text(`${d.name} — risk ${d.riskIndex} (${d.riskLevel})`);
    const drivers = d.riskDrivers.length ? d.riskDrivers : ['No specific agronomic driver flagged'];
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(GREY)
      .text(
        `${drivers.join(' • ')}${
          d.overdueRecommendations > 0 ? ` • ${d.overdueRecommendations} overdue recommendation(s)` : ''
        }`,
        { indent: 10 },
      );
    doc.moveDown(0.35);
  });
  doc.fillColor('#000000');
}

function footer(doc: Doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor('#9ca3af')
      .text(
        `Cinnamon Plantation Monitor — confidential internal report — page ${i - range.start + 1} of ${range.count}`,
        40,
        doc.page.height - 32,
        { width: doc.page.width - 80, align: 'center' },
      );
  }
}

function sectionTitle(doc: Doc, text: string) {
  ensureSpace(doc, 34);
  doc.moveDown(0.4);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(GREEN).text(text);
  doc
    .moveTo(40, doc.y + 2)
    .lineTo(doc.page.width - 40, doc.y + 2)
    .strokeColor('#d3e8d4')
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.5);
  doc.fillColor('#000000');
}

type Col = { label: string; width: number; align: 'left' | 'right' };

function tableHeader(doc: Doc, cols: Col[]) {
  const y = doc.y;
  doc.rect(40, y, doc.page.width - 80, 16).fill('#eef6ee');
  let x = 44;
  cols.forEach((c) => {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(GREEN).text(c.label, x, y + 5, {
      width: c.width - 6,
      align: c.align,
    });
    x += c.width;
  });
  doc.y = y + 18;
  doc.fillColor('#000000');
}

function tableRow(doc: Doc, cols: Col[], values: string[], shaded: boolean) {
  const y = doc.y;
  if (shaded) doc.rect(40, y - 2, doc.page.width - 80, 15).fill('#fafafa');
  let x = 44;
  cols.forEach((c, i) => {
    doc.font('Helvetica').fontSize(8).fillColor('#111827').text(values[i] ?? '', x, y + 1, {
      width: c.width - 6,
      align: c.align,
      lineBreak: false,
    });
    x += c.width;
  });
  doc.y = y + 15;
}

function ensureSpace(doc: Doc, needed: number, onNewPage?: () => void) {
  if (doc.y + needed > doc.page.height - 50) {
    doc.addPage();
    doc.y = 46;
    onNewPage?.();
  }
}

function fmt(value: number | null | undefined, dp: number): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

function signed(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}
