import React from 'react';
import { useTexts, SiteText } from '@/hooks/useTexts';

export const AudienceSection: React.FC = () => {
  const { data: textsData, isLoading } = useTexts();
  const texts: SiteText[] = Array.isArray(textsData) ? textsData : [];
  
  // Компонент всегда рендерится, даже если данные еще загружаются

  // Получаем тексты из базы данных
  const title = texts.find(t => t.key === 'audience.title')?.value || 'Кому підійде?';
  const subtitle = texts.find(t => t.key === 'audience.subtitle')?.value || 'Один набір – роки творчості. Від очікування малюка до шкільних проектів.';
  const description = texts.find(t => t.key === 'audience.description')?.value;
  
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
    <section 
      id="audience" 
      className="py-16 px-4 bg-gradient-to-br from-audience-peach via-audience-cream to-audience-mint"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center text-foreground mb-4">
          {title}
        </h2>
        <p className="text-center text-foreground/70 mb-12">
          {subtitle}
        </p>
        {description && (
          <p className="text-center text-foreground/70 mb-12">
            {description}
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Первая карточка - Майбутнім мамам */}
          <div className="glass-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🤰</span>
              <h3 className="text-xl font-heading font-bold text-foreground">{card1Title}</h3>
            </div>
            <ul className="space-y-4">
              {card1Items.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-foreground/80">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Вторая карточка - Батькам з дітьми */}
          <div className="glass-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">👶</span>
              <h3 className="text-xl font-heading font-bold text-foreground">{card2Title}</h3>
            </div>
            <ul className="space-y-4">
              {card2Items.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-foreground/80">
                  <span className="w-2 h-2 rounded-full bg-secondary mt-2 shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};