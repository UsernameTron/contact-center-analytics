import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  ResponsiveContainer, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, Area, AreaChart, ComposedChart
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
  technologies: {
    'TECH-001': '#3b82f6', // NICE CXone
    'TECH-002': '#8b5cf6', // IEX WFM
    'TECH-003': '#ec4899', // Salesforce
    'TECH-004': '#14b8a6', // AI Chatbot
    'TECH-005': '#f97316', // Voice Auth
    'TECH-006': '#84cc16', // SMS
    'TECH-007': '#06b6d4'  // Email Automation
  },
  integrations: {
    'API': '#3b82f6',
    'Webhook': '#8b5cf6',
    'Custom Script': '#ec4899',
    'Database': '#14b8a6',
    'File Transfer': '#f97316'
  },
  performance: {
    'Excellent': '#22c55e',
    'Good': '#16a34a',
    'Satisfactory': '#eab308',
    'Needs Improvement': '#f97316',
    'Critical Attention Required': '#ef4444'
  }
};

// Format large numbers
const formatNumber = (num) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// Main dashboard component
const TechnologyDashboard = () => {
  // State for selected technology (for detailed view)
  const [selectedTech, setSelectedTech] = useState(null);
  
  // Fetch dashboard data
  const { data: techSummary, loading: techLoading, error: techError } = 
    useDataFetching('/data/technology_summary.json');
  const { data: integrationSummary, loading: intLoading, error: intError } = 
    useDataFetching('/data/integration_summary.json');
  const { data: dailyMetrics, loading: metricsLoading, error: metricsError } = 
    useDataFetching('/data/daily_metrics.json');
  const { data: aiSummary, loading: aiLoading, error: aiError } = 
    useDataFetching('/data/ai_summary.json');
  const { data: summaryMetrics, loading: summaryLoading, error: summaryError } = 
    useDataFetching('/data/summary_metrics.json');

  // Loading state
  if (techLoading || intLoading || metricsLoading || summaryLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg font-medium text-gray-600">Loading technology data...</div>
      </div>
    );
  }

  // Error state
  const errorMessage = techError || intError || metricsError || summaryError;
  if (errorMessage) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Error Loading Dashboard</h3>
        <p>{errorMessage}</p>
      </div>
    );
  }

  // Handler for technology selection
  const handleTechSelect = (tech) => {
    if (tech && tech.technology_id) {
      setSelectedTech(tech.technology_id === selectedTech ? null : tech.technology_id);
    }
  };

  // Get selected technology detail
  const techDetail = techSummary?.find(t => t.technology_id === selectedTech);

  // Filter daily metrics for selected technology
  const filteredDailyMetrics = selectedTech && dailyMetrics ? 
    dailyMetrics.filter(m => m.technology_id === selectedTech) : 
    dailyMetrics;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Technology Impact Dashboard</h2>
      
      {/* Summary metrics */}
      {summaryMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard 
            title="Success Rate"
            value={`${summaryMetrics.overall_success_rate?.toFixed(1) || "N/A"}%`}
            icon="✅"
          />
          <SummaryCard 
            title="Response Time"
            value={`${summaryMetrics.overall_response_time?.toFixed(1) || "N/A"} ms`}
            icon="⚡"
          />
          <SummaryCard 
            title="Cost Savings"
            value={`$${formatNumber(summaryMetrics.total_cost_savings || 0)}`}
            icon="💰"
          />
          <SummaryCard 
            title="ROI"
            value={`${summaryMetrics.overall_roi?.toFixed(1) || "N/A"}%`}
            icon="📈"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technology Success Rate Chart */}
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Technology Success Rates</h3>
          {techSummary ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={techSummary} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis 
                  dataKey="technology_name" 
                  type="category" 
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value, name) => [`${value.toFixed(2)}%`, name]}
                />
                <Bar 
                  dataKey="success_rate" 
                  name="Success Rate" 
                  onClick={handleTechSelect}
                >
                  {techSummary.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colorConfig.technologies[entry.technology_id] || '#64748b'} 
                      stroke={entry.technology_id === selectedTech ? '#000' : 'none'}
                      strokeWidth={2}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center p-8 text-gray-500">No technology data available</div>
          )}
        </div>

        {/* Integration Type Performance */}
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Integration Performance</h3>
          {integrationSummary ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={integrationSummary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="integration_type" />
                <YAxis yAxisId="left" orientation="left" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" domain={[0, Math.max(...integrationSummary.map(i => i.avg_response_time || 0)) * 1.2]} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'Success Rate') return [`${value.toFixed(2)}%`, name];
                    if (name === 'Response Time') return [`${value.toFixed(1)} ms`, name];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="success_rate" 
                  name="Success Rate" 
                  fill="#3b82f6" 
                >
                  {integrationSummary.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colorConfig.integrations[entry.integration_type] || '#64748b'} 
                    />
                  ))}
                </Bar>
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="avg_response_time" 
                  name="Response Time" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center p-8 text-gray-500">No integration data available</div>
          )}
        </div>

        {/* Daily Success Rate Trend */}
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            {selectedTech ? `${techDetail?.technology_name || selectedTech} Success Rate Trend` : 'Success Rate Trends'}
          </h3>
          {filteredDailyMetrics ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={filteredDailyMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth()+1}/${d.getDate()}`;
                  }}
                />
                <YAxis 
                  domain={[
                    dataMin => Math.max(0, dataMin - 5),
                    dataMax => Math.min(100, dataMax + 5)
                  ]} 
                />
                <Tooltip 
                  formatter={(value, name, props) => {
                    if (name === 'success_rate') return [`${value.toFixed(2)}%`, 'Success Rate'];
                    if (name === 'error_rate') return [`${value.toFixed(2)}%`, 'Error Rate'];
                    return [value, name];
                  }}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="success_rate" 
                  name="success_rate" 
                  stroke="#22c55e" 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="error_rate" 
                  name="error_rate" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center p-8 text-gray-500">No trend data available</div>
          )}
        </div>

        {/* Cost Savings / ROI Chart */}
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            {selectedTech ? `${techDetail?.technology_name || selectedTech} Cost Impact` : 'Technology Cost Impact'}
          </h3>
          {filteredDailyMetrics ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={filteredDailyMetrics}>
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
                  formatter={(value, name, props) => {
                    if (name === 'cost_savings') return [`$${value.toFixed(2)}`, 'Cost Savings'];
                    return [value, name];
                  }}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="cost_savings" 
                  name="cost_savings" 
                  fill="#3b82f6" 
                  stroke="#1d4ed8" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center p-8 text-gray-500">No cost impact data available</div>
          )}
        </div>
      </div>

      {/* AI Impact Section (if data available) */}
      {aiSummary && aiSummary.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4">AI Technology Impact</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Containment Chart */}
            <div className="bg-gray-50 p-4 rounded-lg shadow">
              <h4 className="text-md font-medium text-gray-700 mb-3">AI Containment Rate</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={aiSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="technology_name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value, name) => [`${value.toFixed(2)}%`, name]}
                  />
                  <Bar 
                    dataKey="avg_containment" 
                    name="Containment Rate" 
                    fill="#14b8a6" 
                  />
                  <Bar 
                    dataKey="avg_deflection" 
                    name="Deflection Rate" 
                    fill="#0d9488" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* AI Cost Savings Chart */}
            <div className="bg-gray-50 p-4 rounded-lg shadow">
              <h4 className="text-md font-medium text-gray-700 mb-3">AI Cost Savings</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={aiSummary}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total_cost_savings"
                    nameKey="technology_name"
                    label={({ technology_name, percent }) => `${technology_name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {aiSummary.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={colorConfig.technologies[entry.technology_id] || '#64748b'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `$${value.toFixed(2)}`, 
                      name
                    ]} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Technology Detail View (if selected) */}
      {techDetail && (
        <div className="mt-8 bg-blue-50 p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-blue-700">Technology Detail: {techDetail.technology_name}</h3>
            <button
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => setSelectedTech(null)}
            >
              Close
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-3 rounded shadow">
              <div className="text-sm text-gray-500">Success Rate</div>
              <div className="text-xl font-bold">{techDetail.success_rate.toFixed(2)}%</div>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <div className="text-sm text-gray-500">Response Time</div>
              <div className="text-xl font-bold">{techDetail.avg_response_time.toFixed(1)} ms</div>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <div className="text-sm text-gray-500">Error Rate</div>
              <div className="text-xl font-bold">{techDetail.avg_error_rate.toFixed(2)}%</div>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <div className="text-sm text-gray-500">Cost Savings</div>
              <div className="text-xl font-bold">${formatNumber(techDetail.total_cost_savings)}</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded shadow">
            <h4 className="font-medium text-gray-700 mb-2">Technology Details</h4>
            <p className="mb-2">
              <span className="font-medium">Category:</span> {techDetail.technology_category}
            </p>
            <p className="mb-2">
              <span className="font-medium">Total Transactions:</span> {techDetail.total_transactions.toLocaleString()}
            </p>
            <p className="mb-2">
              <span className="font-medium">Successful Transactions:</span> {techDetail.successful_transactions.toLocaleString()} ({(techDetail.successful_transactions / techDetail.total_transactions * 100).toFixed(1)}%)
            </p>
            <p>
              <span className="font-medium">Failed Transactions:</span> {techDetail.failed_transactions.toLocaleString()} ({(techDetail.failed_transactions / techDetail.total_transactions * 100).toFixed(1)}%)
            </p>
          </div>
        </div>
      )}

      {/* Technology Insights Section */}
      <div className="mt-8 bg-purple-50 p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-purple-700 mb-2">Technology Insights</h3>
        <ul className="list-disc pl-5 text-purple-800">
          <li>AI-powered technologies have saved approximately ${formatNumber(aiSummary?.reduce((sum, tech) => sum + tech.total_cost_savings, 0) || 0)} through contact deflection and self-service.</li>
          <li>System integration success rates have {dailyMetrics && dailyMetrics.length > 1 && dailyMetrics[dailyMetrics.length-1].success_rate > dailyMetrics[0].success_rate ? 'improved' : 'declined'} by {dailyMetrics && dailyMetrics.length > 1 ? Math.abs(dailyMetrics[dailyMetrics.length-1].success_rate - dailyMetrics[0].success_rate).toFixed(2) : 0}% over the measurement period.</li>
          <li>{integrationSummary?.sort((a, b) => a.avg_response_time - b.avg_response_time)[0]?.integration_type || 'API'} integrations show the fastest average response times at {integrationSummary?.sort((a, b) => a.avg_response_time - b.avg_response_time)[0]?.avg_response_time.toFixed(1) || 0} ms.</li>
          <li>{techSummary?.sort((a, b) => b.success_rate - a.success_rate)[0]?.technology_name || ''} has the highest overall reliability with a {techSummary?.sort((a, b) => b.success_rate - a.success_rate)[0]?.success_rate.toFixed(2) || 0}% success rate.</li>
        </ul>
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

export default TechnologyDashboard;