import React from 'react';
import { MapPin, Phone, Mail, Clock, Instagram, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { usePublicSettings } from '@/hooks/usePublicSettings';

export const ContactSection: React.FC = () => {
  const { t } = useTranslation('contact');
  const { data: settings = {} } = usePublicSettings();
  
  const storeAddress = settings.store_address || 'м. Київ, вул. Урлівська 30';
  const storePhone = settings.store_phone || '+380501234567';
  const storeEmail = settings.store_email || 'hello@fetr.in.ua';
  const workingHoursWeekdays = settings.store_working_hours_weekdays || 'Пн–Пт: 10:00 – 18:00';
  const workingHoursWeekend = settings.store_working_hours_weekend || 'Сб: 10:00 – 14:00';
  
  return (
    <section id="contact" className="py-20 bg-sage/30">
      <div className="container-tight">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">{t('badge')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact info */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-bold mb-1">Адреса</h3>
                  <p className="text-muted-foreground">{storeAddress}</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">{t('address.pickup', { defaultValue: 'Самовивіз за попереднім записом' })}</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-bold mb-1">Телефон</h3>
                  <a href={`tel:${storePhone.replace(/\s/g, '')}`} className="text-primary hover:underline">
                    {storePhone}
                  </a>
                  <p className="text-sm text-muted-foreground/60 mt-1">{t('phone.messengers', { defaultValue: 'Viber, Telegram, WhatsApp' })}</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-bold mb-1">Email</h3>
                  <a href={`mailto:${storeEmail}`} className="text-primary hover:underline">
                    {storeEmail}
                  </a>
                  <p className="text-sm text-muted-foreground/60 mt-1">{t('email.responseTime', { defaultValue: 'Відповідаємо протягом 24 годин' })}</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-bold mb-1">Графік роботи</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{workingHoursWeekdays}</p>
                  <p className="text-sm text-muted-foreground/60 whitespace-pre-line">{workingHoursWeekend}</p>
                </div>
              </div>
            </div>

            {/* Social links */}
            <div className="flex gap-3">
              <Button variant="soft" size="lg" className="flex-1" asChild>
                <a href="https://instagram.com/helgamade_ua" target="_blank" rel="noopener noreferrer">
                  <Instagram className="w-5 h-5" />
                  Instagram
                </a>
              </Button>
              <Button variant="soft" size="lg" className="flex-1" asChild>
                <a href="https://t.me/helgamade_ua" target="_blank" rel="noopener noreferrer">
                  <Send className="w-5 h-5" />
                  Telegram
                </a>
              </Button>
            </div>
          </div>

          {/* Map */}
          <div className="glass-card overflow-hidden h-[400px] lg:h-auto">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2541.8247898752197!2d30.5679!3d50.4017!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40d4cf0d9d9f9c9b%3A0x1234567890abcdef!2z0YPQuy4g0KPRgNC70ZbQstGB0YzQutCwIDMwLCDQmtC40ZfQsg!5e0!3m2!1suk!2sua!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '400px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Карта розташування"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
