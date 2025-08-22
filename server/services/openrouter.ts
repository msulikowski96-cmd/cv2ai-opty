import { config } from 'dotenv';

config();

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = process.env.OPENROUTER_API_KEY;

if (!API_KEY) {
  throw new Error('OPENROUTER_API_KEY environment variable is required');
}

interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
}

async function callOpenRouterAPI(
  prompt: string, 
  systemPrompt?: string,
  maxTokens = 2000, 
  model = "anthropic/claude-3.5-sonnet"
): Promise<string> {
  const messages = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system' as const, content: systemPrompt });
  }
  
  messages.push({ role: 'user' as const, content: prompt });

  const requestData: OpenRouterRequest = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature: 0.7
  };

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://cv-optimizer-pro.repl.co',
        "X-Title": "CV Optimizer Pro"
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenRouter API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API call failed:', error);
    throw error;
  }
}

export async function optimizeCv(
  cvText: string, 
  jobDescription: string, 
  language = 'pl'
): Promise<string> {
  const systemPrompt = `Jesteś ekspertem w optymalizacji CV. Twoja rola to analizowanie i ulepszanie CV tak, aby były bardziej atrakcyjne dla rekruterów i systemów ATS. Odpowiadaj w języku polskim.`;
  
  const prompt = `
Proszę zoptymalizować następujące CV pod kątem tej oferty pracy:

OFEROWANA POZYCJA:
${jobDescription || 'Ogólna optymalizacja CV'}

AKTUALNE CV:
${cvText}

Proszę o:
1. Analizę zgodności CV z wymaganiami stanowiska
2. Konkretne sugestie dotyczące:
   - Struktury i formatowania
   - Słów kluczowych do dodania
   - Umiejętności do podkreślenia
   - Doświadczeń do lepszego opisania
3. Przepisanie najważniejszych sekcji z sugerowanymi zmianami
4. Wskazówki dotyczące ATS (Applicant Tracking System)

Odpowiedź powinna być praktyczna i konkretna, gotowa do implementacji.
  `;

  return callOpenRouterAPI(prompt, systemPrompt, 3000);
}

export async function generateRecruiterFeedback(
  cvText: string, 
  jobDescription: string, 
  language = 'pl'
): Promise<string> {
  const systemPrompt = `Jesteś doświadczonym rekruterem z 10-letnim stażem. Analizujesz CV z perspektywy pracodawcy i dajesz szczere, konstruktywne opinie. Odpowiadaj w języku polskim.`;
  
  const prompt = `
Jako rekruter, proszę o szczegółową opinię na temat tego CV w kontekście następującej pozycji:

POZYCJA:
${jobDescription || 'Ogólna ocena CV'}

CV DO OCENY:
${cvText}

Proszę o opinię obejmującą:
1. Pierwsze wrażenie (co się podoba, co budzi wątpliwości)
2. Mocne strony kandydata
3. Obszary wymagające poprawy
4. Czy CV przeszłoby przez pierwszą selekcję
5. Konkretne rekomendacje do poprawy
6. Ocena ogólna w skali 1-10 z uzasadnieniem

Bądź szczery, ale konstruktywny. Pamiętaj, że celem jest pomoc kandydatowi.
  `;

  return callOpenRouterAPI(prompt, systemPrompt, 2500);
}

export async function generateCoverLetter(
  cvText: string, 
  jobDescription: string, 
  language = 'pl'
): Promise<string> {
  const systemPrompt = `Jesteś ekspertem w pisaniu listów motywacyjnych. Tworzysz personalizowane, przekonujące listy, które wyróżniają kandydata. Piszesz w języku polskim w profesjonalnym, ale ciepłym tonie.`;
  
  const prompt = `
Na podstawie CV i opisu stanowiska, napisz profesjonalny list motywacyjny:

OPIS STANOWISKA:
${jobDescription}

CV KANDYDATA:
${cvText}

List powinien:
1. Być personalny i nawiązywać do konkretnej firmy/pozycji
2. Podkreślać najważniejsze kwalifikacje z CV
3. Pokazywać motywację i zainteresowanie stanowiskiem
4. Być długością około 250-350 słów
5. Mieć profesjonalny, ale przyjazny ton
6. Kończyć się zachętą do kontaktu

Stwórz kompletny list z odpowiednim formatowaniem.
  `;

  return callOpenRouterAPI(prompt, systemPrompt, 2000);
}

