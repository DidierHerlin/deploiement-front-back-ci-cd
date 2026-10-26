'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import React from 'react';
import { useTranslation } from '@/lib/i18n';

interface RevenueChartProps {
  chartData: Array<{ name: string; Revenus: number }>;
}

export function RevenueChart({ chartData }: RevenueChartProps) {
  const { t } = useTranslation();

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border col-span-1 md:col-span-2">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        {t('admin.reporting.revenue_evolution', 'Évolution des revenus')}
      </h3>
      <div className="h-72">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value.toLocaleString('fr-MG')} Ar`} />
              <Legend />
              <Bar dataKey="Revenus" fill="#8b5cf6" radius={[4, 4, 0, 0]} name={t('admin.reporting.stat_revenus_globaux', 'Revenus')} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            {t('admin.reporting.no_revenue_data', 'Aucune donnée de revenu disponible')}
          </div>
        )}
      </div>
    </div>
  );
}
