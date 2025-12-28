import React from 'react';
import { Heart, Star, Users, Award, CheckCircle } from 'lucide-react';
import { useTeam } from '@/hooks/useTeam';
import { useTranslation } from '@/hooks/useTranslation';

export const AboutSection: React.FC = () => {
  const { t } = useTranslation('about');
  const { data: teamMembers = [], isLoading } = useTeam(true); // Только активные

  // Берем первые два активных члена команды
  const displayMembers = teamMembers.slice(0, 2);

  const stats = [
    { value: t('stat1.value'), label: t('stat1.label') },
    { value: t('stat2.value'), label: t('stat2.label') },
    { value: t('stat3.value'), label: t('stat3.label') },
    { value: t('stat4.value'), label: t('stat4.label') },
  ];

  const values = [
    { icon: Heart, title: t('values.love.title'), description: t('values.love.description') },
    { icon: Star, title: t('values.quality.title'), description: t('values.quality.description') },
    { icon: Users, title: t('values.community.title'), description: t('values.community.description') },
    { icon: Award, title: t('values.experience.title'), description: t('values.experience.description') },
  ];

  const trustItems = [
    t('trust.item1'),
    t('trust.item2'),
    t('trust.item3'),
    t('trust.item4'),
    t('trust.item5'),
    t('trust.item6'),
  ];

  return (
    <section id="about" className="py-20">
      <div className="container-tight">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary mb-4">
            <Heart className="w-4 h-4" />
            <span className="text-sm font-medium">{t('badge')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat) => (
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
            {t('founder.title')}
          </h2>
          <p className="text-center text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('founder.subtitle')}
          </p>
          
          <div className="glass-card p-8 md:p-12">
            <div className="prose prose-lg max-w-none text-foreground space-y-4 mb-6">
              <p>
                {t('founder.text1')}
              </p>
              <p>
                {t('founder.text2')}
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
            {t('team.title')}
          </h3>
          <p className="text-center text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('team.subtitle')}
          </p>
          
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('team.loading')}
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
              {t('team.empty')}
            </div>
          )}
        </div>

        {/* Why trust us */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
          <h3 className="text-xl font-heading font-bold text-center mb-6">{t('trust.title')}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trustItems.map((item) => (
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
