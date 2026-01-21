-- Добавление текстов способов доставки и оплаты для страницы checkout
-- Выполнить этот файл для добавления текстов в site_texts

INSERT INTO site_texts (`key`, value, namespace, description) VALUES
('checkout.delivery.nova_poshta.title', 'Нова Пошта', 'checkout', 'Назва способу доставки "Нова Пошта"'),
('checkout.delivery.nova_poshta.description', '1-2 дні по Україні', 'checkout', 'Опис способу доставки "Нова Пошта"'),
('checkout.delivery.ukrposhta.title', 'Укрпошта', 'checkout', 'Назва способу доставки "Укрпошта"'),
('checkout.delivery.ukrposhta.description', '3-5 днів по Україні', 'checkout', 'Опис способу доставки "Укрпошта"'),
('checkout.delivery.pickup.title', 'Самовивіз', 'checkout', 'Назва способу доставки "Самовивіз"'),
('checkout.payment.wayforpay.title', 'Онлайн оплата', 'checkout', 'Назва способу оплати "WayForPay"'),
('checkout.payment.wayforpay.description', 'Безпечна оплата карткою через WayForPay', 'checkout', 'Опис способу оплати "WayForPay"'),
('checkout.payment.nalojka.title', 'Накладений платіж', 'checkout', 'Назва способу оплати "Накладений платіж"'),
('checkout.payment.nalojka.description', 'Оплата при отриманні (+20 грн комісія)', 'checkout', 'Опис способу оплати "Накладений платіж"'),
('checkout.payment.fop.title', 'Оплата на рахунок ФОП', 'checkout', 'Назва способу оплати "Оплата на рахунок ФОП"'),
('checkout.payment.fop.description', 'Оплата на банківський рахунок ФОП', 'checkout', 'Опис способу оплати "Оплата на рахунок ФОП"')
ON DUPLICATE KEY UPDATE 
  value=VALUES(value), 
  description=VALUES(description);
