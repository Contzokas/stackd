"use client";
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsDashboard({ boardId, onClose }) {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (!boardId) return;

    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/analytics/${boardId}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Analytics API error:', response.status, errorData);
          const errorMsg = errorData.details 
            ? `${errorData.error}: ${errorData.details}` 
            : errorData.error || `Failed to fetch analytics (${response.status})`;
          throw new Error(errorMsg);
        }

        const data = await response.json();
        console.log('Analytics data received:', data);
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [boardId]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-white text-lg">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    const isSchemaError = error.includes('schema not initialized') || error.includes('completed_at');
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 border border-gray-700">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              {isSchemaError ? '⚠️ Analytics Not Set Up' : 'Error Loading Analytics'}
            </h2>
            <p className="text-gray-300 mb-6">{error}</p>
            
            {isSchemaError && (
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-blue-400 font-semibold mb-2">📋 Setup Required:</h3>
                <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
                  <li>Open your <strong>Supabase SQL Editor</strong></li>
                  <li>Run the SQL from <code className="bg-gray-900 px-2 py-1 rounded">analytics-schema.sql</code></li>
                  <li>Verify the tables were created successfully</li>
                  <li>Refresh this page and try again</li>
                </ol>
                <p className="text-gray-400 text-xs mt-3">
                  See <strong>ANALYTICS_SETUP.md</strong> for detailed instructions
                </p>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { overallStats, completedPerWeek, cardsByColumn, avgTimePerColumn, userProductivity } = analytics;

  return (
    <div 
      className="fixed top-0 left-0 right-0 bottom-0 bg-gray-900 z-[9999] flex flex-col animate-fadeIn"
      style={{ 
        width: '100vw', 
        height: '100vh',
        position: 'fixed',
        margin: 0,
        padding: 0
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 p-6 flex items-center justify-between shadow-lg shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            📊 Board Analytics
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Data-driven insights into your workflow
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full w-12 h-12 flex items-center justify-center transition-all hover:rotate-90 duration-200 text-2xl"
          title="Close (Esc)"
        >
          ✕
        </button>
      </div>

      {/* Content - Scrollable Fullscreen */}
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8" style={{ scrollbarWidth: 'thin' }}>
        {/* Container for max-width control */}
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Overall Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <StatCard
              title="Total Cards"
              value={overallStats.totalCards}
              icon="📋"
              color="blue"
            />
            <StatCard
              title="Completed"
              value={overallStats.completedCount}
              subtitle={`${overallStats.completionRate}% completion rate`}
              icon="✅"
              color="green"
            />
            <StatCard
              title="In Progress"
              value={overallStats.inProgressCount}
              icon="🔄"
              color="yellow"
            />
            <StatCard
              title="Overdue"
              value={overallStats.overdueCount}
              subtitle={overallStats.avgDaysOverdue > 0 ? `${overallStats.avgDaysOverdue} days avg` : 'All on track!'}
              icon="⚠️"
              color="red"
            />
            <StatCard
              title="On-Time Rate"
              value={`${overallStats.onTimeRate}%`}
              subtitle={overallStats.completedLateCount > 0 ? `${overallStats.completedLateCount} late` : 'Perfect!'}
              icon="🎯"
              color="teal"
            />
            <StatCard
              title="Avg Completion"
              value={`${overallStats.avgCompletionDays} days`}
              subtitle={overallStats.avgDaysLate > 0 ? `+${overallStats.avgDaysLate}d when late` : ''}
              icon="⏱️"
              color="purple"
            />
          </div>

          {/* Tasks Completed Per Week */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              📈 Tasks Completed Per Week
            </h3>
            {completedPerWeek && completedPerWeek.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={completedPerWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="weekLabel"
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af' }}
                  />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#9ca3af' }} />
                  <Bar dataKey="count" name="Tasks Completed" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-8">No completed tasks yet</p>
            )}
          </div>

          {/* Bottlenecks by Column */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              🚦 Bottlenecks by Column
            </h3>
            {cardsByColumn && cardsByColumn.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={cardsByColumn}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="columnTitle"
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend wrapperStyle={{ color: '#9ca3af' }} />
                    <Bar dataKey="cardCount" name="Number of Cards" fill="#10b981" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="avgAgeDays" name="Avg Age (days)" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Bottleneck Alerts */}
                <div className="mt-4 space-y-2">
                  {cardsByColumn.filter(col => col.isBottleneck).length > 0 ? (
                    <>
                      <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                        ⚠️ Detected Bottlenecks:
                      </h4>
                      {cardsByColumn
                        .filter(col => col.isBottleneck)
                        .map(col => (
                          <div
                            key={col.columnId}
                            className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-sm"
                          >
                            <span className="text-white font-medium">{col.columnTitle}</span>
                            <span className="text-gray-400 ml-2">
                              has {col.cardCount} cards with average age of {col.avgAgeDays} days
                            </span>
                          </div>
                        ))}
                    </>
                  ) : (
                    <p className="text-green-400 text-sm">✨ No bottlenecks detected!</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-center py-8">No data available</p>
            )}
          </div>

          {/* Average Time in Progress */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              ⏳ Average Time per Column
            </h3>
            {avgTimePerColumn && avgTimePerColumn.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={avgTimePerColumn}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="columnTitle"
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} label={{ value: 'Days', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend wrapperStyle={{ color: '#9ca3af' }} />
                    <Line
                      type="monotone"
                      dataKey="avgDays"
                      name="Average Days"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Summary Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 px-3 text-gray-400">Column</th>
                        <th className="text-right py-2 px-3 text-gray-400">Avg Hours</th>
                        <th className="text-right py-2 px-3 text-gray-400">Avg Days</th>
                        <th className="text-right py-2 px-3 text-gray-400">Cards Tracked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {avgTimePerColumn.map(col => (
                        <tr key={col.columnId} className="border-b border-gray-800">
                          <td className="py-2 px-3 text-white">{col.columnTitle}</td>
                          <td className="py-2 px-3 text-right text-gray-300">{col.avgHours}h</td>
                          <td className="py-2 px-3 text-right text-gray-300">{col.avgDays}d</td>
                          <td className="py-2 px-3 text-right text-gray-400">{col.cardCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-2">No time tracking data available yet</p>
                <p className="text-gray-500 text-sm">
                  Move cards between columns to start tracking time metrics
                </p>
              </div>
            )}
          </div>

          {/* User Productivity (Shared Boards) */}
          {userProductivity && userProductivity.length > 1 && (
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                👥 Productivity by User
              </h3>
              <div className="space-y-3">
                {userProductivity.map((user, index) => (
                  <div
                    key={user.userId}
                    className="bg-gray-800 rounded-lg p-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank Badge */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-500 text-gray-900' :
                        index === 1 ? 'bg-gray-400 text-gray-900' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      
                      {/* User Avatar & Name */}
                      <div className="flex items-center gap-3">
                        {user.userImageUrl ? (
                          <img
                            src={user.userImageUrl}
                            alt={user.userName}
                            className="w-10 h-10 rounded-full border-2 border-gray-600"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                            {user.userName?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{user.userFullName || user.userName}</p>
                          {user.userFullName && (
                            <p className="text-gray-400 text-sm">@{user.userName}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-400">{user.cardsCreated}</p>
                        <p className="text-xs text-gray-400">Created</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">{user.cardsCompleted}</p>
                        <p className="text-xs text-gray-400">Completed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-400">{user.cardsInProgress}</p>
                        <p className="text-xs text-gray-400">In Progress</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-400">{user.cardMovements}</p>
                        <p className="text-xs text-gray-400">Moves</p>
                      </div>
                      <div className="text-center min-w-[60px]">
                        <div className="relative w-16 h-16">
                          {/* Circular progress */}
                          <svg className="transform -rotate-90 w-16 h-16">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              className="text-gray-700"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 28}`}
                              strokeDashoffset={`${2 * Math.PI * 28 * (1 - user.completionRate / 100)}`}
                              className={
                                user.completionRate >= 75 ? 'text-green-500' :
                                user.completionRate >= 50 ? 'text-yellow-500' :
                                user.completionRate >= 25 ? 'text-orange-500' :
                                'text-red-500'
                              }
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{user.completionRate}%</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Completion</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {userProductivity.length === 1 && (
                <p className="text-gray-400 text-center text-sm mt-4">
                  💡 Share this board with others to see team productivity metrics
                </p>
              )}
            </div>
          )}

          {/* Last Updated */}
          <p className="text-center text-gray-500 text-sm pb-4">
            Generated at {new Date(analytics.generatedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
    );
  }

// Stat Card Component
function StatCard({ title, value, subtitle, icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-900/20 border-blue-700',
    green: 'bg-green-900/20 border-green-700',
    yellow: 'bg-yellow-900/20 border-yellow-700',
    purple: 'bg-purple-900/20 border-purple-700',
    red: 'bg-red-900/20 border-red-700',
    teal: 'bg-teal-900/20 border-teal-700'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-white text-3xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
