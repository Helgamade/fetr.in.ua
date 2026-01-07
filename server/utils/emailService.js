import nodemailer from 'nodemailer';
import pool from '../db.js';
import Handlebars from 'handlebars';

// Регистрируем хелперы для Handlebars
// Handlebars уже имеет встроенный хелпер 'if', но переопределяем для совместимости
Handlebars.registerHelper('if', function(conditional, options) {
  if (arguments.length < 2) {
    throw new Error('Handlebars helper "if" needs at least one parameter');
  }
  if (conditional) {
    return options.fn(this);
  } else {
    return options.inverse ? options.inverse(this) : '';
  }
});

Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

// Кэш транспортера
let transporter = null;

// Получить настройки SMTP из БД
async function getSMTPSettings() {
  const [settings] = await pool.execute(`
    SELECT key_name, value FROM settings 
    WHERE key_name IN ('smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_password', 'smtp_from_email', 'smtp_from_name')
  `);
  
  const smtpSettings = {};
  settings.forEach(setting => {
    smtpSettings[setting.key_name] = setting.value;
  });
  
  return {
    host: smtpSettings.smtp_host || '',
    port: parseInt(smtpSettings.smtp_port || '587'),
    secure: smtpSettings.smtp_secure === 'true',
    auth: {
      user: smtpSettings.smtp_user || '',
      pass: smtpSettings.smtp_password || ''
    },
    from: {
      email: smtpSettings.smtp_from_email || '',
      name: smtpSettings.smtp_from_name || 'Fetr.in.ua'
    }
  };
}

// Инициализировать транспортер
async function initTransporter() {
  const settings = await getSMTPSettings();
  
  if (!settings.host || !settings.auth.user) {
    console.warn('[Email Service] SMTP налаштування не заповнені. Email не будуть відправлятися.');
    return null;
  }
  
  // Определяем secure на основе порта и настройки
  // Порт 465 требует secure: true (SSL)
  // Порт 587 требует secure: false, но requireTLS: true (STARTTLS)
  const isSecure = settings.port === 465 || (settings.secure && settings.port !== 587);
  
  const transporterConfig = {
    host: settings.host,
    port: settings.port,
    secure: isSecure,
    auth: settings.auth.user ? {
      user: settings.auth.user,
      pass: settings.auth.pass
    } : undefined
  };
  
  // Для порта 587 добавляем requireTLS если secure включен
  if (settings.port === 587 && settings.secure) {
    transporterConfig.requireTLS = true;
    transporterConfig.secure = false; // Для 587 всегда false
  }
  
  // Дополнительные опции для надежности
  transporterConfig.tls = {
    rejectUnauthorized: false // Принимаем самоподписанные сертификаты
  };
  
  transporter = nodemailer.createTransport(transporterConfig);
  
  // Проверяем подключение
  try {
    await transporter.verify();
    console.log('[Email Service] SMTP підключення успішне', {
      host: settings.host,
      port: settings.port,
      secure: isSecure
    });
  } catch (error) {
    console.error('[Email Service] Помилка підключення SMTP:', error.message);
    console.error('[Email Service] Деталі помилки:', error);
    transporter = null;
  }
  
  return transporter;
}

// Получить шаблон по типу события
async function getTemplate(eventType) {
  const [templates] = await pool.execute(`
    SELECT * FROM email_templates 
    WHERE event_type = ? AND is_active = TRUE
  `, [eventType]);
  
  if (templates.length === 0) {
    throw new Error(`Шаблон для події ${eventType} не знайдено або неактивний`);
  }
  
  return templates[0];
}

// Компилировать шаблон с данными
function compileTemplate(template, data) {
  const subjectTemplate = Handlebars.compile(template.subject);
  const htmlTemplate = Handlebars.compile(template.body_html);
  const textTemplate = template.body_text ? Handlebars.compile(template.body_text) : null;
  
  return {
    subject: subjectTemplate(data),
    html: htmlTemplate(data),
    text: textTemplate ? textTemplate(data) : null
  };
}

// Отправить email
export async function sendEmail(eventType, recipientEmail, data = {}) {
  try {
    // Проверяем, включены ли email уведомления
    const [settings] = await pool.execute(`
      SELECT value FROM settings WHERE key_name = 'email_notifications'
    `);
    
    if (settings.length === 0 || settings[0].value !== 'true') {
      console.log('[Email Service] Email сповіщення вимкнені в налаштуваннях');
      return { success: false, message: 'Email сповіщення вимкнені' };
    }
    
    if (!recipientEmail || !recipientEmail.trim()) {
      console.log('[Email Service] Email адреса не вказана');
      return { success: false, message: 'Email адреса не вказана' };
    }
    
    // Инициализируем транспортер, если еще не инициализирован
    if (!transporter) {
      await initTransporter();
    }
    
    if (!transporter) {
      return { success: false, message: 'SMTP не налаштовано' };
    }
    
    // Получаем шаблон
    const template = await getTemplate(eventType);
    
    // Компилируем шаблон
    const compiled = compileTemplate(template, data);
    
    // Получаем настройки отправителя
    const smtpSettings = await getSMTPSettings();
    
    // Отправляем email
    const info = await transporter.sendMail({
      from: `"${smtpSettings.from.name}" <${smtpSettings.from.email}>`,
      to: recipientEmail,
      subject: compiled.subject,
      html: compiled.html,
      text: compiled.text || undefined
    });
    
    console.log('[Email Service] Email відправлено:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('[Email Service] Помилка відправки email:', error);
    return { success: false, message: error.message };
  }
}

// Отправить email администратору
export async function sendEmailToAdmin(eventType, data = {}) {
  const [settings] = await pool.execute(`
    SELECT value FROM settings WHERE key_name = 'store_email'
  `);
  
  if (settings.length === 0 || !settings[0].value) {
    console.log('[Email Service] Email адміністратора не вказано');
    return { success: false, message: 'Email адміністратора не вказано' };
  }
  
  return await sendEmail(eventType, settings[0].value, data);
}

// Переинициализировать транспортер (например, после изменения настроек SMTP)
export async function reloadTransporter() {
  transporter = null;
  return await initTransporter();
}

