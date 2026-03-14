import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import jwt from 'jsonwebtoken';
import * as userModel from '../models/user';
import { config } from '../config';
import { pool } from '../config/db';

const router = Router();
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const facebookAppId = process.env.FACEBOOK_APP_ID;
const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;
const linkedinClientId = process.env.LINKEDIN_CLIENT_ID;
const linkedinClientSecret = process.env.LINKEDIN_CLIENT_SECRET;

// OAuth redirect_uri: frontend URL so Google/Facebook redirect to busybeds.com (no trailing slash).
const frontendBase = (config.frontendUrl || 'http://localhost:3000').replace(/\/$/, '');
const googleCallbackUrl = `${frontendBase}/auth/google/callback`;
const facebookCallbackUrl = `${frontendBase}/auth/facebook/callback`;
const linkedinCallbackUrl = `${frontendBase}/auth/linkedin/callback`;

if (googleClientId && googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackUrl,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: any,
        done: (err: Error | null, user?: object) => void
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || profile.name?.givenName || 'User';
          if (!email) return done(new Error('No email from Google'));
          let user = await userModel.findUserByEmail(email);
          if (!user) {
            const hash = await import('bcrypt').then((b) => b.default.hash(Math.random().toString(36), 10));
            user = await userModel.createUser(email, hash, name);
          }
          // Save OAuth provider info
          await pool.query(
            `INSERT INTO user_oauth_providers (user_id, provider, provider_id, provider_email)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (provider, provider_id) DO UPDATE
             SET provider_email = $4`,
            [user.id, 'google', profile.id, email]
          );
          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}

if (facebookAppId && facebookAppSecret) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: facebookAppId,
        clientSecret: facebookAppSecret,
        callbackURL: facebookCallbackUrl,
        profileFields: ['id', 'emails', 'name'],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: any,
        done: (err: Error | null, user?: object) => void
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || profile.name?.givenName || 'User';
          if (!email) return done(new Error('No email from Facebook'));
          let user = await userModel.findUserByEmail(email);
          if (!user) {
            const hash = await import('bcrypt').then((b) => b.default.hash(Math.random().toString(36), 10));
            user = await userModel.createUser(email, hash, name);
          }
          // Save OAuth provider info
          await pool.query(
            `INSERT INTO user_oauth_providers (user_id, provider, provider_id, provider_email)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (provider, provider_id) DO UPDATE
             SET provider_email = $4`,
            [user.id, 'facebook', profile.id, email]
          );
          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}

router.get('/google', (req, res, next) => {
  if (!googleClientId || !googleClientSecret) {
    return res.redirect(`${config.frontendUrl}/login?error=Google+login+not+configured`);
  }
  const returnTo = (req.query.returnTo as string) || '/dashboard';
  passport.authenticate('google', { scope: ['profile', 'email'], state: returnTo })(req, res, next);
});

// Backend callback (used only if redirect_uri was API; when using frontend callback, frontend redirects to /google/complete)
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', (err: Error | null, user: { id: number; email: string; name: string; role: string } | null) => {
    if (err) return res.redirect(`${config.frontendUrl}/login?error=${encodeURIComponent(err.message)}`);
    if (!user) return res.redirect(`${config.frontendUrl}/login?error=Auth+failed`);
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, type: 'user' },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );
    const returnTo = (req.query.state as string) || '/dashboard';
    res.redirect(`${config.frontendUrl}/auth/callback?token=${token}&returnTo=${encodeURIComponent(returnTo)}`);
  })(req, res, next);
});

// Exchange code from frontend callback (redirect_uri is frontend URL)
router.get('/google/complete', async (req, res) => {
  const code = req.query.code as string;
  const returnTo = (req.query.state as string) || '/dashboard';
  if (!code) {
    return res.redirect(`${config.frontendUrl}/login?error=Missing+code`);
  }
  if (!googleClientId || !googleClientSecret) {
    return res.redirect(`${config.frontendUrl}/login?error=Google+login+not+configured`);
  }
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: googleCallbackUrl,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return res.redirect(`${config.frontendUrl}/login?error=${encodeURIComponent('Google token exchange failed')}`);
    }
    const tokens = (await tokenRes.json()) as { access_token?: string };
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userRes.ok) return res.redirect(`${config.frontendUrl}/login?error=Google+profile+failed`);
  const profile = (await userRes.json()) as { email?: string; name?: string; id?: string };
      const email = profile.email;
      const name = profile.name || 'User';
      if (!email) return res.redirect(`${config.frontendUrl}/login?error=No+email+from+Google`);
      let user = await userModel.findUserByEmail(email);
      if (!user) {
        const hash = await import('bcrypt').then((b) => b.default.hash(Math.random().toString(36), 10));
        user = await userModel.createUser(email, hash, name);
      }
      // Save OAuth provider info
      if (profile.id) {
        await pool.query(
          `INSERT INTO user_oauth_providers (user_id, provider, provider_id, provider_email)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (provider, provider_id) DO UPDATE
           SET provider_email = $4`,
          [user!.id, 'google', profile.id, email]
        );
      }
    const token = jwt.sign(
      { userId: user!.id, email: user!.email, role: user!.role, type: 'user' },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );
    res.redirect(`${config.frontendUrl}/auth/callback?token=${token}&returnTo=${encodeURIComponent(returnTo)}`);
  } catch {
    res.redirect(`${config.frontendUrl}/login?error=Auth+failed`);
  }
});

router.get('/facebook', (req, res, next) => {
  if (!facebookAppId || !facebookAppSecret) {
    return res.redirect(`${config.frontendUrl}/login?error=Facebook+login+not+configured`);
  }
  const returnTo = (req.query.returnTo as string) || '/dashboard';
  passport.authenticate('facebook', { scope: ['public_profile', 'email'], state: returnTo })(req, res, next);
});

