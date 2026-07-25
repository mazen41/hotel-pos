'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePermissions } from '@/contexts/AuthContext';
import { posReportsApi as reportsApi } from '@/lib/api';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Download, 
  Calendar, 
  Printer, 
  FileText, 
  ChevronRight, 
  Layers, 
  Utensils, 
  Bed, 
  ShoppingBag, 
  Percent, 
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { formatCurrency, toMoneyNumber } from '@/lib/money';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

// Types for metadata
interface FiltersMetadata {
  cashiers: Array<{ id: number; name: string }>;
  shifts: Array<{ id: number; shift_name: string; name: string; opened_at: string; status: string; label: string }>;
  tables: Array<{ id: number; number: string; status: string }>;
  items: Array<{ id: number; name: string; price: number; menu_category_id: number }>;
  categories: Array<{ id: number; name: string }>;
  payment_methods: Array<{ id: number; name: string; code: string }>;
}

export default function ReportsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { can } = usePermissions();
  const isRtl = locale.startsWith('ar');

  // Client mounting state (to prevent Recharts hydration issues)
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);

  // Filters State
  const [reportType, setReportType] = useState<string>('dashboard_summary');
  const [preset, setPreset] = useState<string>('today');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [cashierId, setCashierId] = useState<string>('');
  const [shiftId, setShiftId] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [itemId, setItemId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');

  // Printing Configurations
  const [printLanguage, setPrintLanguage] = useState<'en' | 'ar'>(isRtl ? 'ar' : 'en');
  const [printFormat, setPrintFormat] = useState<'a4' | '80mm' | '58mm'>('a4');

  // Metadata for filter dropdowns
  const [metadata, setMetadata] = useState<FiltersMetadata>({
    cashiers: [],
    shifts: [],
    tables: [],
    items: [],
    categories: [],
    payment_methods: []
  });

  // Report Data
  const [reportData, setReportData] = useState<any>(null);

  // Load Metadata
  useEffect(() => {
    setIsMounted(true);
    const fetchMetadata = async () => {
      setMetaLoading(true);
      try {
        const res = await reportsApi.metadata();
        if (res.data) setMetadata(res.data);
      } catch (err) {
        console.error('Failed to load filters metadata:', err);
      } finally {
        setMetaLoading(false);
      }
    };
    if (can('pos.view_reports')) fetchMetadata();
  }, [can]);

  // Load Report on filter change
  useEffect(() => {
    if (can('pos.view_reports')) {
      loadReport();
    }
  }, [
    reportType, 
    preset, 
    dateFrom, 
    dateTo, 
    cashierId, 
    shiftId, 
    tableNumber, 
    itemId, 
    categoryId, 
    paymentMethodId,
    can
  ]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = {
        type: reportType,
        preset,
        date_from: preset === 'custom' ? dateFrom : undefined,
        date_to: preset === 'custom' ? dateTo : undefined,
        user_id: cashierId || undefined,
        cash_shift_id: shiftId || undefined,
        menu_item_id: itemId || undefined,
        menu_category_id: categoryId || undefined,
        table_number: tableNumber || undefined,
        payment_method_id: paymentMethodId || undefined
      };
      const res = await reportsApi.generate(params);
      setReportData(res.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  // Preset Date Filter names
  const datePresets = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'this_week', label: 'This Week' },
    { key: 'this_month', label: 'This Month' },
    { key: 'custom', label: 'Custom Date Range' }
  ];

  // Report Types Categorized
  const reportCategories = [
    {
      title: 'Sales & Ledger Reports',
      items: [
        { key: 'dashboard_summary', label: 'Executive Sales Summary' },
        { key: 'sales_daily', label: 'Daily Sales Report' },
        { key: 'sales_hourly', label: 'Hourly Sales Distribution' },
        { key: 'sales_payment', label: 'Sales by Payment Method' },
        { key: 'sales_tax', label: 'Tax Collection Report' },
        { key: 'sales_service', label: 'Service Charge Report' },
        { key: 'sales_discount', label: 'Discounts & Deductions' },
        { key: 'sales_refund', label: 'Refunds & Returns Ledger' },
        { key: 'sales_void', label: 'Voided & Cancelled Orders' }
      ]
    },
    {
      title: 'Menu & Category Analytics',
      items: [
        { key: 'items_sales', label: 'Product Sales Volume' },
        { key: 'items_best', label: 'Best Selling Items Ranking' },
        { key: 'items_worst', label: 'Worst Selling Items Ranking' },
        { key: 'items_profit', label: 'Item Estimated Profit Report' },
        { key: 'categories_sales', label: 'Sales by Menu Category' }
      ]
    },
    {
      title: 'Dining Tables & Rooms',
      items: [
        { key: 'tables_sales', label: 'Revenue by Table Number' },
        { key: 'tables_occupancy', label: 'Table Usage Statistics' }
      ]
    },
    {
      title: 'Operators & Shift History',
      items: [
        { key: 'cashiers_summary', label: 'Cashier Sales Performance' },
        { key: 'shifts_summary', label: 'Cash Shifts & Reconciliation Logs' }
      ]
    }
  ];

  // Derive active report information
  const activeReportInfo = useMemo(() => {
    for (const cat of reportCategories) {
      const found = cat.items.find(it => it.key === reportType);
      if (found) return found;
    }
    return { key: 'dashboard_summary', label: 'Executive Sales Summary' };
  }, [reportType]);

  // Client-side Excel Export
  const handleExportExcel = () => {
    if (!reportData) return;

    let headers: string[] = [];
    let rows: any[] = [];
    let title = activeReportInfo.label;

    if (Array.isArray(reportData)) {
      if (reportData.length > 0) {
        headers = Object.keys(reportData[0]);
        rows = reportData.map(r => Object.values(r));
      }
    } else if (reportData.dailyBreakdown) {
      title = "Executive Sales Summary";
      headers = ["Date", "Sales", "Orders"];
      rows = reportData.dailyBreakdown.map((b: any) => [b.date, b.sales, b.orders]);
    }

    // Build XML content for Excel download (allows styling and auto-parsing)
    let excelContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    excelContent += `<head><meta charset="utf-8" /><style>table { border-collapse: collapse; } td, th { border: 1px solid #d4a574; padding: 6px; } th { background-color: #242019; color: #f5f2ed; font-weight: bold; }</style></head>`;
    excelContent += `<body>`;
    excelContent += `<h2>${title}</h2>`;
    excelContent += `<p>Generated: ${new Date().toLocaleString()}</p>`;
    excelContent += `<p>Date Preset: ${preset}</p>`;
    excelContent += `<table><thead><tr>`;
    
    headers.forEach(h => {
      excelContent += `<th>${h.toUpperCase().replace('_', ' ')}</th>`;
    });
    excelContent += `</tr></thead><tbody>`;

    rows.forEach(row => {
      excelContent += `<tr>`;
      row.forEach((val: unknown) => {
        excelContent += `<td>${val ?? ''}</td>`;
      });
      excelContent += `</tr>`;
    });

    excelContent += `</tbody></table></body></html>`;

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}_report_${new Date().toISOString().slice(0,10)}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Unified Print & PDF Trigger
  const handlePrint = () => {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) return;

    const isPrintRtl = printLanguage === 'ar';

    // Translations Dictionary for print templates
    const translations: Record<string, Record<string, string>> = {
      en: {
        title: activeReportInfo.label,
        generated: 'Generated Date/Time',
        preset: 'Date Period Filter',
        filters: 'Applied Criteria Filters',
        none: 'None',
        cashier: 'Cashier Operator',
        shift: 'Cash Shift',
        table: 'Table Number',
        method: 'Payment Method',
        summary: 'Ledger Summary',
        netSales: 'Net Sales Volume',
        ordersCount: 'Total Completed Orders',
        avgTicket: 'Average Ticket Value',
        tax: 'Tax Collected',
        serviceCharge: 'Service Charge',
        discount: 'Discounts Given',
        refunds: 'Refunds Processed',
        voids: 'Cancelled Voids Count',
        details: 'Report Detailed Data',
        totalRow: 'TOTALS / AVERAGES'
      },
      ar: {
        title: printLanguage === 'ar' && reportType === 'dashboard_summary' ? 'الملخص التنفيذي للمبيعات' : activeReportInfo.label,
        generated: 'تاريخ ووقت الإنشاء',
        preset: 'فلترة الفترة الزمنية',
        filters: 'معايير الفلترة المطبقة',
        none: 'لا يوجد',
        cashier: 'أمين الصندوق (الكاشير)',
        shift: 'وردية العمل',
        table: 'رقم الطاولة',
        method: 'طريقة الدفع',
        summary: 'ملخص الحسابات',
        netSales: 'حجم صافي المبيعات',
        ordersCount: 'إجمالي الطلبات المكتملة',
        avgTicket: 'متوسط قيمة الطلب',
        tax: 'إجمالي الضرائب المحصلة',
        serviceCharge: 'خدمة الصالة والخدمة',
        discount: 'إجمالي الخصومات الممنوحة',
        refunds: 'إجمالي المرتجعات المستردة',
        voids: 'عدد الطلبات الملغاة',
        details: 'البيانات التفصيلية للتقرير',
        totalRow: 'المجموع الإجمالي / المتوسطات'
      }
    };

    const strings = translations[printLanguage];

    // Compute active summary for print headers
    let printSales = 0;
    let printOrders = 0;
    let printAvg = 0;
    let printTax = 0;
    let printService = 0;
    let printDiscounts = 0;
    let printRefunds = 0;

    if (reportType === 'dashboard_summary' && reportData) {
      printSales = reportData.totalSales;
      printOrders = reportData.totalOrders;
      printAvg = reportData.averageOrderValue;
      printTax = reportData.taxCollected;
      printService = reportData.serviceChargeCollected;
      printDiscounts = reportData.discountsGiven;
      printRefunds = reportData.refundsProcessed;
    } else if (Array.isArray(reportData)) {
      printOrders = reportData.length;
      // Derive sum where appropriate
      reportData.forEach(row => {
        printSales += toMoneyNumber(row.sales ?? row.revenue ?? row.total ?? row.total_sales ?? 0);
        printTax += toMoneyNumber(row.tax ?? 0);
        printService += toMoneyNumber(row.service_charge ?? 0);
        printRefunds += toMoneyNumber(row.refunds ?? row.total_refunds ?? 0);
      });
      printAvg = printOrders > 0 ? printSales / printOrders : 0;
    }

    // Build print HTML template
    let html = `
      <html dir="${isPrintRtl ? 'rtl' : 'ltr'}">
      <head>
        <title>${strings.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: ${isPrintRtl ? "'Cairo', sans-serif" : "'Inter', sans-serif"};
            color: #1a1814;
            margin: 0;
            padding: 20px;
            font-size: 13px;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #d4a574;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .logo {
            font-family: 'Playfair Display', serif;
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 0.1em;
            color: #a3703e;
            margin-bottom: 5px;
          }
          .report-title {
            font-size: 18px;
            font-weight: 700;
            margin: 5px 0;
            color: #1a1814;
          }
          .meta-info {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 10px;
            font-size: 11px;
            color: #5c5954;
            margin-bottom: 15px;
            border-bottom: 1px dashed #e5e2dd;
            padding-bottom: 12px;
          }
          .meta-info div strong {
            color: #1a1814;
          }
          .kpi-grid {
            display: grid;
            grid-template-cols: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 25px;
          }
          .kpi-card {
            border: 1px solid #e5e2dd;
            border-radius: 8px;
            padding: 10px 12px;
            background-color: #faf8f5;
          }
          .kpi-label {
            font-size: 10px;
            color: #8b8680;
            text-transform: uppercase;
            font-weight: 600;
          }
          .kpi-value {
            font-size: 16px;
            font-weight: 700;
            color: #a3703e;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 11px;
          }
          th {
            background-color: #f5f2ed;
            border: 1px solid #e5e2dd;
            padding: 8px;
            font-weight: 700;
            text-align: ${isPrintRtl ? 'right' : 'left'};
          }
          td {
            border: 1px solid #e5e2dd;
            padding: 7px 8px;
          }
          tr:nth-child(even) {
            background-color: #faf8f5;
          }
          .total-row {
            font-weight: bold;
            background-color: #f5f2ed !important;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #8b8680;
            border-top: 1px solid #e5e2dd;
            padding-top: 10px;
          }
          
          /* Thermal formatting overrides */
          ${printFormat !== 'a4' ? `
            body {
              width: ${printFormat === '80mm' ? '280px' : '200px'};
              padding: 5px;
              font-size: 11px;
            }
            .kpi-grid {
              grid-template-cols: 1fr;
              gap: 5px;
            }
            .meta-info {
              grid-template-cols: 1fr;
            }
            table {
              font-size: 9px;
            }
            th, td {
              padding: 4px 2px;
            }
          ` : ''}
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">HOTEL LOBBY POS</div>
          <div class="report-title">${strings.title}</div>
        </div>

        <div class="meta-info">
          <div><strong>${strings.generated}:</strong> ${new Date().toLocaleString(isPrintRtl ? 'ar-EG' : 'en-US')}</div>
          <div><strong>${strings.preset}:</strong> ${preset.toUpperCase().replace('_', ' ')}</div>
          <div style="grid-column: span 2;">
            <strong>${strings.filters}:</strong> 
            [${strings.cashier}: ${cashierId ? metadata.cashiers.find(c => c.id === Number(cashierId))?.name : strings.none}] 
            [${strings.shift}: ${shiftId ? metadata.shifts.find(s => s.id === Number(shiftId))?.shift_name : strings.none}]
            [${strings.table}: ${tableNumber || strings.none}]
            [${strings.method}: ${paymentMethodId ? metadata.payment_methods.find(p => p.id === Number(paymentMethodId))?.name : strings.none}]
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">${strings.netSales}</div>
            <div class="kpi-value">${formatCurrency(printSales, printLanguage)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">${strings.ordersCount}</div>
            <div class="kpi-value">${printOrders}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">${strings.avgTicket}</div>
            <div class="kpi-value">${formatCurrency(printAvg, printLanguage)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">${strings.refunds}</div>
            <div class="kpi-value">${formatCurrency(printRefunds, printLanguage)}</div>
          </div>
        </div>

        <h4 style="margin: 15px 0 5px 0; color: #a3703e;">${strings.details}</h4>
        <table>
          <thead>
            <tr>
    `;

    // Generate table headers based on report type
    let columns: string[] = [];
    if (Array.isArray(reportData) && reportData.length > 0) {
      columns = Object.keys(reportData[0]);
      columns.forEach(col => {
        html += `<th>${col.toUpperCase().replace('_', ' ')}</th>`;
      });
    } else if (reportType === 'dashboard_summary' && reportData?.dailyBreakdown) {
      columns = ['date', 'sales', 'orders'];
      html += `<th>Date</th><th>Total Sales</th><th>Orders Count</th>`;
    } else {
      columns = ['Message'];
      html += `<th>Report Data</th>`;
    }

    html += `</tr></thead><tbody>`;

    // Generate rows
    if (Array.isArray(reportData)) {
      reportData.forEach(row => {
        html += `<tr>`;
        columns.forEach(col => {
          let val = row[col];
          if (typeof val === 'number' && (col.includes('sales') || col.includes('revenue') || col.includes('total') || col.includes('price') || col.includes('tax') || col.includes('charge') || col.includes('discount') || col.includes('refund') || col.includes('ticket'))) {
            val = formatCurrency(val, printLanguage);
          }
          html += `<td>${val ?? ''}</td>`;
        });
        html += `</tr>`;
      });

      // Sums row
      html += `<tr class="total-row">`;
      columns.forEach((col, idx) => {
        if (idx === 0) {
          html += `<td>${strings.totalRow}</td>`;
        } else if (col === 'sales' || col === 'revenue' || col === 'total' || col === 'total_sales' || col === 'refunds') {
          html += `<td>${formatCurrency(printSales, printLanguage)}</td>`;
        } else if (col === 'orders' || col === 'orders_count' || col === 'count' || col === 'quantity') {
          html += `<td>${printOrders}</td>`;
        } else if (col === 'average_ticket' || col === 'avg_price') {
          html += `<td>${formatCurrency(printAvg, printLanguage)}</td>`;
        } else {
          html += `<td>-</td>`;
        }
      });
      html += `</tr>`;
    } else if (reportType === 'dashboard_summary' && reportData?.dailyBreakdown) {
      reportData.dailyBreakdown.forEach((b: any) => {
        html += `<tr><td>${b.date}</td><td>${formatCurrency(b.sales, printLanguage)}</td><td>${b.orders}</td></tr>`;
      });
    } else {
      html += `<tr><td colspan="1">No detailed report records loaded.</td></tr>`;
    }

    html += `
          </tbody>
        </table>

        <div class="footer">
          HOTEL POS SYSTEMS • Page 1 of 1 • THANK YOU
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    // Trigger printing once loaded
    printFrame.contentWindow?.focus();
    setTimeout(() => {
      printFrame.contentWindow?.print();
      setTimeout(() => document.body.removeChild(printFrame), 1000);
    }, 500);
  };

  // Chart data formatting helper
  const chartSalesData = useMemo(() => {
    if (!reportData) return [];
    
    if (reportType === 'dashboard_summary' && reportData.dailyBreakdown) {
      return reportData.dailyBreakdown.map((d: any) => ({
        label: d.date,
        sales: toMoneyNumber(d.sales),
        orders: Number(d.orders)
      }));
    }

    if (Array.isArray(reportData)) {
      return reportData.slice(0, 15).map((item: any) => {
        const dateVal = item.date || item.hour || item.table_name || item.cashier || item.shift || item.category || item.name || item.item_name;
        return {
          label: String(dateVal),
          sales: toMoneyNumber(item.sales ?? item.revenue ?? item.total ?? item.total_sales ?? 0),
          orders: Number(item.orders ?? item.orders_count ?? item.count ?? item.quantity ?? 0)
        };
      });
    }

    return [];
  }, [reportData, reportType]);

  const COLORS = ['#d4a574', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-background p-3 sm:p-6 animate-fade-in">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── Header Area ────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">POS Reporting Hub</h1>
            <p className="text-text-muted text-sm mt-1">Audit shift variance, track sales categories, examine cashier throughput, and run audits.</p>
          </div>

          {/* Languages & Export Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Language Selector */}
            <div className="flex items-center rounded-xl border border-border bg-surface p-1 shadow-soft">
              <button 
                onClick={() => setPrintLanguage('en')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${printLanguage === 'en' ? 'bg-accent text-background' : 'text-text-secondary hover:text-text-primary'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setPrintLanguage('ar')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${printLanguage === 'ar' ? 'bg-accent text-background' : 'text-text-secondary hover:text-text-primary'}`}
              >
                AR (RTL)
              </button>
            </div>

            {/* Print Formats selector */}
            <select
              value={printFormat}
              onChange={(e) => setPrintFormat(e.target.value as any)}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-text-secondary outline-none focus:border-accent shadow-soft"
            >
              <option value="a4">Full A4 Layout</option>
              <option value="80mm">Thermal 80mm</option>
              <option value="58mm">Thermal 58mm</option>
            </select>

            {/* Actions */}
            <button 
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-hover shadow-soft transition-all"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>

            <button 
              onClick={handleExportExcel}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-background hover:bg-accent-600 shadow-medium transition-all"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </button>
          </div>
        </div>

        {/* ── Master Filter Layout ────────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_3fr]">

          {/* LEFT PANEL: Report Selector */}
          <div className="rounded-2xl border border-border bg-surface p-4 premium-shadow space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-text-accent" />
              <span>Report Directories</span>
            </h3>

            <div className="space-y-4">
              {reportCategories.map((cat, catIdx) => (
                <div key={catIdx} className="space-y-1">
                  <h4 className="text-[10px] font-bold text-text-muted/65 uppercase tracking-widest px-2 border-l border-accent/30 dark:border-accent-500/20">{cat.title}</h4>
                  <div className="space-y-0.5">
                    {cat.items.map(item => (
                      <button
                        key={item.key}
                        onClick={() => setReportType(item.key)}
                        className={`w-full text-left rounded-xl px-3 py-2.5 text-xs font-semibold transition-all flex items-center justify-between ${
                          reportType === item.key
                            ? 'bg-surface-elevated text-text-accent border-l-2 border-accent font-bold'
                            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                        }`}
                      >
                        <span className="truncate pr-1">{item.label}</span>
                        <ChevronRight className={`h-3.5 w-3.5 opacity-60 ${reportType === item.key ? 'text-text-accent rotate-90' : 'text-text-muted'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL: Filter Controls & Visuals */}
          <div className="space-y-6">

            {/* Filter controls row */}
            <div className="rounded-2xl border border-border bg-surface p-4 premium-shadow space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-text-accent" />
                  <span>Interactive Criteria Filters</span>
                </h3>
                <button 
                  onClick={() => {
                    setCashierId('');
                    setShiftId('');
                    setTableNumber('');
                    setItemId('');
                    setCategoryId('');
                    setPaymentMethodId('');
                    setPreset('today');
                  }}
                  className="text-[10px] font-bold text-text-accent uppercase tracking-wider hover:underline"
                >
                  Clear All Filters
                </button>
              </div>

              {/* Filtering Select Grid */}
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                
                {/* Date presets */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Date Period</label>
                  <select 
                    value={preset} 
                    onChange={(e) => setPreset(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-elevated p-2.5 text-xs text-text-primary outline-none focus:border-accent"
                  >
                    {datePresets.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                </div>

                {/* Cashiers */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Cashier Operator</label>
                  <select 
                    value={cashierId} 
                    onChange={(e) => setCashierId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-elevated p-2.5 text-xs text-text-primary outline-none focus:border-accent"
                  >
                    <option value="">All Cashiers</option>
                    {metadata.cashiers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Shifts */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Cash Shift</label>
                  <select 
                    value={shiftId} 
                    onChange={(e) => setShiftId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-elevated p-2.5 text-xs text-text-primary outline-none focus:border-accent"
                  >
                    <option value="">All Shifts</option>
                    {metadata.shifts.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>

                {/* Tables */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Dining Table</label>
                  <select 
                    value={tableNumber} 
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-elevated p-2.5 text-xs text-text-primary outline-none focus:border-accent"
                  >
                    <option value="">All Tables</option>
                    {metadata.tables.map(t => <option key={t.number} value={t.number}>Table {t.number}</option>)}
                  </select>
                </div>

                {/* Items */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Menu Product</label>
                  <select 
                    value={itemId} 
                    onChange={(e) => setItemId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-elevated p-2.5 text-xs text-text-primary outline-none focus:border-accent"
                  >
                    <option value="">All Products</option>
                    {metadata.items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>

                {/* Categories */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Menu Category</label>
                  <select 
                    value={categoryId} 
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-elevated p-2.5 text-xs text-text-primary outline-none focus:border-accent"
                  >
                    <option value="">All Categories</option>
                    {metadata.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Payment Methods */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Payment Method</label>
                  <select 
                    value={paymentMethodId} 
                    onChange={(e) => setPaymentMethodId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-elevated p-2.5 text-xs text-text-primary outline-none focus:border-accent"
                  >
                    <option value="">All Methods</option>
                    {metadata.payment_methods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

              </div>

              {/* Custom Date Pickers (only shown if preset === 'custom') */}
              {preset === 'custom' && (
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4 pt-2 border-t border-border/40 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Date From</label>
                    <input 
                      type="date" 
                      value={dateFrom} 
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface-elevated p-2 text-xs text-text-primary outline-none focus:border-accent" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Date To</label>
                    <input 
                      type="date" 
                      value={dateTo} 
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface-elevated p-2 text-xs text-text-primary outline-none focus:border-accent" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── KPI cards section ───────────────────────────────────────────── */}
            {reportType === 'dashboard_summary' && reportData && (
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                
                <div className="rounded-2xl border border-border bg-surface p-4 premium-shadow">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Net Revenue</p>
                  <h3 className="text-xl font-bold text-success font-display mt-1">{formatCurrency(reportData.netRevenue, locale)}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-text-muted mt-2">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span>Includes deductions</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4 premium-shadow">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Gross POS Sales</p>
                  <h3 className="text-xl font-bold text-text-accent font-display mt-1">{formatCurrency(reportData.totalSales, locale)}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-text-muted mt-2">
                    <CheckCircle className="h-3 w-3 text-accent" />
                    <span>{reportData.totalOrders} total orders</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4 premium-shadow">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Taxes & Service</p>
                  <h3 className="text-xl font-bold text-text-primary mt-1">{formatCurrency(reportData.taxCollected + reportData.serviceChargeCollected, locale)}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-text-muted mt-2">
                    <Percent className="h-3 w-3 text-primary" />
                    <span>Tax: {formatCurrency(reportData.taxCollected, locale)}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4 premium-shadow">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Refunds & Voids</p>
                  <h3 className="text-xl font-bold text-error mt-1">{formatCurrency(reportData.refundsProcessed, locale)}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-text-muted mt-2">
                    <ShieldAlert className="h-3 w-3 text-error" />
                    <span>{reportData.voidsCount} orders cancelled</span>
                  </div>
                </div>

              </div>
            )}

            {/* ── Visual Charts & Graphs (Recharts) ───────────────────────────── */}
            {isMounted && chartSalesData.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-5 premium-shadow">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Sales & Activity Trend Analysis</h3>
                
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartSalesData}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d4a574" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#d4a574" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={11} />
                      <YAxis stroke="var(--color-text-muted)" fontSize={11} />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'var(--color-surface)', 
                          border: '1px solid var(--color-border)', 
                          borderRadius: '8px',
                          fontSize: '12px' 
                        }} 
                      />
                      <Area type="monotone" dataKey="sales" stroke="#d4a574" fillOpacity={1} fill="url(#salesGrad)" strokeWidth={2} name="Sales (EGP)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ── Detailed Report Data Table ─────────────────────────────────── */}
            <div className="rounded-2xl border border-border bg-surface premium-shadow overflow-hidden">
              <div className="border-b border-border/80 bg-surface-elevated/40 p-4 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-text-primary text-base">{activeReportInfo.label}</h3>
                  <p className="text-xs text-text-muted mt-0.5">Summary of ledger matching current filters and dates.</p>
                </div>
                {Array.isArray(reportData) && (
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">{reportData.length} records</span>
                )}
              </div>

              {loading ? (
                <div className="space-y-3 p-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 animate-pulse rounded-xl bg-surface-elevated" />
                  ))}
                </div>
              ) : !reportData || (Array.isArray(reportData) && reportData.length === 0) ? (
                <div className="p-12 text-center text-text-muted">No report data generated. Try broadening filters or presets.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface-elevated/20 text-xs font-bold uppercase tracking-wider text-text-secondary">
                        {/* Dynamic Headers */}
                        {Array.isArray(reportData) && Object.keys(reportData[0]).map(key => (
                          <th key={key} className="py-3.5 px-4">{key.replace('_', ' ')}</th>
                        ))}
                        {reportType === 'dashboard_summary' && (
                          <>
                            <th className="py-3.5 px-4">Ledger Item</th>
                            <th className="py-3.5 px-4 text-right">Amount (EGP) / Count</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {/* Dynamic Rows */}
                      {Array.isArray(reportData) ? (
                        reportData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-surface-hover/30 transition-colors">
                            {Object.entries(row).map(([key, val]: any, cellIdx) => {
                              let displayVal = val;
                              if (typeof val === 'number' && (key.includes('sales') || key.includes('revenue') || key.includes('total') || key.includes('price') || key.includes('tax') || key.includes('charge') || key.includes('discount') || key.includes('refund') || key.includes('ticket') || key.includes('opening_cash') || key.includes('expected_cash') || key.includes('counted_cash') || key.includes('variance'))) {
                                displayVal = formatCurrency(val, locale);
                              }
                              return (
                                <td key={cellIdx} className={`py-3 px-4 text-text-secondary ${typeof val === 'number' ? 'font-mono' : ''}`}>
                                  {displayVal ?? '-'}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      ) : (
                        // Dashboard summary table format
                        <>
                          <tr className="hover:bg-surface-hover/30"><td className="py-3 px-4 font-semibold text-text-primary">Net Revenue</td><td className="py-3 px-4 text-right font-bold text-success">{formatCurrency(reportData.netRevenue, locale)}</td></tr>
                          <tr className="hover:bg-surface-hover/30"><td className="py-3 px-4">Gross POS Sales</td><td className="py-3 px-4 text-right font-bold text-text-primary">{formatCurrency(reportData.totalSales, locale)}</td></tr>
                          <tr className="hover:bg-surface-hover/30"><td className="py-3 px-4">Total Tax Collected</td><td className="py-3 px-4 text-right text-text-secondary">{formatCurrency(reportData.taxCollected, locale)}</td></tr>
                          <tr className="hover:bg-surface-hover/30"><td className="py-3 px-4">Total Service Charges</td><td className="py-3 px-4 text-right text-text-secondary">{formatCurrency(reportData.serviceChargeCollected, locale)}</td></tr>
                          <tr className="hover:bg-surface-hover/30"><td className="py-3 px-4">Total Discounts Applied</td><td className="py-3 px-4 text-right text-warning">{formatCurrency(reportData.discountsGiven, locale)}</td></tr>
                          <tr className="hover:bg-surface-hover/30"><td className="py-3 px-4">Approved Refunds Deducted</td><td className="py-3 px-4 text-right text-error">{formatCurrency(reportData.refundsProcessed, locale)}</td></tr>
                          <tr className="hover:bg-surface-hover/30"><td className="py-3 px-4">Voided Orders Value</td><td className="py-3 px-4 text-right text-text-muted">{formatCurrency(reportData.voidsTotal, locale)} ({reportData.voidsCount} orders)</td></tr>
                          <tr className="hover:bg-surface-hover/30"><td className="py-3 px-4">Total Orders Count</td><td className="py-3 px-4 text-right text-text-primary">{reportData.totalOrders} orders</td></tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}