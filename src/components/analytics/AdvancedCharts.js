'use client';
import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';

// Color palette for charts
const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
  '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'
];

// Advanced Line Chart with multiple lines and area
export const AdvancedLineChart = ({
  data = [],
  lines = [],
  height = 400,
  showArea = false,
  showGrid = true,
  showLegend = true,
  className = ''
}) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const ChartComponent = showArea ? AreaChart : LineChart;
  const DataComponent = showArea ? Area : Line;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
          <XAxis 
            dataKey="name" 
            stroke="#6B7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          {showLegend && <Legend />}
          {lines.map((line, index) => (
            <DataComponent
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color || COLORS[index % COLORS.length]}
              fill={showArea ? line.color || COLORS[index % COLORS.length] : undefined}
              strokeWidth={2}
              fillOpacity={showArea ? 0.1 : undefined}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

// Advanced Bar Chart with grouped bars
export const AdvancedBarChart = ({
  data = [],
  bars = [],
  height = 400,
  stacked = false,
  horizontal = false,
  showGrid = true,
  showLegend = true,
  className = ''
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout={horizontal ? 'horizontal' : 'vertical'}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
          {horizontal ? (
            <>
              <YAxis dataKey="name" stroke="#6B7280" fontSize={12} />
              <XAxis stroke="#6B7280" fontSize={12} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          {showLegend && <Legend />}
          {bars.map((bar, index) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              fill={bar.color || COLORS[index % COLORS.length]}
              stackId={stacked ? 'stack' : undefined}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Advanced Pie Chart with custom labels
export const AdvancedPieChart = ({
  data = [],
  height = 400,
  showLegend = true,
  showLabels = true,
  className = ''
}) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={showLabels}
            label={showLabels ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : undefined}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                opacity={activeIndex === index ? 1 : 0.8}
              />
            ))}
          </Pie>
          {showLegend && <Legend />}
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Radar Chart for skill assessments
export const SkillRadarChart = ({
  data = [],
  height = 400,
  className = ''
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data}>
          <PolarGrid stroke="#E5E7EB" />
          <PolarAngleAxis dataKey="subject" stroke="#6B7280" fontSize={12} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6B7280" />
          <Radar
            name="Skills"
            dataKey="A"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.3}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Composed Chart for complex data visualization
export const ComposedChart = ({
  data = [],
  lines = [],
  bars = [],
  areas = [],
  height = 400,
  showGrid = true,
  showLegend = true,
  className = ''
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
          <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
          <YAxis stroke="#6B7280" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          {showLegend && <Legend />}
          
          {/* Render Areas */}
          {areas.map((area, index) => (
            <Area
              key={area.key}
              type="monotone"
              dataKey={area.key}
              fill={area.color || COLORS[index % COLORS.length]}
              stroke={area.color || COLORS[index % COLORS.length]}
              fillOpacity={0.3}
            />
          ))}
          
          {/* Render Bars */}
          {bars.map((bar, index) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              fill={bar.color || COLORS[index % COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
          
          {/* Render Lines */}
          {lines.map((line, index) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color || COLORS[index % COLORS.length]}
              strokeWidth={2}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// Chart Container with controls
export const ChartContainer = ({
  title,
  children,
  controls,
  className = ''
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {(title || controls) && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          )}
          {controls && (
            <div className="flex items-center space-x-2">
              {controls}
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}; 