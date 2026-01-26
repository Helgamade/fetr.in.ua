import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Pencil } from "lucide-react";
import type { CustomerInfo, RecipientInfo } from "@/types/store";

interface CustomerRecipientFormProps {
  customer: CustomerInfo;
  recipient?: RecipientInfo;
  onSave: (customer: CustomerInfo, recipient?: RecipientInfo) => void;
  onCancel?: () => void;
  mode?: 'edit' | 'view'; // 'edit' - всегда в режиме редактирования, 'view' - можно свернуть/развернуть
  defaultExpanded?: boolean;
}

export const CustomerRecipientForm = ({
  customer: initialCustomer,
  recipient: initialRecipient,
  onSave,
  onCancel,
  mode = 'view',
  defaultExpanded = false,
}: CustomerRecipientFormProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || mode === 'edit');
  const [formData, setFormData] = useState({
    firstName: initialCustomer.firstName || "",
    lastName: initialCustomer.lastName || "",
    phone: initialCustomer.phone || "",
    hasDifferentRecipient: !!initialRecipient,
    recipientFirstName: initialRecipient?.firstName || "",
    recipientLastName: initialRecipient?.lastName || "",
    recipientPhone: initialRecipient?.phone || "",
  });

  // Функции валидации (определяем до useEffect, чтобы использовать в нем)
  const validatePhone = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, '');
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

  const validateCyrillic = (value: string): boolean => {
    const cyrillicRegex = /^[а-яА-ЯіІїЇєЄґҐ\s-]+$/;
    return cyrillicRegex.test(value);
  };

  // Обновляем formData при изменении initialCustomer/initialRecipient или при открытии формы редактирования
  useEffect(() => {
    if (isExpanded || mode === 'edit') {
      // Парсим имя заказчика, если оно в формате "Фамилия Имя"
      let firstName = initialCustomer.firstName || "";
      let lastName = initialCustomer.lastName || "";
      
      if (!firstName && !lastName && initialCustomer.name) {
        const nameParts = initialCustomer.name.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          lastName = nameParts[0];
          firstName = nameParts.slice(1).join(' ');
        } else if (nameParts.length === 1) {
          lastName = nameParts[0];
        }
      }

      // Парсим имя получателя, если оно в формате "Фамилия Имя"
      let recipientFirstName = initialRecipient?.firstName || "";
      let recipientLastName = initialRecipient?.lastName || "";
      
      if (initialRecipient && !recipientFirstName && !recipientLastName && initialRecipient.name) {
        const recipientNameParts = initialRecipient.name.trim().split(/\s+/);
        if (recipientNameParts.length >= 2) {
          recipientLastName = recipientNameParts[0];
          recipientFirstName = recipientNameParts.slice(1).join(' ');
        } else if (recipientNameParts.length === 1) {
          recipientLastName = recipientNameParts[0];
        }
      }

      setFormData({
        firstName,
        lastName,
        phone: initialCustomer.phone || "",
        hasDifferentRecipient: !!initialRecipient,
        recipientFirstName,
        recipientLastName,
        recipientPhone: initialRecipient?.phone || "",
      });
      
      // При открытии формы автоматически валидируем заполненные поля
      if (isExpanded) {
        // Валидация телефона заказчика
        if (initialCustomer.phone) {
          setPhoneTouched(true);
          validatePhone(initialCustomer.phone);
        }
        
        // Валидация имени и фамилии заказчика
        if (lastName) {
          setLastNameTouched(true);
          if (lastName.trim() === "") {
            setLastNameError("Це обов'язкове поле");
          } else if (!validateCyrillic(lastName)) {
            setLastNameError("Використовуйте тільки кириличні символи");
          } else {
            setLastNameError("");
          }
        }
        
        if (firstName) {
          setFirstNameTouched(true);
          if (firstName.trim() === "") {
            setFirstNameError("Це обов'язкове поле");
          } else if (!validateCyrillic(firstName)) {
            setFirstNameError("Використовуйте тільки кириличні символи");
          } else {
            setFirstNameError("");
          }
        }
        
        // Валидация данных получателя (если указан)
        if (initialRecipient) {
          if (initialRecipient.phone) {
            setRecipientPhoneTouched(true);
            const digitsOnly = initialRecipient.phone.replace(/\D/g, '');
            if (digitsOnly.length === 0) {
              setRecipientPhoneError("Це обов'язкове поле");
            } else if (digitsOnly.length < 12 || !digitsOnly.startsWith('380')) {
              setRecipientPhoneError("Некоректний номер");
            } else {
              setRecipientPhoneError("");
            }
          }
          
          if (recipientLastName) {
            setRecipientLastNameTouched(true);
            if (recipientLastName.trim() === "") {
              setRecipientLastNameError("Це обов'язкове поле");
            } else if (!validateCyrillic(recipientLastName)) {
              setRecipientLastNameError("Використовуйте тільки кириличні символи");
            } else {
              setRecipientLastNameError("");
            }
          }
          
          if (recipientFirstName) {
            setRecipientFirstNameTouched(true);
            if (recipientFirstName.trim() === "") {
              setRecipientFirstNameError("Це обов'язкове поле");
            } else if (!validateCyrillic(recipientFirstName)) {
              setRecipientFirstNameError("Використовуйте тільки кириличні символи");
            } else {
              setRecipientFirstNameError("");
            }
          }
        }
      }
    }
  }, [initialCustomer, initialRecipient, isExpanded, mode]);

  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const [lastNameTouched, setLastNameTouched] = useState(false);
  const [lastNameError, setLastNameError] = useState("");
  const [firstNameTouched, setFirstNameTouched] = useState(false);
  const [firstNameError, setFirstNameError] = useState("");
  const [recipientPhoneTouched, setRecipientPhoneTouched] = useState(false);
  const [recipientPhoneError, setRecipientPhoneError] = useState("");
  const recipientPhoneInputRef = useRef<HTMLInputElement>(null);
  const [recipientLastNameTouched, setRecipientLastNameTouched] = useState(false);
  const [recipientLastNameError, setRecipientLastNameError] = useState("");
  const [recipientFirstNameTouched, setRecipientFirstNameTouched] = useState(false);
  const [recipientFirstNameError, setRecipientFirstNameError] = useState("");

  const formatPhone = (value: string): string => {
    const digitsOnly = value.replace(/\D/g, '');
    let phoneDigits = digitsOnly;
    if (!phoneDigits.startsWith('380')) {
      phoneDigits = '380' + phoneDigits;
    }
    phoneDigits = phoneDigits.slice(0, 12);
    if (phoneDigits.length <= 3) {
      return '+' + phoneDigits;
    }
    return '+' + phoneDigits;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setFormData(prev => ({ ...prev, phone: "" }));
      if (phoneTouched) {
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
    
    setFormData(prev => ({ ...prev, phone: formatted }));
    
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

  const handlePhoneFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      if (phoneInputRef.current) {
        const phone = formData.phone === "" ? "+380" : formData.phone;
        if (phone.length > 4) {
          phoneInputRef.current.setSelectionRange(phone.length, phone.length);
        } else {
          phoneInputRef.current.setSelectionRange(4, 4);
        }
      }
    }, 0);
  };

  const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (formData.phone === "" || formData.phone === "+380") {
      setFormData(prev => ({ ...prev, phone: "" }));
    }
    setPhoneTouched(true);
    validatePhone(formData.phone === "" || formData.phone === "+380" ? "" : formData.phone);
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || validateCyrillic(value)) {
      setFormData(prev => ({ ...prev, lastName: value }));
      setLastNameTouched(true);
      if (value.trim() === "") {
        setLastNameError("Це обов'язкове поле");
      } else {
        setLastNameError("");
      }
    } else {
      setLastNameTouched(true);
      setLastNameError("Використовуйте тільки кириличні символи");
    }
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || validateCyrillic(value)) {
      setFormData(prev => ({ ...prev, firstName: value }));
      setFirstNameTouched(true);
      if (value.trim() === "") {
        setFirstNameError("Це обов'язкове поле");
      } else {
        setFirstNameError("");
      }
    } else {
      setFirstNameTouched(true);
      setFirstNameError("Використовуйте тільки кириличні символи");
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

  const isPhoneValid = phoneTouched && !phoneError && formData.phone && formData.phone.length >= 12;
  const isLastNameValid = lastNameTouched && !lastNameError && formData.lastName.trim() !== "";
  const isFirstNameValid = firstNameTouched && !firstNameError && formData.firstName.trim() !== "";
  const isContactInfoValid = isPhoneValid && isLastNameValid && isFirstNameValid;

  const isRecipientPhoneValid = !formData.hasDifferentRecipient || (recipientPhoneTouched && !recipientPhoneError && formData.recipientPhone && formData.recipientPhone.length >= 12);
  const isRecipientLastNameValid = !formData.hasDifferentRecipient || (recipientLastNameTouched && !recipientLastNameError && formData.recipientLastName.trim() !== "");
  const isRecipientFirstNameValid = !formData.hasDifferentRecipient || (recipientFirstNameTouched && !recipientFirstNameError && formData.recipientFirstName.trim() !== "");
  const isRecipientValid = !formData.hasDifferentRecipient || (isRecipientPhoneValid && isRecipientLastNameValid && isRecipientFirstNameValid);

  const isValid = isContactInfoValid && isRecipientValid;

  const handleSave = () => {
    if (!isValid) return;

    const customer: CustomerInfo = {
      name: `${formData.lastName} ${formData.firstName}`,
      phone: formData.phone,
      firstName: formData.firstName,
      lastName: formData.lastName,
    };

    const recipient: RecipientInfo | undefined = formData.hasDifferentRecipient ? {
      name: `${formData.recipientLastName} ${formData.recipientFirstName}`,
      phone: formData.recipientPhone,
      firstName: formData.recipientFirstName,
      lastName: formData.recipientLastName,
    } : undefined;

    onSave(customer, recipient);
    if (mode === 'view') {
      setIsExpanded(false);
    }
  };

  const handleCancel = () => {
    // Восстанавливаем исходные значения с парсингом имени
    let firstName = initialCustomer.firstName || "";
    let lastName = initialCustomer.lastName || "";
    
    if (!firstName && !lastName && initialCustomer.name) {
      const nameParts = initialCustomer.name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        lastName = nameParts[0];
        firstName = nameParts.slice(1).join(' ');
      } else if (nameParts.length === 1) {
        lastName = nameParts[0];
      }
    }

    let recipientFirstName = initialRecipient?.firstName || "";
    let recipientLastName = initialRecipient?.lastName || "";
    
    if (initialRecipient && !recipientFirstName && !recipientLastName && initialRecipient.name) {
      const recipientNameParts = initialRecipient.name.trim().split(/\s+/);
      if (recipientNameParts.length >= 2) {
        recipientLastName = recipientNameParts[0];
        recipientFirstName = recipientNameParts.slice(1).join(' ');
      } else if (recipientNameParts.length === 1) {
        recipientLastName = recipientNameParts[0];
      }
    }

    setFormData({
      firstName,
      lastName,
      phone: initialCustomer.phone || "",
      hasDifferentRecipient: !!initialRecipient,
      recipientFirstName,
      recipientLastName,
      recipientPhone: initialRecipient?.phone || "",
    });
    setPhoneTouched(false);
    setPhoneError("");
    setLastNameTouched(false);
    setLastNameError("");
    setFirstNameTouched(false);
    setFirstNameError("");
    setRecipientPhoneTouched(false);
    setRecipientPhoneError("");
    setRecipientLastNameTouched(false);
    setRecipientLastNameError("");
    setRecipientFirstNameTouched(false);
    setRecipientFirstNameError("");
    
    if (mode === 'view') {
      setIsExpanded(false);
    }
    onCancel?.();
  };

  if (mode === 'view' && !isExpanded) {
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Замовник</div>
          <div className="flex items-center justify-between">
            <div className="text-sm">{initialCustomer.name}</div>
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="text-muted-foreground hover:text-primary"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm">{initialCustomer.phone}</div>
        </div>
        {initialRecipient && (
          <div className="space-y-1 pt-2 border-t">
            <div className="text-xs text-muted-foreground">Отримувач</div>
            <div className="text-sm">{initialRecipient.name}</div>
            <div className="text-sm">{initialRecipient.phone}</div>
          </div>
        )}
      </div>
    );
  }

  return (
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

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="hasDifferentRecipient"
          checked={formData.hasDifferentRecipient}
          onCheckedChange={(checked) => {
            setFormData(prev => ({ 
              ...prev, 
              hasDifferentRecipient: checked as boolean,
              ...(checked ? {} : {
                recipientFirstName: "",
                recipientLastName: "",
                recipientPhone: ""
              })
            }));
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
        </Label>
      </div>

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

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!isValid}
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
