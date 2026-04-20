"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

interface ReportData {
  title: string;
  subtitle?: string;
  dateRange: { start: Date; end: Date };
  summary: {
    totalRevenue: number;
    totalServices: number;
    totalCommission: number;
    totalProfit: number;
  };
  items: Array<{
    date: string;
    client: string;
    service: string;
    barber: string;
    value: number;
    commission: number;
  }>;
}

export async function generatePDFReport(data: ReportData): Promise<Blob> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #7A3B2E; padding-bottom: 20px; }
    .header h1 { color: #7A3B2E; font-size: 24px; margin-bottom: 5px; }
    .header h2 { color: #333; font-size: 18px; font-weight: normal; }
    .date-range { color: #666; font-size: 14px; margin-top: 10px; }
    .summary { display: flex; justify-content: space-between; margin: 30px 0; background: #FFF8E7; padding: 20px; border-radius: 8px; }
    .summary-item { text-align: center; }
    .summary-item .label { font-size: 12px; color: #666; }
    .summary-item .value { font-size: 20px; font-weight: bold; color: #7A3B2E; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #7A3B2E; color: white; padding: 12px; text-align: left; font-size: 12px; }
    td { padding: 10px 12px; border-bottom: 1px solid #ddd; font-size: 12px; }
    tr:nth-child(even) { background: #f9f9f9; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 10px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.title}</h1>
    ${data.subtitle ? `<h2>${data.subtitle}</h2>` : ""}
    <p class="date-range">
      Período: ${format(data.dateRange.start, "dd/MM/yyyy", { locale: ptBR })} a ${format(data.dateRange.end, "dd/MM/yyyy", { locale: ptBR })}
    </p>
  </div>

  <div class="summary">
    <div class="summary-item">
      <div class="label">Faturamento Total</div>
      <div class="value">${formatCurrency(data.summary.totalRevenue)}</div>
    </div>
    <div class="summary-item">
      <div class="label">Atendimentos</div>
      <div class="value">${data.summary.totalServices}</div>
    </div>
    <div class="summary-item">
      <div class="label">Comissões</div>
      <div class="value">${formatCurrency(data.summary.totalCommission)}</div>
    </div>
    <div class="summary-item">
      <div class="label">Lucro</div>
      <div class="value">${formatCurrency(data.summary.totalProfit)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Cliente</th>
        <th>Serviço</th>
        <th>Barbeiro</th>
        <th>Valor</th>
        <th>Comissão</th>
      </tr>
    </thead>
    <tbody>
      ${data.items.map(item => `
        <tr>
          <td>${item.date}</td>
          <td>${item.client}</td>
          <td>${item.service}</td>
          <td>${item.barber}</td>
          <td>${formatCurrency(item.value)}</td>
          <td>${formatCurrency(item.commission)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="footer">
    <p>GBarber - Sistema de Gestão de Barbearia</p>
    <p>Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
  </div>
</body>
</html>
  `;

  const blob = new Blob([html], { type: "text/html" });
  return blob;
}

export function downloadReport(data: ReportData, filename: string) {
  generatePDFReport(data).then((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}
