"use client";

import { useState } from "react";
import { BarChart3, PieChart, TrendingUp, Download, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import MarkdownRenderer from "./MarkdownRenderer";

interface ChartRendererProps {
  content: string;
  className?: string;
}

interface ChartData {
  type: 'pie' | 'bar' | 'line' | 'donut';
  base64: string;
  title?: string;
  summary?: any;
}

export default function ChartRenderer({ content, className = "" }: ChartRendererProps) {
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null);
  
  // Função para extrair gráficos base64 do conteúdo
  const extractCharts = (text: string): ChartData[] => {
    const charts: ChartData[] = [];
    
    // Padrão para detectar gráficos base64
    const base64Pattern = /data:image\/(png|jpeg|jpg|gif);base64,([A-Za-z0-9+/=]+)/g;
    const matches = text.match(base64Pattern);
    
    if (matches) {
      matches.forEach((match, index) => {
        // Detectar tipo de gráfico pelo contexto
        const chartType = detectChartType(text, index);
        const title = extractChartTitle(text, index);
        const summary = extractChartSummary(text, index);
        
        charts.push({
          type: chartType,
          base64: match,
          title,
          summary
        });
      });
    }
    
    return charts;
  };
  
  // Detectar tipo de gráfico pelo contexto
  const detectChartType = (text: string, chartIndex: number): 'pie' | 'bar' | 'line' | 'donut' => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('pie') || lowerText.includes('pizza')) return 'pie';
    if (lowerText.includes('bar') || lowerText.includes('barras')) return 'bar';
    if (lowerText.includes('line') || lowerText.includes('linha')) return 'line';
    if (lowerText.includes('donut') || lowerText.includes('rosquinha')) return 'donut';
    
    return 'bar'; // default
  };
  
  // Extrair título do gráfico
  const extractChartTitle = (text: string, chartIndex: number): string => {
    // Procurar por títulos próximos ao gráfico
    const lines = text.split('\n');
    let title = `Gráfico ${chartIndex + 1}`;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('data:image')) {
        // Procurar título acima do gráfico
        for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
          const line = lines[j].trim();
          if (line.startsWith('**') && line.endsWith('**')) {
            title = line.replace(/\*\*/g, '');
            break;
          }
          if (line.startsWith('#')) {
            title = line.replace(/#+/g, '').trim();
            break;
          }
        }
        break;
      }
    }
    
    return title;
  };
  
  // Extrair resumo dos dados
  const extractChartSummary = (text: string, chartIndex: number): any => {
    // Procurar por informações de dados próximas ao gráfico
    const summary: any = {};
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('data:image')) {
        // Procurar por estatísticas próximas
        for (let j = i + 1; j < Math.min(lines.length, i + 10); j++) {
          const line = lines[j].trim();
          if (line.includes('Total:') || line.includes('total:')) {
            summary.total = line.split(':')[1]?.trim();
          }
          if (line.includes('Média:') || line.includes('média:')) {
            summary.average = line.split(':')[1]?.trim();
          }
          if (line.includes('Contagem:') || line.includes('contagem:')) {
            summary.count = line.split(':')[1]?.trim();
          }
        }
        break;
      }
    }
    
    return summary;
  };
  
  // Função para baixar a imagem
  const downloadChart = (chart: ChartData) => {
    const link = document.createElement('a');
    link.href = chart.base64;
    link.download = `${chart.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'grafico'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Função para limpar o conteúdo de imagens base64 do texto
  const cleanContent = (text: string): string => {
    return text.replace(/!\[.*?\]\(data:image\/[^;]+;base64,[^)]+\)/g, '')
               .replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '');
  };
  
  const charts = extractCharts(content);
  const cleanedContent = cleanContent(content);
  
  // Ícone baseado no tipo de gráfico
  const getChartIcon = (type: string) => {
    switch (type) {
      case 'pie': return <PieChart className="h-4 w-4" />;
      case 'bar': return <BarChart3 className="h-4 w-4" />;
      case 'line': return <TrendingUp className="h-4 w-4" />;
      case 'donut': return <PieChart className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };
  
  if (charts.length === 0) {
    // Se não houver gráficos, renderizar apenas o texto limpo
    return cleanedContent.trim() ? (
      <MarkdownRenderer content={cleanedContent.trim()} className={className} />
    ) : null;
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Texto limpo (sem imagens base64) */}
      {cleanedContent.trim() && (
        <MarkdownRenderer content={cleanedContent.trim()} className="text-slate-100" />
      )}
      
      {/* Gráficos */}
      <div className="space-y-4">
        {charts.map((chart, index) => (
          <div key={index} className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-4 backdrop-blur-sm">
            {/* Cabeçalho do gráfico */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  {getChartIcon(chart.type)}
                </div>
                <h4 className="text-white font-medium">{chart.title}</h4>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedChart(chart)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
                  title="Ampliar gráfico"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadChart(chart)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
                  title="Baixar gráfico"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {/* Imagem do gráfico */}
            <div className="relative group">
              <img
                src={chart.base64}
                alt={chart.title}
                className="w-full h-auto rounded-lg border border-slate-600/30 shadow-lg transition-transform duration-200 group-hover:scale-[1.02]"
                onClick={() => setSelectedChart(chart)}
              />
              
              {/* Overlay ao passar o mouse */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center">
                <div className="text-white text-xs mb-2">Clique para ampliar</div>
              </div>
            </div>
            
            {/* Resumo dos dados (se disponível) */}
            {Object.keys(chart.summary).length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-700/30">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {chart.summary.total && (
                    <div className="bg-slate-700/30 rounded p-2">
                      <div className="text-slate-400">Total</div>
                      <div className="text-white font-medium">{chart.summary.total}</div>
                    </div>
                  )}
                  {chart.summary.average && (
                    <div className="bg-slate-700/30 rounded p-2">
                      <div className="text-slate-400">Média</div>
                      <div className="text-white font-medium">{chart.summary.average}</div>
                    </div>
                  )}
                  {chart.summary.count && (
                    <div className="bg-slate-700/30 rounded p-2">
                      <div className="text-slate-400">Itens</div>
                      <div className="text-white font-medium">{chart.summary.count}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Modal de visualização ampliada */}
      <Dialog open={!!selectedChart} onOpenChange={() => setSelectedChart(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedChart?.title}</DialogTitle>
            <DialogClose onClick={() => setSelectedChart(null)} />
          </DialogHeader>
          
          {selectedChart && (
            <div className="space-y-4">
              <img
                src={selectedChart.base64}
                alt={selectedChart.title}
                className="w-full h-auto rounded-lg border border-slate-600/30"
              />
              
              <div className="flex justify-between items-center">
                <div className="text-slate-400 text-sm">
                  Tipo: <span className="text-white capitalize">{selectedChart.type}</span>
                </div>
                
                <Button
                  onClick={() => downloadChart(selectedChart)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}