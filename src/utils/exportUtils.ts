import * as XLSX from 'xlsx';

/**
 * Utility functions for exporting data to Excel, CSV, and other formats
 */

export interface ExportOptions {
  filename?: string;
  format?: 'xlsx' | 'csv' | 'json';
  includeCharts?: boolean;
  includeMetadata?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  chart_type?: string;
  chart_data?: Record<string, unknown> | unknown[];
}

export interface AnalysisData {
  executive_summary?: string;
  key_insights?: string[];
  competitive_analysis?: string;
  risk_assessment?: string;
  kpis?: Record<string, unknown>;
  trends?: string[];
  recommendations?: string[];
  confidence_score?: number;
  chart_type?: string;
  chart_data?: Record<string, unknown> | unknown[];
}

/**
 * Export chat messages to Excel or CSV
 */
export function exportChatMessages(
  messages: ChatMessage[],
  options: ExportOptions = {}
): { content: string; filename: string; mimeType: string } {
  const {
    filename = `chat_export_${new Date().toISOString().slice(0, 10)}`,
    format = 'xlsx',
    includeMetadata = true
  } = options;

  try {
    // Prepare data for export
    const exportData = messages.map((message, index) => {
      const row: Record<string, unknown> = {
        'Mensagem': index + 1,
        'Tipo': message.role === 'user' ? 'Usuário' : 'Assistente',
        'Conteúdo': message.content,
        'Data/Hora': message.timestamp || new Date().toLocaleString('pt-BR')
      };

      if (includeMetadata) {
        row['Tipo de Gráfico'] = message.chart_type || '-';
        row['Dados do Gráfico'] = message.chart_data ? JSON.stringify(message.chart_data) : '-';
      }

      return row;
    });

    return exportDataToFormat(exportData, filename, format);
  } catch (error) {
    console.error('Error exporting chat messages:', error);
    throw new Error('Failed to export chat messages');
  }
}

/**
 * Export analysis data to Excel or CSV
 */
export function exportAnalysisData(
  analysisData: AnalysisData,
  options: ExportOptions = {}
): { content: string; filename: string; mimeType: string } {
  const {
    filename = `analysis_export_${new Date().toISOString().slice(0, 10)}`,
    format = 'xlsx',
    includeMetadata = true
  } = options;

  try {
    const exportData: Record<string, unknown>[] = [];

    // Add executive summary
    if (analysisData.executive_summary) {
      exportData.push({
        'Seção': 'Resumo Executivo',
        'Conteúdo': analysisData.executive_summary,
        'Tipo': 'Texto'
      });
    }

    // Add key insights
    if (analysisData.key_insights && analysisData.key_insights.length > 0) {
      analysisData.key_insights.forEach((insight, index) => {
        exportData.push({
          'Seção': 'Principais Insights',
          'Conteúdo': insight,
          'Tipo': 'Insight',
          'Número': index + 1
        });
      });
    }

    // Add competitive analysis
    if (analysisData.competitive_analysis) {
      exportData.push({
        'Seção': 'Análise Competitiva',
        'Conteúdo': analysisData.competitive_analysis,
        'Tipo': 'Texto'
      });
    }

    // Add risk assessment
    if (analysisData.risk_assessment) {
      exportData.push({
        'Seção': 'Avaliação de Riscos',
        'Conteúdo': analysisData.risk_assessment,
        'Tipo': 'Texto'
      });
    }

    // Add KPIs
    if (analysisData.kpis) {
      Object.entries(analysisData.kpis).forEach(([key, value]) => {
        exportData.push({
          'Seção': 'KPIs',
          'Conteúdo': `${key}: ${JSON.stringify(value)}`,
          'Tipo': 'KPI',
          'Chave': key,
          'Valor': typeof value === 'object' ? JSON.stringify(value) : String(value)
        });
      });
    }

    // Add trends
    if (analysisData.trends && analysisData.trends.length > 0) {
      analysisData.trends.forEach((trend, index) => {
        exportData.push({
          'Seção': 'Tendências',
          'Conteúdo': trend,
          'Tipo': 'Tendência',
          'Número': index + 1
        });
      });
    }

    // Add recommendations
    if (analysisData.recommendations && analysisData.recommendations.length > 0) {
      analysisData.recommendations.forEach((recommendation, index) => {
        exportData.push({
          'Seção': 'Recomendações',
          'Conteúdo': recommendation,
          'Tipo': 'Recomendação',
          'Número': index + 1
        });
      });
    }

    // Add confidence score
    if (analysisData.confidence_score !== undefined) {
      exportData.push({
        'Seção': 'Confiança',
        'Conteúdo': `Score: ${analysisData.confidence_score}/100`,
        'Tipo': 'Métrica',
        'Score': analysisData.confidence_score
      });
    }

    // Add chart data if available
    if (analysisData.chart_data) {
      exportData.push({
        'Seção': 'Dados do Gráfico',
        'Conteúdo': JSON.stringify(analysisData.chart_data),
        'Tipo': 'Dados',
        'Tipo de Gráfico': analysisData.chart_type || 'Desconhecido'
      });
    }

    return exportDataToFormat(exportData, filename, format);
  } catch (error) {
    console.error('Error exporting analysis data:', error);
    throw new Error('Failed to export analysis data');
  }
}

