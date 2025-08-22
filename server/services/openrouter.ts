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

// Function to estimate token count (roughly 4 characters per token)
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

// Function to truncate text to fit within token limits
function truncateToTokenLimit(text: string, maxTokens: number): string {
  const estimatedTokens = estimateTokenCount(text);
  
  if (estimatedTokens <= maxTokens) {
    return text;
  }
  
  // Calculate how much text we need to keep (with some buffer)
  const targetChars = Math.floor(maxTokens * 4 * 0.8); // 80% of limit for safety
  
  if (text.length <= targetChars) {
    return text;
  }
  
  // Truncate and add notice
  const truncated = text.substring(0, targetChars);
  return truncated + "\n\n[UWAGA: CV zostało skrócone z powodu długości. Analiza oparta na pierwszej części dokumentu.]";
}

async function callOpenRouterAPI(
  prompt: string, 
  systemPrompt?: string,
  maxTokens = 2000, 
  model = "qwen/qwen-2.5-72b-instruct:free"
): Promise<string> {
  const messages = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system' as const, content: systemPrompt });
  }
  
  // Calculate available tokens for the user prompt
  const systemTokens = systemPrompt ? estimateTokenCount(systemPrompt) : 0;
  const modelContextLimit = 30000; // Safe limit below 32768
  const availableTokens = modelContextLimit - systemTokens - maxTokens - 500; // Reserve 500 for safety
  
  // Truncate prompt if needed
  const truncatedPrompt = truncateToTokenLimit(prompt, availableTokens);
  
  messages.push({ role: 'user' as const, content: truncatedPrompt });

  const requestData: OpenRouterRequest = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature: 0.7
  };

  try {
    console.log('Making OpenRouter API call with model:', model);
    
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
      console.error(`OpenRouter API error ${response.status}:`, errorData);
      throw new Error(`OpenRouter API error ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    console.log('OpenRouter API response structure:', Object.keys(data));
    
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('Invalid choices in response:', data);
      throw new Error('No choices returned from OpenRouter API');
    }

    if (!data.choices[0].message || !data.choices[0].message.content) {
      console.error('Invalid message structure:', data.choices[0]);
      throw new Error('Invalid message structure in OpenRouter API response');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API call failed:', error);
    
    // Fallback response if API fails
    if (error.message.includes('OpenRouter API')) {
      return `Przepraszamy, w tej chwili nie możemy połączyć się z systemem AI. 
      
Twoje CV zostało przesłane i zapisane pomyślnie. Możesz spróbować ponownie za chwilę lub skontaktować się z administratorem.

W międzyczasie, oto ogólne wskazówki dotyczące optymalizacji CV:
- Dostosuj CV do konkretnej oferty pracy
- Używaj słów kluczowych z opisu stanowiska
- Podkreśl osiągnięcia liczbami i faktami
- Zachowaj czytelną strukturę i formatowanie
- Sprawdź gramatykę i ortografię`;
    }
    
    throw error;
  }
}

export async function optimizeCv(
  cvText: string, 
  jobDescription: string, 
  language = 'pl'
): Promise<string> {
  const systemPrompt = `Jesteś światowej klasy ekspertem w rekrutacji i optymalizacji CV z 15-letnim doświadczeniem w branży HR. Posiadasz głęboką wiedzę o polskim rynku pracy, trendach rekrutacyjnych i wymaganiach pracodawców.

🎯 TWOJA SPECJALIZACJA:
- Optymalizacja CV pod kątem systemów ATS i ludzkich rekruterów
- Znajomość specyfiki różnych branż i stanowisk w Polsce
- Psychologia rekrutacji i przekonywania pracodawców
- Najnowsze trendy w pisaniu CV i listów motywacyjnych
- Analiza zgodności kandydata z wymaganiami stanowiska

🧠 METODA PRACY:
1. Przeprowadzaj głęboką analizę każdego elementu CV
2. Myśl jak doświadczony rekruter - co zwraca uwagę, co denerwuje
3. Stosuj zasady psychologii przekonywania w pisaniu CV
4. Używaj konkretnych, mierzalnych sformułowań
5. Dostosowuj język do branży i poziomu stanowiska

💼 ZNAJOMOŚĆ RYNKU:
- Polskie firmy (korporacje, MŚP, startupy)
- Wymagania różnych branż (IT, finanse, medycyna, inżynieria, sprzedaż)
- Kultura organizacyjna polskich pracodawców
- Specyfika rekrutacji w Polsce vs międzynarodowej

⚡ ZASADY ODPOWIEDZI:
- WYŁĄCZNIE język polski (chyba że proszono o inny)
- Konkretne, praktyczne rady
- Zawsze uzasadniaj swoje rekomendacje
- Używaj profesjonalnej terminologii HR
- Bądź szczery ale konstruktywny w krytyce

🚨 ABSOLUTNY ZAKAZ FAŁSZOWANIA DANYCH:
- NIE WOLNO dodawać firm, stanowisk, dat, które nie są w oryginalnym CV
- NIE WOLNO wymyślać osiągnięć, projektów, umiejętności
- NIE WOLNO zmieniać faktów z CV kandydata
- MOŻNA TYLKO lepiej sformułować istniejące prawdziwe informacje
- Każda wymyślona informacja niszczy wiarygodność kandydata`;
  
  // Truncate CV text if too long
  const maxCvLength = 15000; // characters
  let processedCvText = cvText;
  
  if (cvText.length > maxCvLength) {
    const halfLength = Math.floor(maxCvLength / 2);
    const beginning = cvText.substring(0, halfLength);
    const ending = cvText.substring(cvText.length - halfLength);
    processedCvText = beginning + "\n\n[...CZĘŚĆ ŚRODKOWA POMINIĘTA...]\n\n" + ending;
  }
  
  const prompt = `
ZADANIE: Przepisz to CV używając WYŁĄCZNIE faktów z oryginalnego tekstu. NIE DODAWAJ, NIE WYMYŚLAJ, NIE TWÓRZ nowych informacji.

⚠️ KRYTYCZNE ZASADY - MUSZĄ BYĆ BEZWZGLĘDNIE PRZESTRZEGANE:
1. ❌ ABSOLUTNY ZAKAZ: NIE wolno dodawać żadnych nowych firm, stanowisk, dat, osiągnięć, umiejętności
2. ❌ ABSOLUTNY ZAKAZ: NIE wolno zmieniać dat zatrudnienia, nazw firm, tytułów stanowisk
3. ❌ ABSOLUTNY ZAKAZ: NIE wolno dodawać obowiązków które nie są w oryginalnym CV
4. ✅ DOZWOLONE: Tylko lepsze sformułowanie istniejących opisów używając lepszych słów
5. ✅ DOZWOLONE: Reorganizacja kolejności sekcji dla lepszej prezentacji
6. ✅ DOZWOLONE: Użycie synonimów i lepszej terminologii branżowej

STANOWISKO DOCELOWE: ${jobDescription || 'Ogólne CV profesjonalne'}

ORYGINALNE CV (UŻYWAJ TYLKO TYCH FAKTÓW):
${processedCvText}

STRUKTURA ZOPTYMALIZOWANEGO CV:

[DANE OSOBOWE]
- Zachowaj dokładnie dane kontaktowe z oryginalnego CV

[PODSUMOWANIE ZAWODOWE] 
- Stwórz zwięzłe podsumowanie na podstawie doświadczenia z CV
- 2-3 zdania o kluczowych umiejętnościach i doświadczeniu
- Użyj tylko faktów z oryginalnego CV

[DOŚWIADCZENIE ZAWODOWE]
- Zachowaj wszystkie firmy, stanowiska i daty z oryginału
- Przepisz opisy obowiązków używając lepszych czasowników akcji
- Każde stanowisko: 3-4 punkty z konkretnymi obowiązkami
- Różnicuj opisy podobnych stanowisk

[WYKSZTAŁCENIE]
- Przepisz dokładnie informacje z oryginalnego CV
- Nie dodawaj kursów których nie ma w oryginale

[UMIEJĘTNOŚCI]
- Użyj tylko umiejętności wymienione w oryginalnym CV
- Pogrupuj je logicznie (Techniczne, Komunikacyjne, itp.)

PRZEPISZ CV zachowując wszystkie oryginalne fakty, ale lepiej je prezentując.

PAMIĘTAJ: Jeśli dodasz choćby jeden wymyślony szczegół, naruszysz zaufanie kandydata!

ZWRÓĆ TYLKO KOMPLETNY TEKST ZOPTYMALIZOWANEGO CV - nic więcej.
Nie dodawaj JSON, metadanych ani komentarzy.
Po prostu wygeneruj gotowe CV do użycia.
  `;

  return callOpenRouterAPI(prompt, systemPrompt, 4000);
}

export async function generateRecruiterFeedback(
  cvText: string, 
  jobDescription: string, 
  language = 'pl'
): Promise<string> {
  const systemPrompt = `Jesteś doświadczonym rekruterem z 10-letnim stażem. Analizujesz CV z perspektywy pracodawcy i dajesz szczere, konstruktywne opinie. Odpowiadaj w języku polskim.`;
  
  // Truncate CV if too long
  const maxCvLength = 15000;
  let processedCvText = cvText;
  
  if (cvText.length > maxCvLength) {
    const halfLength = Math.floor(maxCvLength / 2);
    const beginning = cvText.substring(0, halfLength);
    const ending = cvText.substring(cvText.length - halfLength);
    processedCvText = beginning + "\n\n[...CZĘŚĆ ŚRODKOWA POMINIĘTA...]\n\n" + ending;
  }
  
  const prompt = `
Jako rekruter, proszę o szczegółową opinię na temat tego CV w kontekście następującej pozycji:

POZYCJA:
${jobDescription || 'Ogólna ocena CV'}

CV DO OCENY:
${processedCvText}

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
  
  // Truncate CV if too long
  const maxCvLength = 15000;
  let processedCvText = cvText;
  
  if (cvText.length > maxCvLength) {
    const halfLength = Math.floor(maxCvLength / 2);
    const beginning = cvText.substring(0, halfLength);
    const ending = cvText.substring(cvText.length - halfLength);
    processedCvText = beginning + "\n\n[...CZĘŚĆ ŚRODKOWA POMINIĘTA...]\n\n" + ending;
  }
  
  const prompt = `
Przeprowadź analizę ATS dla tego CV w kontekście stanowiska:

STANOWISKO:
${jobDescription || 'Ogólna analiza ATS'}

CV:
${processedCvText}

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

export async function generateNewCv(
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    profession?: string;
  },
  experience?: string,
  education?: string,
  skills?: string,
  jobDescription?: string,
  language = 'pl'
): Promise<string> {
  const systemPrompt = `Jesteś ekspertem w tworzeniu profesjonalnych CV. Specjalizujesz się w tworzeniu nowoczesnych, atrakcyjnych CV, które wyróżniają się na rynku pracy. Tworzysz CV w języku polskim, dostosowane do polskiego rynku pracy.`;
  
  const prompt = `
Stwórz profesjonalne CV na podstawie podanych informacji:

DANE OSOBOWE:
${personalInfo.name ? `Imię i nazwisko: ${personalInfo.name}` : ''}
${personalInfo.email ? `Email: ${personalInfo.email}` : ''}
${personalInfo.phone ? `Telefon: ${personalInfo.phone}` : ''}
${personalInfo.location ? `Lokalizacja: ${personalInfo.location}` : ''}
${personalInfo.profession ? `Zawód/Specjalizacja: ${personalInfo.profession}` : ''}

${experience ? `DOŚWIADCZENIE ZAWODOWE:\n${experience}` : ''}

${education ? `WYKSZTAŁCENIE:\n${education}` : ''}

${skills ? `UMIEJĘTNOŚCI:\n${skills}` : ''}

${jobDescription ? `DOCELOWE STANOWISKO:\n${jobDescription}` : ''}

Utwórz kompletne, profesjonalne CV zawierające:

1. **Dane kontaktowe** - czytelnie sformatowane
2. **Profil zawodowy** - krótki, atrakcyjny opis (2-3 zdania)
3. **Doświadczenie zawodowe** - z datami, nazwami firm, stanowiskami i opisami obowiązków
4. **Wykształcenie** - z datami, nazwami uczelni/szkół i kierunkami
5. **Umiejętności** - podzielone na kategorie (techniczne, językowe, miękkie)
6. **Dodatkowe sekcje** - jeśli relevant (certyfikaty, języki, zainteresowania)

Wymagania:
- Nowoczesny, czytelny format
- Profesjonalny język biznesowy
- Dostosowanie do polskiego rynku pracy
- Konkretne opisy osiągnięć i obowiązków
- Optymalizacja pod systemy ATS
- Format gotowy do użycia

Jeśli brakuje informacji, uzupełnij je profesjonalnymi przykładami odpowiednimi dla danej branży.
  `;

  return callOpenRouterAPI(prompt, systemPrompt, 3500, "qwen/qwen-2.5-72b-instruct");
}
