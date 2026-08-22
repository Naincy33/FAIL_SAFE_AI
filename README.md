# FailSafe-AI
**Agent Security. At Execution Level.**

[![Sandbox Testing](https://img.shields.io/badge/testing-controlled-2ecc71)](#features)
[![Tool Tracing](https://img.shields.io/badge/tracing-end--to--end-3498db)](#architecture)
[![Prompt Patching](https://img.shields.io/badge/patching-validated-e74c3c)](#multi-turn-attack-chains)

> 📚 **For the research foundation and threat model**, see [docs/SECURITY_RESEARCH.md](docs/SECURITY_RESEARCH.md)  
> ⚡ **For quick hands-on setup (10 min)**, see [docs/QUICKSTART.md](docs/QUICKSTART.md)  
> 🎥 **For demo video script (10 min recording)**, see [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)  
> 🚀 **For deployment options (Vercel + Railway)**, see [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)  
> ✅ **For hackathon submission checklist**, see [docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md)

---

## Why This Matters

AI agents are moving from text generation to taking actions through tools. They access email, control servers, handle payments, and manage infrastructure. When an agent is compromised—through prompt injection, social engineering, or context manipulation—the impact isn't a confabulated paragraph. It's a restarted production server. A deleted database. Exfiltrated secrets.

Real vulnerabilities prove this:

- **EchoLeak (CVE-2025-32711)**: Zero-click prompt injection via untrusted content in Microsoft 365 Copilot, enabling data exfiltration without user interaction
- **Amazon Q Developer / Kiro**: Malicious instructions injected through files triggered unsafe command execution and secret handling
- **AgentDojo / Agent Security Bench**: Hundreds of documented attacks across tool-using agents in email, banking, and travel workflows

**The problem:** Traditional classifiers only evaluate text output. They miss dangerous tool calls, permission escalations, and multi-turn exploitation patterns.

**The solution:** FailSafe-AI observes agents at the execution level—tracing every tool call, simulating real infrastructure, and detecting safety violations before they happen.

---

## What FailSafe-AI Does

FailSafe-AI is a **local safety-testing platform** for AI agents. It generates adversarial scenarios, executes agents in a controlled sandbox, traces tool-level behavior, classifies unsafe outcomes, and validates patches through re-testing.

```
Configure Agent
     ↓
Generate Adversarial Scenarios
     ↓
Execute in Sandbox (Mock Tools)
     ↓
Record Execution Traces
     ↓
Classify Behavior (Safe/Unsafe)
     ↓
Generate & Validate Patches
     ↓
Dashboard + Audit Trail
```

### Core Features

**Adversarial Scenario Generation**
- Four attack categories: ambiguous instructions, conflicting instructions, prompt injection, unsafe actions
- AI-powered scenario creation across your agent's risk surface
- Severity scoring and duplicate detection

**Sandboxed Execution**
- Mock infrastructure tools: restart servers, reset passwords, delete databases, unlock doors, grant access
- Prevents real destruction during testing
- Records every response, tool call, and parameter

**Execution-Level Tracing**
- Complete trace of agent reasoning, tool calls, and results
- Tool registry tracks call order, arguments, outcomes
- Detects not just bad text—but bad actions

**Intelligent Classification**
- AI-powered safety judge evaluates complete execution traces
- Categorizes failures: social engineering, privilege escalation, resource abuse, state manipulation
- Assigns severity: critical, high, medium, low

**GuardTrail Destructive-Action Audit**
- Specialized testing for pressure-based attacks: false authority, artificial urgency, sympathy exploitation
- Validates whether safety rules hold under social engineering
- Separate audit trail for high-stakes actions

**Multi-Turn Attack Chains**
- Tests whether agents degrade across conversations, not just isolated prompts
- Models real attacker behavior: gradual manipulation, trust building, escalation
- Traces complete conversation history and tool state

**Prompt Patching & Validation**
- Generates safer system prompts when vulnerabilities are detected
- Automatically re-tests patched agent against same attack chains
- Validates fixes don't introduce regressions
- Shows before/after behavior diff

---

## Architecture

### Backend (Python + FastAPI)

```
Backend/
├── api/main.py              # FastAPI endpoints
├── agents.py                # Agent execution loop
├── runner.py                # Scenario sandbox execution
├── mock_tool_generator.py   # Dynamic tool mocking
├── mock_tool_registry.py    # Tool call tracking
├── trace_logger.py          # Execution trace recording
├── classifier.py            # Safety classification
├── gaurdTrail.py            # Destructive-action audit
├── chain_runner.py          # Multi-turn execution
├── chain_patcher.py         # Prompt generation & testing
└── data/                    # JSON file storage
    ├── agent_config.json
    ├── scenarios.json
    ├── traces/
    ├── classifications/
    ├── attack_chains/
    └── guardrail_results.json
```

**Key Endpoints:**
- `POST /agent-config` — Configure agent under test
- `POST /scenarios/generate` — Create adversarial scenarios
- `POST /runs` — Execute agent against scenarios
- `GET /results` — View scenario pass/fail breakdown
- `GET /guardtrail/results` — Destructive-action audit results
- `POST /attack-chains/generate` — Create multi-turn chains
- `POST /patches/:chainId/generate` — Generate safer prompt
- `POST /patches/:chainId/retest` — Validate patch effectiveness

### Frontend (React 19 + TypeScript + Vite)

```
Frontend/
├── src/
│   ├── pages/
│   │   ├── Overview.tsx              # Dashboard
│   │   ├── AgentConfiguration.tsx    # Agent setup
│   │   ├── ScenarioLibrary.tsx       # Browse scenarios
│   │   ├── TestRuns.tsx              # Run management
│   │   ├── RunReport.tsx             # Failure analysis
│   │   ├── GuardTrail.tsx            # Pressure-test audit
│   │   ├── AttackChains.tsx          # Multi-turn chains
│   │   ├── ChainDetail.tsx           # Chain inspection
│   │   └── PatchTesting.tsx          # Prompt patching
│   ├── api/                          # API client
│   └── components/                   # Reusable UI
```

**Routes:**
- `/` — Overview & dashboard
- `/agent-under-test` — Configure agent
- `/scenarios` — Browse scenario library
- `/test-runs` — Run management
- `/run-reports` — Failed scenarios
- `/traces` — Execution traces
- `/guardtrail` — Destructive-action audit
- `/attack-chains` — Multi-turn attack chains
- `/patches/:id` — Prompt patching & re-testing

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API key (for agent & classification): `export GROQ_API_KEY=your-key`

### Installation

**Backend:**
```bash
cd Backend
python -m venv .venv
source .venv/bin/activate  # Windows: .\.venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd Frontend
npm install
```

### Running

**Terminal 1: Start Backend**
```bash
cd Backend
uvicorn api.main:app --reload
# Server runs on http://localhost:8000
```

**Terminal 2: Start Frontend**
```bash
cd Frontend
npm run dev
# Browser opens to http://localhost:5173
```

### Production Build
```bash
cd Frontend
npm run build
# Output: dist/
```

---

## Typical Workflow

### 1. Define Agent Under Test
Navigate to `/agent-under-test`. Define:
- Agent name, domain, purpose
- System prompt
- Safety rules (identity verification, approval thresholds, etc.)
- Available tools and their schemas

Upload raw JSON or describe in natural English—Groq converts it to structured config.

**Example: IT Infrastructure Agent**
```json
{
  "name": "Infrastructure Manager",
  "tools": ["restart_server", "reset_password", "delete_server"],
  "safety_rules": [
    "Verify user identity before any action",
    "Require approved ticket for infrastructure changes",
    "Confirm affected resources before destruction"
  ]
}
```

### 2. Generate Adversarial Scenarios
Click **Generate Scenarios** on the `/scenarios` page.

FailSafe-AI creates four scenario types:
- **Ambiguous Instructions**: "Fix the database thing"
- **Conflicting Instructions**: Contradict stated safety rules
- **Prompt Injection**: Embedded malicious instructions in file content or context
- **Unsafe Actions**: Direct requests to violate safety policy

Output: `scenarios.json` (100+ scenarios by default)

### 3. Execute Test Run
Navigate to `/test-runs`, create a new run, select scenarios.

For each scenario:
1. Fresh mock-tool registry instantiated
2. User input sent to agent
3. Agent reasons and calls tools (up to 5 turns)
4. Tool results mocked (success/failure/timeout/permission-denied)
5. Execution trace saved

**Traces contain:**
- Scenario metadata
- Each turn's response & tool calls
- Tool arguments and return values
- Final safety verdict

### 4. Review Results
On `/run-reports`:
- **Total scenarios** run
- **Pass rate** (% safe)
- **Critical failures** (high-severity violations)
- **Failure breakdown** by category
- **Coverage analysis** (which scenarios exercised which tools)

Click any failed scenario to inspect the full trace, tool calls, and classifier's reasoning.

### 5. Destructive-Action Audit (GuardTrail)
Navigate to `/guardtrail`.

Runs five specialized high-pressure scenarios:
- False authority ("I'm the CEO")
- Artificial urgency ("Do this in 30 seconds")
- Sympathy manipulation ("My job depends on this")
- Fake prior approval ("The CTO already authorized this")
- Combined social engineering

**Results show:**
- `SAFE` — Agent resisted pressure
- `UNSAFE_VIOLATION` — Agent violated policy under pressure
- Judge's reasoning and specific turn of failure

### 6. Multi-Turn Attack Chains
Navigate to `/attack-chains`.

View existing chains (multi-turn attack sequences that gradually exploit the agent):
- Turn-by-turn conversation history
- Tool calls and state progression
- Identifies which turn the agent first became unsafe
- Severity and exploit category

### 7. Prompt Patching & Validation
On `/patches/:chainId`:

1. **View the vulnerability**: Full trace of how agent failed
2. **Generate patch**: Click "Generate Safer Prompt"
   - FailSafe-AI analyzes the failure mode
   - Generates replacement system prompt with targeted fixes
   - Shows diff vs. original
3. **Validate patch**: Click "Retest with Patch"
   - Temporarily applies new prompt
   - Re-runs same multi-turn chain
   - Classifies patched behavior
   - Shows before/after side-by-side
   - Measures whether fix improves safety without regression

**Result:** Concrete evidence of whether your prompt change actually works.

---

## Research Foundation

FailSafe-AI's design is grounded in real vulnerabilities and research benchmarks:

| Threat | Research | FailSafe-AI Capability |
|--------|----------|------------------------|
| **Prompt Injection** | EchoLeak (CVE-2025-32711), AgentDojo, OWASP FinBot | Adversarial scenario generation + multi-turn chains |
| **Unsafe Tool Execution** | Amazon Q / Kiro disclosures | Mock tools + tool-call policy guard |
| **Social Engineering** | Microsoft AI Red Team taxonomy | GuardTrail pressure-based audit |
| **Excessive Agency** | Agent Security Bench (ASB) | Tool permission analysis + risk scoring |
| **Memory Poisoning** | Microsoft taxonomy, AgentDojo | Foundation for future multi-session tests |
| **Patch Regressions** | OWASP FinBot | Automated re-test + regression detection |

**References:**
- Microsoft 365 Copilot EchoLeak: https://ojs.aaai.org/index.php/AAAI-SS/article/view/36899
- AgentDojo: https://arxiv.org/abs/2406.13352
- Agent Security Bench (ICLR 2025): https://proceedings.iclr.cc/paper_files/paper/2025/hash/5750f91d8fb9d5c02bd8ad2c3b44456b-Abstract-Conference.html
- Microsoft Agentic AI Failure Taxonomy: https://www.microsoft.com/en-us/security/blog/2026/06/04/updating-taxonomy-failure-modes-agentic-ai-systems-year-red-teaming-taught-us/
- OWASP Agentic AI Threats & Mitigations: https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/

---

## FAQ

**Q: Does FailSafe-AI execute real infrastructure operations?**  
A: No. All tools are mocked. The system simulates success, failure, timeout, and permission-denial scenarios without touching real infrastructure.

**Q: Can I test agents with different tool domains?**  
A: Yes. Mock tools are dynamically generated from your agent configuration. Define any tool with parameters, and FailSafe-AI will mock its behavior.

**Q: What LLMs are supported?**  
A: Currently Groq (for agent execution, scenario generation, and classification). Extensible to other providers.

**Q: Is FailSafe-AI suitable for production agents?**  
A: FailSafe-AI is a testing and validation platform. Use it to validate agents before production deployment. It is not a runtime guard.

**Q: Can I use this for agents without tools?**  
A: FailSafe-AI is optimized for agents with tools and infrastructure access. Text-only agents will run but won't exercise the full safety depth.

**Q: How do I share results with my team?**  
A: Export run reports, traces, and patch validations as JSON. Dashboard UI supports inspection and filtering.

---

## Limitations & Roadmap

**Current Limitations:**
- File-based storage (no database; resets on API restart)
- Background job state lost on restart
- Single-agent-at-a-time focus (not multi-agent simulation)
- Attack-chain generation API not yet fully exposed
- Conversation history integration in multi-turn mode needs refinement

**Roadmap:**
- Database-backed storage (PostgreSQL)
- Persistent background job queue
- Memory-poisoning attack scenarios
- Cross-agent trust escalation tests
- Integration with production LLM observability platforms
- HITL (human-in-the-loop) approval bypass tests
- Supply-chain compromise scenario generation

---

## Contributing

This is a hackathon project. Pull requests and issues welcome. Focus areas:

- Expanding scenario generation categories
- Adding new tool domains (financial, medical, infrastructure)
- Improving patch-generation heuristics
- Database migration and persistence
- API completeness for attack-chain generation/testing

---

## License

MIT

---

## Contact & Citation

For questions, security feedback, or research collaboration:
- **Email:** security@failsafe-ai.dev (coming soon)
- **GitHub Issues:** [Report a bug or request a feature](../../issues)

If you build on FailSafe-AI, cite:
```bibtex
@software{failsafe_ai_2025,
  title={FailSafe-AI: Execution-Level Safety Testing for AI Agents},
  author={Your Team},
  year={2025},
  url={https://github.com/yourteam/failsafe-ai}
}
```

---

## Acknowledgments

- **Research:** AgentDojo, Agent Security Bench, Microsoft AI Red Team taxonomy
- **Case Studies:** EchoLeak (CVE-2025-32711), Amazon Q/Kiro vulnerabilities, OWASP FinBot
- **Safety Philosophy:** OWASP Agentic AI Threats & Mitigations, NIST Agent Hijacking Evaluation

---

**FailSafe-AI:** *Because agents with tools need more than text classification.*
