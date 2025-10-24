import React from 'react';
import { Layout, Button, Space, Typography, Alert, Row, Col, Divider } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ClearOutlined, GithubOutlined } from '@ant-design/icons';
import { useActivityTracker } from './hooks/useActivityTracker';
import { StatusCard } from './components/StatusCard';
import { StatisticsCards } from './components/StatisticsCards';
import { DetailedStateViewer } from './components/DetailedStateViewer';
import { ActivityTimeline } from './components/ActivityTimeline';
import { ActivityChart } from './components/ActivityChart';

const { Header, Content, Footer } = Layout;
const { Title, Text, Link } = Typography;

const App: React.FC = () => {
  const {
    currentStatus,
    currentReason,
    detailedState,
    isTracking,
    isTabActive,
    areListenersActive,
    stats,
    logs,
    tabId,
    start,
    stop,
    clearLogs
  } = useActivityTracker();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        background: '#001529',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            🎯 Browser Activity Tracker v2.0
          </Title>
        </div>
        <Link href="https://github.com/yourusername/browser-activity-tracker" target="_blank">
          <Button icon={<GithubOutlined />} type="link" style={{ color: 'white' }}>
            GitHub
          </Button>
        </Link>
      </Header>

      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Kontrol Paneli */}
          <Alert
            message={
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <div>
                  <Text strong>Tab ID:</Text> <Text code>{tabId}</Text>
                </div>
                <Space size="large">
                  <div>
                    <Text strong>İzleme Durumu:</Text>{' '}
                    <Text type={isTracking ? 'success' : 'secondary'}>
                      {isTracking ? 'Aktif' : 'Durduruldu'}
                    </Text>
                  </div>
                  {isTracking && (
                    <>
                      <div>
                        <Text strong>Listener Durumu:</Text>{' '}
                        <Text type={areListenersActive ? 'success' : 'warning'}>
                          {areListenersActive ? 'Çalışıyor' : 'Durdu (Pasif Tab)'}
                        </Text>
                      </div>
                    </>
                  )}
                </Space>
              </Space>
            }
            type={isTracking ? 'info' : 'warning'}
            showIcon
            style={{ marginBottom: 24 }}
            action={
              <Space>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={start}
                  disabled={isTracking}
                >
                  Başlat
                </Button>
                <Button
                  danger
                  icon={<PauseCircleOutlined />}
                  onClick={stop}
                  disabled={!isTracking}
                >
                  Durdur
                </Button>
                <Button
                  icon={<ClearOutlined />}
                  onClick={clearLogs}
                >
                  Logları Temizle
                </Button>
              </Space>
            }
          />

          {/* Bilgi Kutusu */}
          <Alert
            message="Multi-Tab Koordinasyonu"
            description={
              <div>
                <p>
                  Bu demo, Browser Activity Tracker v2.0'ın tüm özelliklerini gösterir.
                  Birden fazla tab'de bu sayfayı açarak multi-tab koordinasyonunu test edebilirsiniz.
                </p>
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>Sadece <strong>aktif tab</strong>'de listener'lar çalışır</li>
                  <li>Pasif tab'ler aktif tab'den gelen güncellemeleri alır</li>
                  <li>Tab değiştirildiğinde listener'lar otomatik başlar/durur</li>
                  <li>Her aktivite değişikliği için <strong>detaylı neden</strong> (reason) gösterilir</li>
                </ul>
              </div>
            }
            type="success"
            showIcon
            closable
            style={{ marginBottom: 24 }}
          />

          {/* Mevcut Durum */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={8}>
              <StatusCard
                status={currentStatus}
                reason={currentReason}
                isTabActive={isTabActive}
                areListenersActive={areListenersActive}
              />
            </Col>
            <Col xs={24} lg={16}>
              <DetailedStateViewer state={detailedState} />
            </Col>
          </Row>

          {/* İstatistikler */}
          <div style={{ marginBottom: 24 }}>
            <Title level={4}>📊 İstatistikler</Title>
            <StatisticsCards stats={stats} />
          </div>

          <Divider />

          {/* Grafikler ve Timeline */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <ActivityChart logs={logs} />
            </Col>
            <Col xs={24} lg={10}>
              <ActivityTimeline logs={logs} />
            </Col>
          </Row>

          {/* Test Alanı */}
          <Divider />
          <Alert
            message="Test Alanı"
            description={
              <div>
                <p>Aktivite tracker'ı test etmek için:</p>
                <ul style={{ paddingLeft: 20 }}>
                  <li>Fareyi hareket ettirin → <strong>mouse_activity</strong></li>
                  <li>Klavyeye basın → <strong>keyboard_activity</strong></li>
                  <li>Sayfayı kaydırın → <strong>scroll_activity</strong></li>
                  <li>Başka bir tab'e geçin → <strong>page_hidden</strong> / <strong>tab_deactivated</strong></li>
                  <li>Pencereyi minimize edin → <strong>window_blur</strong></li>
                  <li>10 saniye bekleyin → <strong>inactivity_timeout</strong></li>
                </ul>
                <div
                  style={{
                    height: 200,
                    border: '2px dashed #d9d9d9',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 16,
                    background: '#fafafa'
                  }}
                >
                  <Text type="secondary">
                    Bu alanda fareyi hareket ettirin, klavyeye basın veya kaydırın
                  </Text>
                </div>
              </div>
            }
            type="info"
            showIcon
            style={{ marginTop: 24 }}
          />
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', background: '#001529', color: 'white' }}>
        <Space direction="vertical" size="small">
          <Text style={{ color: 'white' }}>
            Browser Activity Tracker v2.0 - Demo Dashboard
          </Text>
          <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
            Built with React, TypeScript, Ant Design & RxJS
          </Text>
        </Space>
      </Footer>
    </Layout>
  );
};

export default App;
