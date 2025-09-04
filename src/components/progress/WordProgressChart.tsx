import React, { useState, useMemo, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Calendar, TrendingUp, ToggleLeft, ToggleRight } from "lucide-react";
import { useWordProgressChart, TimeFilter } from "@/hooks/useWordProgressChart";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WordProgressChartProps {
  className?: string;
}

const WordProgressChart: React.FC<WordProgressChartProps> = ({ className = "" }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('days');
  const [period, setPeriod] = useState(30);
  const [isCumulative, setIsCumulative] = useState(false);

  const { data, isLoading, error } = useWordProgressChart(timeFilter, period);

  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    switch (timeFilter) {
      case 'days':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'weeks':
        return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'months':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      default:
        return dateStr;
    }
  }, [timeFilter]);

  const chartData = useMemo(() => {
    if (!data) return { labels: [], datasets: [] };

    const labels = data.map(d => formatDate(d.date));
    const values = data.map(d => isCumulative ? d.cumulative_words : d.words_learned);

    // Create gradient for Chart.js
    const createGradient = (ctx: CanvasRenderingContext2D) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
      gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.2)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
      return gradient;
    };

    return {
      labels,
      datasets: [
        {
          label: isCumulative ? 'Total Words Learned' : 'Words Learned',
          data: values,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D } }) => {
            const { ctx } = context.chart;
            if (!ctx) return 'rgba(59, 130, 246, 0.1)';
            return isCumulative ? createGradient(ctx) : 'rgba(59, 130, 246, 0.05)';
          },
          borderWidth: 3,
          fill: isCumulative,
          tension: 0.4,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: 'rgb(255, 255, 255)',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: 'rgb(59, 130, 246)',
          pointHoverBorderColor: 'rgb(255, 255, 255)',
          pointHoverBorderWidth: 3,
        },
      ],
    };
  }, [data, isCumulative, formatDate]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: 'rgb(17, 24, 39)',
        bodyColor: 'rgb(59, 130, 246)',
        borderColor: 'rgb(229, 231, 235)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          title: (context: TooltipItem<'line'>[]) => {
            return context[0]?.label || '';
          },
          label: (context: TooltipItem<'line'>) => {
            const label = isCumulative ? 'Total Words Learned: ' : 'Words Learned: ';
            return `${label}${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
          font: {
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
          font: {
            size: 12,
          },
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }), [isCumulative]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p>Error loading progress data</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Words Learned Progress</h3>
            <p className="text-sm text-gray-600">Track your pronunciation mastery over time</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Time Filter */}
        <div className="flex items-center space-x-2">
          <Calendar size={16} className="text-gray-500" />
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
          </select>
        </div>

        {/* Period */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Last</span>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeFilter === 'days' && (
              <>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </>
            )}
            {timeFilter === 'weeks' && (
              <>
                <option value={4}>4 weeks</option>
                <option value={8}>8 weeks</option>
                <option value={12}>12 weeks</option>
                <option value={24}>24 weeks</option>
              </>
            )}
            {timeFilter === 'months' && (
              <>
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
                <option value={24}>24 months</option>
              </>
            )}
          </select>
        </div>

        {/* Cumulative Toggle */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Cumulative</span>
          <button
            onClick={() => setIsCumulative(!isCumulative)}
            className="flex items-center"
          >
            {isCumulative ? (
              <ToggleRight className="text-blue-600" size={24} />
            ) : (
              <ToggleLeft className="text-gray-400" size={24} />
            )}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {data?.reduce((sum, d) => sum + d.words_learned, 0) || 0}
          </p>
          <p className="text-sm text-gray-600">Total in Period</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {data?.[data.length - 1]?.cumulative_words || 0}
          </p>
          <p className="text-sm text-gray-600">Total Learned</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">
            {data && data.length > 0 
              ? Math.round((data.reduce((sum, d) => sum + d.words_learned, 0) / data.length) * 10) / 10
              : 0
            }
          </p>
          <p className="text-sm text-gray-600">Daily Average</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">
            {data ? Math.max(...data.map(d => d.words_learned)) : 0}
          </p>
          <p className="text-sm text-gray-600">Best Day</p>
        </div>
      </div>
    </div>
  );
};

export default WordProgressChart;