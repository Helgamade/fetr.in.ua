import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useFAQs } from '@/hooks/useFAQs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTranslation } from '@/hooks/useTranslation';
import { usePublicSettings } from '@/hooks/usePublicSettings';

export const FAQSection: React.FC = () => {
  const { t } = useTranslation('faq');
  const { data: faqs = [], isLoading } = useFAQs();
  const { data: settings = {} } = usePublicSettings();
  const storePhone = settings.store_phone || '+380501234567';

  return (
    <section id="faq" className="py-20">
      <div className="container-tight">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{t('badge')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('loading')}
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                value={faq.id}
                className="glass-card px-6 border-0 data-[state=open]:shadow-medium transition-shadow"
              >
                <AccordionTrigger className="hover:no-underline py-5">
                  <span className="text-left font-heading font-semibold pr-4">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center p-6 rounded-2xl bg-sage/50">
          <p className="text-lg font-medium text-foreground mb-2">
            {t('cta.title')}
          </p>
          <p className="text-muted-foreground">
            Напишіть нам у <a href="https://instagram.com/helgamade_ua" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">Instagram</a> або зателефонуйте за номером <a href={`tel:${storePhone.replace(/\s/g, '')}`} className="text-primary font-medium hover:underline">{storePhone}</a>
          </p>
        </div>
      </div>
    </section>
  );
};
