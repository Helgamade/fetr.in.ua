// Автоматические тесты валидации контактов
const validateCyrillic = (value) => {
  const cyrillicRegex = /^[а-яА-ЯіІїЇєЄґҐ\s-]+$/;
  return cyrillicRegex.test(value);
};

// Функция валидации (ТОЧНО КАК В CHECKOUT)
function validateContact(customer, recipient) {
  const isPhoneValid = customer?.phone 
    ? ((customer.phone === "" || customer.phone === "+380" ? "" : customer.phone).replace(/\D/g, '').length === 12 && (customer.phone === "" || customer.phone === "+380" ? "" : customer.phone).replace(/\D/g, '').startsWith('380'))
    : false;
  
  const isLastNameValid = customer?.lastName 
    ? (customer.lastName.trim() !== "" && validateCyrillic(customer.lastName))
    : false;
    
  const isFirstNameValid = customer?.firstName 
    ? (customer.firstName.trim() !== "" && validateCyrillic(customer.firstName))
    : false;
  
  const isRecipientPhoneValid = !recipient || ((recipient.phone === "" || recipient.phone === "+380" ? "" : recipient.phone).replace(/\D/g, '').length === 12 && (recipient.phone === "" || recipient.phone === "+380" ? "" : recipient.phone).replace(/\D/g, '').startsWith('380'));
  const isRecipientLastNameValid = !recipient || (recipient.lastName.trim() !== "" && validateCyrillic(recipient.lastName));
  const isRecipientFirstNameValid = !recipient || (recipient.firstName.trim() !== "" && validateCyrillic(recipient.firstName));
  const isRecipientInfoValid = !recipient || (isRecipientPhoneValid && isRecipientLastNameValid && isRecipientFirstNameValid);
  
  return isPhoneValid && isLastNameValid && isFirstNameValid && isRecipientInfoValid;
}

let passed = 0;
let failed = 0;
const errors = [];

function test(name, customer, recipient, expected) {
  const result = validateContact(customer, recipient);
  if (result === expected) {
    passed++;
    console.log(`✅ TEST ${passed + failed}: ${name}`);
  } else {
    failed++;
    const error = `❌ TEST ${passed + failed}: ${name} - Expected ${expected}, got ${result}`;
    errors.push(error);
    console.error(error);
    console.error('  Customer:', JSON.stringify(customer));
    console.error('  Recipient:', JSON.stringify(recipient));
  }
}

console.log('=== НАЧАЛО ТЕСТОВ ВАЛИДАЦИИ КОНТАКТОВ ===\n');

