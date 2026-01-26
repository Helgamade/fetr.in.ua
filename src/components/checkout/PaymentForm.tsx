import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, Pencil } from "lucide-react";
import { CODPaymentLogo, WayForPayLogo, FOPPaymentLogo } from "@/components/PaymentLogos";
import { useTexts, SiteText } from "@/hooks/useTexts";
import type { PaymentInfo } from "@/types/store";

interface PaymentFormProps {
  payment: PaymentInfo;
  deliveryMethod?: 'nova_poshta' | 'ukrposhta' | 'pickup';
  onSave: (payment: PaymentInfo) => void;
  onCancel?: () => void;
  mode?: 'edit' | 'view';
  defaultExpanded?: boolean;
}

export const PaymentForm = ({
  payment: initialPayment,
  deliveryMethod,
  onSave,
  onCancel,
  mode = 'view',
  defaultExpanded = false,
}: PaymentFormProps) => {
  const { data: textsData } = useTexts();
  const texts: SiteText[] = Array.isArray(textsData) ? textsData : [];
  
  const paymentWayForPayTitle = texts.find(t => t.key === 'checkout.payment.wayforpay.title')?.value || 'Онлайн оплата';
  const paymentWayForPayDescription = texts.find(t => t.key === 'checkout.payment.wayforpay.description')?.value || 'Безпечна оплата карткою через WayForPay';
  const paymentNalojkaTitle = texts.find(t => t.key === 'checkout.payment.nalojka.title')?.value || 'Оплата при отриманні';
  const paymentFopTitle = texts.find(t => t.key === 'checkout.payment.fop.title')?.value || 'Оплата на рахунок ФОП';
  const paymentFopDescription = texts.find(t => t.key === 'checkout.payment.fop.description')?.value || 'Оплата на банківський рахунок ФОП';

  const paymentNalojkaDescription = () => {
    if (deliveryMethod === 'nova_poshta') {
      return 'Післяплата (комісія 2% + 20 грн)';
    } else if (deliveryMethod === 'ukrposhta') {
      return 'Післяплата (комісія 2% + 15 грн)';
    } else if (deliveryMethod === 'pickup') {
      return 'Оплата готівкою при отриманні замовлення';
    }
    return texts.find(t => t.key === 'checkout.payment.nalojka.description')?.value || 'Оплата при отриманні (+20 грн комісія)';
  };

  const [isExpanded, setIsExpanded] = useState(defaultExpanded || mode === 'edit');
  const [paymentMethod, setPaymentMethod] = useState(initialPayment.method);

  const handleSave = () => {
    if (!paymentMethod) return;

    const payment: PaymentInfo = {
      method: paymentMethod as 'wayforpay' | 'nalojka' | 'fopiban',
      status: initialPayment.status,
      paidAmount: initialPayment.paidAmount,
    };

    onSave(payment);
    if (mode === 'view') {
      setIsExpanded(false);
    }
  };

  const handleCancel = () => {
    setPaymentMethod(initialPayment.method);
    if (mode === 'view') {
      setIsExpanded(false);
    }
    onCancel?.();
  };

  const getPaymentLabel = (method: string) => {
    if (method === 'wayforpay') return paymentWayForPayTitle;
    if (method === 'nalojka') return paymentNalojkaTitle;
    if (method === 'fopiban') return paymentFopTitle;
    return '';
  };

  const getPaymentDescription = (method: string) => {
    if (method === 'wayforpay') return paymentWayForPayDescription;
    if (method === 'nalojka') return paymentNalojkaDescription();
    if (method === 'fopiban') return paymentFopDescription;
    return '';
  };

  const getPaymentLogo = (method: string) => {
    if (method === 'wayforpay') return <WayForPayLogo className="w-5 h-5" />;
    if (method === 'nalojka') return <CODPaymentLogo className="w-5 h-5" />;
    if (method === 'fopiban') return <FOPPaymentLogo className="w-5 h-5" />;
    return null;
  };

  if (mode === 'view' && !isExpanded) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium flex items-center gap-2">
            {getPaymentLogo(initialPayment.method)}
            {getPaymentLabel(initialPayment.method)}
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="text-muted-foreground hover:text-primary"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
        <div className="text-sm text-muted-foreground">{getPaymentDescription(initialPayment.method)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RadioGroup
        value={paymentMethod}
        onValueChange={(value) => setPaymentMethod(value)}
        className="space-y-3"
      >
        <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:border-primary transition-colors">
          <RadioGroupItem value="wayforpay" id="wayforpay" />
          <div>
            <div className="font-medium flex items-center gap-2">
              <WayForPayLogo className="w-5 h-5" />
              {paymentWayForPayTitle}
            </div>
            <div className="text-sm text-muted-foreground">{paymentWayForPayDescription}</div>
          </div>
        </label>
        <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:border-primary transition-colors">
          <RadioGroupItem value="nalojka" id="nalojka" />
          <div>
            <div className="font-medium flex items-center gap-2">
              <CODPaymentLogo className="w-5 h-5" />
              {paymentNalojkaTitle}
            </div>
            <div className="text-sm text-muted-foreground">{paymentNalojkaDescription()}</div>
          </div>
        </label>
        <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:border-primary transition-colors">
          <RadioGroupItem value="fopiban" id="fopiban" />
          <div>
            <div className="font-medium flex items-center gap-2">
              <FOPPaymentLogo className="w-5 h-5" />
              {paymentFopTitle}
            </div>
            <div className="text-sm text-muted-foreground">{paymentFopDescription}</div>
          </div>
        </label>
      </RadioGroup>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!paymentMethod}
          onClick={handleSave}
          className="flex-1 rounded-xl"
        >
          Зберегти
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            className="flex-1 rounded-xl"
          >
            Скасувати
          </Button>
        )}
      </div>
    </div>
  );
};
