import React from 'react';
import { Heart, Star, Users, Award, CheckCircle } from 'lucide-react';
import { useTeam } from '@/hooks/useTeam';

const values = [
  { icon: Heart, title: 'Любов до справи', description: 'Кожен набір створюємо з любов\'ю та турботою' },
  { icon: Star, title: 'Якість', description: 'Тільки перевірені матеріали найвищої якості' },
  { icon: Users, title: 'Спільнота', description: 'Об\'єднуємо творчих людей по всій Україні' },
  { icon: Award, title: 'Досвід', description: '12+ років досвіду у сфері хендмейду' },
];

export const AboutSection: React.FC = () => {
  const { data: teamMembers = [], isLoading } = useTeam(true); // Только активные

  // Берем первые два активных члена команды
  const displayMembers = teamMembers.slice(0, 2);

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

        {/* About Founder Section */}
        <div className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center mb-4">
            Про нас
          </h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            FetrInUA — це команда мам, які знають, як важливо творити разом з дітьми
          </p>
          
          <div className="bg-card rounded-2xl p-8 md:p-12 shadow-elegant">
            <div className="prose prose-lg max-w-none text-foreground space-y-4 mb-6">
              <p>
                Все почалось 10 років тому, коли я шукала матеріали для творчості з донькою. Купувала все окремо, витрачала години на пошуки. Тоді й виникла ідея — зібрати все необхідне в один набір, щоб кожна мама могла просто відкрити коробку і почати творити!
              </p>
              <p>
                Сьогодні понад 30 000 родин по всій Україні творять разом з нами. Ми пишаємось тим, що допомагаємо створювати особливі моменти між батьками та дітьми.
              </p>
            </div>
            
            {teamMembers.length > 0 && teamMembers[0] && (
              <div className="flex items-center gap-4 mt-6">
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                  {teamMembers[0].photo ? (
                    <img
                      src={teamMembers[0].photo}
                      alt={teamMembers[0].name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-heading font-bold text-lg text-foreground">{teamMembers[0].name}</div>
                  <div className="text-sm text-[#8B4A4A] font-medium">{teamMembers[0].role}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h3 className="text-2xl sm:text-3xl font-heading font-bold text-center mb-4 text-foreground">
            Наша команда
          </h3>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Ми завжди раді допомогти вам з вибором та порадою
          </p>
          
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Завантаження інформації про команду...
            </div>
          ) : displayMembers.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-12">
              {displayMembers.map((member, index) => (
                <div
                  key={member.id}
                  className="flex flex-col items-center text-center max-w-[280px] animate-fade-in"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-2 border-pink-200 flex-shrink-0">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-16 h-16 text-primary" />
                      </div>
                    )}
                  </div>
                  <h4 className="text-xl font-heading font-bold mb-2 text-foreground">{member.name}</h4>
                  <p className="text-[#8B4A4A] text-sm font-medium mb-3">{member.role}</p>
                  {member.description && (
                    <p className="text-muted-foreground text-sm">{member.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Інформація про команду наразі недоступна
            </div>
          )}
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
