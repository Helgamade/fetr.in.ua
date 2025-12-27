import React from 'react';
import { MapPin, Phone, Mail, Clock, Instagram, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ContactSection: React.FC = () => {
  return (
    <section id="contact" className="py-20 bg-sage/30">
      <div className="container-tight">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">Контакти</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            Зв'яжіться з нами
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ми завжди раді відповісти на ваші запитання
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
                  <p className="text-muted-foreground">Київ, вул. Урлівська 30</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Самовивіз за попереднім записом</p>
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
                  <a href="tel:+380501234567" className="text-primary hover:underline">
                    +38 (050) 123-45-67
                  </a>
                  <p className="text-sm text-muted-foreground/60 mt-1">Viber, Telegram, WhatsApp</p>
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
                  <a href="mailto:hello@fetr.in.ua" className="text-primary hover:underline">
                    hello@fetr.in.ua
                  </a>
                  <p className="text-sm text-muted-foreground/60 mt-1">Відповідаємо протягом 24 годин</p>
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
                  <p className="text-muted-foreground">Пн–Пт: 10:00 – 18:00</p>
                  <p className="text-muted-foreground">Сб: 10:00 – 14:00</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Нд — вихідний</p>
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
