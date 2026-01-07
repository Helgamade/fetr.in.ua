import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/hooks/useProducts";
import { ordersAPI, promoAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Package, CreditCard, Truck, MapPin, Phone, Mail, User, CheckCircle, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { toast } from "@/hooks/use-toast";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { NovaPoshtaDelivery } from "@/components/NovaPoshtaDelivery";
import { UkrPoshtaDelivery } from "@/components/UkrPoshtaDelivery";
import { NovaPoshtaLogo, UkrposhtaLogo, PickupLogo } from "@/components/DeliveryLogos";
import { CODPaymentLogo, WayForPayLogo, FOPPaymentLogo } from "@/components/PaymentLogos";
import type { NovaPoshtaCity, NovaPoshtaWarehouse, UkrposhtaCity, UkrposhtaBranch } from "@/lib/api";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getSubtotal, getDiscount, getDeliveryCost, getTotal, clearCart } = useCart();
  const { data: products = [] } = useProducts();
  const { data: storeSettings = {} } = usePublicSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('checkoutFormData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(prev => ({
          ...prev,
          name: parsed.name || prev.name,
          firstName: parsed.firstName || prev.firstName,
          lastName: parsed.lastName || prev.lastName,
          phone: parsed.phone || prev.phone || "",
          deliveryExpanded: parsed.deliveryExpanded !== undefined ? parsed.deliveryExpanded : true,
          contactInfoCompleted: parsed.contactInfoCompleted || false,
          contactInfoExpanded: parsed.contactInfoExpanded !== undefined ? parsed.contactInfoExpanded : true,
          paymentMethod: parsed.paymentMethod || prev.paymentMethod || "",
          paymentCompleted: parsed.paymentCompleted || false,
          paymentExpanded: parsed.paymentExpanded !== undefined ? parsed.paymentExpanded : true,
          deliveryMethod: parsed.deliveryMethod || prev.deliveryMethod,
          novaPoshtaCity: parsed.novaPoshtaCity || prev.novaPoshtaCity,
          novaPoshtaCityRef: parsed.novaPoshtaCityRef || prev.novaPoshtaCityRef,
          novaPoshtaPostOfficeWarehouse: parsed.novaPoshtaPostOfficeWarehouse || prev.novaPoshtaPostOfficeWarehouse,
          novaPoshtaPostOfficeWarehouseRef: parsed.novaPoshtaPostOfficeWarehouseRef || prev.novaPoshtaPostOfficeWarehouseRef,
          novaPoshtaPostOfficeCompleted: parsed.novaPoshtaPostOfficeCompleted || false,
          novaPoshtaPostomatWarehouse: parsed.novaPoshtaPostomatWarehouse || prev.novaPoshtaPostomatWarehouse,
          novaPoshtaPostomatWarehouseRef: parsed.novaPoshtaPostomatWarehouseRef || prev.novaPoshtaPostomatWarehouseRef,
          novaPoshtaPostomatCompleted: parsed.novaPoshtaPostomatCompleted || false,
          novaPoshtaDeliveryType: parsed.novaPoshtaDeliveryType || prev.novaPoshtaDeliveryType,
          novaPoshtaExpanded: false, // Всегда свернуто при загрузке
          ukrPoshtaCity: parsed.ukrPoshtaCity || prev.ukrPoshtaCity,
          ukrPoshtaCityId: parsed.ukrPoshtaCityId || prev.ukrPoshtaCityId,
          ukrPoshtaCityRegion: parsed.ukrPoshtaCityRegion || prev.ukrPoshtaCityRegion,
          ukrPoshtaBranch: parsed.ukrPoshtaBranch || prev.ukrPoshtaBranch,
          ukrPoshtaBranchId: parsed.ukrPoshtaBranchId || prev.ukrPoshtaBranchId,
          ukrPoshtaPostalCode: parsed.ukrPoshtaPostalCode || prev.ukrPoshtaPostalCode,
          ukrPoshtaAddress: parsed.ukrPoshtaAddress || prev.ukrPoshtaAddress,
          ukrPoshtaExpanded: false, // Всегда свернуто при загрузке
          ukrPoshtaCompleted: parsed.ukrPoshtaCompleted || false,
          pickupExpanded: false, // Всегда свернуто при загрузке
          pickupCompleted: parsed.pickupCompleted || false,
          comment: parsed.comment || prev.comment || "",
          commentExpanded: parsed.commentExpanded !== undefined ? parsed.commentExpanded : false,
        }));
      } catch (error) {
        console.error('Error loading checkout form data from localStorage:', error);
      }
    }
  }, []);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    name: "", // Объединенное имя для отправки на сервер
    phone: "",
    hasDifferentRecipient: false, // Чекбокс "Інший отримувач замовлення"
    recipientFirstName: "",
    recipientLastName: "",
    recipientPhone: "",
    paymentMethod: "",
    paymentCompleted: false,
    paymentExpanded: true,
    deliveryMethod: "",
    // Данные для Нова Пошта - город общий, отделения/поштоматы отдельно
    novaPoshtaCity: "",
    novaPoshtaCityRef: null as string | null,
    novaPoshtaPostOfficeWarehouse: "",
    novaPoshtaPostOfficeWarehouseRef: null as string | null,
    novaPoshtaPostOfficeCompleted: false,
    novaPoshtaPostomatWarehouse: "",
    novaPoshtaPostomatWarehouseRef: null as string | null,
    novaPoshtaPostomatCompleted: false,
    novaPoshtaDeliveryType: "PostOffice" as "PostOffice" | "Postomat",
    novaPoshtaExpanded: false as boolean | undefined, // По умолчанию свернуто
    // Данные для Укрпошта - по аналогии с Новой Почтой (только строки и ID)
    ukrPoshtaCity: "",
    ukrPoshtaCityId: null as string | null,
    ukrPoshtaCityRegion: "", // Область для отображения города с областью
    ukrPoshtaBranch: "",
    ukrPoshtaBranchId: null as string | null,
    ukrPoshtaPostalCode: "",
    ukrPoshtaAddress: "",
    ukrPoshtaExpanded: false,
    ukrPoshtaCompleted: false,
    // Данные для Самовывоза
    pickupExpanded: false,
    pickupCompleted: false,
    comment: "",
    commentExpanded: false,
    contactInfoCompleted: false,
    contactInfoExpanded: true,
    deliveryExpanded: true
  });

  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const [lastNameTouched, setLastNameTouched] = useState(false);
  const [lastNameError, setLastNameError] = useState("");
  const [firstNameTouched, setFirstNameTouched] = useState(false);
  const [firstNameError, setFirstNameError] = useState("");
  // Состояния для полей получателя
  const [recipientPhoneTouched, setRecipientPhoneTouched] = useState(false);
  const [recipientPhoneError, setRecipientPhoneError] = useState("");
  const recipientPhoneInputRef = useRef<HTMLInputElement>(null);
  const [recipientLastNameTouched, setRecipientLastNameTouched] = useState(false);
  const [recipientLastNameError, setRecipientLastNameError] = useState("");
  const [recipientFirstNameTouched, setRecipientFirstNameTouched] = useState(false);
  const [recipientFirstNameError, setRecipientFirstNameError] = useState("");
  
  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [promoCodeExpanded, setPromoCodeExpanded] = useState(false);
  const [promoCodeApplied, setPromoCodeApplied] = useState<{ code: string; discount: number; message: string } | null>(null);
  const [promoCodeError, setPromoCodeError] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  
  // Rules and recipient sections state
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [recipientExpanded, setRecipientExpanded] = useState(false);
  
  // Refs для скролла к блокам
  const contactInfoRef = useRef<HTMLDivElement>(null);
  const deliveryRef = useRef<HTMLDivElement>(null);
  const paymentRef = useRef<HTMLDivElement>(null);

  const validatePhone = (phone: string): boolean => {
    // Убираем все символы кроме цифр
    const digitsOnly = phone.replace(/\D/g, '');
    // Проверяем что номер начинается с 380 и имеет правильную длину (12 цифр для +380XXXXXXXXX)
    if (digitsOnly.length === 0) {
      setPhoneError("Це обов'язкове поле");
      return false;
    }
    if (digitsOnly.length < 12 || !digitsOnly.startsWith('380')) {
      setPhoneError("Некоректний номер");
      return false;
    }
    setPhoneError("");
    return true;
  };

  // Форматирование телефона - просто +380 и цифры
  const formatPhone = (value: string): string => {
    // Убираем все символы кроме цифр
    const digitsOnly = value.replace(/\D/g, '');
    
    // Всегда начинаем с 380
    let phoneDigits = digitsOnly;
    if (!phoneDigits.startsWith('380')) {
      phoneDigits = '380' + phoneDigits;
    }
    
    // Ограничиваем длину до 12 цифр (380XXXXXXXXX)
    phoneDigits = phoneDigits.slice(0, 12);
    
    // Просто возвращаем +380 и цифры
    if (phoneDigits.length <= 3) {
      return '+' + phoneDigits;
    } else {
      return '+' + phoneDigits;
    }
  };

  // Валидация кириллицы и тире
  const validateCyrillic = (value: string): boolean => {
    // Разрешаем только кириллицу, пробелы и тире
    const cyrillicRegex = /^[а-яА-ЯіІїЇєЄґҐ\s-]+$/;
    return cyrillicRegex.test(value);
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const previousValue = formData.lastName;
    
    // Проверяем валидность нового значения
    if (value === "" || validateCyrillic(value)) {
      setFormData(prev => ({ ...prev, lastName: value }));
      setLastNameTouched(true);
      if (value.trim() === "") {
        setLastNameError("Це обов'язкове поле");
      } else {
        setLastNameError("");
      }
    } else {
      // Если пытаются ввести невалидный символ, показываем ошибку
      setLastNameTouched(true);
      setLastNameError("Використовуйте тільки кириличні символи");
      // Не обновляем значение, но показываем ошибку
    }
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const previousValue = formData.firstName;
    
    // Проверяем валидность нового значения
    if (value === "" || validateCyrillic(value)) {
      setFormData(prev => ({ ...prev, firstName: value }));
      setFirstNameTouched(true);
      if (value.trim() === "") {
        setFirstNameError("Це обов'язкове поле");
      } else {
        setFirstNameError("");
      }
    } else {
      // Если пытаются ввести невалидный символ, показываем ошибку
      setFirstNameTouched(true);
      setFirstNameError("Використовуйте тільки кириличні символи");
      // Не обновляем значение, но показываем ошибку
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPosition = input.selectionStart || 0;
    const inputValue = input.value;
    
    // Получаем только цифры из ввода
    const digitsOnly = inputValue.replace(/\D/g, '');
    
    // Всегда начинаем с 380
    let phoneDigits = digitsOnly;
    if (phoneDigits && !phoneDigits.startsWith('380')) {
      phoneDigits = '380' + phoneDigits;
    }
    
    // Ограничиваем до 12 цифр
    phoneDigits = phoneDigits.slice(0, 12);
    
    // Если ничего не осталось, сбрасываем
    if (phoneDigits.length <= 3) {
      setFormData(prev => ({ ...prev, phone: "" }));
      if (phoneTouched) {
        validatePhone("");
      }
      return;
    }
    
    // Форматируем (просто +380 и цифры)
    const formatted = '+' + phoneDigits;
    
    // Вычисляем позицию курсора
    const digitsBeforeCursor = inputValue.slice(0, cursorPosition).replace(/\D/g, '').length;
    
    // Новая позиция курсора - после префикса +380 или в конце
    let newCursorPosition = 4; // Позиция после "+380"
    
    if (digitsBeforeCursor > 3) {
      // Количество цифр после префикса "380"
      const digitsAfterPrefix = digitsBeforeCursor - 3;
      newCursorPosition = 4 + digitsAfterPrefix;
    }
    
    // Если все цифры введены, ставим курсор в конец
    if (digitsBeforeCursor >= phoneDigits.length) {
      newCursorPosition = formatted.length;
    }
    
    setFormData(prev => ({ ...prev, phone: formatted }));
    
    // Устанавливаем позицию курсора
    setTimeout(() => {
      if (phoneInputRef.current) {
        phoneInputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
    
    if (phoneTouched || formatted.length > 4) {
      validatePhone(formatted);
    }
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // При нажатии Backspace внутри префикса "+380", блокируем удаление
    if (e.key === 'Backspace') {
      const input = e.currentTarget;
      const cursorPosition = input.selectionStart || 0;
      
      // Если курсор внутри или перед "+380", блокируем удаление
      if (cursorPosition <= 4) {
        e.preventDefault();
        return;
      }
    }
    
    // При нажатии Delete внутри префикса, блокируем
    if (e.key === 'Delete') {
      const input = e.currentTarget;
      const cursorPosition = input.selectionStart || 0;
      
      if (cursorPosition < 4) {
        e.preventDefault();
        return;
      }
    }
  };

  const handlePhoneFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Если телефон уже введен, ставим курсор в конец, иначе после "+380"
    setTimeout(() => {
      if (phoneInputRef.current) {
        const phone = formData.phone === "" ? "+380" : formData.phone;
        if (phone.length > 4) {
          // Если номер уже введен, ставим курсор в конец
          phoneInputRef.current.setSelectionRange(phone.length, phone.length);
        } else {
          // Иначе ставим после "+380"
          phoneInputRef.current.setSelectionRange(4, 4);
        }
      }
    }, 0);
  };
  
  const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // При потере фокуса, если поле пустое, очищаем значение для плейсхолдера
    if (formData.phone === "" || formData.phone === "+380") {
      setFormData(prev => ({ ...prev, phone: "" }));
    }
    setPhoneTouched(true);
    validatePhone(formData.phone === "" || formData.phone === "+380" ? "" : formData.phone);
  };

  // Обработчики для полей получателя
  const handleRecipientLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || validateCyrillic(value)) {
      setFormData(prev => ({ ...prev, recipientLastName: value }));
      setRecipientLastNameTouched(true);
      if (value.trim() === "") {
        setRecipientLastNameError("Це обов'язкове поле");
      } else {
        setRecipientLastNameError("");
      }
    } else {
      setRecipientLastNameTouched(true);
      setRecipientLastNameError("Використовуйте тільки кириличні символи");
    }
  };

  const handleRecipientFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || validateCyrillic(value)) {
      setFormData(prev => ({ ...prev, recipientFirstName: value }));
      setRecipientFirstNameTouched(true);
      if (value.trim() === "") {
        setRecipientFirstNameError("Це обов'язкове поле");
      } else {
        setRecipientFirstNameError("");
      }
    } else {
      setRecipientFirstNameTouched(true);
      setRecipientFirstNameError("Використовуйте тільки кириличні символи");
    }
  };

  const handleRecipientPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPosition = input.selectionStart || 0;
    const inputValue = input.value;
    
    const digitsOnly = inputValue.replace(/\D/g, '');
    let phoneDigits = digitsOnly;
    if (phoneDigits && !phoneDigits.startsWith('380')) {
      phoneDigits = '380' + phoneDigits;
    }
    phoneDigits = phoneDigits.slice(0, 12);
    
    if (phoneDigits.length <= 3) {
      setFormData(prev => ({ ...prev, recipientPhone: "" }));
      if (recipientPhoneTouched) {
        validatePhone("");
      }
      return;
    }
    
    const formatted = '+' + phoneDigits;
    const digitsBeforeCursor = inputValue.slice(0, cursorPosition).replace(/\D/g, '').length;
    let newCursorPosition = 4;
    
    if (digitsBeforeCursor > 3) {
      const digitsAfterPrefix = digitsBeforeCursor - 3;
      newCursorPosition = 4 + digitsAfterPrefix;
    }
    
    if (digitsBeforeCursor >= phoneDigits.length) {
      newCursorPosition = formatted.length;
    }
    
    setFormData(prev => ({ ...prev, recipientPhone: formatted }));
    
    setTimeout(() => {
      if (recipientPhoneInputRef.current) {
        recipientPhoneInputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
    
    if (recipientPhoneTouched || formatted.length > 4) {
      validatePhone(formatted);
    }
  };

  const handleRecipientPhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const input = e.currentTarget;
      const cursorPosition = input.selectionStart || 0;
      if (cursorPosition <= 4) {
        e.preventDefault();
        return;
      }
    }
    if (e.key === 'Delete') {
      const input = e.currentTarget;
      const cursorPosition = input.selectionStart || 0;
      if (cursorPosition < 4) {
        e.preventDefault();
        return;
      }
    }
  };

  const handleRecipientPhoneFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      if (recipientPhoneInputRef.current) {
        const phone = formData.recipientPhone === "" ? "+380" : formData.recipientPhone;
        if (phone.length > 4) {
          recipientPhoneInputRef.current.setSelectionRange(phone.length, phone.length);
        } else {
          recipientPhoneInputRef.current.setSelectionRange(4, 4);
        }
      }
    }, 0);
  };
  
  const handleRecipientPhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (formData.recipientPhone === "" || formData.recipientPhone === "+380") {
      setFormData(prev => ({ ...prev, recipientPhone: "" }));
    }
    setRecipientPhoneTouched(true);
    validatePhone(formData.recipientPhone === "" || formData.recipientPhone === "+380" ? "" : formData.recipientPhone);
  };

  const isPhoneValid = (formData.phone === "" || formData.phone === "+380" ? "" : formData.phone).replace(/\D/g, '').length === 12 && (formData.phone === "" || formData.phone === "+380" ? "" : formData.phone).replace(/\D/g, '').startsWith('380');
  
  const isLastNameValid = formData.lastName.trim() !== "" && validateCyrillic(formData.lastName);
  const isFirstNameValid = formData.firstName.trim() !== "" && validateCyrillic(formData.firstName);
  
  // Валидация для полей получателя (только если чекбокс включен)
  const isRecipientPhoneValid = !formData.hasDifferentRecipient || ((formData.recipientPhone === "" || formData.recipientPhone === "+380" ? "" : formData.recipientPhone).replace(/\D/g, '').length === 12 && (formData.recipientPhone === "" || formData.recipientPhone === "+380" ? "" : formData.recipientPhone).replace(/\D/g, '').startsWith('380'));
  const isRecipientLastNameValid = !formData.hasDifferentRecipient || (formData.recipientLastName.trim() !== "" && validateCyrillic(formData.recipientLastName));
  const isRecipientFirstNameValid = !formData.hasDifferentRecipient || (formData.recipientFirstName.trim() !== "" && validateCyrillic(formData.recipientFirstName));
  const isRecipientInfoValid = !formData.hasDifferentRecipient || (isRecipientPhoneValid && isRecipientLastNameValid && isRecipientFirstNameValid);
  
  const isContactInfoValid = isPhoneValid && isLastNameValid && isFirstNameValid && isRecipientInfoValid;

  // Save to localStorage whenever formData changes
  useEffect(() => {
    const dataToSave = {
      name: formData.name,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      hasDifferentRecipient: formData.hasDifferentRecipient,
      recipientFirstName: formData.recipientFirstName,
      recipientLastName: formData.recipientLastName,
      recipientPhone: formData.recipientPhone,
      contactInfoCompleted: formData.contactInfoCompleted,
      contactInfoExpanded: formData.contactInfoExpanded,
      deliveryExpanded: formData.deliveryExpanded,
      paymentMethod: formData.paymentMethod,
      paymentCompleted: formData.paymentCompleted,
      paymentExpanded: formData.paymentExpanded,
      deliveryMethod: formData.deliveryMethod,
      novaPoshtaCity: formData.novaPoshtaCity,
      novaPoshtaCityRef: formData.novaPoshtaCityRef,
      novaPoshtaPostOfficeWarehouse: formData.novaPoshtaPostOfficeWarehouse,
      novaPoshtaPostOfficeWarehouseRef: formData.novaPoshtaPostOfficeWarehouseRef,
      novaPoshtaPostOfficeCompleted: formData.novaPoshtaPostOfficeCompleted,
      novaPoshtaPostomatWarehouse: formData.novaPoshtaPostomatWarehouse,
      novaPoshtaPostomatWarehouseRef: formData.novaPoshtaPostomatWarehouseRef,
      novaPoshtaPostomatCompleted: formData.novaPoshtaPostomatCompleted,
      novaPoshtaDeliveryType: formData.novaPoshtaDeliveryType,
      novaPoshtaExpanded: formData.novaPoshtaExpanded,
      ukrPoshtaCity: formData.ukrPoshtaCity,
      ukrPoshtaCityId: formData.ukrPoshtaCityId,
      ukrPoshtaCityRegion: formData.ukrPoshtaCityRegion,
      ukrPoshtaBranch: formData.ukrPoshtaBranch,
      ukrPoshtaBranchId: formData.ukrPoshtaBranchId,
      ukrPoshtaPostalCode: formData.ukrPoshtaPostalCode,
      ukrPoshtaAddress: formData.ukrPoshtaAddress,
      ukrPoshtaExpanded: formData.ukrPoshtaExpanded,
      ukrPoshtaCompleted: formData.ukrPoshtaCompleted,
      pickupExpanded: formData.pickupExpanded,
      pickupCompleted: formData.pickupCompleted,
      // Не сохраняем comment, так как он может быть специфичным для каждого заказа
    };
    localStorage.setItem('checkoutFormData', JSON.stringify(dataToSave));
  }, [formData]);

  // Получить текущие данные для выбранного способа доставки
  const getCurrentDeliveryData = () => {
    if (formData.deliveryMethod === "nova_poshta") {
      if (formData.novaPoshtaDeliveryType === "PostOffice") {
        return {
          city: formData.novaPoshtaCity,
          cityRef: formData.novaPoshtaCityRef,
          warehouse: formData.novaPoshtaPostOfficeWarehouse,
          warehouseRef: formData.novaPoshtaPostOfficeWarehouseRef,
          deliveryType: "PostOffice" as const,
          completed: formData.novaPoshtaPostOfficeCompleted,
        };
      } else {
        return {
          city: formData.novaPoshtaCity,
          cityRef: formData.novaPoshtaCityRef,
          warehouse: formData.novaPoshtaPostomatWarehouse,
          warehouseRef: formData.novaPoshtaPostomatWarehouseRef,
          deliveryType: "Postomat" as const,
          completed: formData.novaPoshtaPostomatCompleted,
        };
      }
    } else if (formData.deliveryMethod === "ukr_poshta") {
      return {
        city: formData.ukrPoshtaCity,
        cityId: formData.ukrPoshtaCityId,
        cityRegion: formData.ukrPoshtaCityRegion,
        branch: formData.ukrPoshtaBranch,
        branchId: formData.ukrPoshtaBranchId,
        postalCode: formData.ukrPoshtaPostalCode,
        address: formData.ukrPoshtaAddress,
        completed: formData.ukrPoshtaCompleted,
      };
    } else if (formData.deliveryMethod === "pickup") {
      return {
        completed: formData.pickupCompleted,
      };
    }
    return null;
  };

  // Получить сохраненные данные для способа доставки (даже если он не выбран)
  const getSavedDeliveryData = (method: string) => {
    if (method === "nova_poshta") {
      // Город общий, отделение/поштомат зависят от типа
      const warehouse = formData.novaPoshtaDeliveryType === "PostOffice" 
        ? formData.novaPoshtaPostOfficeWarehouse 
        : formData.novaPoshtaPostomatWarehouse;
      const completed = formData.novaPoshtaDeliveryType === "PostOffice"
        ? formData.novaPoshtaPostOfficeCompleted
        : formData.novaPoshtaPostomatCompleted;
      return {
        city: formData.novaPoshtaCity,
        warehouse: warehouse,
        completed: completed,
      };
    } else if (method === "ukr_poshta") {
      return {
        city: formData.ukrPoshtaCity,
        cityRegion: formData.ukrPoshtaCityRegion,
        branch: formData.ukrPoshtaBranch,
        postalCode: formData.ukrPoshtaPostalCode,
        address: formData.ukrPoshtaAddress,
        completed: formData.ukrPoshtaCompleted,
      };
    }
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast({
        title: "Помилка",
        description: "Будь ласка, заповніть контактні дані",
        variant: "destructive"
      });
      return;
    }
    
    // Валидация данных получателя, если чекбокс включен
    if (formData.hasDifferentRecipient) {
      if (!formData.recipientFirstName || !formData.recipientLastName || !formData.recipientPhone) {
        toast({
          title: "Помилка",
          description: "Будь ласка, заповніть дані отримувача",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Объединяем имя и фамилию для отправки
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    if (!formData.deliveryMethod) {
      toast({
        title: "Помилка",
        description: "Будь ласка, виберіть спосіб доставки",
        variant: "destructive"
      });
      return;
    }

    if (formData.deliveryMethod !== "pickup") {
      const deliveryData = getCurrentDeliveryData();
      if (formData.deliveryMethod === "nova_poshta") {
        if (!deliveryData?.city || !deliveryData?.warehouseRef) {
          toast({
            title: "Помилка",
            description: "Будь ласка, виберіть місто та відділення доставки",
            variant: "destructive"
          });
          return;
        }
      } else if (formData.deliveryMethod === "ukr_poshta") {
        if (!deliveryData?.city || !deliveryData?.branchId) {
          toast({
            title: "Помилка",
            description: "Будь ласка, виберіть місто та відділення доставки",
            variant: "destructive"
          });
          return;
        }
      }
    }

    if (!formData.paymentMethod) {
      toast({
        title: "Помилка",
        description: "Будь ласка, виберіть спосіб оплати",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Calculate order totals
      const subtotal = getSubtotal();
      const discount = getTotalDiscount(); // Include promo code discount
      // Доставка не включается в стоимость заказа, отправляем 0
      const deliveryCost = 0;
      const orderTotal = subtotal - discount; // Стоимость заказа БЕЗ доставки (после всех скидок)
      
      // Add COD commission if needed
      const finalTotal = orderTotal + (formData.paymentMethod === "nalojka" ? 20 : 0);
      
      // Номер заказа генерируется на сервере (начиная с 305317)
      // Prepare order data - convert undefined/empty strings to null for SQL
      const orderData = {
        // id убран - генерируется на сервере
        customer: {
          name: fullName,
          phone: formData.phone,
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
        recipient: formData.hasDifferentRecipient ? {
          name: `${formData.recipientFirstName} ${formData.recipientLastName}`.trim(),
          phone: formData.recipientPhone,
          firstName: formData.recipientFirstName,
          lastName: formData.recipientLastName,
        } : null,
        promoCode: promoCodeApplied?.code || null,
        delivery: (() => {
          const deliveryData = getCurrentDeliveryData();
          if (formData.deliveryMethod === "nova_poshta" && deliveryData) {
            return {
              method: formData.deliveryMethod,
              city: deliveryData.city || null,
              warehouse: deliveryData.warehouse || null,
              warehouseRef: deliveryData.warehouseRef || null,
              cityRef: deliveryData.cityRef || null,
              postIndex: null,
              address: null,
            };
          } else if (formData.deliveryMethod === "ukr_poshta" && deliveryData) {
            return {
              method: "ukrposhta", // Исправляем: в базе данных используется "ukrposhta" без подчеркивания
              city: deliveryData.city || null,
              warehouse: deliveryData.branch || null,
              warehouseRef: deliveryData.branchId || null,
              cityRef: deliveryData.cityId || null,
              postIndex: deliveryData.postalCode || null,
              address: deliveryData.address || null,
            };
          } else {
            return {
              method: formData.deliveryMethod,
              city: null,
              warehouse: null,
              warehouseRef: null,
              cityRef: null,
              postIndex: null,
              address: null,
            };
          }
        })(),
        payment: {
          method: formData.paymentMethod,
        },
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions || [],
        })),
        subtotal: subtotal || 0,
        discount: discount || 0,
        deliveryCost: deliveryCost || 0,
        total: finalTotal || 0,
        comment: formData.comment && formData.comment.trim() ? formData.comment.trim() : null,
      };

      // Submit order to API
      const order = await ordersAPI.create(orderData);
      
      // Clear localStorage after successful order
      localStorage.removeItem('checkoutFormData');
      
      // Если онлайн оплата - редиректим на WayForPay
      if (formData.paymentMethod === "wayforpay") {
        try {
          const { wayforpayAPI } = await import("@/lib/api");
          console.log('[Checkout] Creating WayForPay payment for order:', order.orderId);
          
          const paymentResponse = await wayforpayAPI.createPayment(order.orderId);
          
          console.log('[Checkout] Payment response received:', paymentResponse);
          
          if (!paymentResponse.paymentUrl || !paymentResponse.paymentData) {
            throw new Error('Invalid payment response from server');
          }
          
          // Создаем форму и отправляем на WayForPay
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = paymentResponse.paymentUrl;
          
          Object.entries(paymentResponse.paymentData).forEach(([key, value]) => {
            // Обрабатываем массивы для productName[], productPrice[], productCount[]
            if (Array.isArray(value)) {
              value.forEach((item, index) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = `${key}[]`;
                input.value = String(item);
                form.appendChild(input);
              });
            } else {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = key;
              input.value = String(value);
              form.appendChild(input);
            }
          });
          
          console.log('[Checkout] Submitting form to WayForPay');
          document.body.appendChild(form);
          form.submit();
          return; // Не очищаем корзину и не редиректим, так как уходим на WayForPay
        } catch (paymentError) {
          console.error('[Checkout] Error creating payment:', paymentError);
          toast({
            title: "Помилка оплати",
            description: paymentError instanceof Error ? paymentError.message : "Не вдалося створити платіж. Спробуйте пізніше.",
            variant: "destructive"
          });
          // Не очищаем корзину при ошибке оплаты
          return;
        }
      }
      
      // Для наложенного платежа - обычный флоу
      clearCart();
      // Используем trackingToken для безопасной ссылки отслеживания
      navigate(`/thank-you?track=${order.trackingToken}`);
    } catch (error) {
      console.error('Order submission error:', error);
      toast({
        title: "Помилка",
        description: error instanceof Error ? error.message : "Не вдалося оформити замовлення. Спробуйте пізніше.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate promo code discount
  const getPromoDiscount = () => {
    if (!promoCodeApplied) return 0;
    const subtotal = getSubtotal();
    const productDiscount = getDiscount();
    const priceAfterProductDiscount = subtotal - productDiscount;
    const promoDiscount = (priceAfterProductDiscount * promoCodeApplied.discount) / 100;
    return promoDiscount;
  };

  // Total discount = product discount + promo discount
  const getTotalDiscount = () => {
    return getDiscount() + getPromoDiscount();
  };

  // Apply promo code
  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoCodeError("Введіть промокод");
      return;
    }

    setIsApplyingPromo(true);
    setPromoCodeError("");

    try {
      const response = await promoAPI.validate(promoCode, items.map(item => ({ productId: item.productId })));
      setPromoCodeApplied({
        code: response.code,
        discount: response.discount,
        message: response.message
      });
      setPromoCode("");
    } catch (error) {
      setPromoCodeError(error instanceof Error ? error.message : "Помилка застосування промокоду");
      setPromoCodeApplied(null);
    } finally {
      setIsApplyingPromo(false);
    }
  };
  
  // Стоимость заказа БЕЗ доставки (после всех скидок)
  const orderTotal = getSubtotal() - getTotalDiscount();

  // Format number with thousands separator (no decimals)
  const formatPrice = (value: number): string => {
    const rounded = Math.round(value);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };
  // Порог бесплатной доставки из настроек админ-панели
  const FREE_DELIVERY_THRESHOLD = typeof storeSettings.free_delivery_threshold === 'number' 
    ? storeSettings.free_delivery_threshold 
    : parseInt(String(storeSettings.free_delivery_threshold || '1500')) || 1500;
  
  // Цены доставки для справки (не включаются в стоимость заказа)
  const getDeliveryPriceInfo = () => {
    // Если заказ от 4000 грн, все способы доставки бесплатные
    if (orderTotal >= FREE_DELIVERY_THRESHOLD) {
      if (formData.deliveryMethod === "pickup") {
        return { price: 0, text: "Безкоштовно", showFree: false };
      }
      return { price: 0, text: "Безкоштовно", showFree: false };
    }
    
    if (formData.deliveryMethod === "nova_poshta") {
      return { price: 60, text: "від 60 ₴", showFree: true };
    } else if (formData.deliveryMethod === "ukr_poshta") {
      return { price: 45, text: "від 45 ₴", showFree: true };
    } else if (formData.deliveryMethod === "pickup") {
      return { price: 0, text: "Безкоштовно", showFree: false };
    }
    return null;
  };

  const deliveryInfo = getDeliveryPriceInfo();
  const deliveryLabel = formData.deliveryMethod === "nova_poshta" 
    ? "Доставка Нова Пошта:" 
    : formData.deliveryMethod === "ukr_poshta"
    ? "Доставка Укрпошта:"
    : formData.deliveryMethod === "pickup"
    ? "Самовивіз:"
    : "Доставка:";

  // Get full product data for cart items
  const cartItemsWithProducts = items.map(item => {
    const product = products.find(p => p.code === item.productId);
    return { ...item, product };
  }).filter(item => item.product);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Package className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Кошик порожній</h1>
          <p className="text-muted-foreground">Додайте товари для оформлення замовлення</p>
          <Button onClick={() => navigate("/")} className="rounded-full">
            Повернутися до покупок
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Оформлення замовлення | FetrInUA</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      
      <div className="min-h-screen bg-muted/30">
        {/* Header */}
        <header className="bg-background border-b sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Оформлення замовлення</h1>
          </div>
        </header>

        <div className="container mx-auto px-4 pb-8" style={{ paddingTop: '22px' }}>
          {/* Order Items Block - Mobile only */}
          <div className="mb-6 lg:hidden">
            <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
              <div className="flex items-center gap-2 mb-4 p-4 pb-0">
                <h2 className="text-base font-semibold">Замовлення</h2>
                <span className="text-sm text-muted-foreground">{items.length} товара</span>
              </div>
              
              {/* Horizontal scrollable products */}
              {cartItemsWithProducts.length > 1 ? (
                <div className="overflow-x-auto order-items-scroll" style={{ paddingLeft: '1rem', paddingRight: '1rem', paddingBottom: '1rem', WebkitOverflowScrolling: 'touch' }}>
                  <ul className="flex gap-4" style={{ width: 'max-content' }}>
                    {cartItemsWithProducts.map((item, index) => {
                      const product = item.product!;
                      const productOptions = item.selectedOptions.map(optId => 
                        product.options.find(o => o.code === optId)
                      ).filter(Boolean);
                      const optionsTotal = productOptions.reduce((sum, opt) => sum + (opt?.price || 0), 0);
                      const currentPrice = product.salePrice || product.basePrice;
                      const basePrice = product.basePrice;
                      const hasDiscount = product.salePrice && product.salePrice < basePrice;
                      const unitPrice = currentPrice + optionsTotal;
                      
                      return (
                        <li key={item.id || `${item.productId}_${index}`} style={{ width: '265px', flexShrink: 0 }}>
                          <div className="bg-background rounded-xl p-3 border border-border">
                            <div 
                              className="flex gap-3"
                              style={{ 
                                alignContent: 'space-between',
                                marginLeft: 'calc(4px / 2 * -1)',
                                marginRight: 'calc(4px / 2 * -1)',
                                display: 'flex',
                                flexWrap: 'wrap',
                                minWidth: 0
                              }}
                            >
                              {/* Image */}
                              <div className="flex-shrink-0">
                                <div className="w-[88px] h-[90px] rounded-lg overflow-hidden">
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                              </div>
                              
                              {/* Product info */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                  <div className="font-medium text-sm mb-1 line-clamp-2" style={{ fontSize: '0.875rem' }}>
                                    {product.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    {item.quantity} шт.
                                    {productOptions.length > 0 && (
                                      <span> + {productOptions.length} {productOptions.length === 1 ? 'опція' : 'опції'}</span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Price */}
                                <div className="mt-auto">
                                  {hasDiscount ? (
                                    <div>
                                      <div className="text-sm font-semibold text-destructive" style={{ fontSize: '0.875rem' }}>
                                        {unitPrice} ₴/шт.
                                      </div>
                                      <div className="text-xs text-muted-foreground line-through" style={{ fontSize: '0.75rem' }}>
                                        {basePrice + optionsTotal} ₴/шт.
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-sm font-semibold" style={{ fontSize: '0.875rem' }}>
                                      {unitPrice} ₴/шт.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : cartItemsWithProducts.length === 1 ? (
                <div className="p-4 pt-0">
                  {cartItemsWithProducts.map((item, index) => {
                    const product = item.product!;
                    const productOptions = item.selectedOptions.map(optId => 
                      product.options.find(o => o.code === optId)
                    ).filter(Boolean);
                    const optionsTotal = productOptions.reduce((sum, opt) => sum + (opt?.price || 0), 0);
                    const currentPrice = product.salePrice || product.basePrice;
                    const basePrice = product.basePrice;
                    const hasDiscount = product.salePrice && product.salePrice < basePrice;
                    const unitPrice = currentPrice + optionsTotal;
                    
                    return (
                      <div key={item.id || `${item.productId}_${index}`} className="bg-background rounded-xl p-3 border border-border">
                        <div className="flex gap-3">
                          {/* Image */}
                          <div className="flex-shrink-0">
                            <div className="w-[88px] h-[90px] rounded-lg overflow-hidden">
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          </div>
                          
                          {/* Product info */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="font-medium text-sm mb-1 line-clamp-2" style={{ fontSize: '0.875rem' }}>
                                {product.name}
                              </div>
                              <div className="text-xs text-muted-foreground mb-1">
                                {item.quantity} шт.
                                {productOptions.length > 0 && (
                                  <span> + {productOptions.length} {productOptions.length === 1 ? 'опція' : 'опції'}</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Price */}
                            <div className="mt-auto">
                              {hasDiscount ? (
                                <div>
                                  <div className="text-sm font-semibold text-destructive" style={{ fontSize: '0.875rem' }}>
                                    {unitPrice} ₴/шт.
                                  </div>
                                  <div className="text-xs text-muted-foreground line-through" style={{ fontSize: '0.75rem' }}>
                                    {basePrice + optionsTotal} ₴/шт.
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm font-semibold" style={{ fontSize: '0.875rem' }}>
                                  {unitPrice} ₴/шт.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Info */}
                <div ref={contactInfoRef} className="bg-card rounded-2xl p-6 shadow-soft space-y-4 border">
                  <h2 
                    className="text-lg font-bold flex items-center gap-2 cursor-pointer"
                    onClick={() => {
                      if (isContactInfoValid) {
                        setFormData(prev => ({ ...prev, contactInfoExpanded: !prev.contactInfoExpanded }));
                      }
                    }}
                  >
                    {isContactInfoValid ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (formData.phone || formData.firstName || formData.lastName ? (
                      <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-medium">1</span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">1</span>
                    ))}
                    Контактні дані *
                  </h2>
                  
                  {isContactInfoValid && formData.contactInfoCompleted && !formData.contactInfoExpanded ? (
                    // Свернутый вид с информацией
                    <div className="space-y-3">
                      {/* Данные заказчика */}
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Замовник</div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">{formData.lastName} {formData.firstName}</div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, contactInfoExpanded: true }));
                            setTimeout(() => {
                              contactInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                            }, 150);
                          }}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-sm">{formData.phone}</div>
                      </div>
                      {/* Данные получателя (если указан другой получатель) */}
                      {formData.hasDifferentRecipient && formData.recipientFirstName && formData.recipientLastName && (
                        <div className="space-y-1 pt-2 border-t">
                          <div className="text-xs text-muted-foreground">Отримувач</div>
                          <div className="text-sm">{formData.recipientLastName} {formData.recipientFirstName}</div>
                          <div className="text-sm">{formData.recipientPhone}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Развернутый вид с формой
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Телефон *</Label>
                          <div className="relative">
                            <Input
                              ref={phoneInputRef}
                              id="phone"
                              name="phone"
                              type="tel"
                              value={formData.phone === "" ? "+380" : formData.phone}
                              onChange={handlePhoneChange}
                              onKeyDown={handlePhoneKeyDown}
                              onFocus={handlePhoneFocus}
                              onBlur={handlePhoneBlur}
                              placeholder="+380"
                              required
                              className={`rounded-xl pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 ${formData.phone === "" || formData.phone === "+380" ? 'text-muted-foreground' : ''} ${phoneTouched && phoneError ? 'border-red-500' : ''}`}
                            />
                            {isPhoneValid && (
                              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                            )}
                          </div>
                          {phoneTouched && phoneError && (
                            <p className="text-sm text-red-500">{phoneError}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastName">Прізвище *</Label>
                          <div className="relative">
                            <Input
                              id="lastName"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleLastNameChange}
                              onBlur={() => {
                                setLastNameTouched(true);
                                if (formData.lastName.trim() === "") {
                                  setLastNameError("Це обов'язкове поле");
                                } else if (!validateCyrillic(formData.lastName)) {
                                  setLastNameError("Використовуйте тільки кириличні символи");
                                } else {
                                  setLastNameError("");
                                }
                              }}
                              placeholder="Введіть прізвище кирилицею"
                              required
                              className={`rounded-xl pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 ${lastNameTouched && lastNameError ? 'border-red-500' : ''}`}
                            />
                            {isLastNameValid && (
                              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                            )}
                          </div>
                          {lastNameTouched && lastNameError && (
                            <p className="text-sm text-red-500">{lastNameError}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="firstName">Ім'я *</Label>
                          <div className="relative">
                            <Input
                              id="firstName"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleFirstNameChange}
                              onBlur={() => {
                                setFirstNameTouched(true);
                                if (formData.firstName.trim() === "") {
                                  setFirstNameError("Це обов'язкове поле");
                                } else if (!validateCyrillic(formData.firstName)) {
                                  setFirstNameError("Використовуйте тільки кириличні символи");
                                } else {
                                  setFirstNameError("");
                                }
                              }}
                              placeholder="Введіть Ім'я кирилицею"
                              required
                              className={`rounded-xl pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 ${firstNameTouched && firstNameError ? 'border-red-500' : ''}`}
                            />
                            {isFirstNameValid && (
                              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                            )}
                          </div>
                          {firstNameTouched && firstNameError && (
                            <p className="text-sm text-red-500">{firstNameError}</p>
                          )}
                        </div>

                        {/* Чекбокс "Інший отримувач замовлення" */}
                        <div className="flex items-center space-x-2 pt-2">
                          <Checkbox
                            id="hasDifferentRecipient"
                            checked={formData.hasDifferentRecipient}
                            onCheckedChange={(checked) => {
                              setFormData(prev => ({ 
                                ...prev, 
                                hasDifferentRecipient: checked as boolean,
                                // Очищаем поля получателя при снятии чекбокса
                                ...(checked ? {} : {
                                  recipientFirstName: "",
                                  recipientLastName: "",
                                  recipientPhone: ""
                                })
                              }));
                              // Сбрасываем ошибки
                              if (!checked) {
                                setRecipientFirstNameTouched(false);
                                setRecipientFirstNameError("");
                                setRecipientLastNameTouched(false);
                                setRecipientLastNameError("");
                                setRecipientPhoneTouched(false);
                                setRecipientPhoneError("");
                              }
                            }}
                          />
                          <Label 
                            htmlFor="hasDifferentRecipient" 
                            className="text-sm font-normal cursor-pointer flex items-center gap-1"
                          >
                            Інший отримувач замовлення
                            <span className="text-muted-foreground">?</span>
                          </Label>
                        </div>

                        {/* Поля получателя (показываются только если чекбокс включен) */}
                        {formData.hasDifferentRecipient && (
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label htmlFor="recipientPhone">Номер телефону отримувача *</Label>
                              <div className="relative">
                                <Input
                                  ref={recipientPhoneInputRef}
                                  id="recipientPhone"
                                  name="recipientPhone"
                                  type="tel"
                                  value={formData.recipientPhone === "" ? "+380" : formData.recipientPhone}
                                  onChange={handleRecipientPhoneChange}
                                  onKeyDown={handleRecipientPhoneKeyDown}
                                  onFocus={handleRecipientPhoneFocus}
                                  onBlur={handleRecipientPhoneBlur}
                                  placeholder="+380"
                                  required
                                  className={`rounded-xl pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 ${formData.recipientPhone === "" || formData.recipientPhone === "+380" ? 'text-muted-foreground' : ''} ${recipientPhoneTouched && recipientPhoneError ? 'border-red-500' : ''}`}
                                />
                                {isRecipientPhoneValid && (
                                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                                )}
                              </div>
                              {recipientPhoneTouched && recipientPhoneError && (
                                <p className="text-sm text-red-500">{recipientPhoneError}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="recipientLastName">Прізвище отримувача *</Label>
                              <div className="relative">
                                <Input
                                  id="recipientLastName"
                                  name="recipientLastName"
                                  value={formData.recipientLastName}
                                  onChange={handleRecipientLastNameChange}
                                  onBlur={() => {
                                    setRecipientLastNameTouched(true);
                                    if (formData.recipientLastName.trim() === "") {
                                      setRecipientLastNameError("Це обов'язкове поле");
                                    } else if (!validateCyrillic(formData.recipientLastName)) {
                                      setRecipientLastNameError("Використовуйте тільки кириличні символи");
                                    } else {
                                      setRecipientLastNameError("");
                                    }
                                  }}
                                  placeholder="Введіть прізвище кирилицею"
                                  required
                                  className={`rounded-xl pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 ${recipientLastNameTouched && recipientLastNameError ? 'border-red-500' : ''}`}
                                />
                                {isRecipientLastNameValid && (
                                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                                )}
                              </div>
                              {recipientLastNameTouched && recipientLastNameError && (
                                <p className="text-sm text-red-500">{recipientLastNameError}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="recipientFirstName">Ім'я отримувача *</Label>
                              <div className="relative">
                                <Input
                                  id="recipientFirstName"
                                  name="recipientFirstName"
                                  value={formData.recipientFirstName}
                                  onChange={handleRecipientFirstNameChange}
                                  onBlur={() => {
                                    setRecipientFirstNameTouched(true);
                                    if (formData.recipientFirstName.trim() === "") {
                                      setRecipientFirstNameError("Це обов'язкове поле");
                                    } else if (!validateCyrillic(formData.recipientFirstName)) {
                                      setRecipientFirstNameError("Використовуйте тільки кириличні символи");
                                    } else {
                                      setRecipientFirstNameError("");
                                    }
                                  }}
                                  placeholder="Введіть Ім'я кирилицею"
                                  required
                                  className={`rounded-xl pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 ${recipientFirstNameTouched && recipientFirstNameError ? 'border-red-500' : ''}`}
                                />
                                {isRecipientFirstNameValid && (
                                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                                )}
                              </div>
                              {recipientFirstNameTouched && recipientFirstNameError && (
                                <p className="text-sm text-red-500">{recipientFirstNameError}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        disabled={!isContactInfoValid}
                        className="w-full rounded-xl border h-10 hover:border hover:bg-transparent hover:text-primary disabled:hover:text-primary disabled:opacity-50"
                        onClick={() => {
                          if (isContactInfoValid) {
                            setFormData(prev => ({ ...prev, contactInfoCompleted: true, contactInfoExpanded: false }));
                          }
                        }}
                      >
                        Продовжити
                      </Button>
                    </>
                  )}
                </div>

                {/* Delivery */}
                <div className="bg-card rounded-2xl p-6 shadow-soft space-y-4">
                  <h2 
                    className="text-lg font-bold flex items-center gap-2 cursor-pointer"
                    onClick={() => {
                      if (formData.deliveryMethod && getCurrentDeliveryData()?.completed) {
                        setFormData(prev => ({ ...prev, deliveryExpanded: !prev.deliveryExpanded }));
                      }
                    }}
                  >
                    {formData.deliveryMethod && getCurrentDeliveryData()?.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">2</span>
                    )}
                    Доставка *
                  </h2>
                  
                  {formData.deliveryExpanded ? (
                  <RadioGroup
                    value={formData.deliveryMethod}
                    onValueChange={(value) => {
                      setFormData(prev => {
                        // Если кликаем на уже выбранный способ доставки и он свернут, раскрываем его
                        if (prev.deliveryMethod === value && value === "nova_poshta" && prev.novaPoshtaExpanded === false) {
                          return { ...prev, novaPoshtaExpanded: true };
                        }
                        // Если выбираем самовывоз, сразу помечаем как завершенный и сворачиваем
                        if (value === "pickup") {
                          return { 
                            ...prev, 
                            deliveryMethod: value, 
                            pickupCompleted: true,
                            deliveryExpanded: false,
                            novaPoshtaExpanded: undefined 
                          };
                        }
                        // Иначе просто переключаем способ доставки
                        return { ...prev, deliveryMethod: value, novaPoshtaExpanded: value === "nova_poshta" ? true : undefined };
                      });
                    }}
                    className="space-y-3"
                  >
                    {/* Нова Пошта */}
                    <div 
                      className="border rounded-xl transition-all"
                      onClick={(e) => {
                        // Если кликаем на уже выбранный способ доставки и он свернут, раскрываем его
                        if (formData.deliveryMethod === "nova_poshta" && formData.novaPoshtaExpanded === false) {
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, novaPoshtaExpanded: true }));
                        }
                      }}
                    >
                      <label className="flex flex-col gap-2 p-4 cursor-pointer hover:border-primary transition-colors">
                        <div className="flex items-center gap-3">
                        <RadioGroupItem value="nova_poshta" id="nova_poshta" />
                          <div className="font-medium flex items-center gap-2 flex-1">
                            <NovaPoshtaLogo className="w-5 h-5" />
                            Нова Пошта
                          </div>
                          <div className="text-sm font-medium">
                            {orderTotal >= FREE_DELIVERY_THRESHOLD ? <span className="text-green-600">Безкоштовно</span> : "від 60 ₴"}
                          </div>
                        </div>
                        <div className="ml-[28px]">
                          {(() => {
                            const savedData = getSavedDeliveryData("nova_poshta");
                            const isCollapsed = formData.deliveryMethod === "nova_poshta" && formData.novaPoshtaExpanded === false;
                            const showCollapsed = isCollapsed && savedData?.completed && savedData.city && savedData.warehouse;
                            const showSavedWhenNotSelected = formData.deliveryMethod !== "nova_poshta" && savedData?.completed && savedData.city && savedData.warehouse;
                            
                            if (showCollapsed || showSavedWhenNotSelected) {
                              return (
                                <div className="space-y-1 text-sm">
                                  <div className="text-foreground">{savedData.city}</div>
                                  <div className="text-foreground">{savedData.warehouse}</div>
                                </div>
                              );
                            }
                            return <div className="text-sm text-muted-foreground">1-2 дні по Україні</div>;
                          })()}
                        </div>
                      </label>
                      {formData.deliveryMethod === "nova_poshta" && formData.novaPoshtaExpanded !== false && (
                        <div className="pl-4 pr-4 pb-4 ml-[28px]">
                          <NovaPoshtaDelivery
                            cityRef={formData.novaPoshtaCityRef}
                            warehouseRef={formData.novaPoshtaDeliveryType === "PostOffice" 
                              ? formData.novaPoshtaPostOfficeWarehouseRef 
                              : formData.novaPoshtaPostomatWarehouseRef}
                            deliveryType={formData.novaPoshtaDeliveryType}
                            isExpanded={true}
                            onCityChange={(city) => {
                              setFormData(prev => ({
                                ...prev,
                                novaPoshtaCity: city ? city.full_description_ua : "",
                                novaPoshtaCityRef: city ? city.ref : null,
                                // Сбрасываем оба типа при смене города
                                novaPoshtaPostOfficeWarehouse: "",
                                novaPoshtaPostOfficeWarehouseRef: null,
                                novaPoshtaPostOfficeCompleted: false,
                                novaPoshtaPostomatWarehouse: "",
                                novaPoshtaPostomatWarehouseRef: null,
                                novaPoshtaPostomatCompleted: false
                              }));
                            }}
                            onWarehouseChange={(warehouse) => {
                              setFormData(prev => {
                                if (prev.novaPoshtaDeliveryType === "PostOffice") {
                                  return {
                                    ...prev,
                                    novaPoshtaPostOfficeWarehouse: warehouse ? warehouse.description_ua : "",
                                    novaPoshtaPostOfficeWarehouseRef: warehouse ? warehouse.ref : null,
                                    novaPoshtaPostOfficeCompleted: !!warehouse
                                  };
                                } else {
                                  return {
                                    ...prev,
                                    novaPoshtaPostomatWarehouse: warehouse ? warehouse.description_ua : "",
                                    novaPoshtaPostomatWarehouseRef: warehouse ? warehouse.ref : null,
                                    novaPoshtaPostomatCompleted: !!warehouse
                                  };
                                }
                              });
                            }}
                            onDeliveryTypeChange={(type) => {
                              setFormData(prev => {
                                // При переключении типа проверяем, выбрано ли соответствующее отделение/почтомат
                                if (type === "PostOffice") {
                                  return {
                                    ...prev,
                                    novaPoshtaDeliveryType: type,
                                    novaPoshtaPostOfficeCompleted: !!prev.novaPoshtaPostOfficeWarehouseRef
                                  };
                                } else {
                                  return {
                                    ...prev,
                                    novaPoshtaDeliveryType: type,
                                    novaPoshtaPostomatCompleted: !!prev.novaPoshtaPostomatWarehouseRef
                                  };
                                }
                              });
                            }}
                            onContinue={() => {
                              setFormData(prev => ({
                                ...prev,
                                novaPoshtaExpanded: false,
                                deliveryExpanded: false,
                                ...(prev.novaPoshtaDeliveryType === "PostOffice" 
                                  ? { novaPoshtaPostOfficeCompleted: true }
                                  : { novaPoshtaPostomatCompleted: true })
                              }));
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Укрпошта */}
                    <div 
                      className="border rounded-xl transition-all"
                      onClick={(e) => {
                        // Если кликаем на уже выбранный способ доставки и он свернут, раскрываем его
                        if (formData.deliveryMethod === "ukr_poshta" && formData.ukrPoshtaExpanded === false) {
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, ukrPoshtaExpanded: true }));
                        }
                      }}
                    >
                      <label className="flex flex-col gap-2 p-4 cursor-pointer hover:border-primary transition-colors">
                        <div className="flex items-center gap-3">
                        <RadioGroupItem value="ukr_poshta" id="ukr_poshta" />
                          <div className="font-medium flex items-center gap-2 flex-1">
                            <UkrposhtaLogo className="w-5 h-5" />
                            Укрпошта
                          </div>
                          <div className="text-sm font-medium">
                            {orderTotal >= FREE_DELIVERY_THRESHOLD ? <span className="text-green-600">Безкоштовно</span> : "від 45 грн"}
                          </div>
                        </div>
                        <div className="ml-[28px]">
                          {(() => {
                            const savedData = getSavedDeliveryData("ukr_poshta");
                            const isCollapsed = formData.deliveryMethod === "ukr_poshta" && formData.ukrPoshtaExpanded === false;
                            const showCollapsed = isCollapsed && savedData?.completed && savedData.city;
                            const showSavedWhenNotSelected = formData.deliveryMethod !== "ukr_poshta" && savedData?.completed && savedData.city;
                            
                            if (showCollapsed || showSavedWhenNotSelected) {
                              // ВАЖНО: savedData.city уже содержит полное название "Город (Область)"
                              // Если по какой-то причине нет области, формируем из сохраненных данных
                              const cityDisplayName = savedData.city || 
                                (savedData.cityRegion ? `${savedData.city} (${savedData.cityRegion})` : savedData.city);
                              
                              // Формируем полный адрес отделения: {postalCode} {city}, {address}
                              // ВАЖНО: Используем только название города без области для адреса
                              const cityNameOnly = savedData.cityRegion 
                                ? savedData.city.replace(` (${savedData.cityRegion})`, '')
                                : savedData.city;
                              const fullAddress = savedData.postalCode && savedData.address
                                ? `${savedData.postalCode} ${cityNameOnly}, ${savedData.address}`
                                : savedData.branch || '';
                              
                              return (
                                <div className="space-y-1 text-sm">
                                  <div className="text-foreground">{cityDisplayName}</div>
                                  {fullAddress && (
                                    <div className="text-foreground">{fullAddress}</div>
                                  )}
                                </div>
                              );
                            }
                            return <div className="text-sm text-muted-foreground">3-5 днів по Україні</div>;
                          })()}
                        </div>
                      </label>
                      {formData.deliveryMethod === "ukr_poshta" && formData.ukrPoshtaExpanded !== false && (
                        <div className="pl-4 pr-4 pb-4 ml-[28px]">
                          <UkrPoshtaDelivery
                            cityId={formData.ukrPoshtaCityId}
                            branchId={formData.ukrPoshtaBranchId}
                            savedCityName={formData.ukrPoshtaCity}
                            savedCityRegion={formData.ukrPoshtaCityRegion}
                            savedBranchName={formData.ukrPoshtaBranch}
                            savedBranchAddress={formData.ukrPoshtaAddress}
                            savedBranchPostalCode={formData.ukrPoshtaPostalCode}
                            isExpanded={true}
                            onCityChange={(city) => {
                              // ВАЖНО: Сохраняем полное название города с областью в формате "Город (Область)" или "Город (*)"
                              const cityFullName = city 
                                ? (city.region && city.region.trim() !== '' 
                                    ? `${city.name} (${city.region})`
                                    : `${city.name} (*)`)
                                : "";
                              
                              setFormData(prev => ({
                                ...prev,
                                ukrPoshtaCity: cityFullName, // Сохраняем полное название "Город (Область)" или "Город (*)"
                                ukrPoshtaCityId: city ? city.id : null,
                                ukrPoshtaCityRegion: city ? (city.region || "") : "", // Сохраняем область отдельно для удобства
                                // Сбрасываем отделение при смене города (как у Новой Почты)
                                ukrPoshtaBranch: "",
                                ukrPoshtaBranchId: null,
                                ukrPoshtaPostalCode: "",
                                ukrPoshtaAddress: "",
                                ukrPoshtaCompleted: false
                              }));
                            }}
                            onBranchChange={(branch) => {
                              setFormData(prev => ({
                                ...prev,
                                ukrPoshtaBranch: branch ? branch.name : "",
                                ukrPoshtaBranchId: branch ? branch.id : null,
                                ukrPoshtaPostalCode: branch ? branch.postalCode : "",
                                ukrPoshtaAddress: branch ? branch.address : "",
                                ukrPoshtaCompleted: !!branch
                              }));
                            }}
                            onContinue={() => {
                              setFormData(prev => ({
                                ...prev,
                                ukrPoshtaExpanded: false,
                                ukrPoshtaCompleted: true,
                                deliveryExpanded: false
                              }));
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Самовивіз */}
                    <div className="border rounded-xl transition-all">
                      <label className="flex flex-col gap-2 p-4 cursor-pointer hover:border-primary transition-colors">
                        <div className="flex items-center gap-3">
                        <RadioGroupItem value="pickup" id="pickup" />
                          <div className="font-medium flex items-center gap-2 flex-1">
                            <PickupLogo className="w-5 h-5" />
                            Самовивіз
                        </div>
                        <div className="text-sm font-medium">
                          {(() => {
                            const novaPoshtaInfo = orderTotal >= FREE_DELIVERY_THRESHOLD 
                              ? { text: "Безкоштовно", price: 0 }
                              : { text: "від 60 грн", price: 60 };
                            return <span className={novaPoshtaInfo.price === 0 ? "text-green-600" : ""}>{novaPoshtaInfo.text}</span>;
                          })()}
                          </div>
                        </div>
                        <div className="ml-[28px]">
                          <div className="text-sm text-muted-foreground">{storeSettings.store_address || 'м. Київ, вул. Урлівська 30'}</div>
                        </div>
                      </label>
                      {formData.deliveryMethod === "pickup" && (
                        <div className="pl-4 pr-4 pb-4">
                          <div className="font-medium mb-1">Адреса самовивозу:</div>
                          <div className="text-muted-foreground">{storeSettings.store_address || 'м. Київ, вул. Урлівська 30'}</div>
                          {storeSettings.store_working_hours_weekdays && (
                            <div className="text-sm text-muted-foreground mt-2 whitespace-pre-line">
                              {storeSettings.store_working_hours_weekdays}
                            </div>
                          )}
                          {storeSettings.store_working_hours_weekend && (
                            <div className="text-sm text-muted-foreground/60 mt-1 whitespace-pre-line">
                              {storeSettings.store_working_hours_weekend}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </RadioGroup>
                  ) : (
                    // Свернутый вид блока доставки
                    <div className="space-y-2">
                      {(() => {
                        const deliveryData = getCurrentDeliveryData();
                        if (formData.deliveryMethod === "nova_poshta" && deliveryData) {
                          return (
                            <>
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium flex items-center gap-2">
                                  <NovaPoshtaLogo className="w-5 h-5" />
                                  Нова Пошта
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData(prev => ({ ...prev, deliveryExpanded: true }));
                                    setTimeout(() => {
                                      deliveryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                                    }, 150);
                                  }}
                                  className="text-muted-foreground hover:text-primary"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="text-sm">{deliveryData.city}</div>
                              <div className="text-sm">{deliveryData.warehouse}</div>
                            </>
                          );
                        } else if (formData.deliveryMethod === "ukr_poshta" && deliveryData) {
                          // ВАЖНО: deliveryData.city уже содержит полное название "Город (Область)"
                          // Если по какой-то причине нет области, формируем из сохраненных данных
                          const cityDisplayName = deliveryData.city || 
                            (deliveryData.cityRegion ? `${deliveryData.city} (${deliveryData.cityRegion})` : deliveryData.city);
                          
                          // Формируем полный адрес отделения: {postalCode} {city}, {address}
                          // ВАЖНО: Используем только название города без области для адреса
                          const cityNameOnly = deliveryData.cityRegion 
                            ? deliveryData.city.replace(` (${deliveryData.cityRegion})`, '')
                            : deliveryData.city;
                          const fullAddress = deliveryData.postalCode && deliveryData.address
                            ? `${deliveryData.postalCode} ${cityNameOnly}, ${deliveryData.address}`
                            : deliveryData.branch || '';
                          
                          return (
                            <>
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium flex items-center gap-2">
                                  <UkrposhtaLogo className="w-5 h-5" />
                                  Укрпошта
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData(prev => ({ ...prev, deliveryExpanded: true }));
                                    setTimeout(() => {
                                      deliveryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                                    }, 150);
                                  }}
                                  className="text-muted-foreground hover:text-primary"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="text-sm">{cityDisplayName}</div>
                              {fullAddress && (
                                <div className="text-sm">{fullAddress}</div>
                              )}
                            </>
                          );
                        } else if (formData.deliveryMethod === "pickup") {
                          return (
                            <>
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium flex items-center gap-2">
                                  <PickupLogo className="w-5 h-5" />
                                  Самовивіз
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData(prev => ({ ...prev, deliveryExpanded: true }));
                                    setTimeout(() => {
                                      deliveryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                                    }, 150);
                                  }}
                                  className="text-muted-foreground hover:text-primary"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="text-sm">{storeSettings.store_address || 'м. Київ, вул. Урлівська 30'}</div>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>

                {/* Payment */}
                <div className="bg-card rounded-2xl p-6 shadow-soft space-y-4">
                  <h2 
                    className="text-lg font-bold flex items-center gap-2 cursor-pointer"
                    onClick={() => {
                      if (formData.paymentCompleted) {
                        setFormData(prev => ({ ...prev, paymentExpanded: !prev.paymentExpanded }));
                      }
                    }}
                  >
                    {formData.paymentCompleted ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">3</span>
                    )}
                    Спосіб оплати *
                  </h2>
                  
                  {formData.paymentCompleted && !formData.paymentExpanded ? (
                    // Свернутый вид блока оплаты
                    <div className="space-y-2">
                      {formData.paymentMethod === "wayforpay" && (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium flex items-center gap-2">
                              <WayForPayLogo className="w-5 h-5" />
                              Онлайн оплата
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, paymentExpanded: true }));
                                setTimeout(() => {
                                  paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                                }, 150);
                              }}
                              className="text-muted-foreground hover:text-primary"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-sm text-muted-foreground">Безпечна оплата карткою через WayForPay</div>
                        </>
                      )}
                      {formData.paymentMethod === "nalojka" && (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium flex items-center gap-2">
                              <CODPaymentLogo className="w-5 h-5" />
                              Накладений платіж
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, paymentExpanded: true }));
                                setTimeout(() => {
                                  paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                                }, 150);
                              }}
                              className="text-muted-foreground hover:text-primary"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-sm text-muted-foreground">Оплата при отриманні (+20 грн комісія)</div>
                        </>
                      )}
                      {formData.paymentMethod === "fopiban" && (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium flex items-center gap-2">
                              <FOPPaymentLogo className="w-5 h-5" />
                              Оплата на рахунок ФОП
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, paymentExpanded: true }));
                                setTimeout(() => {
                                  paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                                }, 150);
                              }}
                              className="text-muted-foreground hover:text-primary"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-sm text-muted-foreground">Оплата на банківський рахунок ФОП</div>
                        </>
                      )}
                    </div>
                  ) : (
                    // Развернутый вид блока оплаты
                    <RadioGroup
                      value={formData.paymentMethod}
                      onValueChange={(value) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          paymentMethod: value,
                          paymentCompleted: true,
                          paymentExpanded: false
                        }));
                      }}
                      className="space-y-3"
                    >
                      <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:border-primary transition-colors">
                        <RadioGroupItem value="wayforpay" id="wayforpay" />
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <WayForPayLogo className="w-5 h-5" />
                            Онлайн оплата
                          </div>
                          <div className="text-sm text-muted-foreground">Безпечна оплата карткою через WayForPay</div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:border-primary transition-colors">
                        <RadioGroupItem value="nalojka" id="nalojka" />
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <CODPaymentLogo className="w-5 h-5" />
                            Накладений платіж
                          </div>
                          <div className="text-sm text-muted-foreground">Оплата при отриманні (+20 грн комісія)</div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:border-primary transition-colors">
                        <RadioGroupItem value="fopiban" id="fopiban" />
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <FOPPaymentLogo className="w-5 h-5" />
                            Оплата на рахунок ФОП
                          </div>
                          <div className="text-sm text-muted-foreground">Оплата на банківський рахунок ФОП</div>
                        </div>
                      </label>
                    </RadioGroup>
                  )}
                </div>

                {/* Reset Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      deliveryMethod: "",
                      deliveryExpanded: true,
                      paymentMethod: "",
                      paymentCompleted: false,
                      paymentExpanded: true,
                      novaPoshtaCity: "",
                      novaPoshtaCityRef: null,
                      novaPoshtaPostOfficeWarehouse: "",
                      novaPoshtaPostOfficeWarehouseRef: null,
                      novaPoshtaPostOfficeCompleted: false,
                      novaPoshtaPostomatWarehouse: "",
                      novaPoshtaPostomatWarehouseRef: null,
                      novaPoshtaPostomatCompleted: false,
                      ukrPoshtaCity: "",
                      ukrPoshtaCityId: null,
                      ukrPoshtaCityRegion: "",
                      ukrPoshtaBranch: "",
                      ukrPoshtaBranchId: null,
                      ukrPoshtaPostalCode: "",
                      ukrPoshtaAddress: "",
                      ukrPoshtaCompleted: false,
                      pickupCompleted: false
                    }));
                  }}
                  className="w-full rounded-xl border border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-primary bg-transparent hover:bg-transparent active:bg-transparent"
                >
                  Скинути вибрані способи
                </Button>

                {/* Comment */}
                <div className="bg-card rounded-2xl p-6 shadow-soft space-y-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, commentExpanded: !prev.commentExpanded }));
                    }}
                  >
                    <Label htmlFor="comment" className="cursor-pointer">Коментар до замовлення</Label>
                    {formData.commentExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  {formData.commentExpanded ? (
                    <div className="space-y-2">
                      <textarea
                        id="comment"
                        name="comment"
                        value={formData.comment}
                        onChange={handleInputChange}
                        placeholder="Введіть коментар"
                        maxLength={254}
                        className="w-full min-h-[100px] p-3 border border-input rounded-xl resize-none focus:outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 bg-background"
                      />
                      <div className="text-sm text-muted-foreground text-left">
                        Залишилось символів: {254 - formData.comment.length}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-xl border h-10 hover:border hover:bg-transparent hover:text-primary disabled:hover:text-primary disabled:opacity-50"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, commentExpanded: false }));
                        }}
                      >
                        Зберегти
                      </Button>
                    </div>
                  ) : (
                    formData.comment && (
                      <div className="text-sm text-muted-foreground">
                        {formData.comment.length > 100 ? formData.comment.substring(0, 100) + '...' : formData.comment}
                      </div>
                    )
                  )}
                </div>

              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1" data-order-summary>
              <div className="sticky top-24 space-y-4">
                {/* Order Items Block - Desktop/Tablet */}
                <div className="hidden lg:block">
                  <div className="bg-card rounded-2xl p-4 shadow-soft order-items-container">
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-base font-semibold">Замовлення</h2>
                      <span className="text-sm text-muted-foreground">{items.length} товара</span>
                    </div>
                    
                    {/* Horizontal scrollable products */}
                    {cartItemsWithProducts.length > 1 ? (
                      <div className="overflow-x-auto order-items-scroll" style={{ paddingLeft: '12px', paddingTop: '0.5rem', paddingBottom: '0.75rem', WebkitOverflowScrolling: 'touch', marginLeft: '-1rem', marginRight: '-1rem' }}>
                        <ul className="flex gap-4" style={{ width: 'max-content' }}>
                          {cartItemsWithProducts.map((item, index) => {
                            const product = item.product!;
                            const productOptions = item.selectedOptions.map(optId => 
                              product.options.find(o => o.code === optId)
                            ).filter(Boolean);
                            const optionsTotal = productOptions.reduce((sum, opt) => sum + (opt?.price || 0), 0);
                            const currentPrice = product.salePrice || product.basePrice;
                            const basePrice = product.basePrice;
                            const hasDiscount = product.salePrice && product.salePrice < basePrice;
                            const unitPrice = currentPrice + optionsTotal;
                            
                            return (
                              <li key={item.id || `${item.productId}_${index}`} style={{ flexBasis: '265px', flexShrink: 0 }}>
                                <div className="bg-background rounded-xl p-3 border border-border">
                                  <div 
                                    className="flex gap-3"
                                    style={{ 
                                      alignContent: 'space-between',
                                      marginLeft: 'calc(4px / 2 * -1)',
                                      marginRight: 'calc(4px / 2 * -1)',
                                      display: 'flex',
                                      flexWrap: 'wrap',
                                      minWidth: 0
                                    }}
                                  >
                                    {/* Image */}
                                    <div className="flex-shrink-0">
                                      <div className="w-[88px] h-[90px] rounded-lg overflow-hidden">
                                        <img
                                          src={product.images[0]}
                                          alt={product.name}
                                          className="w-full h-full object-cover"
                                          loading="lazy"
                                        />
                                      </div>
                                    </div>
                                    
                                    {/* Product info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                      <div>
                                        <div className="font-medium text-sm mb-1 line-clamp-2" style={{ fontSize: '0.875rem' }}>
                                          {product.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground mb-1">
                                          {item.quantity} шт.
                                          {productOptions.length > 0 && (
                                            <span> + {productOptions.length} {productOptions.length === 1 ? 'опція' : 'опції'}</span>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Price */}
                                      <div className="mt-auto">
                                        {hasDiscount ? (
                                          <div>
                                            <div className="text-sm font-semibold text-destructive" style={{ fontSize: '0.875rem' }}>
                                              {unitPrice} ₴/шт.
                                            </div>
                                            <div className="text-xs text-muted-foreground line-through" style={{ fontSize: '0.75rem' }}>
                                              {basePrice + optionsTotal} ₴/шт.
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-sm font-semibold" style={{ fontSize: '0.875rem' }}>
                                            {unitPrice} ₴/шт.
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : cartItemsWithProducts.length === 1 ? (
                      <div>
                        {cartItemsWithProducts.map((item, index) => {
                          const product = item.product!;
                          const productOptions = item.selectedOptions.map(optId => 
                            product.options.find(o => o.code === optId)
                          ).filter(Boolean);
                          const optionsTotal = productOptions.reduce((sum, opt) => sum + (opt?.price || 0), 0);
                          const currentPrice = product.salePrice || product.basePrice;
                          const basePrice = product.basePrice;
                          const hasDiscount = product.salePrice && product.salePrice < basePrice;
                          const unitPrice = currentPrice + optionsTotal;
                          
                          return (
                            <div key={item.id || `${item.productId}_${index}`} className="bg-background rounded-xl p-3 border border-border">
                              <div className="flex gap-3">
                                {/* Image */}
                                <div className="flex-shrink-0">
                                  <div className="w-[88px] h-[90px] rounded-lg overflow-hidden">
                                    <img
                                      src={product.images[0]}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  </div>
                                </div>
                                
                                {/* Product info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                  <div>
                                    <div className="font-medium text-sm mb-1 line-clamp-2" style={{ fontSize: '0.875rem' }}>
                                      {product.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-1">
                                      {item.quantity} шт.
                                      {productOptions.length > 0 && (
                                        <span> + {productOptions.length} {productOptions.length === 1 ? 'опція' : 'опції'}</span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Price */}
                                  <div className="mt-auto">
                                    {hasDiscount ? (
                                      <div>
                                        <div className="text-sm font-semibold text-destructive" style={{ fontSize: '0.875rem' }}>
                                          {unitPrice} ₴/шт.
                                        </div>
                                        <div className="text-xs text-muted-foreground line-through" style={{ fontSize: '0.75rem' }}>
                                          {basePrice + optionsTotal} ₴/шт.
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-sm font-semibold" style={{ fontSize: '0.875rem' }}>
                                        {unitPrice} ₴/шт.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Order Block */}
                <div className="bg-card rounded-2xl p-6 shadow-soft space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Вартість замовлення:</span>
                      <span>{formatPrice(getSubtotal())} ₴</span>
                    </div>
                    {(getDiscount() > 0 || getPromoDiscount() > 0) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Знижка:</span>
                        <span className="text-red-600">-{formatPrice(getTotalDiscount())} ₴</span>
                      </div>
                    )}
                    {formData.deliveryMethod && deliveryInfo && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-2">
                            {formData.deliveryMethod === "nova_poshta" && <NovaPoshtaLogo className="w-4 h-4" />}
                            {formData.deliveryMethod === "ukr_poshta" && <UkrposhtaLogo className="w-4 h-4" />}
                            {formData.deliveryMethod === "pickup" && <PickupLogo className="w-4 h-4" />}
                            {deliveryLabel}
                          </span>
                          <span className={deliveryInfo.price === 0 ? "text-green-600" : ""}>
                            {deliveryInfo.text}
                          </span>
                        </div>
                        {deliveryInfo.showFree && (
                          <div className="text-sm text-green-600">
                            Безкоштовна доставка від {FREE_DELIVERY_THRESHOLD} ₴
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>{orderTotal >= FREE_DELIVERY_THRESHOLD ? "До оплати з доставкою:" : "До оплати без доставки:"}</span>
                      <span className="text-primary">
                        {formatPrice(orderTotal)} ₴
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full rounded-xl"
                      disabled={isSubmitting}
                      onClick={handleSubmit}
                    >
                      {isSubmitting ? "Обробка..." : "Оформити замовлення"}
                    </Button>
                  </div>

                  {/* Trust badges */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t justify-center text-muted-foreground" style={{ fontSize: '0.85rem' }}>
                    <span>🔒 Безпечна оплата</span>
                    <span>📦 Швидка доставка</span>
                    <span>↩️ 14 днів повернення</span>
                  </div>
                </div>

                {/* Promo Code Section - отдельный блок */}
                <div className="bg-card/50 rounded-2xl p-4 shadow-soft space-y-3">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setPromoCodeExpanded(!promoCodeExpanded)}
                >
                  <h3 className="font-medium text-muted-foreground text-sm">Ввести промокод</h3>
                  {promoCodeExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                
                {promoCodeExpanded && (
                  <div className="space-y-3">
                    {promoCodeApplied ? (
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>{promoCodeApplied.message}</span>
                      </div>
                    ) : (
                      <>
                        <Input
                          type="text"
                          placeholder="Промокод"
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value);
                            setPromoCodeError("");
                          }}
                          className={`rounded-xl ${promoCodeError ? 'border-red-500' : ''}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyPromoCode();
                            }
                          }}
                        />
                        {promoCodeError && (
                          <p className="text-sm text-red-500">{promoCodeError}</p>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyPromoCode}
                          disabled={!promoCode.trim() || isApplyingPromo}
                          className="w-full rounded-xl border h-10 hover:border hover:bg-transparent hover:text-primary disabled:hover:text-primary disabled:opacity-50"
                        >
                          {isApplyingPromo ? "Застосування..." : "Застосувати"}
                        </Button>
                      </>
                    )}
                  </div>
                )}
                </div>

                {/* Rules and Recipient Section */}
                <div className="space-y-3" style={{ fontSize: '0.8rem' }}>
                  {/* Agreement text - без блока */}
                  <p className="text-muted-foreground">
                    Натискаючи кнопку «Оформити замовлення», я погоджуюсь з правилами та умовами нижче
                  </p>
                  
                  {/* Rules and Recipient in block */}
                  <div className="space-y-3">
                    {/* Rules Section */}
                    <div className="space-y-2">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setRulesExpanded(!rulesExpanded)}
                      >
                        <span className="font-medium">Правила та умови</span>
                        {rulesExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      {rulesExpanded && (
                        <div className="pt-2 space-y-2 text-muted-foreground">
                          <p>Оформлюючи/оплачуючи замовлення, користувач підтверджує, що надає:</p>
                          <p>
                            Згоду з <a href="/privacy-policy" target="_blank" className="text-primary hover:underline">Політикою конфіденційності</a> та <a href="/terms-of-use" target="_blank" className="text-primary hover:underline">Угодою користувача</a>.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Recipient Section */}
                    <div className="space-y-2">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setRecipientExpanded(!recipientExpanded)}
                      >
                        <span className="font-medium">*Отримувач коштів</span>
                        {recipientExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      {recipientExpanded && (
                        <div className="pt-2 text-muted-foreground">
                          <p>
                            за замовлення: ФОП Пітальов Олександр Миколайович, 3078718311, UA383052990000026008046715224
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
