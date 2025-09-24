"use client";

import TestChartExtraction from "@/components/test_chart_extraction";

export default function TestChartPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Teste de Extração de Gráficos</h1>
        <TestChartExtraction />
      </div>
    </div>
  );
}