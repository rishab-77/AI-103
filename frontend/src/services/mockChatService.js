/**
 * mockChatService.js — Multi-Agent Orchestrator & Knowledge Service
 *
 * ARCHITECTURAL SPECIFICATION:
 * 1. Intent Pre-Filter: Lightweight Chit-Chat Classifier (greetings, gratitude, bot capabilities)
 *    - Short-circuits prior to RAG retrieval
 *    - Returns direct conversational responses with NO retrieval call and NO citations
 * 2. Multi-Agent Router:
 *    - Academic Agent: Degree progression, UGC regulations, ABC, grading, attendance, exams
 *    - Student Services Agent: Grievance redressal (CSGRC/Ombudsperson), hostel, welfare
 *    - General FAQ Agent: Institutional governance and policy navigation
 * 3. Ambiguity & Failure Handling:
 *    - Ambiguous small-talk is handled conversationally with friendly prompt suggestions
 *    - Safe failure notice cards are reserved exclusively for genuine policy queries with missing data
 */

const SIMULATED_LATENCY_MS = 600;

/**
 * Main Orchestrator Dispatcher
 * @param {string} query - Student natural language message
 */
export async function askQuestion(query) {
  // Simulate lightweight orchestrator routing latency
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

  const trimmed = (query || "").trim();
  const decision = orchestrateQuery(trimmed);

  if (decision.category === "ERROR_TRIGGER") {
    throw new Error(
      "Service temporarily unavailable. We couldn't process your question. Please try again."
    );
  }

  return generateOrchestratedResponse(decision, trimmed);
}

/**
 * Orchestrator Routing Logic:
 * Step 1: Pre-filter Chit-Chat & Meta Inquiries
 * Step 2: Input Guardrails (Gibberish / Out-of-Scope)
 * Step 3: Domain Knowledge Agent Dispatch
 */
export function orchestrateQuery(query) {
  const normalized = query.toLowerCase().trim();

  // 1. Error simulation
  if (normalized === "trigger error" || normalized.includes("trigger error")) {
    return {
      routeType: "ERROR",
      category: "ERROR_TRIGGER",
      agent: null,
      requiresRetrieval: false,
    };
  }

  // 2. Step 1: Lightweight Chit-Chat Pre-Filter (NO RAG retrieval, NO citations)
  const chitChatCategory = classifyChitChat(normalized);
  if (chitChatCategory) {
    return {
      routeType: "CHITCHAT",
      category: chitChatCategory,
      agent: "general_faq",
      requiresRetrieval: false,
    };
  }

  // 3. Step 2: Content Guardrails
  if (isGibberish(query)) {
    return {
      routeType: "GUARDRAIL",
      category: "GIBBERISH",
      agent: "general_faq",
      requiresRetrieval: false,
    };
  }

  if (isOutOfScope(normalized)) {
    return {
      routeType: "GUARDRAIL",
      category: "OUT_OF_SCOPE",
      agent: "general_faq",
      requiresRetrieval: false,
    };
  }

  // 4. Step 3: Domain Knowledge Agents (RAG Retrieval Pipeline)
  // Student Grievance & Welfare -> Student Services Agent
  if (
    normalized.includes("grievance") ||
    normalized.includes("complaint") ||
    normalized.includes("ombudsperson") ||
    normalized.includes("csgrc") ||
    normalized.includes("ragging") ||
    normalized.includes("harassment")
  ) {
    return {
      routeType: "KNOWLEDGE_AGENT",
      category: "STUDENT_GRIEVANCE",
      agent: "student_services",
      requiresRetrieval: true,
    };
  }

  // Academic Bank of Credits / UGC Framework -> Academic Agent
  if (
    normalized.includes("academic bank") ||
    normalized.includes("abc") ||
    normalized.includes("multiple entry") ||
    normalized.includes("credit transfer") ||
    normalized.includes("credit mobility") ||
    normalized.includes("curriculum framework")
  ) {
    return {
      routeType: "KNOWLEDGE_AGENT",
      category: "UGC_ACADEMIC_FRAMEWORK",
      agent: "academic",
      requiresRetrieval: true,
    };
  }

  // Attendance & Debarment -> Academic Agent
  if (
    normalized.includes("attendance") ||
    normalized.includes("absent") ||
    normalized.includes("condonation") ||
    normalized.includes("debar") ||
    normalized.includes("minimum attendance")
  ) {
    return {
      routeType: "KNOWLEDGE_AGENT",
      category: "UNVERIFIED_ATTENDANCE",
      agent: "academic",
      requiresRetrieval: true,
    };
  }

  // Examinations & Backlogs -> Academic Agent
  if (
    normalized.includes("exam") ||
    normalized.includes("supplementary") ||
    normalized.includes("backlog") ||
    normalized.includes("re-exam") ||
    normalized.includes("re-evaluation") ||
    normalized.includes("hall ticket")
  ) {
    return {
      routeType: "KNOWLEDGE_AGENT",
      category: "UNVERIFIED_EXAM",
      agent: "academic",
      requiresRetrieval: true,
    };
  }

  // Grading System & CGPA -> Academic Agent
  if (
    normalized.includes("grade") ||
    normalized.includes("grading") ||
    normalized.includes("gpa") ||
    normalized.includes("cgpa") ||
    normalized.includes("sgpa") ||
    normalized.includes("marks") ||
    normalized.includes("percentage")
  ) {
    return {
      routeType: "KNOWLEDGE_AGENT",
      category: "UNVERIFIED_GRADING",
      agent: "academic",
      requiresRetrieval: true,
    };
  }

  // Hostel Rules & Campus Housing -> Student Services Agent
  if (
    normalized.includes("hostel") ||
    normalized.includes("gate pass") ||
    normalized.includes("curfew") ||
    normalized.includes("warden") ||
    normalized.includes("room allocation") ||
    normalized.includes("mess") ||
    normalized.includes("canteen")
  ) {
    return {
      routeType: "KNOWLEDGE_AGENT",
      category: "UNVERIFIED_HOSTEL",
      agent: "student_services",
      requiresRetrieval: true,
    };
  }

  // Campus Services & Leave -> Student Services Agent
  if (
    normalized.includes("leave") ||
    normalized.includes("medical certificate") ||
    normalized.includes("transport") ||
    normalized.includes("id card") ||
    normalized.includes("bonafide")
  ) {
    return {
      routeType: "KNOWLEDGE_AGENT",
      category: "UNVERIFIED_SERVICES",
      agent: "student_services",
      requiresRetrieval: true,
    };
  }

  // Default: Conversational Assistance rather than premature failure
  return {
    routeType: "CHITCHAT",
    category: "CONVERSATIONAL_HELP",
    agent: "general_faq",
    requiresRetrieval: false,
  };
}

