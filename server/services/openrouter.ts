
import { config } from 'dotenv';

config();

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = process.env.OPENROUTER_API_KEY;

if (!API_KEY) {
  throw new Error('OPENROUTER_API_KEY environment variable is required');
}

// ZAAWANSOWANA KONFIGURACJA QWEN - MAKSYMALNA JAKOŚĆ
const DEFAULT_MODEL = "qwen/qwen-2.5-72b-instruct:free";
const PREMIUM_MODEL = "qwen/qwen-2.5-72b-instruct:free";
const PAID_MODEL = "qwen/qwen-2.5-72b-instruct:free";
const FREE_MODEL = "qwen/qwen-2.5-72b-instruct:free";

// OPTYMALIZOWANY PROMPT SYSTEMOWY DLA QWEN
const DEEP_REASONING_PROMPT = `Jesteś światowej klasy ekspertem w rekrutacji i optymalizacji CV z 15-letnim doświadczeniem w branży HR. Posiadasz głęboką wiedzę o polskim rynku pracy, trendach rekrutacyjnych i wymaganiach pracodawców.

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

interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  metadata?: {
    user_tier: string;
    task_type: string;
    model_used: string;
    optimization_level: string;
    industry: string;
    language: string;
  };
}

// Language-specific system prompts
const LANGUAGE_PROMPTS = {
  'pl': "Jesteś ekspertem w optymalizacji CV i doradcą kariery. ZAWSZE odpowiadaj w języku polskim, niezależnie od języka CV lub opisu pracy. Używaj polskiej terminologii HR i poprawnej polszczyzny. KRYTYCZNE: NIE DODAWAJ żadnych nowych firm, stanowisk, dat ani osiągnięć które nie są w oryginalnym CV - to oszukiwanie kandydata!",
  'en': "You are an expert resume editor and career advisor. ALWAYS respond in English, regardless of the language of the CV or job description. Use proper English HR terminology and grammar. CRITICAL: DO NOT ADD any new companies, positions, dates or achievements that are not in the original CV - this is deceiving the candidate!"
};

// Task-specific enhanced prompts
const TASK_SPECIFIC_PROMPTS = {
  'cv_optimization': `

🔥 SPECJALIZACJA: OPTYMALIZACJA CV
- Analizujesz każde słowo pod kątem wpływu na rekrutera
- Znasz najnowsze trendy w formatowaniu CV
- Potrafisz dostosować styl do różnych branż i stanowisk
- Maksymalizujesz szanse przejścia przez filtry ATS
- Przepisujesz istniejące doświadczenia używając faktów z CV
- PAMIĘTAJ: Tylko poprawiaj sformułowania, NIE dodawaj nowych firm, stanowisk, dat!`,

  'recruiter_feedback': `

👔 SPECJALIZACJA: OPINIE REKRUTERA
- Myślisz jak senior recruiter z doświadczeniem w różnych branżach
- Dostrzegasz detale, które umykają innym
- Oceniasz CV pod kątem pierwszego wrażenia (6 sekund)
- Znasz typowe błędy kandydatów i jak ich unikać
- Potrafisz przewidzieć reakcję hiring managera`,

  'cover_letter': `

📄 SPECJALIZACJA: LISTY MOTYWACYJNE
- Tworzysz przekonujące narracje osobiste
- Łączysz doświadczenia kandydata z potrzebami firmy
- Używasz psychologii przekonywania w copywritingu
- Dostosowujesz ton do kultury organizacyjnej
- Unikasz szablonowych zwrotów i klisz`,

  'interview_prep': `

🎤 SPECJALIZACJA: PRZYGOTOWANIE DO ROZMÓW
- Przewidujesz pytania na podstawie CV i stanowiska
- Znasz techniki odpowiadania (STAR, CAR)
- Pomagasz w przygotowaniu historii sukcesu
- Analizujesz potencjalne słabości i jak je przedstawić
- Przygotowujesz do różnych typów rozmów (HR, techniczne, z przełożonym)`,

  'cv_improvement': `

