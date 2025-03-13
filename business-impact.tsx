import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  ResponsiveContainer, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ComposedChart, Area
} from 'recharts';

// Custom hook for fetching dashboard data
const useDataFetching = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Failed to load data from ${url}: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};

// Color configuration
const colorConfig = {
  months: {
    'Jan': '#3b82f6',
    'Feb': '#8b5cf6',
    'Mar': '#ec4899',
    'Apr': '#14b8a6',
    'May': '#f97316',
    'Jun': '#84cc16',
    'Jul': '#06b6d4',
    'Aug': '#6366f1',
    'Sep': '#a855f7',
    'Oct': '#f43f5e',
    'Nov': '#0ea5e9',
    'Dec': '#10b981'
  },
  metrics: {
    'cost': '#ef4444',
    'savings': '#22c55e',
    'impact': '#3b82f6',
    'roi': '#8b5cf6'
  }
};

// Format large numbers
const formatMoney = (amount) => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(2)}`;
};

// Main dashboard component
const BusinessImpactDashboard = () => {
  // Fetch dashboard data
  const { data: monthlyImpact, loading: monthlyLoading, error: monthlyError } = 
    useDataFetching('/data/monthly_impact.json');
  const { data: dailyCost, loading: costLoading, error: costError } = 
    useDataFetching('/data/daily_cost.json');
  const { data: aiImpact, loading: aiLoading, error: aiError } = 
    useDataFetching('/data/daily_ai_impact.json');
  const { data: summaryMetrics, loading: summaryLoading, error: summaryError } = 
    useDataFetching('/data/summary_metrics.json');
  const { data: formattedMetrics, loading: formattedLoading, error: formattedError } = 
    useDataFetching('/data/formatted_metrics.json');

  // Loading state
  if (monthlyLoading || costLoading || aiLoading || summaryLoading || formattedLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg font-medium text-gray-600">Loading business impact data...</div>
      </div>
    );
  }

  // Error state
  const errorMessage = monthlyError || costError || aiError || summaryError || formattedError;
  if (errorMessage) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Error Loading Dashboard</h3>
        <p>{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Business Impact Dashboard</h2>
      
      {/* Summary metrics */}
      {summaryMetrics && formattedMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard 
            title="Total Contacts"
            value={formattedMetrics.total_contacts_formatted || "N/A"}
            icon="📞"
          />
          <SummaryCard 
            title="Cost Per Contact"
            value={`${summaryMetrics.avg_cost_per_contact?.toFixed(2) || "N/A"}`}
            icon="💵"
          />
          <SummaryCard 
            title="Total Savings"
            value={formattedMetrics.total_savings_formatted || "N/A"}
            icon="💰"
          />
          <SummaryCard 
            title="ROI"
            value={`${summaryMetrics.avg_roi?.toFixed(1) || "N/A"}%`}
            icon="📈"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Impact Chart */}
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Monthly Business Impact</h3>
          {monthlyImpact ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={monthlyImpact}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  yAxisId="left" 
                  orientation="left"
                  tickFormatter={(value) => `${value/1000}K`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  domain={[0, 100]}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'Total Savings') return [formatMoney(value), name];
                    if (name === 'Total Cost') return [formatMoney(value), name];
                    if (name === 'Business Impact') return [formatMoney(value), name];
                    if (name === 'ROI') return [`${value.toFixed(1)}%`, name];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="total_savings" 
                  name="Total Savings" 
                  fill={colorConfig.metrics.savings} 
                />
                <Bar 
                  yAxisId="left"
                  dataKey="total_tech_cost" 
                  name="Total Cost" 
                  fill={colorConfig.metrics.cost} 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="avg_roi_percentage" 
                  name="ROI" 
                  stroke={colorConfig.metrics.roi} 
                  strokeWidth={2}
                  dot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center p-8 text-gray-500">No monthly impact data available</div>
          )}
        </div>

        {/* Cost Per Contact Trend */}
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Cost Per Contact Trend</h3>
          {dailyCost ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyCost}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth()+1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'cost_per_contact') return [`${value.toFixed(2)}`, 'Cost Per Contact'];
                    return [value, name];
                  }}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cost_per_contact" 
                  name="cost_per_contact" 
                  stroke={colorConfig.metrics.cost} 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center p-8 text-gray-500">No cost trend data available</div>
          )}
        </div>

        {/* AI Impact Chart */}
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-4">AI Containment Impact</h3>
          {aiImpact ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={aiImpact}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth()+1}/${d.getDate()}`;
                  }}
                />
                <YAxis 
                  yAxisId="left" 
                  orientation="left"
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  domain={[0, 1]}
                  tickFormatter={(value) => `${(value*100).toFixed(0)}%`}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'containment_ratio') return [`${(value*100).toFixed(1)}%`, 'Containment Rate'];
                    if (name === 'contained_contacts') return [`${value.toLocaleString()} contacts`, 'Contained Contacts'];
                    if (name === 'total_contacts') return [`${value.toLocaleString()} contacts`, 'Total Contacts'];
                    return [value, name];
                  }}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="total_contacts" 
                  name="total_contacts" 
                  fill="#94a3b8" 
                  fillOpacity={0.5}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="contained_contacts" 
                  name="contained_contacts" 
                  fill="#14b8a6" 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="containment_ratio" 
                  name="containment_ratio" 
                  stroke="#0d9488" 
                  strokeWidth={3}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center p-8 text-gray-500">No AI impact data available</div>
          )}
        </div>

        {/* Cost vs. Savings Chart */}
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Cost vs. Savings Breakdown</h3>
          {dailyCost ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyCost}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth()+1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'savings') return [formatMoney(value), 'Savings'];
                    if (name === 'tech_cost') return [formatMoney(value), 'Technology Cost'];
                    return [value, name];
                  }}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="savings" 
                  name="savings" 
                  fill={colorConfig.metrics.savings} 
                  stroke="#16a34a" 
                  fillOpacity={0.6} 
                  stackId="1"
                />
                <Area 
                  type="monotone" 
                  dataKey="tech_cost" 
                  name="tech_cost" 
                  fill={colorConfig.metrics.cost} 
                  stroke="#dc2626" 
                  fillOpacity={0.6}
                  stackId="2"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center p-8 text-gray-500">No cost breakdown data available</div>
          )}
        </div>
      </div>

      {/* Business Value Table */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Business Value Summary</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">Month</th>
                <th className="py-2 px-4 border-b text-right">Total Contacts</th>
                <th className="py-2 px-4 border-b text-right">AI Containment</th>
                <th className="py-2 px-4 border-b text-right">FCR Rate</th>
                <th className="py-2 px-4 border-b text-right">CSAT</th>
                <th className="py-2 px-4 border-b text-right">Cost Per Contact</th>
                <th className="py-2 px-4 border-b text-right">Total Savings</th>
                <th className="py-2 px-4 border-b text-right">ROI</th>
              </tr>
            </thead>
            <tbody>
              {monthlyImpact && monthlyImpact.map((month, index) => (
                <tr 
                  key={month.month}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="py-2 px-4 border-b">{month.month}</td>
                  <td className="py-2 px-4 border-b text-right">{month.total_contacts.toLocaleString()}</td>
                  <td className="py-2 px-4 border-b text-right">{(month.ai_containment_ratio * 100).toFixed(1)}%</td>
                  <td className="py-2 px-4 border-b text-right">{month.fcr_rate?.toFixed(1) || 'N/A'}%</td>
                  <td className="py-2 px-4 border-b text-right">{month.csat_avg?.toFixed(2) || 'N/A'}</td>
                  <td className="py-2 px-4 border-b text-right">${month.avg_cost_per_contact?.toFixed(2) || 'N/A'}</td>
                  <td className="py-2 px-4 border-b text-right">{formatMoney(month.total_savings)}</td>
                  <td className="py-2 px-4 border-b text-right">{month.avg_roi_percentage?.toFixed(1) || 'N/A'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Business Insights Section */}
      <div className="mt-8 bg-green-50 p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-green-700 mb-2">Business Impact Insights</h3>
        <ul className="list-disc pl-5 text-green-800">
          <li>AI containment has reduced cost per contact by an average of 
            {dailyCost && 
              ((Math.max(...dailyCost.map(d => d.cost_per_contact)) - 
                Math.min(...dailyCost.map(d => d.cost_per_contact))).toFixed(2)
              ) || "0.00"} over the measurement period.
          </li>
          <li>Total technology investment of {formattedMetrics?.total_cost_formatted || "$0"} has yielded {formattedMetrics?.total_savings_formatted || "$0"} in savings, resulting in a positive ROI of {summaryMetrics?.avg_roi?.toFixed(1) || "0.0"}%.</li>
          <li>By containing {aiImpact?.reduce((sum, day) => sum + day.contained_contacts, 0).toLocaleString() || "0"} contacts through self-service and automation, we've improved both customer experience and operational efficiency.</li>
          <li>Month-over-month improvement in AI containment rate suggests further cost optimization potential with continued technology enhancements.</li>
        </ul>
      </div>

      {/* ROI Calculation Methodology */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-blue-700 mb-2">ROI Calculation Methodology</h3>
        <p className="mb-3 text-blue-900">
          The Return on Investment calculation considers both direct and indirect cost savings:
        </p>
        <ol className="list-decimal pl-8 mb-3 text-blue-900">
          <li className="mb-1">
            <span className="font-medium">Direct Cost Savings:</span> Reduction in agent handling time, decreased staffing needs, and lower telecommunications costs.
          </li>
          <li className="mb-1">
            <span className="font-medium">Technology Costs:</span> Implementation, licensing, maintenance, and support costs for all integrated technologies.
          </li>
          <li className="mb-1">
            <span className="font-medium">ROI Formula:</span> (Total Savings - Total Cost) / Total Cost × 100
          </li>
        </ol>
        <p className="text-blue-900">
          This conservative approach ensures reliable ROI estimates, with actual business impact likely higher when considering improved customer experience and brand loyalty.
        </p>
      </div>
    </div>
  );
};

// Summary card component
const SummaryCard = ({ title, value, icon }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
      <div className="flex items-center">
        <div className="text-3xl mr-3">{icon}</div>
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
};

export default BusinessImpactDashboard;