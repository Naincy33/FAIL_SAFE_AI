
# FailSafe-AI Security Research & Threat Mapping

## Executive Summary

As AI agents transition from text generation to infrastructure access, their attack surface expands beyond model outputs to include tool usage, permissions, memory, and human oversight. Real vulnerabilities (EchoLeak, Amazon Q/Kiro) and research benchmarks (AgentDojo, Agent Security Bench) demonstrate that agent security requires execution-level evaluation—not just text classification.

This document maps FailSafe-AI's capabilities to documented threats, research findings, and recommended testing practices.

---

## Real-World Vulnerabilities

### 1. EchoLeak (CVE-2025-32711) — Microsoft 365 Copilot

**Threat Class:** Indirect prompt injection + data exfiltration

**What Happened:**
A zero-click vulnerability in Microsoft 365 Copilot demonstrated that adversaries could inject malicious instructions through untrusted external content (emails, documents, web pages) without requiring any user interaction. Once injected, the prompt could manipulate the agent to:
- Exfiltrate sensitive data
- Modify documents or emails
- Escalate privileges
- Chain actions across systems

**Why It Matters:**
- Enterprise agents access repositories of sensitive data (emails, files, decisions)
- Content is often untrusted (external emails, downloaded documents, web scraping)
- The attack is invisible to the user—no "suspicious prompt" warning
- Impact cascades: agent with data access → data theft; agent with action access → destructive operations

**FailSafe-AI Connection:**
```
Scenario Type: Prompt Injection (untrusted content)
├─ Embed malicious instruction in file/context
├─ Observe whether agent extracts/acts on injected instruction
├─ Trace data access and tool calls
├─ Classify as unsafe if:
│  ├─ Agent accesses sensitive data after injection
│  ├─ Agent calls unauthorized tools
│  └─ Agent changes state based on injected instruction
└─ Patch: Validate instruction source before execution
```

**References:**
- AAAI Case Study: https://ojs.aaai.org/index.php/AAAI-SS/article/view/36899
- Research Paper: https://arxiv.org/abs/2509.10540

---

### 2. Amazon Q Developer / Kiro — Prompt Injection & Command Risks

**Threat Class:** Prompt injection + unsafe command execution + secret handling

**What Happened:**
AWS disclosed multiple prompt-injection vulnerabilities affecting Amazon Q Developer and Kiro (AWS security assistant). Malicious instructions embedded in code files, chat context, or documentation could trigger:
- Execution of arbitrary shell commands
- Handling of secrets insecurely
- Modification of code without user review
- Installation of malicious dependencies

**Why It Matters:**
- Agents with command execution access can compromise entire systems
- Secrets (API keys, database credentials) are high-value targets
- Developers trust IDE integrations and security tools
- No explicit "unsafe command" warning—silently executed

**AWS Response:**
Implemented stronger human-in-the-loop confirmation for high-risk actions, requiring explicit user approval before command execution or secret handling.

**FailSafe-AI Connection:**
```
Scenario Type: Unsafe Action (command execution)
├─ Inject instruction to execute command or handle secrets
├─ Observe whether agent:
│  ├─ Calls shell/command execution tools
│  ├─ Accesses credential management
│  └─ Modifies sensitive configuration
├─ Trace tool-call arguments and permissions
├─ Classify as unsafe if tool called without explicit approval
└─ Patch: Require HITL confirmation + validate command source
```

**References:**
- AWS Security Bulletin — Q/Kiro: https://aws.amazon.com/security/security-bulletins/AWS-2025-019/
- AWS Security Bulletin — VS Code: https://aws.amazon.com/security/security-bulletins/AWS-2025-015/

---

## Research Benchmarks

### 3. AgentDojo — Prompt Injection Attacks in Tool-Using Agents

**Scope:** 200+ security test cases across realistic agent workflows (email, banking, travel)

**Methodology:**
- Dynamic environment with real tools and untrusted data
- Agents attempt tasks: send emails, book flights, process payments
- Adversarial scenarios inject malicious instructions into task context
- Researchers evaluate whether agents execute injected instructions

