import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, CreditCard, Cog, Box, Truck, MapPin, Home, Star, ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface TimelineStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "completed" | "current" | "pending";
}

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order") || "FTR-XXXXXX";

  const timelineSteps: TimelineStep[] = [
    {
      id: "ordered",
      title: "Замовлення оформлено",
      description: "Ваше замовлення успішно створено",
      icon: <CheckCircle className="w-5 h-5" />,
      status: "completed"
    },
    {
      id: "accepted",
      title: "Прийнято",
      description: "Замовлення прийнято в обробку",
      icon: <Package className="w-5 h-5" />,
      status: "current"
    },
    {
      id: "payment",
      title: "Очікує оплату",
      description: "Очікуємо підтвердження оплати",
      icon: <CreditCard className="w-5 h-5" />,
      status: "pending"
    },
    {
      id: "processing",
      title: "Опрацювання",
      description: "Збираємо ваше замовлення",
      icon: <Cog className="w-5 h-5" />,
      status: "pending"
    },
    {
      id: "packed",
      title: "Упаковано",
      description: "Замовлення готове до відправки",
      icon: <Box className="w-5 h-5" />,
      status: "pending"
    },
    {
      id: "shipped",
      title: "Відправлено",
      description: "Передано перевізнику",
      icon: <Truck className="w-5 h-5" />,
      status: "pending"
    },
    {
      id: "in_transit",
      title: "В дорозі",
      description: "Прямує до вашого міста",
      icon: <MapPin className="w-5 h-5" />,
      status: "pending"
    },
    {
      id: "delivered",
      title: "Прибуло",
      description: "Очікує у відділенні",
      icon: <Home className="w-5 h-5" />,
      status: "pending"
    },
    {
      id: "review",
      title: "Залишити відгук",
      description: "Поділіться враженнями",
      icon: <Star className="w-5 h-5" />,
      status: "pending"
    }
  ];

  const getStatusColor = (status: TimelineStep["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white";
      case "current":
        return "bg-primary text-primary-foreground animate-pulse";
      case "pending":
        return "bg-muted text-muted-foreground";
    }
  };

  const getLineColor = (status: TimelineStep["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "current":
        return "bg-gradient-to-b from-green-500 to-muted";
      case "pending":
        return "bg-muted";
    }
  };

  return (
    <>
      <Helmet>
        <title>Дякуємо за замовлення! | FetrInUA</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-green-50 to-background">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white py-12">
          <div className="container mx-auto px-4 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Дякуємо за замовлення!</h1>
            <p className="text-green-100">Ваше замовлення успішно оформлено</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Order Info Card */}
          <div className="bg-card rounded-2xl p-6 shadow-elegant -mt-8 relative z-10 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Номер замовлення</div>
                <div className="text-xl font-bold font-mono">{orderId}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Статус</div>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  Обробляється
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <h2 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Інформація про оплату
            </h2>
            <p className="text-amber-700 text-sm mb-4">
              Для завершення замовлення переведіть суму на картку:
            </p>
            <div className="bg-white rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Картка ПриватБанк:</span>
                <span className="font-mono font-bold">5168 XXXX XXXX XXXX</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Отримувач:</span>
                <span className="font-medium">Петренко О.В.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Призначення:</span>
                <span className="font-medium">Замовлення {orderId}</span>
              </div>
            </div>
            <p className="text-xs text-amber-600 mt-3">
              Після оплати надішліть скріншот у Telegram або Viber для швидкого підтвердження
            </p>
          </div>

          {/* Timeline */}
          <div className="bg-card rounded-2xl p-6 shadow-soft mb-8">
            <h2 className="font-bold text-lg mb-6">Статус замовлення</h2>
            
            <div className="space-y-0">
              {timelineSteps.map((step, index) => (
                <div key={step.id} className="flex gap-4">
                  {/* Icon & Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(step.status)}`}>
                      {step.icon}
                    </div>
                    {index < timelineSteps.length - 1 && (
                      <div className={`w-0.5 h-12 ${getLineColor(step.status)}`} />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="pb-8">
                    <div className={`font-medium ${step.status === "pending" ? "text-muted-foreground" : ""}`}>
                      {step.title}
                    </div>
                    <div className="text-sm text-muted-foreground">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-card rounded-2xl p-6 shadow-soft mb-8">
            <h2 className="font-bold text-lg mb-4">Що далі?</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                <span className="text-sm">Оплатіть замовлення (якщо обрали передоплату)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                <span className="text-sm">Очікуйте SMS або дзвінок від нашого менеджера</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                <span className="text-sm">Отримайте ТТН для відстеження посилки</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                <span className="text-sm">Заберіть набір та творіть з задоволенням! 🎨</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="bg-secondary/30 rounded-2xl p-6 text-center mb-8">
            <h3 className="font-bold mb-2">Маєте питання?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Зв'яжіться з нами у зручний спосіб
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full">
                📞 +380 XX XXX XX XX
              </Button>
              <Button variant="outline" size="sm" className="rounded-full">
                💬 Telegram
              </Button>
              <Button variant="outline" size="sm" className="rounded-full">
                📱 Viber
              </Button>
            </div>
          </div>

          {/* Back to Shop */}
          <div className="text-center">
            <Link to="/">
              <Button className="rounded-full" size="lg">
                Повернутися до магазину
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-muted/50 py-6 mt-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">
              Дякуємо, що обрали FetrInUA! 💝<br />
              Ми цінуємо вашу довіру
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ThankYou;