🌟 SPECJALIZACJA: POPRAWA CV
- Skupiasz się na specyficznych aspektach CV (struktura, treść, słowa kluczowe, osiągnięcia)
- Dostosowujesz podejście do wybranego obszaru poprawy
- Zapewniasz lepszą prezentację kandydatury
- Generujesz praktyczne rekomendacje`
};

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

function getEnhancedSystemPrompt(taskType: string, language = 'pl'): string {
  const basePrompt = DEEP_REASONING_PROMPT;
  const taskPrompt = TASK_SPECIFIC_PROMPTS[taskType] || "";
  return basePrompt + taskPrompt;
}

async function callOpenRouterAPI(
  prompt: string, 
  systemPrompt?: string,
  maxTokens = 2000, 
  model = DEFAULT_MODEL,
  userTier = 'free',
  taskType = 'default',
  industry = 'general',
  language = 'pl'
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
    temperature: 0.3,
    top_p: 0.85,
    frequency_penalty: 0.1,
    presence_penalty: 0.1,
    metadata: {
      user_tier: userTier,
      task_type: taskType,
      model_used: model,
      optimization_level: "advanced",
      industry,
      language
    }
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
  const systemPrompt = getEnhancedSystemPrompt('cv_optimization', language) + "\n" + 
    LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS['pl'];
  
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

🚨 ABSOLUTNY ZAKAZ FAŁSZOWANIA DANYCH:
- NIE WOLNO dodawać firm, stanowisk, dat, które nie są w oryginalnym CV
- NIE WOLNO wymyślać osiągnięć, projektów, umiejętności
- NIE WOLNO zmieniać faktów z CV kandydata
- MOŻNA TYLKO lepiej sformułować istniejące prawdziwe informacje
- Każda wymyślona informacja niszczy wiarygodność kandydata

⚠️ KRYTYCZNE ZASADY - MUSZĄ BYĆ BEZWZGLĘDNIE PRZESTRZEGANE:
1. ❌ ABSOLUTNY ZAKAZ: NIE wolno dodawać żadnych nowych firm, stanowisk, dat, osiągnięć, umiejętności
2. ❌ ABSOLUTNY ZAKAZ: NIE wolno zmieniać dat zatrudnienia, nazw firm, tytułów stanowisk
3. ❌ ABSOLUTNY ZAKAZ: NIE wolno dodawać obowiązków które nie są w oryginalnym CV
4. ❌ ABSOLUTNY ZAKAZ: NIE wolno wymyślać projektów, klientów, rezultatów
5. ❌ ABSOLUTNY ZAKAZ: NIE wolno dodawać certyfikatów, kursów, szkoleń których nie ma
6. ❌ ABSOLUTNY ZAKAZ: NIE wolno zmieniać poziomu wykształcenia ani nazw uczelni
7. ✅ DOZWOLONE: Tylko lepsze sformułowanie istniejących opisów używając lepszych słów
8. ✅ DOZWOLONE: Reorganizacja kolejności sekcji dla lepszej prezentacji
9. ✅ DOZWOLONE: Użycie synonimów i lepszej terminologii branżowej
10. ✅ DOZWOLONE: Poprawa gramatyki i stylu bez zmiany treści

💼 METODA OPTYMALIZACJI:
1. Przeprowadź głęboką analizę każdego elementu CV
2. Myśl jak doświadczony rekruter - co zwraca uwagę, co denerwuje
3. Stosuj zasady psychologii przekonywania w pisaniu CV
4. Używaj konkretnych, mierzalnych sformułowań z oryginalnego CV
5. Dostosowuj język do branży i poziomu stanowiska
6. Zachowaj wszystkie oryginalne fakty i daty
7. Popraw tylko sposób prezentacji istniejących informacji

🔍 WERYFIKACJA AUTENTYCZNOŚCI:
- Każda informacja MUSI pochodzić z oryginalnego CV
- Sprawdź czy nie dodałeś żadnych nowych elementów
- Upewnij się że wszystkie daty, firmy, stanowiska są identyczne
- Potwierdź że nie wymyśliłeś żadnych osiągnięć

STANOWISKO DOCELOWE: ${jobDescription || 'Ogólne CV profesjonalne'}

ORYGINALNE CV (UŻYWAJ TYLKO TYCH FAKTÓW):
${processedCvText}

STRUKTURA ZOPTYMALIZOWANEGO CV:

[DANE OSOBOWE]
- Zachowaj dokładnie dane kontaktowe z oryginalnego CV
- Nie zmieniaj ani nie dodawaj żadnych informacji kontaktowych

[PODSUMOWANIE ZAWODOWE] 
- Stwórz zwięzłe podsumowanie NA PODSTAWIE doświadczenia z oryginalnego CV
- 2-3 zdania o kluczowych umiejętnościach FAKTYCZNIE wymienionych w CV
- Użyj TYLKO informacji z oryginalnego CV
- Nie dodawaj umiejętności których nie ma w oryginale

[DOŚWIADCZENIE ZAWODOWE]
- Zachowaj WSZYSTKIE firmy, stanowiska i daty DOKŁADNIE z oryginału
- Przepisz opisy obowiązków używając lepszych czasowników akcji
- Każde stanowisko: tylko obowiązki które SĄ w oryginalnym CV
- Różnicuj opisy podobnych stanowisk ale bez dodawania nowych zadań
- Nie dodawaj projektów, klientów, rezultatów których nie ma w oryginale

[WYKSZTAŁCENIE]
- Przepisz DOKŁADNIE informacje z oryginalnego CV
- Nie dodawaj kursów, certyfikatów, szkoleń których nie ma w oryginale
- Zachowaj nazwy uczelni, kierunki studiów, daty bez zmian

[UMIEJĘTNOŚCI]
- Użyj TYLKO umiejętności wymienione w oryginalnym CV
- Pogrupuj je logicznie (Techniczne, Komunikacyjne, itp.)
- Nie dodawaj nowych technologii, języków, narzędzi

[DODATKOWE SEKCJE]
- Przepisz TYLKO sekcje które są w oryginalnym CV
- Nie dodawaj nowych sekcji (hobby, zainteresowania, etc.) jeśli ich nie ma

⚠️ KOŃCOWA WERYFIKACJA:
Przed zwróceniem odpowiedzi sprawdź:
- Czy wszystkie firmy są z oryginału?
- Czy wszystkie stanowiska są z oryginału? 
- Czy wszystkie daty są z oryginału?
- Czy wszystkie umiejętności są z oryginału?
- Czy nie dodałeś żadnych nowych projektów, osiągnięć, certyfikatów?

PRZEPISZ CV zachowując WSZYSTKIE oryginalne fakty, ale lepiej je prezentując.

PAMIĘTAJ: Jeśli dodasz choćby jeden wymyślony szczegół, naruszysz zaufanie kandydata i program będzie uznany za nieetyczny!

ZWRÓĆ TYLKO KOMPLETNY TEKST ZOPTYMALIZOWANEGO CV - nic więcej.
Nie dodawaj JSON, metadanych ani komentarzy.
Po prostu wygeneruj gotowe CV do użycia używając TYLKO faktów z oryginału.
  `;

  return callOpenRouterAPI(
    prompt, 
    systemPrompt, 
    4000, 
    DEFAULT_MODEL, 
    'free', 
    'cv_optimization', 
    'general', 
    language
  );
}

