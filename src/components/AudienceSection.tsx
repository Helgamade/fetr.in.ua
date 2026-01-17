import React from 'react';
import { useTexts, SiteText } from '@/hooks/useTexts';

export const AudienceSection: React.FC = () => {
  const { data: textsData, isLoading } = useTexts();
  const texts: SiteText[] = Array.isArray(textsData) ? textsData : [];
  
  // Компонент всегда рендерится, даже если данные еще загружаются

  // Получаем тексты из базы данных
  const title = texts.find(t => t.key === 'audience.title')?.value || 'Кому підійде?';
  const subtitle = texts.find(t => t.key === 'audience.subtitle')?.value || 'Один набір – роки творчості. Від очікування малюка до шкільних проектів.';
  
  // Тексты для первой карточки
  const card1Title = texts.find(t => t.key === 'audience.card1.title')?.value || 'Майбутнім мамам';
  const card1Item1 = texts.find(t => t.key === 'audience.card1.item1')?.value || 'Дитячі мобілі ручної роботи';
  const card1Item2 = texts.find(t => t.key === 'audience.card1.item2')?.value || 'Іграшки з безпечних матеріалів';
  const card1Item3 = texts.find(t => t.key === 'audience.card1.item3')?.value || 'Підвісні іграшки на коляску';
  const card1Item4 = texts.find(t => t.key === 'audience.card1.item4')?.value || 'Тематичний декор дитячої кімнати';
  const card1Item5 = texts.find(t => t.key === 'audience.card1.item5')?.value || 'Іменні гірлянди з фетру';
  
  // Тексты для второй карточки
  const card2Title = texts.find(t => t.key === 'audience.card2.title')?.value || 'Батькам з дітьми';
  const card2Item1 = texts.find(t => t.key === 'audience.card2.item1')?.value || 'Розвиваючі іграшки, книжки';
  const card2Item2 = texts.find(t => t.key === 'audience.card2.item2')?.value || 'Фетр для уроків праці у школі';
  const card2Item3 = texts.find(t => t.key === 'audience.card2.item3')?.value || 'Прикраси на голову, квіти з фетру';
  const card2Item4 = texts.find(t => t.key === 'audience.card2.item4')?.value || 'Корони, маски, костюми';
  const card2Item5 = texts.find(t => t.key === 'audience.card2.item5')?.value || 'Спільні творчі вечори з дитиною';

  // Фильтруем пустые элементы (оставляем только непустые строки)
  const card1Items = [card1Item1, card1Item2, card1Item3, card1Item4, card1Item5].filter(item => item && item.trim());
  const card2Items = [card2Item1, card2Item2, card2Item3, card2Item4, card2Item5].filter(item => item && item.trim());

  return (
    <section id="audience" className="py-20 bg-peach/30">
      <div className="container-tight">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Первая карточка - Майбутнім мамам */}
          <div className="rounded-lg text-card-foreground shadow-sm glass-card border-0 overflow-hidden bg-peach/30">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-background/80 flex items-center justify-center text-3xl shadow-sm">
                  🤰
                </div>
                <h3 className="font-heading text-2xl font-bold text-foreground">
                  {card1Title}
                </h3>
              </div>
              <ul className="space-y-3">
                {card1Items.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-foreground/80">
                    <span className="text-primary mt-1">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Вторая карточка - Батькам з дітьми */}
          <div className="rounded-lg text-card-foreground shadow-sm glass-card border-0 overflow-hidden bg-sage/30">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-background/80 flex items-center justify-center text-3xl shadow-sm">
                  👶
                </div>
                <h3 className="font-heading text-2xl font-bold text-foreground">
                  {card2Title}
                </h3>
              </div>
              <ul className="space-y-3">
                {card2Items.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-foreground/80">
                    <span className="text-primary mt-1">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};