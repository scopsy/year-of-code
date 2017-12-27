import * as passport from 'passport';
import * as passportGithub from 'passport-github';

import { Request, Response, NextFunction } from 'express';
import { default as User, UserInstance } from '../models/User';

const GitHubStrategy: any = passportGithub.Strategy;

passport.serializeUser<UserInstance, string>((user, done) => {
    done(undefined, user.id);
});

passport.deserializeUser<UserInstance, string>((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

/**
 * Sign in with GitHub.
 */
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
    callbackURL: '/auth/github/callback',
    passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
    User.findOne({ github: profile.id }, (err, existingUser) => {
        if (err) {
            return done(err);
        }
        if (existingUser) {
            return done(null, existingUser);
        }

        User.findOne({ email: profile._json.email }, (err, existingEmailUser) => {
            if (err) {
                return done(err);
            }
            if (existingEmailUser) {
                req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with GitHub manually from Account Settings.' });
                done(err);
            } else {
                const user = new User();

                user.email = profile._json.email;
                user.github = profile.id;
                user.username = profile._json.login;
                user.tokens.push({ kind: 'github', accessToken });
                user.profile.name = profile.displayName;
                user.profile.bio = profile._json.bio;
                user.profile.picture = profile._json.avatar_url;
                user.profile.location = profile._json.location;
                user.profile.website = profile._json.blog;
                user.save((err: any) => {
                    done(err, user);
                });
            }
        });
    });
}));

/**
 * Login Required middleware.
 */
export let isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/login');
};