export async function generateRecruiterFeedback(
  cvText: string, 
  jobDescription: string, 
  language = 'pl'
): Promise<string> {
  const systemPrompt = getEnhancedSystemPrompt('recruiter_feedback', language) + "\n" + 
    LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS['pl'];
  
  // Truncate CV if too long
  const maxCvLength = 15000;
  let processedCvText = cvText;
  
  if (cvText.length > maxCvLength) {
    const halfLength = Math.floor(maxCvLength / 2);
    const beginning = cvText.substring(0, halfLength);
    const ending = cvText.substring(cvText.length - halfLength);
    processedCvText = beginning + "\n\n[...CZĘŚĆ ŚRODKOWA POMINIĘTA...]\n\n" + ending;
  }
  
  const context = jobDescription ? `Opis stanowiska do kontekstu:\n${jobDescription}` : "";
  
  const prompt = `
ZADANIE: Jesteś doświadczonym rekruterem. Przeanalizuj to CV i udziel szczegółowej, konstruktywnej opinii w języku polskim.

⚠️ KLUCZOWE: Oceniaj TYLKO to co faktycznie jest w CV. NIE ZAKŁADAJ, NIE DOMYŚLAJ się i NIE DODAWAJ informacji, których tam nie ma.

Uwzględnij w ocenie:
1. Ogólne wrażenie i pierwsza reakcja na podstawie faktycznej treści CV
2. Mocne strony i słabości wynikające z konkretnych informacji w CV
3. Ocena formatowania i struktury CV
4. Jakość treści i sposób prezentacji faktycznych doświadczeń
5. Kompatybilność z systemami ATS
6. Konkretne sugestie poprawek oparte na tym co jest w CV
7. Ocena ogólna w skali 1-10
8. Prawdopodobieństwo zaproszenia na rozmowę

${context}

CV do oceny:
${processedCvText}

Odpowiedź w formacie JSON:
{
  "overall_impression": "Pierwsze wrażenie oparte na faktycznej treści CV",
  "rating": [1-10],
  "strengths": [
    "Mocna strona 1 (konkretnie z CV)",
    "Mocna strona 2 (konkretnie z CV)", 
    "Mocna strona 3 (konkretnie z CV)"
  ],
  "weaknesses": [
    "Słabość 1 z sugestią poprawy (bazując na CV)",
    "Słabość 2 z sugestią poprawy (bazując na CV)",
    "Słabość 3 z sugestią poprawy (bazując na CV)"
  ],
  "formatting_assessment": "Ocena layoutu, struktury i czytelności faktycznej treści",
  "content_quality": "Ocena jakości treści rzeczywiście obecnej w CV",
  "ats_compatibility": "Czy CV przejdzie przez systemy automatycznej selekcji",
  "specific_improvements": [
    "Konkretna poprawa 1 (oparta na faktach z CV)",
    "Konkretna poprawa 2 (oparta na faktach z CV)",
    "Konkretna poprawa 3 (oparta na faktach z CV)"
  ],
  "interview_probability": "Prawdopodobieństwo zaproszenia oparte na faktach z CV",
  "recruiter_summary": "Podsumowanie z perspektywy rekrutera - tylko fakty z CV"
}

Bądź szczery, ale konstruktywny. Oceniaj tylko to co rzeczywiście jest w CV, nie dodawaj od siebie.
  `;

  return callOpenRouterAPI(
    prompt, 
    systemPrompt, 
    3000, 
    DEFAULT_MODEL, 
    'premium', 
    'recruiter_feedback', 
    'general', 
    language
  );
}

