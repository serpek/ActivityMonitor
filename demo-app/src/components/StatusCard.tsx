import React from 'react';
import { Card, Tag, Typography, Space, Badge } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ActivityStatus, ActivityReason } from '../lib';

const { Title, Text } = Typography;

interface StatusCardProps {
  status: ActivityStatus;
  reason: ActivityReason;
  isTabActive: boolean;
  areListenersActive: boolean;
}

const getStatusColor = (status: ActivityStatus) => {
  return status === 'ACTIVE' ? 'success' : 'error';
};

const getReasonLabel = (reason: ActivityReason): string => {
  const labels: Record<ActivityReason, string> = {
    user_interaction: 'Kullanıcı Etkileşimi',
    mouse_activity: 'Fare Hareketi',
    keyboard_activity: 'Klavye Aktivitesi',
    touch_activity: 'Dokunma',
    scroll_activity: 'Scroll',
    window_focus: 'Pencere Odak Kazandı',
    window_blur: 'Pencere Odak Kaybetti',
    window_visible: 'Pencere Görünür',
    window_hidden: 'Pencere Gizli',
    page_visible: 'Sayfa Görünür',
    page_hidden: 'Sayfa Gizli',
    screen_lock: 'Ekran Kilidi',
    screen_unlock: 'Ekran Kilidi Açıldı',
    system_idle: 'Sistem Boşta',
    system_active: 'Sistem Aktif',
    network_offline: 'Ağ Bağlantısı Kesildi',
    network_online: 'Ağ Bağlantısı Kuruldu',
    inactivity_timeout: 'Hareketsizlik Süresi Doldu',
    tab_activated: 'Tab Aktif Oldu',
    tab_deactivated: 'Tab Pasif Oldu',
    initialization: 'Başlatma'
  };
  return labels[reason] || reason;
};

export const StatusCard: React.FC<StatusCardProps> = ({
  status,
  reason,
  isTabActive,
  areListenersActive
}) => {
  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text type="secondary">Mevcut Durum</Text>
          <Title level={2} style={{ margin: '8px 0' }}>
            <Tag
              color={getStatusColor(status)}
              icon={status === 'ACTIVE' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              style={{ fontSize: '24px', padding: '8px 16px' }}
            >
              {status}
            </Tag>
          </Title>
        </div>

        <div>
          <Text type="secondary">Aktivite Nedeni</Text>
          <div style={{ marginTop: 8 }}>
            <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
              {getReasonLabel(reason)}
            </Tag>
          </div>
        </div>

        <Space size="large">
          <div>
            <Text type="secondary">Tab Durumu</Text>
            <div style={{ marginTop: 8 }}>
              <Badge
                status={isTabActive ? 'success' : 'default'}
                text={isTabActive ? 'Aktif' : 'Pasif'}
              />
            </div>
          </div>

          <div>
            <Text type="secondary">Listener'lar</Text>
            <div style={{ marginTop: 8 }}>
              <Badge
                status={areListenersActive ? 'processing' : 'default'}
                text={areListenersActive ? 'Çalışıyor' : 'Durdu'}
              />
            </div>
          </div>
        </Space>
      </Space>
    </Card>
  );
};
