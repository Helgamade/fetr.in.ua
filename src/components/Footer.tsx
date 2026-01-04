import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Send, Phone, Mail, CreditCard, Truck, Shield } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { usePages } from '@/hooks/usePages';

export const Footer: React.FC = () => {
  const { t } = useTranslation('footer');
  const { t: tNav } = useTranslation('nav');
  const { data: settings = {} } = usePublicSettings();
  const { data: pages = [] } = usePages();
  const currentYear = new Date().getFullYear();
  
  const storeName = settings.store_name || 'FetrInUA';
  const storePhone = settings.store_phone || '+380501234567';
  const storeEmail = settings.store_email || 'hello@fetr.in.ua';
  const storeAddress = settings.store_address || 'м. Київ, вул. Урлівська 30';
  
  // Фильтруем только опубликованные страницы
  const publishedPages = pages.filter(page => page.is_published);

  return (
    <footer className="bg-foreground text-primary-foreground">
      {/* Trust badges */}
      <div className="border-b border-primary-foreground/10">
        <div className="container-tight py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Truck className="w-8 h-8 text-primary" />
              <span className="text-sm font-medium">{t('freeDelivery.title')}</span>
              <span className="text-xs text-primary-foreground/60">{t('freeDelivery.subtitle')}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              <span className="text-sm font-medium">{t('quality.title')}</span>
              <span className="text-xs text-primary-foreground/60">{t('quality.subtitle')}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CreditCard className="w-8 h-8 text-primary" />
              <span className="text-sm font-medium">{t('payment.title')}</span>
              <span className="text-xs text-primary-foreground/60">{t('payment.subtitle')}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Phone className="w-8 h-8 text-primary" />
              <span className="text-sm font-medium">{t('support.title')}</span>
              <span className="text-xs text-primary-foreground/60">{t('support.subtitle')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container-tight py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-bold text-lg">F</span>
              </div>
              <span className="font-heading font-bold text-xl">{storeName}</span>
            </div>
            <p className="text-primary-foreground/60 text-sm mb-4">
              {t('description')}
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com/helgamade_ua"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://t.me/helgamade_ua"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Send className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-heading font-bold mb-4">{t('menu.title')}</h4>
            <ul className="space-y-2">
              {[
                { key: 'home', href: '#hero' },
                { key: 'products', href: '#products' },
                { key: 'comparison', href: '#comparison' },
                { key: 'gallery', href: '#gallery' },
                { key: 'reviews', href: '#reviews' },
                { key: 'faq', href: '#faq' },
              ].map(item => (
                <li key={item.key}>
                  <a href={item.href} className="text-primary-foreground/60 hover:text-primary-foreground transition-colors text-sm">
                    {tNav(item.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold mb-4">{t('contact.title')}</h4>
            <ul className="space-y-3">
              <li>
                <a href={`tel:${storePhone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors text-sm">
                  <Phone className="w-4 h-4" />
                  {storePhone}
                </a>
              </li>
              <li>
                <a href={`mailto:${storeEmail}`} className="flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors text-sm">
                  <Mail className="w-4 h-4" />
                  {storeEmail}
                </a>
              </li>
              <li className="text-primary-foreground/60 text-sm">
                {storeAddress}
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-bold mb-4">Інформація</h4>
            <ul className="space-y-2">
              {publishedPages.length > 0 ? (
                publishedPages.map(page => (
                  <li key={page.id}>
                    <Link 
                      to={`/${page.slug}`} 
                      className="text-primary-foreground/60 hover:text-primary-foreground transition-colors text-sm"
                    >
                      {page.title}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-primary-foreground/40 text-sm">
                  Немає доступних сторінок
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-primary-foreground/10">
        <div className="container-tight py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-primary-foreground/40 text-sm">
              © {currentYear} {storeName}. {t('copyright')}
            </p>
            <p className="text-primary-foreground/40 text-sm">
              Зроблено з ❤️ в Україні
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
