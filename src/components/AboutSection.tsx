import React from 'react';
import { teamMembers } from '@/data/products';
import { Heart, Star, Users, Award, CheckCircle } from 'lucide-react';

const values = [
  { icon: Heart, title: 'Любов до справи', description: 'Кожен набір створюємо з любов\'ю та турботою' },
  { icon: Star, title: 'Якість', description: 'Тільки перевірені матеріали найвищої якості' },
  { icon: Users, title: 'Спільнота', description: 'Об\'єднуємо творчих людей по всій Україні' },
  { icon: Award, title: 'Досвід', description: '12+ років досвіду у сфері хендмейду' },
];

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-20">
      <div className="container-tight">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary mb-4">
            <Heart className="w-4 h-4" />
            <span className="text-sm font-medium">Про нас</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            Творимо разом з 2012 року
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            FetrInUA — це більше, ніж магазин. Це спільнота творчих людей, які люблять створювати красу власноруч.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { value: '12+', label: 'років досвіду' },
            { value: '3000+', label: 'клієнтів' },
            { value: '500+', label: 'майстер-класів' },
            { value: '100%', label: 'задоволення' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-6 text-center hover-lift">
              <div className="text-3xl sm:text-4xl font-heading font-bold gradient-text mb-2">
                {stat.value}
              </div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Values */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {values.map((value, index) => (
            <div
              key={value.title}
              className="text-center p-6 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <value.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2">{value.title}</h3>
              <p className="text-muted-foreground text-sm">{value.description}</p>
            </div>
          ))}
        </div>

        {/* Team */}
        <div className="mb-16">
          <h3 className="text-2xl font-heading font-bold text-center mb-8">Наша команда</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={member.id}
                className="glass-card overflow-hidden hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h4 className="font-heading font-bold text-lg">{member.name}</h4>
                  <p className="text-primary text-sm font-medium mb-2">{member.role}</p>
                  <p className="text-muted-foreground text-sm">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why trust us */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
          <h3 className="text-xl font-heading font-bold text-center mb-6">Чому нам довіряють</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Понад 3000 задоволених клієнтів',
              'Сертифіковані матеріали',
              'Швидка відправка замовлень',
              'Постійна підтримка майстра',
              'Гарантія якості',
              'Безкоштовна доставка від 1500 ₴',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
