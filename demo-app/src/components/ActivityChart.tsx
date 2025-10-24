import React, { useMemo } from 'react';
import { Card, Typography } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { ActivityLog } from '../hooks/useActivityTracker';

const { Title } = Typography;

interface ActivityChartProps {
  logs: ActivityLog[];
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ logs }) => {
  const timelineData = useMemo(() => {
    // Son 20 olayı al ve grafiğe dönüştür
    return logs
      .slice(0, 20)
      .reverse()
      .map((log, index) => ({
        index: index + 1,
        time: log.timestamp.toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        status: log.event.status === 'ACTIVE' ? 1 : 0,
        isTabActive: log.event.isCurrentTabActive ? 1 : 0
      }));
  }, [logs]);

  const reasonData = useMemo(() => {
    const reasonCounts: Record<string, number> = {};

    logs.forEach(log => {
      const reason = log.event.reason;
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    return Object.entries(reasonCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // En çok olan 8 nedeni göster
  }, [logs]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c'];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Title level={4}>Aktivite Zaman Çizelgesi</Title>
        {timelineData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 1]} ticks={[0, 1]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="status"
                stroke="#52c41a"
                name="Durum (1=Aktif, 0=Pasif)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="isTabActive"
                stroke="#1890ff"
                name="Tab (1=Aktif, 0=Pasif)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p>Henüz veri yok</p>
        )}
      </Card>

      <Card>
        <Title level={4}>Aktivite Nedenleri Dağılımı</Title>
        {reasonData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reasonData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {reasonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p>Henüz veri yok</p>
        )}
      </Card>
    </>
  );
};
