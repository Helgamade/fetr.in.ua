import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/404') {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>Сторінку не знайдено — FetrInUA</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center max-w-lg mx-auto">
            {/* Big 404 */}
            <div className="relative mb-8 select-none">
              <span className="text-[10rem] font-heading font-bold leading-none text-primary/10">
                404
              </span>
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="w-16 h-16 text-primary/40" strokeWidth={1.5} />
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
              Сторінку не знайдено
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Схоже, ця сторінка переїхала або її ніколи не існувало.
              Але у нас є багато чудових наборів для творчості! 🧵
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/">
                  <Home className="w-4 h-4" />
                  На головну
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link to="/#products">
                  <ArrowLeft className="w-4 h-4" />
                  До каталогу
                </Link>
              </Button>
            </div>

            <p className="mt-8 text-sm text-muted-foreground/60">
              {location.pathname}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default NotFound;
