import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown, Star, Users, Truck, HeartHandshake, Sparkles } from 'lucide-react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { usePublicSettings } from '@/hooks/usePublicSettings';

export const HeroSection: React.FC = () => {
  const { trackEvent } = useAnalytics();
  const { t } = useTranslation('hero');
  const { data: publicSettings = {} } = usePublicSettings();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Используем изображение из настроек или дефолтное
  const heroBackgroundImage = publicSettings.hero_background_image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920';

  const stats = [
    { icon: Star, value: t('stat1.value'), label: t('stat1.label') },
    { icon: Users, value: t('stat2.value'), label: t('stat2.label') },
    { icon: Truck, value: t('stat3.value'), label: t('stat3.label') },
    { icon: HeartHandshake, value: t('stat4.value'), label: t('stat4.label') },
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleCTAClick = () => {
    trackEvent('cta_click', { location: 'hero', button: 'choose_set' });
    document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-peach via-background to-sage -z-10" />
      
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-5">
        <div 
          className="absolute top-20 left-[10%] w-20 h-20 rounded-full bg-primary/10 floating-element"
          style={{ transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)` }}
        />
        <div 
          className="absolute top-40 right-[15%] w-32 h-32 rounded-full bg-secondary/10 floating-element-delay"
          style={{ transform: `translate(${mousePosition.x * -0.3}px, ${mousePosition.y * -0.3}px)` }}
        />
        <div 
          className="absolute bottom-32 left-[20%] w-16 h-16 rounded-full bg-accent/10 floating-element"
          style={{ transform: `translate(${mousePosition.x * 0.4}px, ${mousePosition.y * 0.4}px)` }}
        />
        <div 
          className="absolute top-1/2 right-[5%] w-24 h-24 rounded-full bg-primary/5 floating-element-delay"
          style={{ transform: `translate(${mousePosition.x * -0.6}px, ${mousePosition.y * -0.6}px)` }}
        />
        
        {/* Decorative shapes */}
        <svg className="absolute top-1/4 left-[5%] w-12 h-12 text-primary/20 floating-element" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        <svg className="absolute bottom-1/4 right-[10%] w-16 h-16 text-secondary/20 floating-element-delay" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>

      {/* Parallax Image */}
      <div 
        className="absolute inset-0 -z-5"
        style={{
          backgroundImage: `url(${heroBackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px) scale(1.1)`,
          opacity: 0.13,
        }}
      />

      <div className="container-tight relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">{t('badge')}</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {t('title')}{' '}
            <span className="gradient-text">{t('titleHighlight')}</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {t('subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button variant="cta" size="xl" onClick={handleCTAClick} className="w-full sm:w-auto">
              {t('ctaChoose')}
              <ArrowDown className="w-5 h-5 animate-bounce-subtle" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => document.querySelector('#comparison')?.scrollIntoView({ behavior: 'smooth' })}>
              {t('ctaCompare')}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className="glass-card p-4 hover-lift"
                style={{ animationDelay: `${0.5 + index * 0.1}s` }}
              >
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-heading font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
