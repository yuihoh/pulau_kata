# Delivery and pricing plan

*Draft, 18 Nov 2026 · Yang + Claude Code. The price is a **proposal to test** with pilot parents, not a decision.*

## Summary

- **Delivery:** a web link (PWA). Parents open it on the child's phone or tablet and tap *Add to Home Screen*. No .exe or .apk, and no app store at launch.
- **Payment:** **one payment per school year (per Tahun)**, by FPX or DuitNow. No per-unit charges and no monthly subscription.
- **Proposed price:** **RM39 per Tahun**, with a **founding-family price of RM19–29** for pilot families. Test it before deciding.
- **Free part:** Tema 1 of each Tahun (Units 1–3, the current pilot content).

---

## 1. How the app reaches families

### Delivery as a web link (PWA)
1. Yang shares a link (e.g. `https://jelajahkata.my`) or a QR code (flyer, WhatsApp, Facebook).
2. The parent opens it on the child's device:
   - **Android (Chrome):** *Install app*, or ⋮ → *Add to Home screen*
   - **iPhone/iPad (Safari):** *Share* → *Add to Home Screen*
3. An icon appears. The app opens full screen and works offline after the first load (task 8).
4. Updates arrive automatically the next time the app opens.

### Why not an executable (.exe / .apk)
| Problem | Effect |
|---|---|
| Most children use phones and tablets | A .exe runs only on Windows computers |
| Windows SmartScreen warns about unknown downloads | Many parents stop at "Windows protected your PC" |
| Every fix or new unit needs a new file | Families stay on old versions |
| A file can be forwarded on WhatsApp | Paid content leaks; a link + account lets the server control access |

### App stores: later, only if parents ask
- **Google Play:** the same PWA can be wrapped (Trusted Web Activity) with little work, but Google normally requires Play Billing (15%+) for digital content sold inside the app.
- **Apple App Store:** Apple requires its in-app purchase for digital content and often rejects apps that are mainly a wrapped website.
- **Decision for now:** sell only through the web link.

### Where to find families
WhatsApp parent groups, Facebook groups for KSSR parents (especially SJKC/SJKT, where BM is often the hardest subject), BM teachers, tuition centres, and word of mouth from pilot families.

---

## 2. Payment model

### Options compared
| | Per unit (e.g. RM10) | Monthly subscription | **One payment per Tahun** |
|---|---|---|---|
| Parent's cost for a full year | 24 × RM10 = **RM240** | Unclear, felt every month | One clear number |
| Number of payments | 24, each one a chance to stop | Needs a saved card; FPX can't charge automatically | **One, by FPX/DuitNow** |
| Child's experience | Paywall in the middle of a theme | App locks if a payment fails | No interruptions all year |
| Gateway fixed fees | Paid 24 times | Paid every month | Paid once |
| Feels like | In-game purchases | Netflix | **Buying the year's workbook** |

**Chosen:** one payment per Tahun. This matches CLAUDE.md §2 ("one-time payment per school-year track").

### What is offered
- **Free:** Tema 1 (Units 1–3) of each Tahun. This is the trial, so no separate trial system is needed.
- **Paid:** all 24 units of a Tahun, one payment. *Open question:* unlocked permanently, or for 12 months? Choose one and state it clearly on the payment page.
- **Founding-family price** for pilot families, kept for them.
- **Later:** sibling or two-year bundles (e.g. Tahun 3 + Tahun 5 for about RM59); per-seat yearly pricing for tuition centres (P3).

---

## 3. Price

### What parents already pay (checked 17 Nov 2026; may have changed)
| What | Price | Covers |
|---|---|---|
| BM Tahun 5 workbook (Pelangi, Pan Asia) | RM6.50–11.65 | One subject, paper |
| DBP Tahun 5 SJK textbook | RM12.50 | One subject |
| CleverPlus | about RM70 a year | All subjects, KSSR |
| Pandai Premium | about RM100–150 a year (sources disagree) | All subjects, KSSR + KSSM, also has a free tier |
| Group tuition | about RM55–60 per subject per month | One subject, with a teacher |