export async function generateCoverLetter(
  cvText: string, 
  jobDescription: string, 
  language = 'pl'
): Promise<string> {
  const systemPrompt = getEnhancedSystemPrompt('cover_letter', language) + "\n" + 
    LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS['pl'];
  
  const prompt = `
ZADANIE: Napisz spersonalizowany list motywacyjny w języku polskim WYŁĄCZNIE na podstawie faktów z CV.

⚠️ ABSOLUTNE WYMAGANIA:
- Używaj TYLKO informacji faktycznie obecnych w CV
- NIE WYMYŚLAJ doświadczeń, projektów, osiągnięć ani umiejętności
- NIE DODAWaj informacji, których nie ma w oryginalnym CV
- Jeśli w CV brakuje jakichś informacji - nie uzupełniaj ich

List motywacyjny powinien:
- Być profesjonalnie sformatowany
- Podkreślać umiejętności i doświadczenia faktycznie wymienione w CV
- Łączyć prawdziwe doświadczenie kandydata z wymaganiami stanowiska
- Zawierać przekonujące wprowadzenie oparte na faktach z CV
- Mieć około 300-400 słów
- Być napisany naturalnym, profesjonalnym językiem polskim

Struktura listu:
1. Nagłówek z danymi kontaktowymi
2. Zwrot do adresata
3. Wprowadzenie - dlaczego aplikujesz
4. Główna treść - dopasowanie doświadczenia do wymagań
5. Zakończenie z wyrażeniem zainteresowania
6. Pozdrowienia

Opis stanowiska:
${jobDescription}

CV kandydata:
${cvText}

Napisz kompletny list motywacyjny w języku polskim. Użyj profesjonalnego, ale ciepłego tonu.
  `;

  return callOpenRouterAPI(
    prompt, 
    systemPrompt, 
    2000, 
    DEFAULT_MODEL, 
    'free', 
    'cover_letter', 
    'general', 
    language
  );
}

