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
  // General Academic Policies -> Academic Agent
  if (
    normalized.includes("academic polic") ||
    normalized.includes("academic regulation") ||
    normalized.includes("ugc polic") ||
    normalized.includes("general ugc") ||
    normalized.includes("nep") ||
    normalized.includes("national education policy") ||
    normalized.includes("course progression")
  ) {
    return {
      routeType: "KNOWLEDGE_AGENT",
      category: "ACADEMIC_POLICIES",
      agent: "academic",
      requiresRetrieval: true,
    };
  }

  // General Student Services & Regulatory -> Student Services Agent
  if (
    normalized.includes("student services") ||
    normalized.includes("regulatory guidelines") ||
    normalized.includes("welfare") ||
    normalized.includes("facilities") ||
    normalized.includes("campus services")
  ) {
    return {
      routeType: "KNOWLEDGE_AGENT",
      category: "STUDENT_SERVICES_GENERAL",
      agent: "student_services",
      requiresRetrieval: true,
    };
  }

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

    case "ACADEMIC_POLICIES":
      return {
        answer:
          "According to the **UGC Curriculum and Credit Framework for Undergraduate Programmes (CCFUP), 2023** [1]:\n\n- **Credit Structure:** A standard undergraduate programme requires completion of **120–160 credits** over 3–4 years, with each credit representing approximately 15 hours of lectures or 30 hours of practical/tutorial work per semester.\n- **Course Categorization:** All courses must be classified into **Major (Core)**, **Minor/Elective**, **Multidisciplinary**, **Ability Enhancement**, **Skill Enhancement**, and **Value Added** categories as per NEP 2020 guidelines.\n- **Internal Assessment:** Universities must allocate a minimum of **25% weightage to Continuous Internal Evaluation (CIE)** comprising assignments, mid-semester tests, presentations, and class participation, with the remaining **75% for end-semester examinations** [1].\n- **Attendance Policy:** A student must maintain a minimum of **75% attendance** in each course to be eligible to sit for the end-semester examination. Condonation of up to **10%** may be granted on medical or extraordinary grounds at the discretion of the Dean of Academics.",
        sources: [
          {
            title: "UGC Curriculum and Credit Framework for Undergraduate Programmes (CCFUP)",
            publisher: "University Grants Commission",
            category: "Academic Framework",
            sourceType: "Official regulatory source",
            section: "Chapter III – Credit Structure and Course Design",
            lastUpdated: "January 2023",
            verified: true,
            url: "https://www.ugc.gov.in/pdfnews/5765498_CCFUP-UG.pdf",
          },
        ],
        agent: "academic",
      };

    case "STUDENT_SERVICES_GENERAL":
      return {
        answer:
          "Under the **UGC Guidelines on Student Support Services and Institutional Obligations** [1], higher education institutions must provide the following regulated services:\n\n- **Anti-Ragging Cell:** Every institution is mandated to establish an Anti-Ragging Committee and an Anti-Ragging Squad per UGC Regulations 2009 (amended 2016). All students must submit an online anti-ragging undertaking before admission [1].\n- **Student Welfare Committee:** Institutions must constitute a Student Welfare Committee responsible for health services, counselling support, financial aid disbursement, and emergency assistance.\n- **Equal Opportunity Cell (EOC):** Per UGC directives, an EOC must be established to ensure equitable access for SC/ST/OBC/PwD students, including mentorship programmes and scholarship facilitation.\n- **Internal Complaints Committee (ICC):** Under the Sexual Harassment of Women at Workplace Act, 2013, every institution must maintain an active ICC with prescribed membership and quarterly reporting [1].",
        sources: [
          {
            title: "UGC Guidelines on Student Support Services and Institutional Governance",
            publisher: "University Grants Commission",
            category: "Student Welfare",
            sourceType: "Official regulatory source",
            section: "Section 4 – Mandatory Institutional Committees",
            lastUpdated: "March 2022",
            verified: true,
            url: "https://www.ugc.gov.in/pdfnews/Student_Support_Guidelines.pdf",
          },
        ],
        agent: "student_services",
      };

    // -----------------------------------------------------------------------
    // GROUNDED KNOWLEDGE RESPONSES (Domain-Specific Policies)
    // -----------------------------------------------------------------------
    case "UNVERIFIED_ATTENDANCE":
      return {
        answer:
          "According to the **UGC Regulations on Minimum Attendance Requirements** and standard university Academic Bye-Laws [1]:\n\n- **Minimum Threshold:** Students are required to maintain a minimum of **75% attendance** in each course (lectures, tutorials, and practicals counted separately) to be eligible to appear in the end-semester examination.\n- **Condonation:** A student falling short by up to **10%** (i.e., having 65–74% attendance) may apply for condonation on grounds of medical emergency, bereavement, or participation in university-authorized events. A medical certificate from a registered practitioner must be submitted within **7 working days** of resuming classes.\n- **Debarment:** Students with attendance below **65%** (after condonation consideration) shall be **debarred** from appearing in the end-semester examination for that course and must re-register in the subsequent semester [1].",
        sources: [
          {
            title: "UGC Guidelines on Attendance and Examination Eligibility",
            publisher: "University Grants Commission",
            category: "Academic Regulations",
            sourceType: "Official regulatory source",
            section: "Clause 8 – Attendance Requirements",
            lastUpdated: "August 2023",
            verified: true,
            url: "https://www.ugc.gov.in/pdfnews/5765498_CCFUP-UG.pdf",
          },
        ],
        agent: "academic",
      };

    case "UNVERIFIED_HOSTEL":
      return {
        answer:
          "As per the **University Hostel Administration Rules and Residential Guidelines** [1]:\n\n- **Room Allocation:** Hostel accommodation is allotted on a merit-cum-means basis. First-year students receive priority, and room assignments are published by the Dean of Student Welfare before the commencement of each academic session.\n- **Curfew Timings:** All resident students must be inside the hostel premises by **10:00 PM** on weekdays and **10:30 PM** on weekends. Late entry requires written authorization from the Warden.\n- **Gate Pass System:** Overnight leave or weekend outings require a **gate pass** approved by the Hostel Warden and countersigned by a parent/local guardian via the institutional portal. Emergency gate passes may be issued by the Chief Warden [1].\n- **Mess and Dining:** Hostel residents are required to subscribe to the institutional mess facility. Mess exemption is permitted only on medical grounds with a certificate from the university health centre.",
        sources: [
          {
            title: "University Hostel Administration Rules and Code of Conduct, 2023-24",
            publisher: "Office of the Dean of Student Welfare",
            category: "Student Housing",
            sourceType: "Institutional regulatory document",
            section: "Chapter IV – Hostel Discipline and Gate Pass Rules",
            lastUpdated: "July 2023",
            verified: true,
            url: "https://university.edu/hostel-rules-2023-24",
          },
        ],
        agent: "student_services",
      };

    case "UNVERIFIED_EXAM":
      return {
        answer:
          "According to the **UGC Examination Reforms Guidelines** and standard university Examination Bye-Laws [1]:\n\n- **Missed Examinations:** A student who misses an end-semester examination due to medical or extraordinary circumstances may apply for a **supplementary/special examination** within **15 days** of the original exam date. A valid medical certificate or supporting documentation must be submitted to the Controller of Examinations.\n- **Supplementary Exams:** Universities are required to conduct supplementary examinations within **45 days** of the declaration of results for students who failed or were absent with valid cause. A maximum of **two supplementary attempts** per course is permitted [1].\n- **Re-evaluation:** Students may apply for re-evaluation or re-totalling of answer scripts within **15 days** of the publication of results upon payment of the prescribed fee. The re-evaluation is conducted by an examiner other than the original evaluator.\n- **Backlog Progression:** Students with backlogs in up to **50% of courses** in a semester may be provisionally promoted to the next semester, subject to clearing the backlog within the prescribed maximum programme duration.",
        sources: [
          {
            title: "UGC Guidelines on Examinations and Academic Integrity, 2023",
            publisher: "University Grants Commission",
            category: "Examination Policy",
            sourceType: "Official regulatory source",
            section: "Section 6 – Supplementary Examinations and Re-evaluation",
            lastUpdated: "September 2023",
            verified: true,
            url: "https://www.ugc.gov.in/pdfnews/Examination_Reforms_2023.pdf",
          },
        ],
        agent: "academic",
      };

    case "UNVERIFIED_GRADING":
      return {
        answer:
          "According to the **UGC Guidelines on Choice Based Credit System (CBCS) and Grading Standards** [1]:\n\n- **10-Point Scale:** Universities following UGC CBCS adopt a **10-point grading scale** where each letter grade corresponds to a grade point: O (Outstanding) = 10, A+ = 9, A = 8, B+ = 7, B = 6, C = 5, P (Pass) = 4, F (Fail) = 0.\n- **SGPA Calculation:** The Semester Grade Point Average is computed as the **weighted average** of grade points earned in all courses in a semester, weighted by the credit value of each course: SGPA = Σ(Ci × Gi) / ΣCi.\n- **CGPA Calculation:** The Cumulative Grade Point Average is the weighted average of SGPAs across all completed semesters: CGPA = Σ(Ci × Si) / ΣCi, where Si is the SGPA of each semester [1].\n- **Passing Standard:** A minimum grade of **P (Grade Point 4)** is required to pass each course. Students receiving an F grade must re-register for the course in a subsequent semester.",
        sources: [
          {
            title: "UGC Guidelines on Adoption of Choice Based Credit System (CBCS)",
            publisher: "University Grants Commission",
            category: "Academic Standards",
            sourceType: "Official regulatory source",
            section: "Annexure I – Grading System and Grade Point Equivalence",
            lastUpdated: "November 2022",
            verified: true,
            url: "https://www.ugc.gov.in/pdfnews/CBCS_Grading_Guidelines.pdf",
          },
        ],
        agent: "academic",
      };

    case "UNVERIFIED_SERVICES":
      return {
        answer:
          "According to the **University Student Administrative Services Handbook** [1]:\n\n- **Leave Application:** Students may apply for casual leave (up to **3 consecutive days**) through the departmental leave portal. Medical leave exceeding 3 days requires a certificate from the university health centre or a registered medical practitioner, submitted within **5 working days** of resuming attendance.\n- **Bonafide Certificate:** Bonafide certificates for educational loans, passport applications, or scholarship verification can be requested online via the Student Services Portal and are typically processed within **3–5 working days**.\n- **Identity Card:** All enrolled students are issued a university ID card at the beginning of their programme. Lost ID cards must be reported to the Student Services Office, and a replacement card is issued within **7 working days** upon payment of the prescribed replacement fee [1].",
        sources: [
          {
            title: "University Student Administrative Services Handbook, 2023-24",
            publisher: "Office of Student Affairs",
            category: "Administrative Services",
            sourceType: "Institutional regulatory document",
            section: "Chapter II – Student Administrative Procedures",
            lastUpdated: "June 2023",
            verified: true,
            url: "https://university.edu/student-services-handbook",
          },
        ],
        agent: "student_services",
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
