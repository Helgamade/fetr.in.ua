import React, { useState } from 'react';
import { MessageCircle, X, Send, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-glow flex items-center justify-center transition-all duration-300 hover:scale-110 md:bottom-4',
          isOpen && 'scale-0 opacity-0'
        )}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat popup */}
      <div
        className={cn(
          'fixed bottom-20 right-4 z-40 w-[320px] bg-card rounded-2xl shadow-large transition-all duration-300 overflow-hidden md:bottom-4',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="bg-primary p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-primary-foreground">Чат з нами</h3>
              <p className="text-xs text-primary-foreground/80">Відповідаємо швидко!</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/30 transition-colors"
          >
            <X className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="bg-muted rounded-lg p-4 mb-4">
            <p className="text-sm">
              👋 Привіт! Оберіть спосіб зв'язку і ми з радістю відповімо на ваші питання!
            </p>
          </div>

          <div className="space-y-3">
            <a
              href="https://instagram.com/helgamade_ua"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 hover:from-purple-500/20 hover:via-pink-500/20 hover:to-orange-500/20 transition-colors"
            >
              <Instagram className="w-6 h-6 text-pink-500" />
              <div>
                <p className="font-medium">Instagram Direct</p>
                <p className="text-xs text-muted-foreground">@helgamade_ua</p>
              </div>
            </a>

            <a
              href="https://t.me/helgamade_ua"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 transition-colors"
            >
              <Send className="w-6 h-6 text-[#0088cc]" />
              <div>
                <p className="font-medium">Telegram</p>
                <p className="text-xs text-muted-foreground">Швидка відповідь</p>
              </div>
            </a>

            <a
              href="tel:+380501234567"
              className="flex items-center gap-3 p-4 rounded-xl bg-success/10 hover:bg-success/20 transition-colors"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <span className="text-xl">📞</span>
              </div>
              <div>
                <p className="font-medium">Зателефонувати</p>
                <p className="text-xs text-muted-foreground">+38 (050) 123-45-67</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
