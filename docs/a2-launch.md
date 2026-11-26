# A2 launch and paid search

Keep the KVK and BTW-id placeholders while registration is pending. Use the Vercel preview for this change. Keep the existing noindex gate until the launch decision. No campaign should run before the paid launch is approved.

## Search ads

| Ad group | Headline ideas | Description | Destination |
| --- | --- | --- | --- |
| Schrijven A2 | Schrijven A2 Oefenen / Probeer Een Schrijfopdracht / Feedback Op Je Eigen Tekst | Schrijf een kort bericht en zie welke fout je als eerste kunt verbeteren. Probeer gratis. | https://bittertalen.nl/oefenen?open=writing&src=a2w |
| Spreken A2 | Spreken A2 Oefenen / Oefen Voor Je Inburgering / Feedback Op Je Antwoord | Beantwoord een A2-vraag hardop. Controleer de uitgeschreven tekst en oefen verder met feedback. | https://bittertalen.nl/oefenen?open=speaking&src=a2s |

Start with phrase or exact matches around schrijfopdrachten A2 and spreken A2 oefenen. Use the public pages /a2-schrijven-oefenen and /a2-spreken-oefenen as organic entry points. The tagged exercise routes measure aggregate visit, first check, checkout and confirmed access events in the owner dashboard. These counters only follow the same tab and respect Global Privacy Control and Do Not Track. For confirmed purchases and revenue use Stripe. Compare spend per purchase, including any sales that marketing cannot attribute with these counters. There are no Google tags or individual attribution IDs in this setup.

## Minimum checks before paid launch

- Check the deployed routes, guest writing trial, all five A2 mock exams, quotas and the Stripe return.
- Apply the grading-receipt migration to the intended Supabase project before deploying the matching application/API. The preview build itself neither changes the database nor activates new prices. On a separate Stripe test-mode setup, exercise subscription, Examenpas and Jaarpas, plus cancellation and successful entitlement activation. Repository tests use mocked Stripe and Supabase.
- Compare the published limits with /api/config. Pay attention to Examenpas's whole-term limit and the Jaarpas's separate whole-term limit.