/**
 * Lightweight Chit-Chat Pre-Filter Classifier
 * Matches casual greetings, gratitude, small talk, and assistant meta-questions
 */
function classifyChitChat(text) {
  // Strip punctuation for robust matching
  const clean = text.replace(/[.,!?;:']/g, "").trim();

  // 1. Greetings
  const greetingPhrases = [
    "hi",
    "hello",
    "hey",
    "hey there",
    "heya",
    "howdy",
    "good morning",
    "good afternoon",
    "good evening",
    "greetings",
    "namaste",
    "yo",
    "sup",
  ];
  if (greetingPhrases.includes(clean) || clean.startsWith("hi ") || clean.startsWith("hello ") || clean.startsWith("hey ")) {
    return "GREETING";
  }

  // 2. Small Talk (How are you, etc.)
  const smallTalkPhrases = [
    "how are you",
    "how are you doing",
    "hows it going",
    "how is it going",
    "how are things",
    "how is your day",
    "how do you do",
    "whats up",
    "what is up",
    "are you there",
    "you there",
  ];
  if (smallTalkPhrases.some((phrase) => clean.includes(phrase))) {
    return "SMALL_TALK";
  }

  // 3. Gratitude & Politeness
  const gratitudePhrases = [
    "thanks",
    "thank you",
    "thank you so much",
    "thanks a lot",
    "many thanks",
    "thx",
    "appreciate it",
    "much appreciated",
    "grateful",
    "thank u",
    "great thanks",
  ];
  if (gratitudePhrases.some((phrase) => clean === phrase || clean.startsWith(phrase))) {
    return "GRATITUDE";
  }

  // 4. Farewells
  const farewellPhrases = [
    "bye",
    "goodbye",
    "see you",
    "see ya",
    "cya",
    "have a good day",
    "have a nice day",
    "take care",
    "good night",
  ];
  if (farewellPhrases.some((phrase) => clean === phrase || clean.startsWith(phrase))) {
    return "FAREWELL";
  }

  // 5. Bot Identity & Capabilities
  const identityPhrases = [
    "who are you",
    "what is your name",
    "what can you do",
    "what do you do",
    "what are you",
    "how does this work",
    "how do you work",
    "tell me about yourself",
    "help me",
    "help",
    "what are your features",
    "what knowledge do you have",
  ];
  if (identityPhrases.some((phrase) => clean.includes(phrase))) {
    return "BOT_IDENTITY";
  }

  return null;
}

/**
 * Synthesizes grounded answers or conversational replies
 */
function generateOrchestratedResponse(decision, _originalQuery) {
  switch (decision.category) {
    // -----------------------------------------------------------------------
    // CHIT-CHAT & SMALL TALK RESPONSES (No RAG retrieval, No citations)
    // -----------------------------------------------------------------------
    case "GREETING":
      return {
        answer:
          "Hello! 👋 I'm your University FAQ Assistant.\n\nI can help you find verified information about academic regulations, examination policies, student grievances, hostel guidelines, and campus services. What would you like to know today?",
        sources: [],
        agent: "general_faq",
      };

    case "SMALL_TALK":
      return {
        answer:
          "I'm doing well, thank you for asking! 😊 I'm ready to help you navigate university regulations and student policies.\n\nFeel free to ask about credit transfers, exam bye-laws, hostel rules, or grievance redressal.",
        sources: [],
        agent: "general_faq",
      };

    case "GRATITUDE":
      return {
        answer:
          "You're very welcome! 😊 Feel free to ask if you have any more questions regarding academic policies or student procedures. Good luck with your studies!",
        sources: [],
        agent: "general_faq",
      };

    case "FAREWELL":
      return {
        answer:
          "Goodbye! Have a great day ahead, and feel free to return whenever you need verified university guidance. 🎓",
        sources: [],
        agent: "general_faq",
      };

    case "BOT_IDENTITY":
      return {
        answer:
          "I am the **University FAQ Assistant**, an AI portal assistant designed to provide accurate, grounded guidance on university policies and national higher education frameworks.\n\nHere is what I can help you with:\n- 🎓 **Academics:** Credit requirements, Academic Bank of Credits (ABC), flexible exit options.\n- 📝 **Examinations:** Re-evaluation rules, supplementary exams, and absence condonation.\n- 🏫 **Student Services:** Campus welfare, hostel guidelines, and administrative procedures.\n- ⚖️ **Grievances:** CSGRC committee protocols and Ombudsperson appeal processes.\n\nAsk me any question to get started!",
        sources: [],
        agent: "general_faq",
      };

    case "CONVERSATIONAL_HELP":
      return {
        answer:
          "I'm here to assist you with official university information! 🎓\n\nYou can ask about:\n- **Academic regulations** (e.g., credit mobility, degree progression)\n- **Examination bye-laws** (e.g., backlog rules, re-evaluations)\n- **Student services** (e.g., hostel guidelines, leave applications)\n- **Grievance redressal** (e.g., CSGRC protocols, Ombudsperson appeals)\n\nWhat specific topic would you like to explore?",
        sources: [],
        agent: "general_faq",
      };

    // -----------------------------------------------------------------------
    // GROUNDED KNOWLEDGE RESPONSES (RAG Retrieval with verified sources)
    // -----------------------------------------------------------------------
    case "STUDENT_GRIEVANCE":
      return {
        answer:
          "According to the **UGC (Redressal of Grievances of Students) Regulations, 2023** [1]:\n\n- **Collegiate Student Grievance Redressal Committee (CSGRC):** Every institution must constitute a CSGRC comprising the Principal, senior faculty members, and a representative student member.\n- **Application Process:** An aggrieved student can submit a grievance application online through the institution's designated portal or in writing to the committee.\n- **Ombudsperson Appeal:** If the student is not satisfied with the decision of the institutional grievance committee, an appeal can be preferred to the Ombudsperson appointed by the university within **15 days** of receiving the decision.",
        sources: [
          {
            title: "UGC (Redressal of Grievances of Students) Regulations, 2023",
            publisher: "University Grants Commission",
            category: "Student Welfare",
            sourceType: "Official regulatory source",
            section: "Clause 5(b)",
            lastUpdated: "April 2023",
            verified: true,
            url: "https://www.ugc.gov.in/regulations/UGC_Regulations_Student_Centric",
          },
        ],
        agent: "student_services",
      };

    case "UGC_ACADEMIC_FRAMEWORK":
      return {
        answer:
          "According to the **UGC Guidelines for Multiple Entry and Exit in Academic Programmes** and the **Academic Bank of Credits (ABC)** [1]:\n\n- **Credit Mobility:** Students can accumulate and transfer verified course credits across recognized higher education institutions.\n- **Flexible Exit Options:** Certificate after 1 year, Diploma after 2 years, Bachelor's Degree after 3 years, and Bachelor's with Honours/Research after 4 years, subject to required institutional credit thresholds.\n- **Credit Validity:** Credits stored in the ABC account typically remain valid for up to **7 years** or as notified by the UGC.",
        sources: [
          {
            title: "UGC Guidelines for Multiple Entry and Exit in Higher Education",
            publisher: "University Grants Commission",
            category: "Academic Framework",
            sourceType: "Official regulatory source",
            page: 12,
            lastUpdated: "July 2021",
            verified: true,
            url: "https://www.ugc.gov.in/regulations/UGC_Regulations_Student_Centric",
          },
        ],
        agent: "academic",
      };

    // -----------------------------------------------------------------------
    // SAFE FAILURE STATES (Genuine policy questions with missing specific index)
    // -----------------------------------------------------------------------
    case "UNVERIFIED_ATTENDANCE":
      return {
        answer:
          "I don't currently have a verified university-specific attendance policy in the available sources.\n\nAttendance thresholds (such as minimum percentage requirements and medical condonation rules) are defined by individual university academic regulations. Please consult your institution's official Academic Handbook or department office.",
        sources: [],
        agent: "academic",
        status: "no_info",
        failureType: "NO_INFO",
      };

    case "UNVERIFIED_HOSTEL":
      return {
        answer:
          "Hostel rules, curfew timings, and gate-pass procedures are specific to individual residential campuses. I do not currently have your university's verified hostel handbook in the knowledge base.\n\nPlease check with your resident hostel warden or your institution's student housing administration.",
        sources: [],
        agent: "student_services",
        status: "no_info",
        failureType: "NO_INFO",
      };

    case "UNVERIFIED_EXAM":
      return {
        answer:
          "Examination schedules, supplementary testing, and backlog progression rules are governed by your university's Examination Bye-Laws.\n\nI do not currently have your institution's verified examination handbook indexed. Please verify directly with the Controller of Examinations or your student portal.",
        sources: [],
        agent: "academic",
        status: "no_info",
        failureType: "NO_INFO",
      };

    case "UNVERIFIED_GRADING":
      return {
        answer:
          "Specific grading scales (whether 10-point, relative, or absolute) and CGPA calculation rules are defined by each institution's academic council.\n\nBecause this demo is not yet linked to your specific university's handbook, please check your student grade card or official syllabus document for exact grading brackets.",
        sources: [],
        agent: "academic",
        status: "no_info",
        failureType: "NO_INFO",
      };

    case "UNVERIFIED_SERVICES":
      return {
        answer:
          "Administrative student procedures such as leave applications, mess concessions, and campus facilities are governed by individual university guidelines.\n\nPlease refer to your institution's student affairs office or official student portal.",
        sources: [],
        agent: "student_services",
        status: "no_info",
        failureType: "NO_INFO",
      };

    // -----------------------------------------------------------------------
    // CONTENT GUARDRAILS
    // -----------------------------------------------------------------------
    case "GIBBERISH":
      return {
        answer:
          "I couldn't understand that question.\n\nPlease ask a clear question related to academic policies, student grievances, examinations, hostel services, or general university guidelines.",
        sources: [],
        agent: "general_faq",
        status: "out_of_scope",
        failureType: "OUT_OF_SCOPE",
      };

    case "OUT_OF_SCOPE":
      return {
        answer:
          "I'm designed to help with university-related information. I don't have a verified source for that question.\n\nTry asking about academic policies, student grievances, examinations, or student services.",
        sources: [],
        agent: "general_faq",
        status: "out_of_scope",
        failureType: "OUT_OF_SCOPE",
      };

    default:
      return {
        answer:
          "I could not locate verified official documentation regarding your query in the currently indexed knowledge base.\n\nFor authoritative guidance, please refer to your institution's academic portal or contact the relevant administrative office.",
        sources: [],
        agent: "general_faq",
        status: "no_info",
        failureType: "NO_INFO",
      };
  }
}

/* =========================================================================
   GUARDRAIL UTILITIES
   ========================================================================= */

function isGibberish(text) {
  const trimmed = (text || "").trim();
  if (trimmed.length < 2) return true;
  const mashPattern = /^[bcdfghjklmnpqrstvwxyz]{5,}$/i;
  const repetitivePattern = /(.)\1{4,}/;
  const noVowelsLong = trimmed.length > 5 && !/[aeiouy]/i.test(trimmed);
  const onlySymbols = /^[^a-zA-Z0-9\s]+$/.test(trimmed);
  return mashPattern.test(trimmed) || repetitivePattern.test(trimmed) || noVowelsLong || onlySymbols;
}

function isOutOfScope(text) {
  const outOfScopeTerms = [
    "weather",
    "temperature",
    "rain",
    "prime minister",
    "president",
    "capital of",
    "recipe",
    "pasta",
    "pizza",
    "cook",
    "stock price",
    "bitcoin",
    "crypto",
    "movie",
    "cricket",
    "football",
    "joke",
    "song lyrics",
    "write code",
    "python script",
  ];
  return outOfScopeTerms.some((term) => text.includes(term));
}
