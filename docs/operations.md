# Running Bittertalen (support, refunds, complaints, numbers) — 26 November 2026

Not code: what the owner does, so a launch doesn't drown one person. Keep it short and true.

## Support
- One inbox: hallo@bittertalen.nl. Answer in Dutch or English; other languages via a translator, and say so.
- Promise: an answer within 3 working days (on the contact page). Saved replies for the five common questions:
  1. "My check was graded wrong" → the AI-complaint routine below.
  2. "I want my money back" → refunds below.
  3. "I can't log in / no code arrived" → spam folder, try Google/Apple, or we delete the account so they can start again.
  4. "Is this the real exam / from DUO?" → no; link nakijken.html and DUO's own practice exams.
  5. "When is my exam / how do I book it" → DUO, not us; link to DUO.

## Refunds and withdrawals
- Within 14 days of the first payment: always, without questions (voorwaarden, "Niet tevreden").
- The Herroepen button writes table `withdrawals` and ends the plan at once. Every Monday: refund each row without
  `refunded_at` in Stripe (Payments → Refund), then set `refunded_at`. Stripe's customer e-mails confirm it.
- Chargeback: answer in Stripe with the withdrawal row or the account's use; never argue a small amount.

## Complaints about AI
- Grading: "Is mijn score fout?" → read the text and the result; if the AI was wrong, say so, give the check back
  (Supabase `check_day_usage`/`check_week_usage`), and add the text to the calibration set (supabase/calibration.sql).
- Conversations: every Monday read the `ai_report` lines in Vercel's logs (Meld); fix the character's prompt in
  api/_scenes.js when needed. A serious one (hate, sexual, self-harm): fix the same day.

## Money and tax
- Book one session with a bookkeeper before the first sale: BTW 21% on digital services, the KOR (small business
  scheme) or not, OSS for buyers elsewhere in the EU, and whether Stripe Tax should calculate it.
- Fixed costs to expect: Vercel Pro, Supabase Pro, the domain, Apple (€99/year), Google (one-time $25).

## Five numbers, every Monday
1. Activation: new devices that finish the start test or a first exercise (events `new`, `test`).
2. Day-7 return: of last week's new devices, how many opened again (events `open`).
3. Paying: Checkouts started and paid (`buy`, `pass`, `paid`), and withdrawals.
4. AI cost per paying learner (admin.html, ai_spend) against what they paid.
5. Support: e-mails this week, and the top reason.

## Beta before launch
- Ten real learners (Russian/Ukrainian, Arabic and Turkish chats in NL; a WhatsApp study group; two NT2 teachers),
  free Plus through a group (`/admin` → group), and a 30-minute call with each after a week. Write down what they
  say in the project; change nothing new until then.
- One session with an NT2 teacher on 20 texts: put the result on nakijken.html ("X of 20 within one point").
