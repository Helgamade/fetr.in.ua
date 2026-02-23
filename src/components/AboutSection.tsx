import React from 'react';
import { Heart, Star, Users, Award, CheckCircle, Flower2, Sparkles, Palette } from 'lucide-react';
import { useTeam } from '@/hooks/useTeam';
import { useTranslation } from '@/hooks/useTranslation';

export const AboutSection: React.FC = () => {
  const { t } = useTranslation('about');
  const { data: teamMembers = [], isLoading } = useTeam(true); // Только активные

  const values = [
    { icon: Heart, title: t('values.love.title'), description: t('values.love.description') },
    { icon: Star, title: t('values.quality.title'), description: t('values.quality.description') },
    { icon: Users, title: t('values.community.title'), description: t('values.community.description') },
    { icon: Palette, title: t('values.experience.title'), description: t('values.experience.description') },
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
    <>
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

          {/* Values */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>
      </section>

      <section id="about-team" className="py-20 bg-gradient-to-b from-sage/20 to-peach/20">
        <div className="container-tight">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">{t('greeting.badge')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground">
              {t('greeting.title')}
            </h2>
          </div>

          {/* Founder Card — Variant 19 style */}
          <div className="mb-6">
            <div className="max-w-2xl mx-auto bg-card/80 backdrop-blur-sm rounded-3xl px-8 pt-[2.7rem] pb-8 [box-shadow:var(--shadow-md)] border border-border/50 relative">
              <div className="absolute top-3 left-3 md:top-4 md:left-4 w-6 h-6 md:w-8 md:h-8 border-t-2 border-l-2 border-primary/30 rounded-tl-[1.3rem]" />
              <div className="absolute top-3 right-3 md:top-4 md:right-4 w-6 h-6 md:w-8 md:h-8 border-t-2 border-r-2 border-primary/30 rounded-tr-[1.3rem]" />
              <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 w-6 h-6 md:w-8 md:h-8 border-b-2 border-l-2 border-primary/30 rounded-bl-[1.3rem]" />
              <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 w-6 h-6 md:w-8 md:h-8 border-b-2 border-r-2 border-primary/30 rounded-br-[1.3rem]" />
              <div className="flex flex-col items-center text-center">
                {teamMembers.length > 0 && teamMembers[0] && (
                  <div className="relative mb-4">
                    <div className="absolute -inset-3 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 rounded-full animate-pulse" />
                    {teamMembers[0].photo ? (
                      <img
                        src={teamMembers[0].photo}
                        alt={teamMembers[0].name}
                        className="relative w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-card"
                      />
                    ) : (
                      <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-card">
                        <Users className="w-10 h-10 text-primary" />
                      </div>
                    )}
                    <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-primary" />
                  </div>
                )}

                {teamMembers.length > 0 && teamMembers[0] && (
                  <>
                    <h3 className="font-heading text-xl md:text-2xl font-bold text-foreground">{teamMembers[0].name}</h3>
                    <p className="text-primary text-sm mb-4">{t('founder.role')}</p>
                  </>
                )}

              <p className="text-foreground/80 text-sm md:text-base leading-relaxed w-full" dangerouslySetInnerHTML={{ __html: t('founder.text1') }} />
              {t('founder.text2') && (
                <p className="text-foreground/80 text-sm md:text-base leading-relaxed w-full mt-3" dangerouslySetInnerHTML={{ __html: t('founder.text2') }} />
              )}
              </div>
            </div>
          </div>

          {/* Team — Variant 19 style */}
          <div className="mb-10">
            <div className="max-w-2xl mx-auto bg-card/80 backdrop-blur-sm rounded-3xl p-6 md:p-8 [box-shadow:var(--shadow-md)] border border-border/50">
              <h3 className="font-heading text-lg md:text-xl font-bold text-foreground text-center mb-5">
                {t('team.title')}
              </h3>

              {isLoading ? (
                <div className="text-center py-6 text-muted-foreground">{t('team.loading')}</div>
              ) : teamMembers.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-6">
                  {teamMembers.map((member, i) => (
                    <div key={member.id} className="text-center w-[calc(50%-12px)] sm:w-auto">
                      <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {member.photo ? (
                          <img src={member.photo} alt={member.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="text-2xl">{member.emoji || '🌸'}</span>
                        )}
                      </div>
                      <p className="font-medium text-foreground text-base">{member.name}</p>
                      <p className="text-muted-foreground text-xs">{member.role}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">{t('team.empty')}</div>
              )}
            </div>
          </div>

          {/* Why trust us */}
          <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
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
    </>
  );
};
