# Adnan Alashram Portfolio

Next.js portfolio with a Firebase-backed human live chat. The portfolio stays on Vercel; Firebase provides Authentication, Realtime Database, Cloud Messaging, Security Rules, and Cloud Functions.

## Architecture

- Vercel: portfolio pages, visitor widget, admin login/dashboard, Firebase web SDK, and the FCM service-worker route.
- Firebase Authentication: Email/Password for the single admin; Anonymous Auth for visitors.
- Firebase Realtime Database: conversations, messages, visitors, typing state, unread counters, and admin device tokens.
- Firebase Cloud Functions: assigns the admin custom claim and sends FCM data notifications when visitor messages are created.
- FCM: background notifications on multiple admin devices with conversation deep links.

There is no Socket.IO, Railway, Prisma, PostgreSQL, SQLite, custom Node server, or `web-push` implementation.

## Firebase Console setup

1. Create a Firebase project.
2. Add a Web app and copy its web configuration into `.env.local` and Vercel.
3. Enable Authentication providers: **Email/Password** and **Anonymous**.
4. Create exactly one admin user manually in Firebase Authentication.
5. Set the same email in `ADMIN_EMAIL` for Cloud Functions configuration.
6. Create a Realtime Database. Deploy `database.rules.json`; never use public read/write rules.
7. Enable Cloud Messaging and add a Web Push certificate. Put its public key in `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
8. Enable the Cloud Functions API and billing if Firebase requires it for your project. Functions may not be available on the Spark plan.

## Environment variables

Copy `.env.example` to `.env.local`. Firebase web config values are intended for the browser and are not passwords. Do not commit secrets.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
ADMIN_EMAIL=the-email-created-in-firebase-auth
```

`ADMIN_EMAIL` is used by the Cloud Function to assign the `admin: true` custom claim to the matching Firebase Auth user. The admin password is stored only in Firebase Auth, not in this repository or Vercel variables.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Enable Firebase Anonymous Auth for the visitor widget to work. The admin account must first be created in Firebase Console.

To deploy database rules and functions, install the Firebase CLI and authenticate:

```bash
npm install -g firebase-tools
firebase login
firebase use YOUR_FIREBASE_PROJECT_ID
firebase deploy --only database
firebase deploy --only functions
```

Functions dependencies are in `functions/package.json`; run `npm install --prefix functions` before deploying functions.

## Authentication and admin claim

Visitors sign in anonymously. Firebase persists the anonymous user in the browser, and its UID is mirrored to localStorage and a cookie as the visitor ID. No visitor account form is shown.

The admin signs in at `/admin/login` with Firebase Email/Password. The `assignAdminClaim` Cloud Function grants `admin: true` only when the newly created user's email matches `ADMIN_EMAIL`. Sign out and sign back in after the claim is assigned so the ID token refreshes. The dashboard and RTDB rules both require this claim.

There is no public admin registration page.

## Realtime Database model

```text
conversations/{visitorId}
messages/{visitorId}/{messageId}
visitors/{visitorId}
typing/{visitorId}/visitor
 typing/{visitorId}/admin
adminDevices/{adminUid}/{deviceId}
```

Clients write only new messages, visitor identity, typing state, read flags, and their own device token. The `updateConversationSummary` Cloud Function maintains the conversation preview, timestamps, status, and unread counters. React renders message content as text, so visitor content is not injected as HTML.

## FCM notifications

The admin dashboard requests notification permission, registers `/firebase-messaging-sw.js`, gets an FCM token, and stores one token per browser/device in `adminDevices`. Multiple devices are supported.

A visitor message is first written to RTDB. The `notifyAdminDevices` Cloud Function then sends a data-only FCM message to all registered admin tokens. Invalid tokens are removed. Admin messages never trigger this function because it ignores messages whose `senderRole` is `admin`.

The service worker displays the notification and reads `conversationId` from its data payload. Clicking it opens `/admin/chat?conversation=<conversationId>`. If the admin is logged out, the login page preserves the query string and redirects back to the same conversation after Firebase login.

FCM background delivery requires HTTPS and browser/OS support. A physically powered-off device cannot receive a push notification.

## Deployment

### Vercel

1. Keep the existing repository/project connected.
2. Add every `NEXT_PUBLIC_FIREBASE_*` variable and `ADMIN_EMAIL` to Vercel Production.
3. Deploy normally with `npm run build`.
4. Confirm `https://YOUR_DOMAIN/firebase-messaging-sw.js` returns JavaScript.

### Firebase

1. Set the Firebase project with `firebase use`.
2. Deploy rules:

```bash
firebase deploy --only database
```

3. Install function dependencies and deploy:

```bash
npm install --prefix functions
firebase deploy --only functions
```

4. When prompted for the Functions parameter `ADMIN_EMAIL`, enter the exact Firebase Auth admin email.
5. Create the admin user in Firebase Console, then sign out/in once so the custom claim is loaded.

## Security rules

The exact rules are in `database.rules.json`. They deny root access, isolate visitor data by `auth.uid`, require `auth.token.admin === true` for inbox/admin data, prevent visitor edits to existing messages, and allow only read-status changes to existing messages.

## Testing checklist

- Visitor opens chat and receives an anonymous Firebase UID.
- Visitor sends a message; it appears in RTDB and the admin inbox listener.
- Admin replies; the visitor listener receives it without refresh.
- Refresh/close/reopen the visitor browser and verify the same UID/history.
- Create two visitor sessions and verify isolation and separate unread counts.
- Close/reopen a conversation from the dashboard.
- Sign out and confirm `/admin/chat` redirects to login.
- Create a non-admin Firebase user and verify it cannot read admin data.
- Register desktop and phone browser tokens.
- Close the admin browser, send a visitor message, and verify FCM delivery.
- Tap the notification and verify the exact conversation opens.
- Expire/sign out the admin session, tap a notification, log in, and verify the same conversation query is preserved.
- Confirm admin messages do not generate notifications.

## Free-plan limitation

Firebase Realtime Database and Authentication may be usable on the Spark plan within quotas, but Cloud Functions and some FCM/server features may require the Blaze billing plan. Firebase can therefore remain low-cost, but do not assume all background notification functionality is available on Spark without billing. No real Firebase project, rules emulator, FCM device, or production notification was available for local verification in this repository.
