import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { usePage } from '@/hooks/usePages';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useEffect } from 'react';

export default function Page() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, error } = usePage(slug || '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Сторінку не знайдено</h1>
              <p className="text-muted-foreground mb-4">
                Сторінка, яку ви шукаєте, не існує або була видалена.
              </p>
              <a href="/" className="text-primary underline hover:text-primary/90">
                Повернутися на головну
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Очистка HTML контента для безопасности
  const sanitizedContent = page.content ? DOMPurify.sanitize(page.content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <article>
              <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
              <div
                className="prose prose-lg max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />
            </article>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

