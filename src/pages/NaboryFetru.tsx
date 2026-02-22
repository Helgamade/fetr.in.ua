import DOMPurify from 'dompurify';
import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { SocialProof } from '@/components/SocialProof';
import { ChatWidget } from '@/components/ChatWidget';
import { StickyMobileCTA } from '@/components/StickyMobileCTA';
import { ProductsSection } from '@/components/ProductsSection';
import { useOptionalPage } from '@/hooks/usePages';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'a', 'img', 'blockquote',
  'code', 'pre', 'hr', 'div', 'span',
  'dl', 'dt', 'dd', 'figure', 'figcaption',
];
const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'class', 'style'];

const PROSE_CLASSES = `prose prose-lg max-w-none
  prose-headings:font-heading prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight
  prose-h1:text-[36px] prose-h1:font-heading prose-h1:font-bold
  prose-h2:text-[24px] prose-h2:font-heading prose-h2:font-semibold
  prose-h3:text-[16px] prose-h3:font-heading prose-h3:font-bold
  prose-h4:text-[14px] prose-h4:font-heading prose-h4:font-bold
  prose-p:text-lg prose-p:text-foreground prose-p:font-body
  prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
  prose-strong:text-foreground prose-strong:font-bold
  prose-em:text-foreground prose-em:italic
  prose-ul:text-lg prose-ul:text-foreground prose-ul:font-body
  prose-ol:text-lg prose-ol:text-foreground prose-ol:font-body
  prose-li:text-foreground prose-li:font-body
  prose-img:rounded-lg prose-img:my-6
  prose-hr:border-t prose-hr:border-border
  prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:pr-4 prose-blockquote:py-4 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:font-body prose-blockquote:bg-muted/30
  prose-pre:bg-muted prose-pre:text-foreground prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
  prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono
  dark:prose-invert`;

function OptionalPageContent({ slug }: { slug: string }) {
  const { data: page } = useOptionalPage(slug);

  if (!page?.content) return null;

  const sanitized = DOMPurify.sanitize(page.content, { ALLOWED_TAGS, ALLOWED_ATTR });
  if (!sanitized) return null;

  return (
    <div className="container-tight py-8">
      {page.title && (
        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-4">
          {page.title}
        </h2>
      )}
      <div
        className={PROSE_CLASSES}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    </div>
  );
}

export default function NaboryFetru() {
  return (
    <>
      <Helmet>
        <title>Набори фетру — FetrInUA</title>
        <meta name="description" content="Набори для творчості з фетру. Стартовий, Оптимальний та Преміум набори. Купити в Україні." />
        <meta property="og:title" content="Набори фетру — FetrInUA" />
        <meta property="og:description" content="Набори для творчості з фетру. Стартовий, Оптимальний та Преміум набори. Купити в Україні." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://fetr.in.ua/nabory-fetru/" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-16">
          {/* Текст выше наборов — управляется через Pages admin (slug: nabory-fetru-above) */}
          <OptionalPageContent slug="nabory-fetru-above" />

          <ProductsSection />

          {/* Текст ниже наборов — управляется через Pages admin (slug: nabory-fetru-below) */}
          <OptionalPageContent slug="nabory-fetru-below" />
        </main>

        <Footer />
        <CartDrawer />
        <SocialProof />
        <ChatWidget />
        <StickyMobileCTA />
      </div>
    </>
  );
}
