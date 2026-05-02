import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import './Analytics.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const COLORS = ['#FCD535','#3fe397','#00bcd4','#f97316','#a855f7','#ff5252','#10b981','#3b82f6','#ec4899','#6366f1','#84cc16','#14b8a6','#f43f5e','#6d28d9','#0ea5e9','#ffab40','#8b5cf6','#06b6d4','#e9c320'];

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const analyticsRes = await api.get('/analytics');
        setData(analyticsRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading analytics..." />;
  if (!data) return <div className="container py-5 text-center text-light">Failed to load analytics</div>;

  const { overview, categoryDistribution, productsOverTime } = data;

  const pieData = {
    labels: categoryDistribution?.map(c => c._id?.replace(/_/g, ' ')) || [],
    datasets: [{
      data: categoryDistribution?.map(c => c.count) || [],
      backgroundColor: COLORS,
      borderWidth: 0,
    }],
  };

  const timeData = {
    labels: productsOverTime?.map(d => d._id) || [],
    datasets: [{
      label: 'Products Added',
      data: productsOverTime?.map(d => d.count) || [],
      borderColor: '#FCD535',
      backgroundColor: 'rgba(252,213,53,0.08)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: 'rgba(255,255,255,0.6)', font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,0.4)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: 'rgba(255,255,255,0.4)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  };

  return (
    <div className="analytics-page">
      <div className="container">
        <h1 className="page-title">Analytics Dashboard</h1>

        {/* Overview Stats */}
        <div className="analytics-stats">
          {[
            { label: 'Total Products', value: overview.totalProducts?.toLocaleString() },
            { label: 'Categories', value: overview.totalCategories },
            { label: 'Total Users', value: overview.totalUsers },
            { label: 'Predictions', value: overview.totalPredictions },
          ].map((s, i) => (
            <div key={i} className="analytics-stat">
              <span className="analytics-stat-label">{s.label}</span>
              <span className="analytics-stat-value">{s.value || '0'}</span>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="row g-4">
          <div className="col-md-6">
            <div className="chart-card">
              <h3>Category Distribution</h3>
              <div className="chart-container pie-container">
                <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: 'rgba(255,255,255,0.6)', font: { size: 10 }, boxWidth: 12, padding: 8 } } } }} />
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="chart-card">
              <h3>Products Over Time</h3>
              <div className="chart-container"><Line data={timeData} options={chartOptions} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
