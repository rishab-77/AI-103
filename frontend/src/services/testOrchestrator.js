import { orchestrateQuery, askQuestion } from "./mockChatService.js";

const TEST_CASES = [
  "hi",
  "hello",
  "how are you",
  "thanks",
  "what can you do",
  "who are you",
  "How can a student raise a grievance?",
  "What is the Academic Bank of Credits?",
  "What is the university attendance requirement?",
  "What are the hostel curfew timings?",
  "What is the weather today?",
  "Tell me something",
];

async function runTests() {
  console.log("===============================================================================");
  console.log("AGENT ORCHESTRATOR ROUTING TEST SUITE");
  console.log("===============================================================================\n");

  for (const query of TEST_CASES) {
    const decision = orchestrateQuery(query);
    const response = await askQuestion(query);

    console.log(`QUERY: "${query}"`);
    console.log(`  ├─ Route Type:          ${decision.routeType}`);
    console.log(`  ├─ Category:            ${decision.category}`);
    console.log(`  ├─ Assigned Agent:      ${decision.agent}`);
    console.log(`  ├─ Requires RAG/Search: ${decision.requiresRetrieval}`);
    console.log(`  ├─ Citation Count:      ${response.sources.length}`);
    console.log(`  ├─ Response Snippet:    ${response.answer.split("\n")[0].substring(0, 80)}...`);
    console.log(`  └─ Status Code:         ${response.status || "conversational"}\n`);
  }
}

runTests().catch(console.error);