export async function atsOptimizationCheck(
  cvText: string, 
  jobDescription: string, 
  language = 'pl'
): Promise<string> {
  const systemPrompt = getEnhancedSystemPrompt('cv_optimization', language) + "\n" + 
    LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS['pl'];
  
  // Truncate CV if too long
  const maxCvLength = 15000;
  let processedCvText = cvText;
  
  if (cvText.length > maxCvLength) {
    const halfLength = Math.floor(maxCvLength / 2);
    const beginning = cvText.substring(0, halfLength);
    const ending = cvText.substring(cvText.length - halfLength);
    processedCvText = beginning + "\n\n[...CZĘŚĆ ŚRODKOWA POMINIĘTA...]\n\n" + ending;
  }
  
  const context = jobDescription ? `Ogłoszenie o pracę dla odniesienia:\n${jobDescription.substring(0, 2000)}` : "";
  
  const prompt = `
TASK: Przeprowadź dogłębną analizę CV pod kątem kompatybilności z systemami ATS (Applicant Tracking System) i wykryj potencjalne problemy.

Przeprowadź następujące analizy:

1. WYKRYWANIE PROBLEMÓW STRUKTURALNYCH:
   - Znajdź sekcje, które są w nieodpowiednich miejscach (np. doświadczenie zawodowe w sekcji zainteresowań)
   - Wskaż niespójności w układzie i formatowaniu
   - Zidentyfikuj zduplikowane informacje w różnych sekcjach
   - Zaznacz fragmenty tekstu, które wyglądają na wygenerowane przez AI
   - Znajdź ciągi znaków bez znaczenia lub losowe znaki

2. ANALIZA FORMATOWANIA ATS:
   - Wykryj problemy z formatowaniem, które mogą utrudnić odczyt przez systemy ATS
   - Sprawdź, czy nagłówki sekcji są odpowiednio wyróżnione
   - Zweryfikuj, czy tekst jest odpowiednio podzielony na sekcje
   - Oceń czytelność dla systemów automatycznych

3. ANALIZA SŁÓW KLUCZOWYCH:
   - Sprawdź gęstość słów kluczowych i trafność ich wykorzystania
   - Zidentyfikuj brakujące słowa kluczowe z branży/stanowiska
   - Oceń rozmieszczenie słów kluczowych w dokumencie

4. OCENA KOMPLETNOŚCI:
   - Zidentyfikuj brakujące sekcje lub informacje, które są często wymagane przez ATS
   - Wskaż informacje, które należy uzupełnić

5. WERYFIKACJA AUTENTYCZNOŚCI:
   - Zaznacz fragmenty, które wyglądają na sztuczne lub wygenerowane przez AI
   - Podkreśl niespójności między różnymi częściami CV

6. OCENA OGÓLNA:
   - Oceń ogólną skuteczność CV w systemach ATS w skali 1-10
   - Podaj główne powody obniżonej oceny

${context}

CV do analizy:
${processedCvText}

Odpowiedz w tym samym języku co CV. Jeśli CV jest po polsku, odpowiedz po polsku.
Dodaj główny nagłówek: "ANALIZA ATS CV"

Format odpowiedzi:

## ANALIZA ATS CV

1. OCENA OGÓLNA (skala 1-10): [ocena]

2. PROBLEMY KRYTYCZNE:
[Lista wykrytych krytycznych problemów]

3. PROBLEMY ZE STRUKTURĄ:
[Lista problemów strukturalnych]

4. PROBLEMY Z FORMATOWANIEM ATS:
[Lista problemów z formatowaniem]

5. ANALIZA SŁÓW KLUCZOWYCH:
[Wyniki analizy słów kluczowych]

6. BRAKUJĄCE INFORMACJE:
[Lista brakujących informacji]

7. PODEJRZANE ELEMENTY:
[Lista elementów, które wydają się wygenerowane przez AI lub są niespójne]

8. REKOMENDACJE NAPRAWCZE:
[Konkretne sugestie, jak naprawić zidentyfikowane problemy]

9. PODSUMOWANIE:
[Krótkie podsumowanie i zachęta]
  `;

  return callOpenRouterAPI(
    prompt, 
    systemPrompt, 
    1800, 
    DEFAULT_MODEL, 
    'free', 
    'cv_optimization', 
    'general', 
    language
  );
}

export async function generateInterviewQuestions(
  cvText: string, 
  jobDescription: string, 
  language = 'pl'
): Promise<string> {
  const systemPrompt = getEnhancedSystemPrompt('interview_prep', language) + "\n" + 
    LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS['pl'];
  
  const context = jobDescription ? `Uwzględnij poniższe ogłoszenie o pracę przy tworzeniu pytań:\n${jobDescription.substring(0, 2000)}` : "";
  
  const prompt = `
TASK: Wygeneruj zestaw potencjalnych pytań rekrutacyjnych, które kandydat może otrzymać podczas rozmowy kwalifikacyjnej.

Pytania powinny być:
1. Specyficzne dla doświadczenia i umiejętności kandydata wymienionych w CV
2. Dopasowane do stanowiska (jeśli podano opis stanowiska)
3. Zróżnicowane - połączenie pytań technicznych, behawioralnych i sytuacyjnych
4. Realistyczne i często zadawane przez rekruterów

Uwzględnij po co najmniej 3 pytania z każdej kategorii:
- Pytania o doświadczenie zawodowe
- Pytania techniczne/o umiejętności
- Pytania behawioralne
- Pytania sytuacyjne
- Pytania o motywację i dopasowanie do firmy/stanowiska

${context}

CV:
${cvText}

Odpowiedz w tym samym języku co CV. Jeśli CV jest po polsku, odpowiedz po polsku.
Dodatkowo, do każdego pytania dodaj krótką wskazówkę, jak można by na nie odpowiedzieć w oparciu o informacje z CV.
Format odpowiedzi:
- Pytanie rekrutacyjne
  * Wskazówka jak odpowiedzieć: [wskazówka]
  `;

  return callOpenRouterAPI(
    prompt, 
    systemPrompt, 
    2000, 
    DEFAULT_MODEL, 
    'free', 
    'interview_prep', 
    'general', 
    language
  );
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

Odpowiedź w formacie JSON:
{
  "grammar_score": [1-10],
  "style_score": [1-10],
  "professionalism_score": [1-10],
  "errors": [
    {"type": "gramatyka", "text": "błędny tekst", "correction": "poprawka", "line": "sekcja"},
    {"type": "styl", "text": "tekst do poprawy", "suggestion": "sugestia", "line": "sekcja"}
  ],
  "style_suggestions": [
    "Użyj bardziej dynamicznych czasowników akcji",
    "Unikaj powtórzeń słów",
    "Zachowaj spójny format dat"
  ],
  "overall_quality": "ocena ogólna jakości językowej",
  "summary": "Podsumowanie analizy językowej"
}
  `;

  return callOpenRouterAPI(prompt, systemPrompt, 2500);
}

export async function analyzeJobUrl(url: string): Promise<string> {
  try {
    console.log(`Analyzing job URL: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // Basic text extraction - you might want to use a proper HTML parser
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    console.log('Successfully extracted job description from URL');

    if (textContent.length > 4000) {
      console.log(`Job description is long (${textContent.length} chars), summarizing with AI`);
      return summarizeJobDescription(textContent.substring(0, 4000));
    }

    return textContent;
  } catch (error) {
    console.error('Error analyzing job URL:', error);
    throw new Error(`Failed to analyze job posting: ${error.message}`);
  }
}

