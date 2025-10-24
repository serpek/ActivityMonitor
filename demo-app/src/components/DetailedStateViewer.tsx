import React from 'react';
import { Card, Descriptions, Badge, Tag, Typography } from 'antd';
import type { DetailedActivityState } from 'browser-activity-tracker';

const { Title } = Typography;

interface DetailedStateViewerProps {
  state: DetailedActivityState | null;
}

const formatDate = (date?: Date) => {
  if (!date) return '-';
  return date.toLocaleString('tr-TR');
};

export const DetailedStateViewer: React.FC<DetailedStateViewerProps> = ({ state }) => {
  if (!state) {
    return (
      <Card>
        <Title level={4}>Detaylı Durum</Title>
        <p>Henüz veri yok</p>
      </Card>
    );
  }

  return (
    <Card>
      <Title level={4}>Detaylı Aktivite Durumu</Title>
      <Descriptions bordered column={{ xs: 1, sm: 2, md: 2 }} size="small">
        <Descriptions.Item label="Pencere Görünür">
          <Badge
            status={state.windowVisible ? 'success' : 'default'}
            text={state.windowVisible ? 'Evet' : 'Hayır'}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Pencere Odakta">
          <Badge
            status={state.windowFocused ? 'success' : 'default'}
            text={state.windowFocused ? 'Evet' : 'Hayır'}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Sayfa Görünür">
          <Badge
            status={state.pageVisible ? 'success' : 'default'}
            text={state.pageVisible ? 'Evet' : 'Hayır'}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Tab Aktif">
          <Badge
            status={state.isTabActive ? 'success' : 'default'}
            text={state.isTabActive ? 'Evet' : 'Hayır'}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Fare Aktivitesi">
          <Tag color={state.hasMouseActivity ? 'green' : 'default'}>
            {state.hasMouseActivity ? 'Var' : 'Yok'}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Klavye Aktivitesi">
          <Tag color={state.hasKeyboardActivity ? 'green' : 'default'}>
            {state.hasKeyboardActivity ? 'Var' : 'Yok'}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Dokunma Aktivitesi">
          <Tag color={state.hasTouchActivity ? 'green' : 'default'}>
            {state.hasTouchActivity ? 'Var' : 'Yok'}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Scroll Aktivitesi">
          <Tag color={state.hasScrollActivity ? 'green' : 'default'}>
            {state.hasScrollActivity ? 'Var' : 'Yok'}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Ekran Kilidi">
          <Badge
            status={state.isScreenLocked ? 'error' : 'success'}
            text={state.isScreenLocked ? 'Kilitli' : 'Açık'}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Ağ Bağlantısı">
          <Badge
            status={state.isNetworkOnline ? 'success' : 'error'}
            text={state.isNetworkOnline ? 'Online' : 'Offline'}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Son Aktivite" span={2}>
          {formatDate(state.lastActivityTime)}
        </Descriptions.Item>

        {state.lastMouseActivityTime && (
          <Descriptions.Item label="Son Fare Aktivitesi" span={2}>
            {formatDate(state.lastMouseActivityTime)}
          </Descriptions.Item>
        )}

        {state.lastKeyboardActivityTime && (
          <Descriptions.Item label="Son Klavye Aktivitesi" span={2}>
            {formatDate(state.lastKeyboardActivityTime)}
          </Descriptions.Item>
        )}

        {state.lastTouchActivityTime && (
          <Descriptions.Item label="Son Dokunma Aktivitesi" span={2}>
            {formatDate(state.lastTouchActivityTime)}
          </Descriptions.Item>
        )}

        {state.lastScrollActivityTime && (
          <Descriptions.Item label="Son Scroll Aktivitesi" span={2}>
            {formatDate(state.lastScrollActivityTime)}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Card>
  );
};
