import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, Phone, User, LogOut, Package, FileText, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('nav');
  const { t: tCommon } = useTranslation('common');
  const { data: settings = {} } = usePublicSettings();
  const { user, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { getItemCount, openCart } = useCart();
  const itemCount = getItemCount();
  
  const storePhone = settings.store_phone || '+380501234567';
  const isHomePage = location.pathname === '/';
  
  const handleLogin = () => {
    authAPI.googleLogin();
  };
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };
  
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navLinks = [
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

            {/* Auth Button / User Menu */}
            {isAuthenticated && user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-10 w-10 rounded-full"
                  onClick={() => setIsUserMenuOpen(true)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogin}
                className="hidden sm:flex"
              >
                <User className="mr-2 h-4 w-4" />
                Увійти
              </Button>
            )}

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

      {/* User Menu Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 transition-opacity duration-300',
          isUserMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsUserMenuOpen(false)}
      />

      {/* User Menu (Desktop & Mobile) */}
      {isAuthenticated && user && (
        <div
          className={cn(
            'fixed top-0 right-0 bottom-0 w-[280px] bg-card z-50 transition-transform duration-300 shadow-large',
            isUserMenuOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="font-heading font-bold text-lg">Мій профіль</span>
            <Button variant="ghost" size="icon" onClick={() => setIsUserMenuOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <nav className="p-4 flex flex-col gap-1">
            <button
              onClick={() => { navigate('/user/profile'); setIsUserMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors text-left"
            >
              <User className="w-5 h-5 text-primary" />
              <span className="font-medium">Мій профіль</span>
            </button>
            <button
              onClick={() => { navigate('/user/orders'); setIsUserMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors text-left"
            >
              <Package className="w-5 h-5 text-primary" />
              <span className="font-medium">Мої замовлення</span>
            </button>
            <button
              onClick={() => { navigate('/user/materials'); setIsUserMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors text-left"
            >
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-medium">Мої матеріали</span>
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => { navigate('/admin'); setIsUserMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors text-left"
              >
                <LayoutDashboard className="w-5 h-5 text-primary" />
                <span className="font-medium">Адмін панель</span>
              </button>
            )}
          </nav>

          <div className="p-4 border-t border-border mt-auto">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Вийти</span>
            </button>
          </div>
        </div>
      )}

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
          {/* Auth section in mobile menu */}
          {!isAuthenticated && (
            <button
              onClick={handleLogin}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors text-left"
            >
              <User className="w-5 h-5 text-primary" />
              <span className="font-medium">Увійти</span>
            </button>
          )}
          
          <div className="pt-4">
            <a
              href={`tel:${storePhone.replace(/\s/g, '')}`}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <Phone className="w-5 h-5 text-primary" />
              <span className="font-medium">{storePhone}</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