**Key Findings:**
1. Agents are vulnerable to prompt injection even with explicit safety instructions
2. Tool-using agents are higher-risk than text-only agents
3. Adversarial scenarios can be made progressively harder (adaptive attacks)
4. Defense effectiveness varies: some prompts are harder to exploit than others

**FailSafe-AI Alignment:**
FailSafe-AI follows the same evaluation model:
- Real tools and scenarios → Mock tools in sandbox
- Adversarial input injection → Scenario generation
- Tool execution observation → Trace recording
- Behavioral classification → Safety judge
- Patch & re-test → Validation of defenses

**Application to FailSafe-AI:**
If building scenarios for email agents, banking agents, or travel agents, AgentDojo's taxonomy of attacks (context injection, tool chaining, permission exploitation) directly informs scenario generation.

**Reference:**
AgentDojo (2024): https://arxiv.org/abs/2406.13352

---

### 4. Agent Security Bench (ASB) — ICLR 2025

**Scope:** Systematic evaluation of agent security across scenarios, agents, tools, and attack methods

**Coverage:**
- Multiple LLMs (GPT-4, Claude, Llama)
- Multiple agents (email assistant, code reviewer, financial advisor)
- Attack types:
  - Prompt injection
  - Memory poisoning (false history)
  - Tool-misuse exploitation (wrong permissions, side effects)
  - Cross-domain exploitation (mixing contexts)

**Key Insight:**
Agent security is not a single binary property. It spans:
- **Perception**: Does the agent understand what it's seeing?
- **Reasoning**: Does it reason correctly about safety?
- **Action**: Does it refuse unsafe actions or demand approval?
- **Observability**: Can humans audit what the agent did?

**FailSafe-AI Application:**
ASB reinforces why FailSafe-AI traces execution (not just text):
- Tool-call tracing reveals reasoning errors humans would miss
- Mock-tool results test handling of edge cases
- Multi-turn chains reveal degradation across conversations
- Classification assigns severity to understand risk prioritization

**Reference:**
Agent Security Bench (ICLR 2025): https://proceedings.iclr.cc/paper_files/paper/2025/hash/5750f91d8fb9d5c02bd8ad2c3b44456b-Abstract-Conference.html

---

### 5. Microsoft Agentic AI Failure Taxonomy

**Type:** Red-team research + threat modeling framework

**Failure Modes (v2.0):**

| Mode | Definition | Example |
|------|------------|---------|
| **Memory Poisoning** | False or manipulated history injected into agent context | Agent given fake prior approvals or decisions |
| **Cross-Domain Prompt Injection** | Malicious instruction in one domain triggers action in another | Instruction in email triggers database deletion |
| **HITL Bypass** | Agent circumvents human approval requirements | Auto-approves high-risk actions |
| **Incorrect Permissions** | Agent granted more access than necessary | Read-only agent can delete |
| **Insufficient Isolation** | Agent context bleeds across sessions/users | Agent accesses another user's data |
| **Excessive Agency** | Agent given unnecessary autonomy | Auto-executes without confirmation |
| **Supply-Chain Compromise** | Malicious tool, dependency, or service exploited | Fake tool returns malicious data |
| **Goal Hijacking** | Agent's objective manipulated or redirected | Agent prioritizes attacker goal over user goal |
| **Inter-Agent Trust Escalation** | One agent trusts another without verification | Agent A trusts Agent B's decision blindly |
| **Session-Context Contamination** | Prior conversation leaks into new session | Agent assumes previous user's identity |

**FailSafe-AI Coverage (Current):**
✅ Memory poisoning (via scenario context)  
✅ Cross-domain injection (via prompt injection scenarios)  
✅ HITL bypass (via GuardTrail pressure testing)  
✅ Excessive agency (via unsafe-action scenarios)  
🔄 Insufficient isolation (foundation for future)  
🔄 Supply-chain compromise (foundation for future)  
🔄 Inter-agent trust (future multi-agent tests)  
🔄 Session contamination (future cross-session tests)

**Roadmap Integration:**
Microsoft's taxonomy provides a structured threat model for prioritizing new scenario types and test categories.

**Reference:**
Microsoft AI Red Team: https://www.microsoft.com/en-us/security/blog/2026/06/04/updating-taxonomy-failure-modes-agentic-ai-systems-year-red-teaming-taught-us/