export async function atsOptimizationCheck(
  cvText: string, 
  jobDescription: string, 
  language = 'pl'
): Promise<string> {
  const systemPrompt = `Jesteś ekspertem w systemach ATS (Applicant Tracking System). Analizujesz CV pod kątem kompatybilności z automatycznymi systemami rekrutacyjnymi. Odpowiadasz w języku polskim.`;
  
  const prompt = `
Przeprowadź analizę ATS dla tego CV w kontekście stanowiska:

STANOWISKO:
${jobDescription || 'Ogólna analiza ATS'}

CV:
${cvText}

Przeanalizuj:
1. **Zgodność słów kluczowych** - jakie słowa kluczowe z opisu stanowiska występują w CV
2. **Formatowanie** - czy struktura CV jest przyjazna dla ATS
3. **Sekcje standardowe** - czy CV zawiera standardowe sekcje (dane kontaktowe, doświadczenie, wykształcenie, umiejętności)
4. **Problemy techniczne** - potencjalne problemy z parsowaniem
5. **Wskaźnik ATS** - prawdopodobny procent dopasowania (1-100%)
6. **Rekomendacje** - konkretne zmiany do poprawy wyników ATS

Podaj praktyczne wskazówki do optymalizacji.
  `;

  return callOpenRouterAPI(prompt, systemPrompt, 2000);
}

export async function generateInterviewQuestions(
  cvText: string, 
  jobDescription: string, 
  language = 'pl'
): Promise<string> {
  const systemPrompt = `Jesteś doświadczonym rekruterem przygotowującym pytania na rozmowę kwalifikacyjną. Formułujesz pytania, które realnie mogą paść podczas rozmowy. Odpowiadasz w języku polskim.`;
  
  const prompt = `
Na podstawie CV i opisu stanowiska, przygotuj prawdopodobne pytania rekrutacyjne:

STANOWISKO:
${jobDescription}

CV KANDYDATA:
${cvText}

Przygotuj:
1. **Pytania ogólne** (3-4 pytania) - o motywację, zainteresowanie firmą
2. **Pytania techniczne** (4-5 pytań) - związane z umiejętnościami z CV
3. **Pytania behawioralne** (3-4 pytania) - o doświadczenia z CV
4. **Pytania sytuacyjne** (2-3 pytania) - hipotetyczne scenariusze
5. **Krótkie wskazówki** jak się do każdego typu pytań przygotować

Pytania powinny być realistyczne i prawdopodobne w kontekście tej konkretnej pozycji.
  `;

  return callOpenRouterAPI(prompt, systemPrompt, 2000);
}

export async function generateGrammarCheck(
  cvText: string, 
  language = 'pl'
): Promise<string> {
  const systemPrompt = `Jesteś ekspertem językowym specjalizującym się w języku polskim. Sprawdzasz gramatykę, ortografię, interpunkcję i styl pisania w dokumentach biznesowych. Jesteś bardzo dokładny i sugerujesz konkretne poprawki.`;
  
  const prompt = `
Przeprowadź szczegółową korektę językową tego CV:

${cvText}

Sprawdź:
1. **Ortografia i gramatyka** - błędy językowe
2. **Interpunkcja** - poprawność znaków przestankowych
3. **Styl i płynność** - poprawa sformułowań
4. **Konsekwencja** - jednolitość stylu w całym CV
5. **Profesjonalizm języka** - dopasowanie do standardów biznesowych
6. **Czytelność** - sugestie poprawy zrozumiałości

Dla każdego błędu podaj:
- Fragment z błędem
- Poprawną wersję
- Krótkie wyjaśnienie

Na końcu podaj ogólną ocenę jakości językowej (1-10) i główne rekomendacje.
  `;

  return callOpenRouterAPI(prompt, systemPrompt, 2500);
}
