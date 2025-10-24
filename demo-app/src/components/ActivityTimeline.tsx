import React from 'react';
import { Card, Timeline, Tag, Typography, Empty, Space } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import type { ActivityLog } from '../hooks/useActivityTracker';
import type { ActivityReason } from '../lib';

const { Title, Text } = Typography;

interface ActivityTimelineProps {
  logs: ActivityLog[];
}

const getReasonColor = (reason: ActivityReason): string => {
  const colorMap: Partial<Record<ActivityReason, string>> = {
    mouse_activity: 'blue',
    keyboard_activity: 'purple',
    touch_activity: 'cyan',
    scroll_activity: 'geekblue',
    window_focus: 'green',
    window_blur: 'orange',
    page_visible: 'green',
    page_hidden: 'orange',
    network_online: 'green',
    network_offline: 'red',
    inactivity_timeout: 'red',
    tab_activated: 'green',
    tab_deactivated: 'orange',
    initialization: 'default'
  };
  return colorMap[reason] || 'default';
};

const getReasonLabel = (reason: ActivityReason): string => {
  const labels: Record<ActivityReason, string> = {
    user_interaction: 'Kullanıcı Etkileşimi',
    mouse_activity: 'Fare',
    keyboard_activity: 'Klavye',
    touch_activity: 'Dokunma',
    scroll_activity: 'Scroll',
    window_focus: 'Pencere Odak',
    window_blur: 'Pencere Blur',
    window_visible: 'Pencere Görünür',
    window_hidden: 'Pencere Gizli',
    page_visible: 'Sayfa Görünür',
    page_hidden: 'Sayfa Gizli',
    screen_lock: 'Ekran Kilidi',
    screen_unlock: 'Ekran Açıldı',
    system_idle: 'Sistem Boşta',
    system_active: 'Sistem Aktif',
    network_offline: 'Ağ Offline',
    network_online: 'Ağ Online',
    inactivity_timeout: 'Hareketsizlik',
    tab_activated: 'Tab Aktif',
    tab_deactivated: 'Tab Pasif',
    initialization: 'Başlatma'
  };
  return labels[reason] || reason;
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ logs }) => {
  return (
    <Card>
      <Title level={4}>
        <ClockCircleOutlined /> Aktivite Geçmişi
      </Title>
      {logs.length === 0 ? (
        <Empty description="Henüz aktivite kaydı yok" />
      ) : (
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <Timeline>
            {logs.map((log) => (
              <Timeline.Item
                key={log.id}
                color={log.event.status === 'ACTIVE' ? 'green' : 'red'}
              >
                <Space direction="vertical" size="small">
                  <Space size="small">
                    <Tag color={log.event.status === 'ACTIVE' ? 'success' : 'error'}>
                      {log.event.status}
                    </Tag>
                    <Tag color={getReasonColor(log.event.reason)}>
                      {getReasonLabel(log.event.reason)}
                    </Tag>
                    {!log.event.isCurrentTabActive && (
                      <Tag color="orange">Pasif Tab</Tag>
                    )}
                  </Space>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {log.timestamp.toLocaleTimeString('tr-TR')}
                  </Text>
                  {log.event.timeSinceLastActivity !== undefined && (
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      Son aktiviteden {Math.round(log.event.timeSinceLastActivity / 1000)}s sonra
                    </Text>
                  )}
                </Space>
              </Timeline.Item>
            ))}
          </Timeline>
        </div>
      )}
    </Card>
  );
};
