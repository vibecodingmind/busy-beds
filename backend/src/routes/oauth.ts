import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import jwt from 'jsonwebtoken';
import * as userModel from '../models/user';
import { config } from '../config';

const router = Router();
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const facebookAppId = process.env.FACEBOOK_APP_ID;
const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;

if (googleClientId && googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: `${process.env.API_URL || 'http://localhost:3001'}/auth/google/callback`,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: { emails?: { value: string }[]; displayName?: string; name?: { givenName?: string } },
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
        callbackURL: `${process.env.API_URL || 'http://localhost:3001'}/auth/facebook/callback`,
        profileFields: ['id', 'emails', 'name'],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: { emails?: { value: string }[]; displayName?: string; name?: { givenName?: string } },
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

router.get('/facebook', (req, res, next) => {
  if (!facebookAppId || !facebookAppSecret) {
    return res.redirect(`${config.frontendUrl}/login?error=Facebook+login+not+configured`);
  }
  const returnTo = (req.query.returnTo as string) || '/dashboard';
  passport.authenticate('facebook', { scope: ['email'], state: returnTo })(req, res, next);
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

export default router;