/**
 * Export chart data to Excel or CSV
 */
export function exportChartData(
  chartData: Record<string, unknown> | unknown[],
  chartType: string,
  options: ExportOptions = {}
): { content: string; filename: string; mimeType: string } {
  const {
    filename = `chart_export_${new Date().toISOString().slice(0, 10)}`,
    format = 'xlsx'
  } = options;

  try {
    let exportData: Record<string, unknown>[] = [];

    // Handle different chart data formats
    if (typeof chartData === 'object' && chartData !== null) {
      if (Array.isArray(chartData)) {
        // Array of data points
        exportData = chartData.map((item, index) => {
          const chartItem = item as Record<string, unknown>;
          return {
            'Índice': index + 1,
            'Label': (chartItem.label as string) || (chartItem.name as string) || `Item ${index + 1}`,
            'Valor': (chartItem.value as number) || (chartItem.y as number) || String(chartItem),
            'Tipo de Gráfico': chartType
          };
        });
      } else if (chartData.labels && chartData.values) {
        // Standard chart format
        const labels = chartData.labels as string[];
        const values = chartData.values as number[];
        exportData = labels.map((label: string, index: number) => ({
          'Label': label,
          'Valor': values[index],
          'Tipo de Gráfico': chartType
        }));
      } else {
        // Generic object format
        exportData = Object.entries(chartData).map(([key, value]) => ({
          'Chave': key,
          'Valor': value,
          'Tipo de Gráfico': chartType
        }));
      }
    } else {
      // Fallback for simple data
      exportData = [{
        'Dados': JSON.stringify(chartData),
        'Tipo de Gráfico': chartType
      }];
    }

    return exportDataToFormat(exportData, filename, format);
  } catch (error) {
    console.error('Error exporting chart data:', error);
    throw new Error('Failed to export chart data');
  }
}

/**
 * Generic function to export data to specified format
 */
function exportDataToFormat(
  data: Record<string, unknown>[],
  filename: string,
  format: 'xlsx' | 'csv' | 'json'
): { content: string; filename: string; mimeType: string } {
  try {
    let content: string;
    let mimeType: string;
    let finalFilename: string;

    switch (format) {
      case 'xlsx':
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Auto-size columns
        const colWidths = data.reduce((widths: number[], row: Record<string, unknown>) => {
          Object.values(row).forEach((value, index) => {
            const length = String(value).length;
            widths[index] = Math.max(widths[index] || 0, Math.min(length + 2, 50));
          });
          return widths;
        }, []);
        
        ws['!cols'] = colWidths.map(width => ({ width }));
        XLSX.utils.book_append_sheet(wb, ws, 'Dados');
        
        // Generate Excel file
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        content = btoa(String.fromCharCode(...new Uint8Array(excelBuffer)));
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        finalFilename = `${filename}.xlsx`;
        break;

      case 'csv':
        // Convert to CSV format
        const csvContent = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(data));
        content = btoa(unescape(encodeURIComponent(csvContent)));
        mimeType = 'text/csv';
        finalFilename = `${filename}.csv`;
        break;

      case 'json':
        // Convert to JSON format
        content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
        mimeType = 'application/json';
        finalFilename = `${filename}.json`;
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return {
      content,
      filename: finalFilename,
      mimeType
    };
  } catch (error) {
    console.error('Error in exportDataToFormat:', error);
    throw new Error(`Failed to export data to ${format}`);
  }
}

/**
 * Download file with given content and filename
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  try {
    const byteCharacters = atob(content);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error('Failed to download file');
  }
}

/**
 * Export data using backend API
 */
export async function exportViaBackend(
  exportType: 'chat' | 'analysis' | 'chart',
  formatType: 'xlsx' | 'csv' | 'json',
  data: Record<string, unknown> | unknown[] | ChatMessage[] | AnalysisData,
  filename?: string
): Promise<void> {
  try {
    const response = await fetch('/api/export-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        export_type: exportType,
        format_type: formatType,
        data,
        filename
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Download the file
    downloadFile(result.file_content, result.filename, result.content_type);
  } catch (error) {
    console.error('Error exporting via backend:', error);
    throw new Error('Failed to export data via backend');
  }
}

export default {
  exportChatMessages,
  exportAnalysisData,
  exportChartData,
  downloadFile,
  exportViaBackend
};