router.get('/facebook/callback', (req, res, next) => {
  passport.authenticate('facebook', (err: Error | null, user: { id: number; email: string; name: string; role: string } | null) => {
    if (err) return res.redirect(`${config.frontendUrl}/login?error=${encodeURIComponent(err.message)}`);
    if (!user) return res.redirect(`${config.frontendUrl}/login?error=Auth+failed`);
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, type: 'user' },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );
    const returnTo = (req.query.state as string) || '/dashboard';
    res.redirect(`${config.frontendUrl}/auth/callback?token=${token}&returnTo=${encodeURIComponent(returnTo)}`);
  })(req, res, next);
});

// Exchange code from frontend callback (redirect_uri is frontend URL)
router.get('/facebook/complete', async (req, res) => {
  const code = req.query.code as string;
  const returnTo = (req.query.state as string) || '/dashboard';
  if (!code) {
    return res.redirect(`${config.frontendUrl}/login?error=Missing+code`);
  }
  if (!facebookAppId || !facebookAppSecret) {
    return res.redirect(`${config.frontendUrl}/login?error=Facebook+login+not+configured`);
  }
  try {
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${facebookAppId}&redirect_uri=${encodeURIComponent(facebookCallbackUrl)}&client_secret=${facebookAppSecret}&code=${encodeURIComponent(code)}`;
    const tokenRes = await fetch(tokenUrl);
    if (!tokenRes.ok) {
      return res.redirect(`${config.frontendUrl}/login?error=${encodeURIComponent('Facebook token exchange failed')}`);
    }
    const tokens = (await tokenRes.json()) as { access_token?: string };
    const meRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(tokens.access_token || '')}`);
    if (!meRes.ok) return res.redirect(`${config.frontendUrl}/login?error=Facebook+profile+failed`);
     const profile = (await meRes.json()) as { email?: string; name?: string; id?: string };
     const email = profile.email;
     const name = profile.name || 'User';
     if (!email) return res.redirect(`${config.frontendUrl}/login?error=No+email+from+Facebook`);
     let user = await userModel.findUserByEmail(email);
     if (!user) {
       const hash = await import('bcrypt').then((b) => b.default.hash(Math.random().toString(36), 10));
       user = await userModel.createUser(email, hash, name);
     }
     // Save OAuth provider info
     if (profile.id) {
       await pool.query(
         `INSERT INTO user_oauth_providers (user_id, provider, provider_id, provider_email)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (provider, provider_id) DO UPDATE
          SET provider_email = $4`,
         [user!.id, 'facebook', profile.id, email]
       );
     }
    const token = jwt.sign(
      { userId: user!.id, email: user!.email, role: user!.role, type: 'user' },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );
    res.redirect(`${config.frontendUrl}/auth/callback?token=${token}&returnTo=${encodeURIComponent(returnTo)}`);
  } catch {
    res.redirect(`${config.frontendUrl}/login?error=Auth+failed`);
  }
});

// ——— LinkedIn (OAuth 2.0, no Passport; frontend callback + /complete)
router.get('/linkedin', (req, res) => {
  if (!linkedinClientId || !linkedinClientSecret) {
    return res.redirect(`${config.frontendUrl}/login?error=LinkedIn+login+not+configured`);
  }
  const returnTo = (req.query.returnTo as string) || '/dashboard';
  const scope = 'openid profile email';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: linkedinClientId,
    redirect_uri: linkedinCallbackUrl,
    state: returnTo,
    scope,
  });
  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`);
});

router.get('/linkedin/complete', async (req, res) => {
  const code = req.query.code as string;
  const returnTo = (req.query.state as string) || '/dashboard';
  if (!code) {
    return res.redirect(`${config.frontendUrl}/login?error=Missing+code`);
  }
  if (!linkedinClientId || !linkedinClientSecret) {
    return res.redirect(`${config.frontendUrl}/login?error=LinkedIn+login+not+configured`);
  }
  try {
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: linkedinClientId,
        client_secret: linkedinClientSecret,
        redirect_uri: linkedinCallbackUrl,
      }),
    });
    if (!tokenRes.ok) {
      return res.redirect(`${config.frontendUrl}/login?error=LinkedIn+token+exchange+failed`);
    }
    const tokens = (await tokenRes.json()) as { access_token?: string };
    const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userRes.ok) return res.redirect(`${config.frontendUrl}/login?error=LinkedIn+profile+failed`);
     const profile = (await userRes.json()) as { email?: string; name?: string; given_name?: string; sub?: string };
     const email = profile.email;
     const name = profile.name || profile.given_name || 'User';
     if (!email) return res.redirect(`${config.frontendUrl}/login?error=No+email+from+LinkedIn`);
     let user = await userModel.findUserByEmail(email);
     if (!user) {
       const hash = await import('bcrypt').then((b) => b.default.hash(Math.random().toString(36), 10));
       user = await userModel.createUser(email, hash, name);
     }
     // Save OAuth provider info
     if (profile.sub) {
       await pool.query(
         `INSERT INTO user_oauth_providers (user_id, provider, provider_id, provider_email)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (provider, provider_id) DO UPDATE
          SET provider_email = $4`,
         [user!.id, 'linkedin', profile.sub, email]
       );
     }
    const token = jwt.sign(
      { userId: user!.id, email: user!.email, role: user!.role, type: 'user' },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );
    res.redirect(`${config.frontendUrl}/auth/callback?token=${token}&returnTo=${encodeURIComponent(returnTo)}`);
  } catch {
    res.redirect(`${config.frontendUrl}/login?error=Auth+failed`);
  }
});

export default router;
