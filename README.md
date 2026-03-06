# Offerte App — Break the Norm B.V.

Een professionele applicatie voor het opstellen, versturen en digitaal ondertekenen van offertes.

## Features

- 📝 **Offertes opstellen** — Klantgegevens, regels, BTW, introductie- en slottekst
- 📧 **Versturen per e-mail** — Via Resend API met mooie HTML-mail
- ✍️ **Digitaal ondertekenen** — Klant opent unieke link, zet handtekening op canvas
- 📊 **Dashboard** — Overzicht met statistieken (openstaand, ondertekend, concepten)
- 👥 **Klantenbeheer** — Klanten toevoegen en beheren
- ⚙️ **Instellingen** — Bedrijfsgegevens, standaard teksten, BTW

## Setup

### 1. Supabase
1. Maak een nieuw Supabase project aan
2. Voer het migratiebestand uit: `supabase/migrations/001_initial.sql`
3. Kopieer je URL en anon key

### 2. Resend
1. Maak een account aan op [resend.com](https://resend.com)
2. Verifieer je domein (bijv. vrijdag.ai)
3. Maak een API key aan

### 3. Omgevingsvariabelen
```bash
cp .env.example .env.local
```
Vul in:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=https://jouwdomein.nl
```

### 4. Lokaal draaien
```bash
npm install
npm run dev
```

### 5. Deployen op Vercel
1. Push naar GitHub
2. Importeer repo in Vercel
3. Voeg omgevingsvariabelen toe
4. Deploy!

## Eerste gebruik
1. Ga naar `/login` en log in met je Supabase-account
2. Ga naar Instellingen en vul je bedrijfsgegevens in
3. Voeg klanten toe
4. Maak je eerste offerte aan via "Nieuwe offerte"

## Tech stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (auth + database)
- Resend (e-mail)
- react-signature-canvas (handtekening)