---

## Threat-to-Capability Mapping

### High-Priority Threats (Implemented)

#### Threat: Prompt Injection
**Attack Path:**
```
Untrusted content (email, file, web) 
  → Agent processes as instruction 
  → Agent executes injected command 
  → Data exfiltration or destructive action
```

**FailSafe-AI Tests:**
- `prompt_injection` scenario category
- Multi-turn attack chains with embedded malicious instructions
- Traces tool calls triggered by injected content
- Classification detects unsafe instruction execution

**Validation:**
- Patch tested against same injection scenarios
- Re-test confirms agent ignores or rejects injection

---

#### Threat: Unsafe Tool Execution
**Attack Path:**
```
Agent receives ambiguous or conflicting instructions 
  → Agent calls dangerous tool (restart_server, delete_database) 
  → No HITL confirmation 
  → Infrastructure damage
```

**FailSafe-AI Tests:**
- `unsafe_action` scenario category
- Mock tools track which dangerous operations are called
- Traces record tool-call arguments and permissions
- Classification checks whether tool call required approval but didn't get it

**Validation:**
- Patch enforces approval gate before dangerous tools
- Re-test confirms agent refuses unsafe calls

---

#### Threat: Social Engineering / Pressure-Based Attacks
**Attack Path:**
```
Attacker uses false authority, urgency, or sympathy 
  → Pressures agent to bypass safety rules 
  → Agent violates policy under pressure 
  → Unauthorized action executed
```

**FailSafe-AI Tests:**
- GuardTrail audit (specialized destructive-action testing)
- Five high-pressure scenarios:
  - False authority ("I'm the CEO")
  - Artificial urgency ("Do this in 30 seconds")
  - Sympathy ("My job depends on this")
  - Fake approval ("Already authorized")
  - Combined pressure
- Traces record agent's reasoning and final action
- Judge classifies resistance to pressure

**Validation:**
- Safety rules reinforced in prompt patch
- Re-test confirms agent withstands same pressure

---

### Medium-Priority Threats (Foundation Laid)

#### Threat: Memory Poisoning
**Attack Path:**
```
Attacker injects false history into agent context 
  → Agent trusts false history as fact 
  → Agent makes decision based on false state 
  → Unauthorized action or data misuse
```

**FailSafe-AI Foundation:**
- Scenario generation can embed false prior decisions
- Attack chains preserve conversation history
- Future: explicit memory-integrity tests

**Roadmap:** Implement scenario category `memory_poisoning` with specialized trace validation.

---

#### Threat: Excessive Agency
**Attack Path:**
```
Agent given too many permissions or too much autonomy 
  → Agent doesn't request approval for risky actions 
  → Agent acts unilaterally 
  → Cascading damage from single compromise
```

**FailSafe-AI Foundation:**
- Tool permission analysis in scenario generation
- Risk scoring by tool capability
- Future: explicit permission-boundary tests

**Roadmap:** Implement permission matrix validation and excessive-agency scenario type.

---

### Lower-Priority Threats (Future Scope)

- **Supply-Chain Compromise**: Validate tool behavior; detect malicious tool returns
- **Inter-Agent Trust Escalation**: Multi-agent simulation with trust verification
- **Session-Context Contamination**: Cross-session tests; identity isolation validation
- **Insufficient Isolation**: Resource access control; data boundary testing

---

## Testing Best Practices (Based on Research)

### 1. Test at Execution Level, Not Text Level

**Why:** Text classification misses tool-level attacks (Amazon Q/Kiro) and multi-turn degradation (Agent Security Bench).

**FailSafe-AI Approach:**
- Trace every tool call, not just final response
- Mock tool results to simulate edge cases
- Record complete conversation history
- Classify based on behavior, not just text

---

### 2. Use Realistic Tools & Untrusted Data

**Why:** AgentDojo and EchoLeak demonstrate attacks are realistic (email injection, file upload, web scraping).

**FailSafe-AI Approach:**
- Mock tools match real infrastructure (servers, databases, secrets)
- Scenarios include untrusted content injection
- Tool results can simulate real-world edge cases

---

