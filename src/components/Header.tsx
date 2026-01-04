import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, Phone, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { usePublicSettings } from '@/hooks/usePublicSettings';

export const Header: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation('nav');
  const { t: tCommon } = useTranslation('common');
  const { data: settings = {} } = usePublicSettings();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getItemCount, openCart } = useCart();
  const itemCount = getItemCount();
  
  const storePhone = settings.store_phone || '+380501234567';
  const isHomePage = location.pathname === '/';

  const navLinks = [
    { href: '#hero', label: t('home') },
    { href: '#products', label: t('products') },
    { href: '#comparison', label: t('comparison') },
    { href: '#gallery', label: t('gallery') },
    { href: '#reviews', label: t('reviews') },
    { href: '#faq', label: t('faq') },
    { href: '#about', label: t('about') },
    { href: '#contact', label: t('contact') },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    if (isHomePage) {
      // На главной странице - скроллим к секции
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // На других страницах - переходим на главную с якорем
      window.location.href = `/${href}`;
    }
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-card/95 backdrop-blur-md shadow-medium py-2'
            : 'bg-transparent py-4'
        )}
      >
        <div className="container-tight flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 z-50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-lg">F</span>
            </div>
            <span className={cn(
              'font-heading font-bold text-xl transition-colors',
              isScrolled ? 'text-foreground' : 'text-foreground'
            )}>
              FetrInUA
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  'hover:bg-primary/10 hover:text-primary',
                  isScrolled ? 'text-foreground' : 'text-foreground'
                )}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <a
              href={`tel:${storePhone.replace(/\s/g, '')}`}
              className={cn(
                'hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                'hover:bg-primary/10',
                isScrolled ? 'text-foreground' : 'text-foreground'
              )}
            >
              <Phone className="w-4 h-4" />
              <span className="hidden md:inline">{storePhone}</span>
            </a>

            <a
              href="https://instagram.com/helgamade_ua"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'hidden sm:flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
                'hover:bg-primary/10',
                isScrolled ? 'text-foreground' : 'text-foreground'
              )}
            >
              <Instagram className="w-5 h-5" />
            </a>

            <Button
              variant="soft"
              size="icon"
              className="relative"
              onClick={openCart}
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
                  {itemCount}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300',
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Menu */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 w-[280px] bg-card z-50 lg:hidden transition-transform duration-300 shadow-large',
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-heading font-bold text-lg">{tCommon('menu')}</span>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="p-4 flex flex-col gap-1">
          {navLinks.map(link => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="px-4 py-3 rounded-lg text-left font-medium hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <a
            href={`tel:${storePhone.replace(/\s/g, '')}`}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <Phone className="w-5 h-5 text-primary" />
            <span className="font-medium">{storePhone}</span>
          </a>
          <a
            href="https://instagram.com/helgamade_ua"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <Instagram className="w-5 h-5 text-primary" />
            <span className="font-medium">@helgamade_ua</span>
          </a>
        </div>
      </div>
    </>
  );
};