Sources: [Pandai FAQ](https://pandai.org/en/faq), [The Star on Pandai](https://www.thestar.com.my/business/business-news/2025/07/26/pandais-vision-for-smarter-learning), [CleverPlus](https://cleverplus.my/join-us), [Pelangi UASA Tahun 5 BM](https://store.pelangibooks.com/products/praktis-topikal-uasa-2025-tahun-5-bahasa-melayu), [Pelangi SK listing](https://store.pelangibooks.com/collections/primary-education-for-sk?page=2), [SBIS Year 5 book list](https://sbis.edu.my/wp-content/uploads/2026/01/Year-5-2025-2026-UPDATED-13082025.pdf), [PTAJ tuition fees](https://ptaj.com/tuisyen-prestasi/). These are store and tutor listings, not a market survey.

### Why RM39
- **Upper limit:** all-subject apps cost RM70–150 a year, so a BM-vocabulary-only app looks expensive above about RM50.
- **Lower limit:** a paper workbook is about RM10; the app adds pictures, voices and games a child chooses to play.
- **Message to parents:** "less than one month of BM tuition, for the whole school year."

### How to test it in the pilot
1. **Show the full year first.** RM39 is for 24 units (about 288 words); the pilot shows only 3 units per Tahun.
2. **Ask pilot parents four questions**, each answered with an amount:
   - At what price is this too cheap to trust?
   - At what price is it a good deal?
   - At what price does it start to feel expensive?
   - At what price is it too expensive?

   The price sits where most answers fall between "good deal" and "getting expensive".
3. If still unsure, test **RM29, RM39 and RM59**.

### Rough numbers (RM39, after gateway fees and AI-check costs)
| Paying families | Approximate income |
|---|---|
| 100 | RM3,500–3,800 |
| 500 | RM18,000–19,000 |

Many families are needed, so the founding-family price and parents' recommendations matter more than an extra RM10.

---

## 4. Technical work this needs

| Item | When | Notes |
|---|---|---|
| Offline support + anonymous usage tracking | Task 8 (P1) | App works without internet once installed |
| Online hosting | Task 10 (P1) | Cloudflare Pages; `*.pages.dev` is fine for the pilot |
| Staging → production → pilot link | Task 11 (P1) | Share the link + QR code with pilot families |
| Own domain (`.my` or `.com`) | Before charging | Looks more trustworthy to parents |
| Parent accounts (email sign-in link, no password) | P2 | Supabase Auth, Singapore region |
| **Server lock on paid units** | P2 | **Biggest P2 job.** Today every unit is built into the app (`import.meta.glob`), so anyone technical could open paid units. Paid units must be downloaded from the server only after it checks the account has paid |
| Payment + webhook | P2 | FPX via Billplz, ToyyibPay or Stripe (not decided). The gateway's webhook tells the Worker the payment succeeded; the account is marked as owning that Tahun |
| Progress sync across devices | P2 | Behind the existing progress-storage interface |

## 5. Paperwork (start early; can take weeks)
- **Business registration (SSM):** most Malaysian payment gateways require it.
- **PDPA 2010:** parent accounts mean parental consent at sign-up and collecting the minimum (no child full names or school names, as in CLAUDE.md §2).

## 6. Order
1. Finish the free pilot and put it online (tasks 8–11).
2. Ask pilot parents the price questions (§3).
3. Register the business; open a gateway account.
4. Build parent accounts, the server lock and payments (P2).
5. Write the remaining units of the first paid Tahun.
6. Launch with the founding-family price.

## Open decisions for Yang
- Final price (after the pilot questions).
- Paid Tahun: permanent unlock or 12 months.
- Payment gateway: Billplz, ToyyibPay or Stripe.
- Which Tahun is paid first (Tahun 3 per CLAUDE.md §4 P2, or Tahun 5).
- Domain name (the app name "Jelajah Kata" is still a working title).
