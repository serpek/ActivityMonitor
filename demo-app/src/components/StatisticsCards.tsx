import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import {
  ClockCircleOutlined,
  ThunderboltOutlined,
  MouseOutlined,
  KeyboardOutlined,
  MobileOutlined,
  VerticalAlignMiddleOutlined
} from '@ant-design/icons';
import type { ActivityStats } from '../hooks/useActivityTracker';

interface StatisticsCardsProps {
  stats: ActivityStats;
}

const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}s ${minutes % 60}dk`;
  } else if (minutes > 0) {
    return `${minutes}dk ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({ stats }) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Toplam Olay"
            value={stats.totalEvents}
            prefix={<ThunderboltOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Aktif Süre"
            value={formatTime(stats.activeTime)}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Hareketsiz Süre"
            value={formatTime(stats.inactiveTime)}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Fare Aktivitesi"
            value={stats.mouseActivityCount}
            prefix={<MouseOutlined />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Klavye Aktivitesi"
            value={stats.keyboardActivityCount}
            prefix={<KeyboardOutlined />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Dokunma Aktivitesi"
            value={stats.touchActivityCount}
            prefix={<MobileOutlined />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Scroll Aktivitesi"
            value={stats.scrollActivityCount}
            prefix={<VerticalAlignMiddleOutlined />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Son Değişiklik"
            value={stats.lastStatusChange ? stats.lastStatusChange.toLocaleTimeString('tr-TR') : '-'}
            valueStyle={{ fontSize: '16px' }}
          />
        </Card>
      </Col>
    </Row>
  );
};
