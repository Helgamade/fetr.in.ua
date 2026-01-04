import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { usePage } from '@/hooks/usePages';
import { Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { SocialProof } from '@/components/SocialProof';
import { ChatWidget } from '@/components/ChatWidget';
import { ExitIntentPopup } from '@/components/ExitIntentPopup';
import { StickyMobileCTA } from '@/components/StickyMobileCTA';

export default function Page() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, error } = usePage(slug || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-20">
          <div className="container-tight">
            <div className="text-center py-20">
              <h1 className="text-4xl font-heading font-bold text-foreground mb-4">Сторінку не знайдено</h1>
              <p className="text-lg text-muted-foreground mb-6">
                Сторінка, яку ви шукаєте, не існує або була видалена.
              </p>
              <a href="/" className="text-primary font-medium hover:underline">
                Повернутися на головну
              </a>
            </div>
          </div>
        </main>
        <Footer />
        <CartDrawer />
        <SocialProof />
        <ChatWidget />
        <ExitIntentPopup />
        <StickyMobileCTA />
      </div>
    );
  }

  // Очистка HTML контента для безопасности
  const sanitizedContent = page.content ? DOMPurify.sanitize(page.content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'hr', 'div', 'span', 'dl', 'dt', 'dd', 'figure', 'figcaption'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style'],
  }) : '';

  return (
    <>
      <Helmet>
        <title>{page.meta_title || page.title}</title>
        <meta name="description" content={page.meta_description || page.title} />
        <meta property="og:title" content={page.meta_title || page.title} />
        <meta property="og:description" content={page.meta_description || page.title} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={page.meta_title || page.title} />
        <meta name="twitter:description" content={page.meta_description || page.title} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-24 pb-20">
          <section style={{ paddingTop: '1rem', paddingBottom: '5rem' }}>
            <div className="container-tight">
              <article className="max-w-4xl mx-auto">
                {/* Заголовок страницы */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-6">
                  {page.title}
                </h1>
                
                {/* Контент страницы с правильными стилями */}
                <div 
                  className="prose prose-lg max-w-none 
                    prose-headings:font-heading prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight
                    prose-h1:text-4xl prose-h1:sm:text-5xl prose-h1:lg:text-6xl prose-h1:mb-6 prose-h1:mt-8 prose-h1:font-heading prose-h1:font-bold
                    prose-h2:text-3xl prose-h2:sm:text-4xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:font-heading prose-h2:font-bold
                    prose-h3:text-2xl prose-h3:sm:text-3xl prose-h3:mb-3 prose-h3:mt-6 prose-h3:font-heading prose-h3:font-bold
                    prose-h4:text-xl prose-h4:sm:text-2xl prose-h4:mb-2 prose-h4:mt-4 prose-h4:font-heading prose-h4:font-bold
                    prose-h5:text-lg prose-h5:sm:text-xl prose-h5:mb-2 prose-h5:mt-4 prose-h5:font-heading prose-h5:font-bold
                    prose-h6:text-base prose-h6:sm:text-lg prose-h6:mb-2 prose-h6:mt-3 prose-h6:font-heading prose-h6:font-bold
                    prose-p:text-lg prose-p:text-foreground prose-p:mb-4 prose-p:mt-0 prose-p:font-body
                    prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-foreground prose-strong:font-bold
                    prose-em:text-foreground prose-em:italic
                    prose-ul:text-lg prose-ul:text-foreground prose-ul:mb-4 prose-ul:mt-4 prose-ul:font-body
                    prose-ol:text-lg prose-ol:text-foreground prose-ol:mb-4 prose-ol:mt-4 prose-ol:font-body
                    prose-li:text-foreground prose-li:mb-2 prose-li:mt-0 prose-li:font-body
                    prose-img:rounded-lg prose-img:my-6
                    prose-hr:border-t prose-hr:border-border prose-hr:my-8 prose-hr:mt-8 prose-hr:mb-8
                    prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:pr-4 prose-blockquote:py-4 prose-blockquote:my-6 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:font-body prose-blockquote:bg-muted/30
                    prose-pre:bg-muted prose-pre:text-foreground prose-pre:p-4 prose-pre:rounded-lg prose-pre:my-6 prose-pre:overflow-x-auto
                    prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono
                    prose-dl:my-6
                    prose-dt:font-bold prose-dt:text-foreground prose-dt:mb-2 prose-dt:mt-4
                    prose-dd:text-foreground prose-dd:mb-4 prose-dd:ml-4
                    prose-figure:my-6
                    prose-figcaption:text-sm prose-figcaption:text-muted-foreground prose-figcaption:mt-2 prose-figcaption:text-center
                    dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
              </article>
            </div>
          </section>
        </main>
        
        <Footer />
        <CartDrawer />
        <SocialProof />
        <ChatWidget />
        <ExitIntentPopup />
        <StickyMobileCTA />
      </div>
    </>
  );
}
