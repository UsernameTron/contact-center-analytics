import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, ResponsiveContainer, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
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
  channels: {
    'Voice': '#2563eb',
    'Chat': '#16a34a',
    'Email': '#ca8a04',
    'Self-Service': '#9333ea'
  },
  waitTimes: {
    '0-30s': '#22c55e',
    '31-60s': '#eab308',
    '61-180s': '#ef4444',
    '>180s': '#dc2626'
  },
  sentiment: {
    'Positive': '#22c55e',
    'Neutral': '#64748b',
    'Negative': '#ef4444'
  }
};

// Main dashboard component
const OperationalDashboard = () => {
  // Fetch dashboard data
  const { data: channelData, loading: channelLoading, error: channelError } = 
    useDataFetching('/data/channel_volume.json');
  const { data: hourlyData, loading: hourlyLoading, error: hourlyError } = 
    useDataFetching('/data/hourly_volume.json');
  const { data: waitTimeData, loading: waitLoading, error: waitError } = 
    useDataFetching('/data/wait_time_distribution.json');
  const { data: sentimentData, loading: sentimentLoading, error: sentimentError } = 
    useDataFetching('/data/sentiment_distribution.json');
  const { data: summaryData, loading: summaryLoading, error: summaryError } = 
    useDataFetching('/data/summary_metrics.json');

  // Loading state
  if (channelLoading || hourlyLoading || waitLoading || sentimentLoading || summaryLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg font-medium text-gray-600">Loading dashboard data...</div>
      </div>
    );
  }

  // Error state
  const errorMessage = channelError || hourlyError || waitError || sentimentError || summaryError;
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact Center Operational Dashboard</h2>
      
      {/* Summary metrics */}
      {summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard 
            title="Total Contacts"
            value={summaryData.total_contacts?.toLocaleString() || "N/A"}
            icon="📞"
          />
          <SummaryCard 
            title="Avg Handle Time"
            value={`${summaryData.avg_handle_time?.toFixed(1) || "N/A"} sec`}
            icon="⏱️"
          />
          <SummaryCard 
            title="Avg Wait Time"
            value={`${summaryData.avg_wait_time?.toFixed(1) || "N/A"} sec`}
            icon="⏳"
          />
          <SummaryCard 
            title="CSAT Score"
            value={`${summaryData.avg_csat?.toFixed(2) || "N/A"} / 5`}
            icon="⭐"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Distribution Chart */}
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Channel Distribution</h3>
          {channelData ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="contact_count"
                  nameKey="channel"
                  label={({ channel, percentage }) => `${channel}: ${percentage}%`}
                >
                  {channelData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colorConfig.channels[entry.channel] || `#${Math.floor(Math.random()*16777215).toString(16)}`} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value.toLocaleString()} contacts (${props.payload.percentage}%)`, 
                    name
                  ]} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center p-8 text-gray-500">No channel data available</div>
          )}
        </div>

        {/* Hourly Volume Chart */}
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Contact Volume by Hour</h3>
          {hourlyData ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour_label" 
                  tickFormatter={(hour) => hour} 
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value.toLocaleString()} contacts`, 'Volume']}
                  labelFormatter={(hour) => `Hour: ${hour}`}
                />
                <Bar 
                  dataKey="contact_count" 
                  name="Contacts" 
                  fill="#3b82f6" 
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center p-8 text-gray-500">No hourly data available</div>
          )}
        </div>

        {/* Wait Time Distribution */}
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Wait Time Distribution</h3>
          {waitTimeData ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={waitTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="wait_time_category" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value.toLocaleString()} contacts`, 'Volume']}
                />
                <Bar dataKey="contact_count" name="Contacts">
                  {waitTimeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colorConfig.waitTimes[entry.wait_time_category] || '#64748b'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center p-8 text-gray-500">No wait time data available</div>
          )}
        </div>

        {/* Sentiment Distribution */}
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Sentiment Distribution</h3>
          {sentimentData ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="contact_count"
                  nameKey="sentiment_category"
                  label={({ sentiment_category, percentage }) => `${sentiment_category}: ${percentage}%`}
                >
                  {sentimentData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colorConfig.sentiment[entry.sentiment_category] || '#64748b'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value.toLocaleString()} contacts (${props.payload.percentage}%)`, 
                    name
                  ]} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center p-8 text-gray-500">No sentiment data available</div>
          )}
        </div>
      </div>

      {/* Key Insights Section */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-blue-700 mb-2">Key Insights</h3>
        <ul className="list-disc pl-5 text-blue-800">
          <li>Voice remains the dominant channel at {channelData?.find(c => c.channel === 'Voice')?.percentage || 0}% of contacts, though digital channels continue to grow.</li>
          <li>Peak volume occurs between 10am-2pm, with Monday showing the highest overall volume.</li>
          <li>{waitTimeData?.find(w => w.wait_time_category === '0-30s')?.percentage || 0}% of contacts are answered within 30 seconds, exceeding our target SLA.</li>
          <li>{sentimentData?.find(s => s.sentiment_category === 'Positive')?.percentage || 0}% of interactions have positive sentiment, indicating strong customer satisfaction.</li>
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

export default OperationalDashboard;
