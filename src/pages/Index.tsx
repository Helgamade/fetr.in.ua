import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { AudienceSection } from "@/components/AudienceSection";
import { ProductsSection } from "@/components/ProductsSection";
import { ComparisonSection } from "@/components/ComparisonSection";
import { GallerySection } from "@/components/GallerySection";
import { ReviewsSection } from "@/components/ReviewsSection";
import { FAQSection } from "@/components/FAQSection";
import { InstagramSection } from "@/components/InstagramSection";
import { AboutSection } from "@/components/AboutSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { SocialProof } from "@/components/SocialProof";
import { ChatWidget } from "@/components/ChatWidget";
// import { ExitIntentPopup } from "@/components/ExitIntentPopup"; // временно отключен
import { StickyMobileCTA } from "@/components/StickyMobileCTA";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "@/hooks/useTranslation";
import { useTexts } from "@/hooks/useTexts";

const Index = () => {
  const { t } = useTranslation('index');
  const { data: texts = [] } = useTexts();
  
  // Получаем тексты баннера
  const bannerText1 = texts.find(t => t.key === 'banner.text1')?.value || '🎁 Безкоштовна доставка від 1500 грн';
  const bannerText2 = texts.find(t => t.key === 'banner.text2')?.value || '🚀 Відправка щодня до 17:00';
  const bannerText3 = texts.find(t => t.key === 'banner.text3')?.value || '💝 Подарунок до кожного замовлення';
  return (
    <>
        <Helmet>
          <title>FetrInUA — Набори для творчості з фетру | Купити в Україні</title>
          <meta name="description" content="Творчі набори з фетру для дітей та дорослих. 12+ років досвіду, 3000+ задоволених клієнтів. Швидка доставка по Україні. Замовляйте зараз!" />
          <meta name="keywords" content="фетр, набори для творчості, рукоділля, діти, іграшки з фетру, Україна" />
          <link rel="canonical" href="https://fetr.in.ua" />
        </Helmet>
        
        <div className="min-h-screen bg-background">
          <Header />
          
          <main>
            <HeroSection />
            
            {/* CTA Banner */}
            <section className="bg-gradient-to-r from-primary to-primary/80 py-4">
              <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-center">
                  <p className="text-primary-foreground font-medium">
                    {bannerText1}
                  </p>
                  <p className="text-primary-foreground font-medium">
                    {bannerText2}
                  </p>
                  <p className="text-primary-foreground font-medium">
                    {bannerText3}
                  </p>
                </div>
              </div>
            </section>
            
            <AudienceSection />
            
            <ProductsSection />
            
            {/* Trust Banner */}
            <section className="bg-secondary/30 py-8">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-primary">{t('trust.experience.value') || '12+'}</div>
                    <div className="text-sm text-muted-foreground">{t('trust.experience.label') || 'років досвіду'}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-primary">{t('trust.clients.value') || '3000+'}</div>
                    <div className="text-sm text-muted-foreground">{t('trust.clients.label') || 'щасливих клієнтів'}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-primary">{t('trust.quality.value') || '100%'}</div>
                    <div className="text-sm text-muted-foreground">{t('trust.quality.label') || 'якісні матеріали'}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-primary">{t('trust.support.value') || '24/7'}</div>
                    <div className="text-sm text-muted-foreground">{t('trust.support.label') || 'підтримка'}</div>
                  </div>
                </div>
              </div>
            </section>
            
            <ComparisonSection />
            
            {/* Mid-page CTA */}
            <section className="py-12 bg-gradient-to-br from-accent/20 to-secondary/20">
              <div className="container mx-auto px-4 text-center space-y-4">
                <h2 className="text-2xl md:text-3xl font-display font-bold">
                  {t('cta_mid.title')}
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  {t('cta_mid.subtitle')}
                </p>
                <a 
                  href="#products" 
                  className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors"
                >
                  {t('cta_mid.button')}
                </a>
              </div>
            </section>
            
            <GallerySection />
            <ReviewsSection />
            
            {/* Guarantee Banner */}
            <section className="py-12 bg-muted/30">
              <div className="container mx-auto px-4">
                <div className="bg-card rounded-2xl p-8 shadow-elegant text-center max-w-3xl mx-auto">
                  <div className="text-4xl mb-4">🛡️</div>
                  <h3 className="text-xl font-bold mb-2">{t('guarantee.title')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t('guarantee.text')}
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 text-sm">
                    <span className="flex items-center gap-2">✅ {t('guarantee.safe_payment')}</span>
                    <span className="flex items-center gap-2">✅ {t('guarantee.fast_delivery')}</span>
                    <span className="flex items-center gap-2">✅ {t('guarantee.master_support')}</span>
                  </div>
                </div>
              </div>
            </section>
            
            <FAQSection />
            <InstagramSection />
            <AboutSection />
            
            {/* Final CTA */}
            <section className="py-16 bg-gradient-to-r from-primary via-primary/90 to-accent">
              <div className="container mx-auto px-4 text-center space-y-6">
                <h2 className="text-2xl md:text-4xl font-display font-bold text-primary-foreground">
                  {t('cta_final.title')}
                </h2>
                <p className="text-primary-foreground/90 max-w-2xl mx-auto text-lg">
                  {t('cta_final.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="#products" 
                    className="bg-background text-foreground px-8 py-4 rounded-full font-bold text-lg hover:bg-background/90 transition-colors shadow-lg"
                  >
                    Обрати набір
                  </a>
                  <a 
                    href="#contact" 
                    className="border-2 border-primary-foreground text-primary-foreground px-8 py-4 rounded-full font-bold text-lg hover:bg-primary-foreground/10 transition-colors"
                  >
                    Задати питання
                  </a>
                </div>
              </div>
            </section>
            
            <ContactSection />
          </main>
          
          <Footer />
          <CartDrawer />
          <SocialProof />
          <ChatWidget />
          {/* <ExitIntentPopup /> - временно отключен */}
          <StickyMobileCTA />
        </div>
    </>
  );
};

export default Index;
