import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter, 
  ResponsiveContainer, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ZAxis
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
  performance: {
    'Top Performer': '#22c55e',
    'Exceeds Expectations': '#16a34a',
    'Meets Expectations': '#eab308',
    'Needs Improvement': '#f97316',
    'Performance Concern': '#ef4444'
  },
  metrics: {
    'adherence': '#3b82f6',
    'quality': '#8b5cf6',
    'csat': '#ec4899',
    'fcr': '#14b8a6'
  }
};

// Main dashboard component
const AgentPerformanceDashboard = () => {
  // State for selected agent (for detailed view)
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  // Fetch dashboard data
  const { data: agentSummary, loading: agentLoading, error: agentError } = 
    useDataFetching('/data/agent_summary.json');
  const { data: teamSummary, loading: teamLoading, error: teamError } = 
    useDataFetching('/data/team_summary.json');
  const { data: dailyMetrics, loading: metricsLoading, error: metricsError } = 
    useDataFetching('/data/daily_metrics.json');
  const { data: perfDistribution, loading: perfLoading, error: perfError } = 
    useDataFetching('/data/performance_distribution.json');
  const { data: summaryMetrics, loading: summaryLoading, error: summaryError } = 
    useDataFetching('/data/summary_metrics.json');

  // Loading state
  if (agentLoading || teamLoading || metricsLoading || perfLoading || summaryLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg font-medium text-gray-600">Loading agent performance data...</div>
      </div>
    );
  }

  // Error state
  const errorMessage = agentError || teamError || metricsError || perfError || summaryError;
  if (errorMessage) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Error Loading Dashboard</h3>
        <p>{errorMessage}</p>
      </div>
    );
  }

  // Handler for agent selection
  const handleAgentSelect = (agent) => {
    setSelectedAgent(agent.agent_id === selectedAgent ? null : agent.agent_id);
  };

  // Sort agents by performance score
  const sortedAgents = agentSummary ? 
    [...agentSummary].sort((a, b) => b.performance_score - a.performance_score) : 
    [];

  // Get agent detail
  const agentDetail = agentSummary?.find(a => a.agent_id === selectedAgent);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Agent Performance Dashboard</h2>
      
      {/* Summary metrics */}
      {summaryMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard 
            title="Agents"
            value={summaryMetrics.agent_count || "N/A"}
            icon="👥"
          />
          <SummaryCard 
            title="Avg Adherence"
            value={`${summaryMetrics.overall_adherence?.toFixed(1) || "N/A"}%`}
            icon="📅"
          />
          <SummaryCard 
            title="Avg Quality"
            value={`${summaryMetrics.overall_quality?.toFixed(1) || "N/A"}/100`}
            icon="🎯"
          />
          <SummaryCard 
            title="Avg CSAT"
            value={`${summaryMetrics.overall_csat?.toFixed(2) || "N/A"}/5`}
            icon="⭐"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Distribution Chart */}
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Performance Distribution</h3>
          {perfDistribution ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={perfDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tier" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} agents`, 'Count']}
                />
                <Bar dataKey="agent_count" name="Agents">
                  {perfDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colorConfig.performance[entry.tier] || '#64748b'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center p-8 text-gray-500">No performance data available</div>
          )}
        </div>

        {/* Metrics Trend Chart */}
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Performance Trends</h3>
          {dailyMetrics ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyMetrics}>
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
                    if (name === 'contacts') return [`${value.toLocaleString()} contacts`, 'Volume'];
                    return [`${value.toFixed(1)}${name === 'fcr' ? '%' : ''}`, name.toUpperCase()];
                  }}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="adherence" 
                  name="adherence" 
                  stroke={colorConfig.metrics.adherence} 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="quality" 
                  name="quality" 
                  stroke={colorConfig.metrics.quality} 
                />
                <Line 
                  type="monotone" 
                  dataKey="csat" 
                  name="csat" 
                  stroke={colorConfig.metrics.csat} 
                />
                <Line 
                  type="monotone" 
                  dataKey="fcr" 
                  name="fcr" 
                  stroke={colorConfig.metrics.fcr} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center p-8 text-gray-500">No trend data available</div>
          )}
        </div>

        {/* Team Performance Chart */}
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Team Performance</h3>
          {teamSummary ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamSummary} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="team_id" type="category" />
                <Tooltip 
                  formatter={(value, name) => [`${value.toFixed(1)}%`, name]}
                />
                <Legend />
                <Bar 
                  dataKey="avg_adherence" 
                  name="Adherence" 
                  fill={colorConfig.metrics.adherence} 
                  stackId="a" 
                />
                <Bar 
                  dataKey="avg_quality" 
                  name="Quality" 
                  fill={colorConfig.metrics.quality} 
                  stackId="b" 
                />
                <Bar 
                  dataKey="avg_csat" 
                  name="CSAT (x20)" 
                  fill={colorConfig.metrics.csat} 
                  stackId="c" 
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center p-8 text-gray-500">No team data available</div>
          )}
        </div>

        {/* Agent Scatter Plot */}
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Agent Performance Matrix</h3>
          {agentSummary ? (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid />
                <XAxis 
                  type="number" 
                  dataKey="avg_quality" 
                  name="Quality Score" 
                  domain={[60, 100]} 
                  label={{ value: 'Quality Score', position: 'bottom' }} 
                />
                <YAxis 
                  type="number" 
                  dataKey="avg_csat" 
                  name="CSAT" 
                  domain={[1, 5]} 
                  label={{ value: 'CSAT', angle: -90, position: 'left' }} 
                />
                <ZAxis 
                  type="number" 
                  dataKey="total_contacts" 
                  range={[50, 400]} 
                  name="Volume" 
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => {
                    if (name === 'Quality Score') return [`${value.toFixed(1)}/100`, name];
                    if (name === 'CSAT') return [`${value.toFixed(2)}/5`, name];
                    if (name === 'Volume') return [`${value.toLocaleString()} contacts`, name];
                    return [value, name];
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const agent = agentSummary.find(a => 
                        a.avg_quality === payload[0].value && 
                        a.avg_csat === payload[1].value
                      );
                      
                      return (
                        <div className="bg-white p-2 border border-gray-200 shadow-md">
                          <p className="font-bold">{agent?.agent_id}</p>
                          <p>Quality: {agent?.avg_quality.toFixed(1)}/100</p>
                          <p>CSAT: {agent?.avg_csat.toFixed(2)}/5</p>
                          <p>Contacts: {agent?.total_contacts.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Scatter 
                  name="Agents" 
                  data={agentSummary} 
                  fill="#8884d8"
                  onClick={handleAgentSelect}
                >
                  {agentSummary.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colorConfig.performance[entry.performance_tier] || '#64748b'} 
                      stroke={entry.agent_id === selectedAgent ? '#000' : 'none'}
                      strokeWidth={2}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center p-8 text-gray-500">No agent data available</div>
          )}
        </div>
      </div>

      {/* Agent Leaderboard */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Top Performers</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">Agent ID</th>
                <th className="py-2 px-4 border-b text-left">Team</th>
                <th className="py-2 px-4 border-b text-right">Adherence</th>
                <th className="py-2 px-4 border-b text-right">Quality</th>
                <th className="py-2 px-4 border-b text-right">CSAT</th>
                <th className="py-2 px-4 border-b text-right">FCR</th>
                <th className="py-2 px-4 border-b text-right">Contacts</th>
                <th className="py-2 px-4 border-b text-center">Performance</th>
              </tr>
            </thead>
            <tbody>
              {sortedAgents.slice(0, 5).map((agent, index) => (
                <tr 
                  key={agent.agent_id}
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${agent.agent_id === selectedAgent ? 'bg-blue-50' : ''}`}
                  onClick={() => handleAgentSelect(agent)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="py-2 px-4 border-b">{agent.agent_id}</td>
                  <td className="py-2 px-4 border-b">{agent.team_id}</td>
                  <td className="py-2 px-4 border-b text-right">{agent.avg_adherence.toFixed(1)}%</td>
                  <td className="py-2 px-4 border-b text-right">{agent.avg_quality.toFixed(1)}</td>
                  <td className="py-2 px-4 border-b text-right">{agent.avg_csat.toFixed(2)}</td>
                  <td className="py-2 px-4 border-b text-right">{(agent.avg_fcr * 100).toFixed(1)}%</td>
                  <td className="py-2 px-4 border-b text-right">{agent.total_contacts.toLocaleString()}</td>
                  <td className="py-2 px-4 border-b">
                    <div className="flex justify-center">
                      <span 
                        className="px-2 py-1 text-xs font-semibold rounded-full"
                        style={{ 
                          backgroundColor: colorConfig.performance[agent.performance_tier] || '#64748b',
                          color: 'white'
                        }}
                      >
                        {agent.performance_tier}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent Detail View (if selected) */}
      {agentDetail && (
        <div className="mt-8 bg-blue-50 p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-blue-700">Agent Detail: {agentDetail.agent_id}</h3>
            <button
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => setSelectedAgent(null)}
            >
              Close
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-3 rounded shadow">
              <div className="text-sm text-gray-500">CSAT</div>
              <div className="text-xl font-bold">{agentDetail.avg_csat.toFixed(2)}/5</div>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <div className="text-sm text-gray-500">FCR Rate</div>
              <div className="text-xl font-bold">{(agentDetail.avg_fcr * 100).toFixed(1)}%</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded shadow">
            <h4 className="font-medium text-gray-700 mb-2">Performance Profile</h4>
            <p className="mb-2">
              <span className="font-medium">Team:</span> {agentDetail.team_id}
            </p>
            <p className="mb-2">
              <span className="font-medium">Performance Tier:</span> {agentDetail.performance_tier}
            </p>
            <p className="mb-2">
              <span className="font-medium">Total Contacts:</span> {agentDetail.total_contacts.toLocaleString()}
            </p>
            <p className="mb-2">
              <span className="font-medium">Avg Handle Time:</span> {agentDetail.avg_aht?.toFixed(1) || "N/A"} seconds
            </p>
            <p>
              <span className="font-medium">Work Days:</span> {agentDetail.work_days}
            </p>
          </div>
        </div>
      )}

      {/* Coaching Insights Section */}
      <div className="mt-8 bg-green-50 p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-green-700 mb-2">Coaching Insights</h3>
        <ul className="list-disc pl-5 text-green-800">
          <li>{perfDistribution?.find(p => p.tier === 'Top Performer')?.agent_count || 0} agents are in the "Top Performer" category, demonstrating best practices that can be shared with the team.</li>
          <li>{perfDistribution?.find(p => p.tier === 'Performance Concern' || p.tier === 'Needs Improvement')?.agent_count || 0} agents require additional coaching support to improve performance metrics.</li>
          <li>Quality scores have {dailyMetrics && dailyMetrics.length > 1 && dailyMetrics[dailyMetrics.length-1].quality > dailyMetrics[0].quality ? 'improved' : 'declined'} by {dailyMetrics && dailyMetrics.length > 1 ? Math.abs(dailyMetrics[dailyMetrics.length-1].quality - dailyMetrics[0].quality).toFixed(1) : 0} points over the measurement period.</li>
          <li>Team {teamSummary && teamSummary.length > 0 ? teamSummary.sort((a, b) => b.avg_quality - a.avg_quality)[0].team_id : ''} has the highest quality scores and may have effective practices to share.</li>
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

export default AgentPerformanceDashboard; text-gray-500">Adherence</div>
              <div className="text-xl font-bold">{agentDetail.avg_adherence.toFixed(1)}%</div>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <div className="text-sm text-gray-500">Quality</div>
              <div className="text-xl font-bold">{agentDetail.avg_quality.toFixed(1)}/100</div>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <div className="text-sm text-gray-500">CSAT</div>
              <div className="text-xl font-bold">{agentDetail.avg_csat.toFixed(2)}/5</div>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <div className="text-sm