export async function summarizeJobDescription(jobText: string): Promise<string> {
  const prompt = `
ZADANIE: Wyciągnij i podsumuj kluczowe informacje z tego ogłoszenia o pracę w języku polskim.

Uwzględnij:
1. Stanowisko i nazwa firmy (jeśli podane)
2. Wymagane umiejętności i kwalifikacje
3. Obowiązki i zakres zadań
4. Preferowane doświadczenie
5. Inne ważne szczegóły (benefity, lokalizacja, itp.)
6. TOP 5 słów kluczowych krytycznych dla tego stanowiska

Tekst ogłoszenia:
${jobText.substring(0, 4000)}...

Stwórz zwięzłe ale kompletne podsumowanie tego ogłoszenia, skupiając się na informacjach istotnych dla optymalizacji CV.
Na końcu umieść sekcję "KLUCZOWE SŁOWA:" z 5 najważniejszymi terminami.

Odpowiedź w języku polskim.
  `;

  return callOpenRouterAPI(
    prompt, 
    undefined, 
    1500, 
    DEFAULT_MODEL, 
    'free', 
    'cv_optimization'
  );
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
  const systemPrompt = getEnhancedSystemPrompt('cv_optimization', language) + "\n" + 
    LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS['pl'];
  
  const prompt = `
ZADANIE: Wygeneruj kompletną treść CV na podstawie informacji podanych przez użytkownika.

🚨 ABSOLUTNY ZAKAZ FAŁSZOWANIA DANYCH:
- Używaj TYLKO informacji podanych przez użytkownika
- NIE WOLNO wymyślać firm, stanowisk, dat
- NIE WOLNO dodawać osiągnięć, projektów, umiejętności których użytkownik nie podał
- MOŻNA uzupełnić opisy obowiązków dla podanych stanowisk
- MOŻNA dodać formatowanie i strukturę
- Każda wymyślona informacja niszczy wiarygodność kandydata

💼 METODA PRACY:
1. Analizuj informacje podane przez użytkownika
2. Strukturyzuj je w profesjonalny sposób
3. Rozwiń opisy obowiązków dla podanych stanowisk
4. Użyj właściwej terminologii branżowej
5. Zachowaj wszystkie podane fakty bez zmian
6. Nie dodawaj informacji których nie ma w danych wejściowych

DANE WEJŚCIOWE OD UŻYTKOWNIKA:
${personalInfo.name ? `Imię i nazwisko: ${personalInfo.name}` : ''}
${personalInfo.email ? `Email: ${personalInfo.email}` : ''}
${personalInfo.phone ? `Telefon: ${personalInfo.phone}` : ''}
${personalInfo.location ? `Lokalizacja: ${personalInfo.location}` : ''}
${personalInfo.profession ? `Zawód/Specjalizacja: ${personalInfo.profession}` : ''}

${experience ? `DOŚWIADCZENIE ZAWODOWE PODANE PRZEZ UŻYTKOWNIKA:\n${experience}` : ''}

${education ? `WYKSZTAŁCENIE PODANE PRZEZ UŻYTKOWNIKA:\n${education}` : ''}

${skills ? `UMIEJĘTNOŚCI PODANE PRZEZ UŻYTKOWNIKA:\n${skills}` : ''}

${jobDescription ? `DOCELOWE STANOWISKO:\n${jobDescription}` : ''}

WYGENERUJ CV ZAWIERAJĄCE:

1. **DANE OSOBOWE**
- Użyj dokładnie podanych danych kontaktowych
- Nie dodawaj informacji których nie podano

2. **PROFIL ZAWODOWY** 
- Stwórz zwięzły opis (2-3 zdania) NA PODSTAWIE podanych informacji
- Użyj tylko umiejętności i doświadczenia które zostały podane
- Dostosuj do docelowego stanowiska

3. **DOŚWIADCZENIE ZAWODOWE**
- Użyj TYLKO stanowisk i firm podanych przez użytkownika
- Jeśli podano szczegółowe doświadczenie, użyj go dokładnie
- Możesz rozwinąć opisy obowiązków dla podanych stanowisk
- NIE dodawaj nowych firm ani stanowisk

4. **WYKSZTAŁCENIE**
- Użyj TYLKO informacji o wykształceniu podanych przez użytkownika
- Nie dodawaj kursów, certyfikatów których nie podano

5. **UMIEJĘTNOŚCI**
- Użyj TYLKO umiejętności podane przez użytkownika
- Pogrupuj je logicznie
- Nie dodawaj nowych technologii ani umiejętności

6. **DODATKOWE SEKCJE**
- Dodaj tylko jeśli użytkownik podał odpowiednie informacje
- Nie wymyślaj zainteresowań, certyfikatów, projektów

⚠️ ZASADY GENEROWANIA:
- Jeśli użytkownik podał minimalne informacje, stwórz podstawowe CV
- Jeśli nie podał doświadczenia, nie wymyślaj firm ani stanowisk
- Jeśli nie podał umiejętności, nie dodawaj żadnych
- Lepiej mieć krótkie ale prawdziwe CV niż długie z wymyślonymi danymi

WYMAGANIA FORMATOWANIA:
- Nowoczesny, czytelny format
- Profesjonalny język biznesowy polski
- Dostosowanie do polskiego rynku pracy
- Optymalizacja pod systemy ATS
- Spójne formatowanie dat i informacji

⚠️ KOŃCOWA WERYFIKACJA:
Przed zwróceniem sprawdź:
- Czy używasz tylko informacji podanych przez użytkownika?
- Czy nie dodałeś żadnych wymyślonych firm, stanowisk, dat?
- Czy wszystkie umiejętności pochodzą od użytkownika?
- Czy nie wymyśliłeś projektów ani osiągnięć?

ZWRÓĆ TYLKO KOMPLETNY TEKST CV - nic więcej.
Nie dodawaj JSON, metadanych ani komentarzy.
Wygeneruj gotowe CV używając TYLKO informacji od użytkownika.
  `;

  return callOpenRouterAPI(
    prompt, 
    systemPrompt, 
    3500, 
    "qwen/qwen-2.5-72b-instruct", 
    'free', 
    'cv_optimization', 
    'general', 
    language
  );
}