// Тест 1-10: Валидные телефоны
test('Валидный телефон 380123456789', { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' }, null, true);
test('Валидный телефон +380123456789', { phone: '+380123456789', lastName: 'Петров', firstName: 'Петро' }, null, true);
test('Валидный телефон 380 12 345 67 89', { phone: '380 12 345 67 89', lastName: 'Сидоров', firstName: 'Сидір' }, null, true);
test('Валидный телефон (380)123456789', { phone: '(380)123456789', lastName: 'Коваленко', firstName: 'Олексій' }, null, true);
test('Валидный телефон 380-123-456-789', { phone: '380-123-456-789', lastName: 'Шевченко', firstName: 'Тарас' }, null, true);
test('Валидный телефон 380.123.456.789', { phone: '380.123.456.789', lastName: 'Мельник', firstName: 'Андрій' }, null, true);
test('Валидный телефон +380 (12) 345-67-89', { phone: '+380 (12) 345-67-89', lastName: 'Бондаренко', firstName: 'Володимир' }, null, true);
test('Валидный телефон 3801234567890 (13 цифр)', { phone: '3801234567890', lastName: 'Ткаченко', firstName: 'Микола' }, null, false); // 13 цифр - невалидно
test('Валидный телефон 38012345678 (11 цифр)', { phone: '38012345678', lastName: 'Кравченко', firstName: 'Олег' }, null, false); // 11 цифр - невалидно
test('Валидный телефон 380123456789 (12 цифр)', { phone: '380123456789', lastName: 'Мороз', firstName: 'Сергій' }, null, true);

// Тест 11-20: Невалидные телефоны
test('Пустой телефон', { phone: '', lastName: 'Іванов', firstName: 'Іван' }, null, false);
test('Телефон +380', { phone: '+380', lastName: 'Петров', firstName: 'Петро' }, null, false);
test('Телефон 380', { phone: '380', lastName: 'Сидоров', firstName: 'Сидір' }, null, false);
test('Телефон начинается не с 380', { phone: '123456789012', lastName: 'Коваленко', firstName: 'Олексій' }, null, false);
test('Телефон с буквами', { phone: '380abc456789', lastName: 'Шевченко', firstName: 'Тарас' }, null, false);
test('Телефон null', { phone: null, lastName: 'Мельник', firstName: 'Андрій' }, null, false);
test('Телефон undefined', { phone: undefined, lastName: 'Бондаренко', firstName: 'Володимир' }, null, false);
test('Телефон только пробелы', { phone: '   ', lastName: 'Ткаченко', firstName: 'Микола' }, null, false);
test('Телефон 38012345678901 (14 цифр)', { phone: '38012345678901', lastName: 'Кравченко', firstName: 'Олег' }, null, false);
test('Телефон 3801234567 (10 цифр)', { phone: '3801234567', lastName: 'Мороз', firstName: 'Сергій' }, null, false);

// Тест 21-30: Валидные имена
test('Валидное имя кириллицей', { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' }, null, true);
test('Валидное имя с дефисом', { phone: '380123456789', lastName: 'Петров-Сидоров', firstName: 'Петро-Іван' }, null, true);
test('Валидное имя с пробелами', { phone: '380123456789', lastName: 'Коваленко', firstName: 'Олексій Володимирович' }, null, true);
test('Валидное имя украинские буквы', { phone: '380123456789', lastName: 'Шевченко', firstName: 'Тарас' }, null, true);
test('Валидное имя іїє', { phone: '380123456789', lastName: 'Мельник', firstName: 'Андрій' }, null, true);
test('Валидное имя ґ', { phone: '380123456789', lastName: 'Бондаренко', firstName: 'Володимир' }, null, true);
test('Валидное имя все украинские', { phone: '380123456789', lastName: 'Ткаченко', firstName: 'Микола' }, null, true);
test('Валидное имя длинное', { phone: '380123456789', lastName: 'Кравченко-Мороз-Іванов', firstName: 'Олег-Петро-Сергій' }, null, true);
test('Валидное имя одно слово', { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' }, null, true);
test('Валидное имя два слова', { phone: '380123456789', lastName: 'Петров Сидоров', firstName: 'Петро Іван' }, null, true);

// Тест 31-40: Невалидные имена
test('Имя с латиницей', { phone: '380123456789', lastName: 'Ivanov', firstName: 'Ivan' }, null, false);
test('Имя с цифрами', { phone: '380123456789', lastName: 'Іванов123', firstName: 'Іван456' }, null, false);
test('Имя пустое', { phone: '380123456789', lastName: '', firstName: 'Іван' }, null, false);
test('Имя только пробелы', { phone: '380123456789', lastName: '   ', firstName: 'Іван' }, null, false);
test('Имя null', { phone: '380123456789', lastName: null, firstName: 'Іван' }, null, false);
test('Имя undefined', { phone: '380123456789', lastName: undefined, firstName: 'Іван' }, null, false);
test('Имя с спецсимволами', { phone: '380123456789', lastName: 'Іванов!', firstName: 'Іван@' }, null, false);
test('Имя с точкой', { phone: '380123456789', lastName: 'Іванов.', firstName: 'Іван.' }, null, false);
test('Имя с запятой', { phone: '380123456789', lastName: 'Іванов,', firstName: 'Іван,' }, null, false);
test('Имя с скобками', { phone: '380123456789', lastName: 'Іванов()', firstName: 'Іван()' }, null, false);

// Тест 41-50: С получателем валидным
test('С валидным получателем', 
  { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' },
  { phone: '380987654321', lastName: 'Петров', firstName: 'Петро' },
  true);
test('С валидным получателем разные форматы', 
  { phone: '+380123456789', lastName: 'Сидоров', firstName: 'Сидір' },
  { phone: '380 987 654 321', lastName: 'Коваленко', firstName: 'Олексій' },
  true);
test('С получателем без телефона', 
  { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' },
  { phone: '', lastName: 'Петров', firstName: 'Петро' },
  false);
test('С получателем невалидный телефон', 
  { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' },
  { phone: '123456789012', lastName: 'Петров', firstName: 'Петро' },
  false);
test('С получателем без фамилии', 
  { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' },
  { phone: '380987654321', lastName: '', firstName: 'Петро' },
  false);
test('С получателем без имени', 
  { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' },
  { phone: '380987654321', lastName: 'Петров', firstName: '' },
  false);
test('С получателем латиница', 
  { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' },
  { phone: '380987654321', lastName: 'Petrov', firstName: 'Petro' },
  false);
test('С получателем все валидно', 
  { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' },
  { phone: '380987654321', lastName: 'Петров-Сидоров', firstName: 'Петро-Іван' },
  true);
test('С получателем длинные имена', 
  { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' },
  { phone: '380987654321', lastName: 'Кравченко-Мороз-Іванов', firstName: 'Олег-Петро-Сергій' },
  true);
test('С получателем пробелы в имени', 
  { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' },
  { phone: '380987654321', lastName: 'Петров Сидоров', firstName: 'Петро Іван' },
  true);

// Тест 51-60: Граничные случаи
test('Только телефон валидный', { phone: '380123456789', lastName: '', firstName: '' }, null, false);
test('Только фамилия валидная', { phone: '', lastName: 'Іванов', firstName: '' }, null, false);
test('Только имя валидное', { phone: '', lastName: '', firstName: 'Іван' }, null, false);
test('Телефон и фамилия валидны', { phone: '380123456789', lastName: 'Іванов', firstName: '' }, null, false);
test('Телефон и имя валидны', { phone: '380123456789', lastName: '', firstName: 'Іван' }, null, false);
test('Фамилия и имя валидны', { phone: '', lastName: 'Іванов', firstName: 'Іван' }, null, false);
test('Все пусто', { phone: '', lastName: '', firstName: '' }, null, false);
test('Все null', { phone: null, lastName: null, firstName: null }, null, false);
test('Все undefined', { phone: undefined, lastName: undefined, firstName: undefined }, null, false);
test('Customer null', null, null, false);

// Тест 61-70: Реальные данные из базы
test('Реальный заказ 1', 
  { phone: '+380501234567', lastName: 'Іванов', firstName: 'Іван' },
  null,
  true);
test('Реальный заказ 2', 
  { phone: '380671234567', lastName: 'Петров', firstName: 'Петро' },
  { phone: '380501234567', lastName: 'Сидоров', firstName: 'Сидір' },
  true);
test('Реальный заказ 3', 
  { phone: '+380 50 123 45 67', lastName: 'Коваленко', firstName: 'Олексій' },
  null,
  true);
test('Реальный заказ 4', 
  { phone: '380501234567', lastName: 'Шевченко', firstName: 'Тарас Григорович' },
  null,
  true);
test('Реальный заказ 5', 
  { phone: '+380501234567', lastName: 'Мельник', firstName: 'Андрій' },
  { phone: '380671234567', lastName: 'Бондаренко', firstName: 'Володимир' },
  true);
test('Реальный заказ невалидный телефон', 
  { phone: '0501234567', lastName: 'Ткаченко', firstName: 'Микола' },
  null,
  false);
test('Реальный заказ невалидное имя', 
  { phone: '380501234567', lastName: 'Kravchenko', firstName: 'Oleg' },
  null,
  false);
test('Реальный заказ короткий телефон', 
  { phone: '38050123456', lastName: 'Мороз', firstName: 'Сергій' },
  null,
  false);
test('Реальный заказ длинный телефон', 
  { phone: '3805012345678', lastName: 'Іванов', firstName: 'Іван' },
  null,
  false);
test('Реальный заказ пробелы в телефоне', 
  { phone: '380 50 123 45 67', lastName: 'Петров', firstName: 'Петро' },
  null,
  true);

// Тест 71-80: Различные комбинации
test('Комбинация 1: все валидно', 
  { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' },
  null,
  true);
test('Комбинация 2: телефон невалидный', 
  { phone: '123456789012', lastName: 'Іванов', firstName: 'Іван' },
  null,
  false);
test('Комбинация 3: фамилия невалидна', 
  { phone: '380123456789', lastName: 'Ivanov', firstName: 'Іван' },
  null,
  false);
test('Комбинация 4: имя невалидно', 
  { phone: '380123456789', lastName: 'Іванов', firstName: 'Ivan' },
  null,
  false);
test('Комбинация 5: получатель невалиден', 
  { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' },
  { phone: '123456789012', lastName: 'Петров', firstName: 'Петро' },
  false);
test('Комбинация 6: получатель без данных', 
  { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' },
  { phone: '', lastName: '', firstName: '' },
  false);
test('Комбинация 7: получатель частично', 
  { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' },
  { phone: '380987654321', lastName: 'Петров', firstName: '' },
  false);
test('Комбинация 8: все невалидно', 
  { phone: '123', lastName: 'Ivanov', firstName: 'Ivan' },
  { phone: '456', lastName: 'Petrov', firstName: 'Petro' },
  false);
test('Комбинация 9: только получатель валиден', 
  { phone: '', lastName: '', firstName: '' },
  { phone: '380987654321', lastName: 'Петров', firstName: 'Петро' },
  false);
test('Комбинация 10: получатель null', 
  { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' },
  null,
  true);

// Тест 81-90: Специальные случаи
test('Телефон с +380 в начале', { phone: '+380123456789', lastName: 'Іванов', firstName: 'Іван' }, null, true);
test('Телефон только +380', { phone: '+380', lastName: 'Іванов', firstName: 'Іван' }, null, false);
test('Телефон пустая строка', { phone: '', lastName: 'Іванов', firstName: 'Іван' }, null, false);
test('Телефон "+380" как строка', { phone: '+380', lastName: 'Іванов', firstName: 'Іван' }, null, false);
test('Имя с дефисом в начале', { phone: '380123456789', lastName: '-Іванов', firstName: 'Іван' }, null, false);
test('Имя с дефисом в конце', { phone: '380123456789', lastName: 'Іванов-', firstName: 'Іван' }, null, false);
test('Имя только дефис', { phone: '380123456789', lastName: '-', firstName: 'Іван' }, null, false);
test('Имя только пробел', { phone: '380123456789', lastName: ' ', firstName: 'Іван' }, null, false);
test('Имя trim работает', { phone: '380123456789', lastName: '  Іванов  ', firstName: '  Іван  ' }, null, true);
test('Телефон trim не нужен', { phone: '  380123456789  ', lastName: 'Іванов', firstName: 'Іван' }, null, true);

// Тест 91-100: Финальные проверки
test('Финальный тест 1', 
  { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' },
  null,
  true);
test('Финальный тест 2', 
  { phone: '+380123456789', lastName: 'Петров', firstName: 'Петро' },
  { phone: '380987654321', lastName: 'Сидоров', firstName: 'Сидір' },
  true);
test('Финальный тест 3', 
  { phone: '380123456789', lastName: 'Коваленко', firstName: 'Олексій' },
  null,
  true);
test('Финальный тест 4', 
  { phone: '380123456789', lastName: 'Шевченко', firstName: 'Тарас' },
  { phone: '380987654321', lastName: 'Мельник', firstName: 'Андрій' },
  true);
test('Финальный тест 5', 
  { phone: '+380123456789', lastName: 'Бондаренко', firstName: 'Володимир' },
  null,
  true);
test('Финальный тест 6 - невалидный', 
  { phone: '123456789012', lastName: 'Іванов', firstName: 'Іван' },
  null,
  false);
test('Финальный тест 7 - невалидный', 
  { phone: '380123456789', lastName: 'Ivanov', firstName: 'Іван' },
  null,
  false);
test('Финальный тест 8 - невалидный', 
  { phone: '380123456789', lastName: 'Іванов', firstName: 'Ivan' },
  null,
  false);
test('Финальный тест 9 - невалидный получатель', 
  { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' },
  { phone: '123456789012', lastName: 'Петров', firstName: 'Петро' },
  false);
test('Финальный тест 10 - все валидно с получателем', 
  { phone: '380123456789', lastName: 'Іванов', firstName: 'Іван' },
  { phone: '380987654321', lastName: 'Петров', firstName: 'Петро' },
  true);

console.log('\n=== РЕЗУЛЬТАТЫ ТЕСТОВ ===');
console.log(`✅ Пройдено: ${passed}`);
console.log(`❌ Провалено: ${failed}`);
console.log(`📊 Всего: ${passed + failed}`);
console.log(`📈 Успешность: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);

if (errors.length > 0) {
  console.log('\n=== ОШИБКИ ===');
  errors.forEach((error, index) => {
    console.log(`${index + 1}. ${error}`);
  });
  process.exit(1);
} else {
  console.log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!');
  process.exit(0);
}
