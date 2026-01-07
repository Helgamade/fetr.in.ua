import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from '../db.js';

// Настройки Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8080/api/auth/google/callback';

/**
 * Настройка Passport для Google OAuth
 */
export function configurePassport() {
  // Стратегия Google OAuth
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;
          const name = profile.displayName || profile.name?.givenName || 'User';
          const avatarUrl = profile.photos?.[0]?.value || null;

          if (!email) {
            return done(new Error('Email not provided by Google'), null);
          }

          // Проверяем, существует ли пользователь с таким google_id
          let [users] = await pool.execute(
            'SELECT * FROM users WHERE google_id = ?',
            [googleId]
          );

          let user = users[0];

          if (!user) {
            // Проверяем, есть ли пользователь с таким email
            [users] = await pool.execute(
              'SELECT * FROM users WHERE email = ?',
              [email]
            );

            user = users[0];

            if (user) {
              // Пользователь существует, но без google_id - обновляем
              await pool.execute(
                'UPDATE users SET google_id = ?, avatar_url = ?, is_email_verified = TRUE, last_login = NOW() WHERE id = ?',
                [googleId, avatarUrl, user.id]
              );
            } else {
              // Создаем нового пользователя
              const [result] = await pool.execute(
                `INSERT INTO users (name, email, google_id, avatar_url, role, is_active, is_email_verified, last_login)
                VALUES (?, ?, ?, ?, 'user', TRUE, TRUE, NOW())`,
                [name, email, googleId, avatarUrl]
              );

              user = {
                id: result.insertId,
                name,
                email,
                google_id: googleId,
                avatar_url: avatarUrl,
                role: 'user',
                is_active: true,
                is_email_verified: true,
              };
            }
          } else {
            // Пользователь уже существует - обновляем время последнего входа
            await pool.execute(
              'UPDATE users SET last_login = NOW(), avatar_url = ? WHERE id = ?',
              [avatarUrl, user.id]
            );
          }

          // Получаем актуальные данные пользователя
          [users] = await pool.execute(
            'SELECT id, name, email, google_id, avatar_url, role, is_active FROM users WHERE google_id = ?',
            [googleId]
          );

          user = users[0];

          return done(null, user);
        } catch (error) {
          console.error('[OAuth] Error during Google authentication:', error);
          return done(error, null);
        }
      }
    )
  );

  // Сериализация пользователя в сессию
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Десериализация пользователя из сессии
  passport.deserializeUser(async (id, done) => {
    try {
      const [users] = await pool.execute(
        'SELECT id, name, email, google_id, avatar_url, role, is_active FROM users WHERE id = ?',
        [id]
      );

      if (users.length === 0) {
        return done(new Error('User not found'), null);
      }

      done(null, users[0]);
    } catch (error) {
      console.error('[OAuth] Error during deserialization:', error);
      done(error, null);
    }
  });
}

export { passport };

