import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { readFileSync } from 'fs'
import { join } from 'path'

function getOpenAIKey(): string {
  try {
    const secretPath = join(process.env.HOME || '/home/bartgrootveld', '.openclaw/secrets/openai.json')
    const secrets = JSON.parse(readFileSync(secretPath, 'utf-8'))
    return secrets.api_key || secrets.apiKey || ''
  } catch {
    return process.env.OPENAI_API_KEY || ''
  }
}

export async function POST(req: NextRequest) {
  const { description } = await req.json()
  if (!description) {
    return NextResponse.json({ error: 'Beschrijving is verplicht' }, { status: 400 })
  }

  const apiKey = getOpenAIKey()
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API sleutel niet gevonden' }, { status: 500 })
  }

  const openai = new OpenAI({ apiKey })

  const systemPrompt = `Je bent een expert in het opstellen van professionele offertes voor een Nederlands IT/AI adviesbureau genaamd Vrijdag.AI.
  
Je taak is om op basis van een projectbeschrijving een complete, professionele offerte te genereren in JSON-formaat.

Regels:
- Alle teksten zijn in het Nederlands
- Prijzen zijn realistisch voor een IT/AI consultancy (dagprijzen €850-€1500, uurtarieven €100-€175)
- Gebruik zinvolle regelomschrijvingen
- BTW-tarief is standaard 21%
- Wees concreet en professioneel

Geef ALLEEN een valid JSON object terug, zonder markdown code blocks of extra tekst, in dit formaat:
{
  "title": "Offerte titel",
  "intro": "Professionele introductietekst (2-3 zinnen)",
  "line_items": [
    {
      "description": "Omschrijving van de dienst of het product",
      "quantity": 1,
      "unit": "stuks",
      "unit_price": 1000,
      "vat_rate": 21
    }
  ]
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Maak een offerte voor het volgende project:\n\n${description}` },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content || ''
    
    // Parse JSON from response
    let parsed
    try {
      // Strip potential markdown code blocks
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'AI kon geen geldige offerte genereren. Probeer opnieuw.' }, { status: 422 })
    }

    return NextResponse.json(parsed)
  } catch (error: unknown) {
    console.error('OpenAI error:', error)
    const message = error instanceof Error ? error.message : 'Onbekende fout'
    return NextResponse.json({ error: `AI fout: ${message}` }, { status: 500 })
  }
}