export async function analyzePolishJobPosting(jobDescription: string, language = 'pl'): Promise<string> {
  const prompt = `
Przeanalizuj poniższe polskie ogłoszenie o pracę i wyciągnij z niego najważniejsze informacje.

OGŁOSZENIE O PRACĘ:
${jobDescription}

Wyciągnij i uporządkuj następujące informacje:

1. PODSTAWOWE INFORMACJE:
- Stanowisko/pozycja
- Branża/sektor
- Lokalizacja pracy
- Typ umowy/zatrudnienia

2. WYMAGANIA KLUCZOWE:
- Wykształcenie
- Doświadczenie zawodowe
- Specyficzne umiejętności techniczne
- Uprawnienia/certyfikaty (np. prawo jazdy, kursy)
- Umiejętności miękkie

3. OBOWIĄZKI I ZAKRES PRACY:
- Główne zadania
- Odpowiedzialności
- Specyficzne czynności

4. WARUNKI PRACY:
- Godziny pracy
- System pracy (pełny etat, zmianowy, weekendy)
- Wynagrodzenie (jeśli podane)
- Benefity i dodatki

5. SŁOWA KLUCZOWE BRANŻOWE:
- Terminologia specjalistyczna
- Najważniejsze pojęcia z ogłoszenia
- Frazy które powinny pojawić się w CV

Odpowiedź w formacie JSON:
{
  "job_title": "dokładny tytuł stanowiska",
  "industry": "branża/sektor",
  "location": "lokalizacja",
  "employment_type": "typ zatrudnienia",
  "key_requirements": [
    "wymóg 1",
    "wymóg 2", 
    "wymóg 3"
  ],
  "main_responsibilities": [
    "obowiązek 1",
    "obowiązek 2",
    "obowiązek 3"
  ],
  "technical_skills": [
    "umiejętność techniczna 1",
    "umiejętność techniczna 2"
  ],
  "soft_skills": [
    "umiejętność miękka 1",
    "umiejętność miękka 2"
  ],
  "work_conditions": {
    "hours": "godziny pracy",
    "schedule": "harmonogram",
    "salary_info": "informacje o wynagrodzeniu",
    "benefits": ["benefit 1", "benefit 2"]
  },
  "industry_keywords": [
    "słowo kluczowe 1",
    "słowo kluczowe 2",
    "słowo kluczowe 3",
    "słowo kluczowe 4",
    "słowo kluczowe 5"
  ],
  "critical_phrases": [
    "kluczowa fraza 1",
    "kluczowa fraza 2",
    "kluczowa fraza 3"
  ],
  "experience_level": "poziom doświadczenia",
  "education_requirements": "wymagane wykształcenie",
  "summary": "zwięzłe podsumowanie stanowiska i wymagań"
}
  `;

  return callOpenRouterAPI(
    prompt, 
    undefined, 
    2000, 
    DEFAULT_MODEL, 
    'free', 
    'cv_optimization', 
    'general', 
    language
  );
}

