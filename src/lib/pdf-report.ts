"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

export interface ReportData {
  title: string;
  subtitle?: string;
  barberShopName?: string;
  dateRange: { start: Date; end: Date };
  summary: {
    totalRevenue: number;
    totalServices: number;
    totalCommission: number;
    totalProfit: number;
  };
  items: Array<{
    date: string;
    service: string;
    barber: string;
    value: number;
    commission: number;
  }>;
}

export interface StockData {
  title: string;
  subtitle?: string;
  barberShopName?: string;
  items: Array<{
    nome: string;
    categoria: string;
    quantidade: number;
    custo: number;
    precoVenda: number;
    estoqueMinimo: number;
  }>;
}

const baseStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
    padding: 40px; 
    color: #1a1a1a; 
    font-size: 12px;
    line-height: 1.4;
  }
  .header { 
    text-align: center; 
    margin-bottom: 30px; 
    border-bottom: 3px solid #7A3B2E; 
    padding-bottom: 15px;
  }
  .barber-shop-name {
    color: #7A3B2E;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 8px;
  }
  .header h1 { 
    color: #1a1a1a; 
    font-size: 22px; 
    margin-bottom: 5px; 
  }
  .header h2 { 
    color: #555; 
    font-size: 14px; 
    font-weight: normal; 
  }
  .date-range { 
    color: #666; 
    font-size: 11px; 
    margin-top: 10px;
  }
  .summary { 
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    margin: 25px 0; 
    background: linear-gradient(135deg, #faf8f5 0%, #fff8f0 100%);
    padding: 20px; 
    border-radius: 8px;
    border: 1px solid #e8e0d8;
  }
  .summary-item { 
    text-align: center;
    padding: 10px;
    background: white;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  .summary-item .label { 
    font-size: 10px; 
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .summary-item .value { 
    font-size: 18px; 
    font-weight: bold; 
    color: #7A3B2E; 
    margin-top: 5px;
  }
  table { 
    width: 100%; 
    border-collapse: collapse; 
    margin-top: 25px;
    font-size: 11px;
  }
  th { 
    background: #7A3B2E; 
    color: white; 
    padding: 12px 10px; 
    text-align: left; 
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  td { 
    padding: 10px; 
    border-bottom: 1px solid #e0e0e0; 
  }
  tr:nth-child(even) { background: #fafafa; }
  tr:hover { background: #f5f0eb; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .text-muted { color: #888; }
  .footer { 
    margin-top: 40px; 
    text-align: center; 
    color: #999; 
    font-size: 10px;
    padding-top: 15px;
    border-top: 1px solid #e0e0e0;
  }
  .footer-divider {
    width: 50px;
    height: 2px;
    background: #7A3B2E;
    margin: 10px auto;
  }
  .total-row {
    background: #f5f0eb !important;
    font-weight: bold;
  }
  .low-stock {
    color: #c53030;
    font-weight: bold;
  }
  .page-break { page-break-before: always; }
  @page {
    size: A4;
    margin: 15mm;
  }
  @media print { 
    body { padding: 0; }
    tr:hover { background: transparent; }
  }
`;

export async function generatePDFReport(data: ReportData): Promise<Blob> {
  const shopName = data.barberShopName || "GBarber";
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.title}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="header">
    <div class="barber-shop-name">${shopName}</div>
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
      <div class="label">Lucro Líquido</div>
      <div class="value">${formatCurrency(data.summary.totalProfit)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Serviço</th>
        <th>Barbeiro</th>
        <th class="text-right">Valor</th>
        <th class="text-right">Comissão</th>
      </tr>
    </thead>
    <tbody>
      ${data.items.map(item => `
        <tr>
          <td>${item.date}</td>
          <td>${item.service}</td>
          <td>${item.barber}</td>
          <td class="text-right">${formatCurrency(item.value)}</td>
          <td class="text-right">${formatCurrency(item.commission)}</td>
        </tr>
      `).join("")}
      <tr class="total-row">
        <td colspan="3" class="text-right">TOTAL</td>
        <td class="text-right">${formatCurrency(data.summary.totalRevenue)}</td>
        <td class="text-right">${formatCurrency(data.summary.totalCommission)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <div class="footer-divider"></div>
    <p><strong>${shopName}</strong> - Sistema de Gestão de Barbearia</p>
    <p>Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
    <p>Página 1 de 1</p>
  </div>
</body>
</html>
`;

  return new Blob([html], { type: "text/html" });
}

export async function generatePDFStock(data: StockData): Promise<Blob> {
  const shopName = data.barberShopName || "GBarber";
  const totalItens = data.items.length;
  const totalEstoque = data.items.reduce((sum, p) => sum + p.quantidade, 0);
  const totalValor = data.items.reduce((sum, p) => sum + (p.quantidade * p.precoVenda), 0);
  const itensAbaixoMinimo = data.items.filter(p => p.quantidade <= p.estoqueMinimo);
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.title}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="header">
    <div class="barber-shop-name">${shopName}</div>
    <h1>${data.title}</h1>
    ${data.subtitle ? `<h2>${data.subtitle}</h2>` : ""}
    <p class="date-range">
      Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
    </p>
  </div>

  <div class="summary">
    <div class="summary-item">
      <div class="label">Total de Itens</div>
      <div class="value">${totalItens}</div>
    </div>
    <div class="summary-item">
      <div class="label">Unidades em Estoque</div>
      <div class="value">${totalEstoque}</div>
    </div>
    <div class="summary-item">
      <div class="label">Valor em Estoque</div>
      <div class="value">${formatCurrency(totalValor)}</div>
    </div>
    <div class="summary-item">
      <div class="label">Estoque Baixo</div>
      <div class="value" style="${itensAbaixoMinimo.length > 0 ? 'color: #c53030;' : ''}">${itensAbaixoMinimo.length}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Produto</th>
        <th>Categoria</th>
        <th class="text-center">Qtd</th>
        <th class="text-center">Est. Mín</th>
        <th class="text-right">Custo</th>
        <th class="text-right">Venda</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${data.items.map(item => {
        const isLowStock = item.quantidade <= item.estoqueMinimo;
        const rowClass = isLowStock ? 'low-stock' : '';
        return `
        <tr class="${rowClass}">
          <td>${item.nome} ${isLowStock ? '⚠️' : ''}</td>
          <td class="text-muted">${item.categoria}</td>
          <td class="text-center">${item.quantidade}</td>
          <td class="text-center text-muted">${item.estoqueMinimo}</td>
          <td class="text-right">${formatCurrency(item.custo)}</td>
          <td class="text-right">${formatCurrency(item.precoVenda)}</td>
          <td class="text-right">${formatCurrency(item.quantidade * item.precoVenda)}</td>
        </tr>
      `}).join("")}
      <tr class="total-row">
        <td colspan="2" class="text-right">TOTAL</td>
        <td class="text-center">${totalEstoque}</td>
        <td colspan="3" class="text-right">Valor Total em Estoque:</td>
        <td class="text-right">${formatCurrency(totalValor)}</td>
      </tr>
    </tbody>
  </table>

  ${itensAbaixoMinimo.length > 0 ? `
  <div style="margin-top: 30px; padding: 15px; background: #fff5f5; border: 1px solid #feb2b2; border-radius: 6px;">
    <strong style="color: #c53030;">⚠️ Itens abaixo do estoque mínimo:</strong>
    <ul style="margin-top: 10px; padding-left: 20px; color: #c53030;">
      ${itensAbaixoMinimo.map(item => `<li>${item.nome} - ${item.quantidade} un (mín: ${item.estoqueMinimo})</li>`).join("")}
    </ul>
  </div>
  ` : ""}

  <div class="footer">
    <div class="footer-divider"></div>
    <p><strong>${shopName}</strong> - Sistema de Gestão de Barbearia</p>
    <p>Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
    <p>Página 1 de 1</p>
  </div>
</body>
</html>
`;

  return new Blob([html], { type: "text/html" });
}

export function downloadPDF(data: ReportData | StockData, filename: string, type: "report" | "stock") {
  const generator = type === "report" 
    ? generatePDFReport(data as ReportData) 
    : generatePDFStock(data as StockData);
  
  generator.then((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.html`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

export function printPDF(data: ReportData | StockData, type: "report" | "stock") {
  const generator = type === "report" 
    ? generatePDFReport(data as ReportData) 
    : generatePDFStock(data as StockData);
  
  generator.then((blob) => {
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  });
}