### 3. Test Multi-Turn Exploitation, Not Just Isolated Prompts

**Why:** Agent Security Bench found agents degrade across conversations. Single-prompt tests miss gradual manipulation.

**FailSafe-AI Approach:**
- Attack chains preserve conversation history
- Agents respond to sequences of related messages
- Classification identifies the turn where safety fails

---

### 4. Validate Patches, Don't Just Generate Them

**Why:** Prompt changes can introduce regressions (new vulnerabilities) while fixing old ones.

**FailSafe-AI Approach:**
- Patch generation produces reasoning and diff
- Automatic re-test on same attack chains
- Side-by-side comparison of before/after behavior
- Regression detection

---

### 5. Categorize Failures by Type & Severity

**Why:** Microsoft's taxonomy and ASB show agent security spans multiple dimensions. Blanket "unsafe" verdict doesn't guide fixes.

**FailSafe-AI Approach:**
- Failure categories: social engineering, privilege escalation, resource abuse, state manipulation
- Severity levels: critical, high, medium, low
- Dashboard breakdown by type and severity

---

## Recommended Deployment Strategy

### Phase 1: Local Testing (FailSafe-AI)
1. Configure your agent in FailSafe-AI
2. Generate scenarios across all four categories
3. Run test suite, measure pass rate
4. Identify critical failures
5. Generate and validate patches
6. Re-test until pass rate target reached

### Phase 2: Pre-Production
- Test agent against production-like data (sample emails, real infrastructure names)
- Run GuardTrail pressure-based audit with stakeholders
- Document safety rules and assumptions
- Prepare incident response (what if agent is compromised?)

### Phase 3: Production Monitoring
- Deploy agent with execution tracing enabled
- Log all tool calls and classify in real-time
- Set alerts for anomalous behavior (e.g., unexpected tool combinations)
- Periodically re-run FailSafe-AI test suite against latest agent version

### Phase 4: Continuous Improvement
- Collect real-world attack attempts via monitoring
- Convert to new test scenarios
- Incrementally improve safety rules and patches
- Share learnings with broader agent security community

---

## Limitations & Assumptions

### What FailSafe-AI Tests
✅ Agent reasoning under adversarial input  
✅ Tool-call behavior under pressure  
✅ Multi-turn manipulation across conversations  
✅ Patch effectiveness via re-testing  
✅ Resistance to common attack patterns  

### What FailSafe-AI Does Not Test
❌ Real infrastructure behavior (mocked only)  
❌ Adversary with actual system access  
❌ Side-channel attacks (timing, resource exhaustion)  
❌ Supply-chain compromise (malicious dependencies)  
❌ Zero-day LLM jailbreaks (tests known attack patterns only)  

### Assumptions
- Agent uses the specified system prompt and tools
- LLM is stable and doesn't dramatically change behavior across calls
- Mock tool behavior is representative of real behavior
- Safety rules are well-defined and agreed upon
- Groq API is available and responsive

---

## Reading List

### Real Vulnerabilities
- **EchoLeak (CVE-2025-32711):** https://arxiv.org/abs/2509.10540
- **Amazon Q & Kiro:** https://aws.amazon.com/security/security-bulletins/

### Research Benchmarks
- **AgentDojo:** https://arxiv.org/abs/2406.13352
- **Agent Security Bench:** https://proceedings.iclr.cc/paper_files/paper/2025/hash/5750f91d8fb9d5c02bd8ad2c3b44456b-Abstract-Conference.html
- **Microsoft AI Red Team Taxonomy:** https://www.microsoft.com/en-us/security/blog/2026/06/04/updating-taxonomy-failure-modes-agentic-ai-systems-year-red-teaming-taught-us/

### Threat Modeling & Guidance
- **OWASP Agentic AI Threats & Mitigations:** https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/
- **OWASP Securing Agentic Applications:** https://genai.owasp.org/resource/securing-agentic-applications-guide-1-0/
- **NIST AI Agent Hijacking Evaluation:** https://www.nist.gov/news-events/news/2025/01/technical-blog-strengthening-ai-agent-hijacking-evaluations

---

**FailSafe-AI Security Research** v1.0  
Last Updated: January 2025