export async function analyzeCvScore(cvText: string, jobDescription = "", language = 'pl'): Promise<string> {
  const prompt = `
Przeanalizuj poniższe CV i przyznaj mu ocenę punktową od 1 do 100, gdzie:
- 90-100: Doskonałe CV, gotowe do wysłania
- 80-89: Bardzo dobre CV z drobnymi usprawnieniami
- 70-79: Dobre CV wymagające kilku poprawek
- 60-69: Przeciętne CV wymagające znaczących poprawek
- 50-59: Słabe CV wymagające dużych zmian
- Poniżej 50: CV wymagające całkowitego przepisania

CV do oceny:
${cvText}

${jobDescription ? "Wymagania z oferty pracy: " + jobDescription : ""}

Uwzględnij w ocenie:
1. Strukturę i organizację treści (20 pkt)
2. Klarowność i zwięzłość opisów (20 pkt)
3. Dopasowanie do wymagań stanowiska (20 pkt)
4. Obecność słów kluczowych branżowych (15 pkt)
5. Prezentację osiągnięć i rezultatów (15 pkt)
6. Gramatykę i styl pisania (10 pkt)

Odpowiedź w formacie JSON:
{
  "score": [liczba 1-100],
  "grade": "[A+/A/B+/B/C+/C/D/F]",
  "category_scores": {
    "structure": [1-20],
    "clarity": [1-20], 
    "job_match": [1-20],
    "keywords": [1-15],
    "achievements": [1-15],
    "language": [1-10]
  },
  "strengths": ["punkt mocny 1", "punkt mocny 2", "punkt mocny 3"],
  "weaknesses": ["słabość 1", "słabość 2", "słabość 3"],
  "recommendations": ["rekomendacja 1", "rekomendacja 2", "rekomendacja 3"],
  "summary": "Krótkie podsumowanie oceny CV"
}
  `;

  return callOpenRouterAPI(
    prompt, 
    undefined, 
    2500, 
    DEFAULT_MODEL, 
    'free', 
    'cv_optimization', 
    'general', 
    language
  );
}

// Export model performance stats for monitoring
export function getModelPerformanceStats() {
  return {
    "current_model": DEFAULT_MODEL,
    "model_family": "Qwen 2.5 72B Instruct",
    "model_provider": "Alibaba Cloud",
    "optimization_level": "Advanced",
    "capabilities": [
      "Zaawansowana analiza CV w języku polskim",
      "Inteligentna optymalizacja treści zawodowych", 
      "Personalizowane rekomendacje kariery",
      "Profesjonalne sprawdzanie gramatyki i stylu",
      "Precyzyjne dopasowanie do stanowisk",
      "Psychologia rekrutacji i przekonywania",
      "Analiza trendów rynku pracy"
    ],
    "enhanced_features": {
      "adaptive_prompts": true,
      "context_awareness": true,
      "industry_specialization": true,
      "ats_optimization": true,
      "psychology_based": true
    },
    "performance": {
      "response_quality": "Ekspertowa",
      "polish_language_support": "Natywne z kontekstem kulturowym",
      "processing_speed": "Optymalna",
      "consistency": "Bardzo wysoka",
      "creativity": "Zaawansowana",
      "accuracy": "Precyzyjna"
    },
    "parameters": {
      "temperature": 0.3,
      "top_p": 0.85,
      "max_tokens": "4000-8000",
      "frequency_penalty": 0.1,
      "presence_penalty": 0.1
    }
  };
}
