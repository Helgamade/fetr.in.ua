import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AnalyticsEvent } from '@/types/store';

interface AnalyticsContextType {
  events: AnalyticsEvent[];
  trackEvent: (event: string, data?: Record<string, unknown>) => void;
  getEventsByType: (eventType: string) => AnalyticsEvent[];
  getEventCount: (eventType: string) => number;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<AnalyticsEvent[]>(() => {
    const saved = localStorage.getItem('fetr-analytics');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('fetr-analytics', JSON.stringify(events.slice(-1000))); // Keep last 1000 events
  }, [events]);

  const trackEvent = useCallback((event: string, data: Record<string, unknown> = {}) => {
    const newEvent: AnalyticsEvent = {
      id: crypto.randomUUID(),
      event,
      data,
      timestamp: new Date(),
    };
    setEvents(prev => [...prev, newEvent]);
    console.log('📊 Analytics:', event, data);
  }, []);

  useEffect(() => {
    const handleAnalytics = (e: CustomEvent) => {
      trackEvent(e.detail.event, e.detail);
    };
    
    window.addEventListener('analytics', handleAnalytics as EventListener);
    return () => window.removeEventListener('analytics', handleAnalytics as EventListener);
  }, [trackEvent]);

  // Track page views
  useEffect(() => {
    trackEvent('page_view', { path: window.location.pathname });
  }, [trackEvent]);

  const getEventsByType = useCallback((eventType: string) => {
    return events.filter(e => e.event === eventType);
  }, [events]);

  const getEventCount = useCallback((eventType: string) => {
    return events.filter(e => e.event === eventType).length;
  }, [events]);

  return (
    <AnalyticsContext.Provider
      value={{
        events,
        trackEvent,
        getEventsByType,
        getEventCount,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within a AnalyticsProvider');
  }
  return context;
};
