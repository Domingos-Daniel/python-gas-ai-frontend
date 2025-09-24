"use client";

import MarkdownRenderer from "./MarkdownRenderer";
import ChartRenderer from "./ChartRenderer";

interface MessageContentRendererProps {
  content: string;
  className?: string;
}

export default function MessageContentRenderer({ content, className = "" }: MessageContentRendererProps) {
  // Verificar se o conteúdo contém imagens base64 (gráficos)
  const hasCharts = /data:image\/(png|jpeg|jpg|gif);base64,/.test(content);
  
  if (hasCharts) {
    // Se tiver gráficos, usar o ChartRenderer que já processa o texto e os gráficos
    return <ChartRenderer content={content} className={className} />;
  }
  
  // Se não tiver gráficos, usar o MarkdownRenderer tradicional
  return <MarkdownRenderer content={content} className={className} />;
}