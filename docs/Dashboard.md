# FailSafe-AI Dashboard

Visual documentation of the FailSafe-AI AI Agent Safety Testing Platform.

---

## 1. Overview Dashboard

The Overview dashboard provides a high-level view of the agent's current safety posture, including scenario coverage, failures, guardrail status, attack-chain results, and security signals.

**Image:** `../images/overview.jpeg`

![Overview Dashboard](../images/overview.jpeg)

---

## 2. Scenarios

The Scenarios module contains the test cases used to evaluate the AI agent against different safety and security conditions.

**Image:** `../images/Scenarios.jpeg`

![Scenarios](../images/Scenarios.jpeg)

---

## 3. Classified Scenarios

The Classified Scenarios module organizes test cases into different categories, making it easier to manage scenario coverage and analyze specific safety risks.

**Image:** `../images/ScenariosClassified.jpeg`

![Classified Scenarios](../images/ScenariosClassified.jpeg)

---

## 4. Test Runs

The Test Runs module displays individual executions of the safety testing pipeline and their resulting test status.

**Image:** `../images/TestRuns.jpeg`

![Test Runs](../images/TestRuns.jpeg)

---

## 5. Run Reports

Run Reports provide a detailed view of completed test executions, including test outcomes and identified failures.

**Image:** `../images/RunReport.jpeg`

![Run Reports](../images/RunReport.jpeg)

---

## 6. Safety / Guardrails

The Safety / Guardrails module evaluates the safety controls configured for the AI agent and provides visibility into compliance and violations.

**Image:** `../images/GuardRail.jpeg`

![Safety / Guardrails](../images/GuardRail.jpeg)

---

## 7. Attack Chains

The Attack Chains module performs multi-step adversarial testing to determine whether an AI agent can be manipulated into violating its safety constraints.

**Image:** `../images/AttackChains.jpeg`

![Attack Chains](../images/AttackChains.jpeg)

---

## 8. Multi-Turn Attack Testing

Multi-Turn Attack testing evaluates the agent across multiple interactions to identify vulnerabilities that may emerge through changing context or progressive instructions.

**Image:** `../images/MultiTurnAttack.jpeg`

![Multi-Turn Attack](../images/MultiTurnAttack.jpeg)

---

## 9. Traces

The Traces module provides visibility into the agent's execution flow during testing and helps investigate failures and agent behavior.

**Image:** `../images/Traces.jpeg`

![Traces](../images/Traces.jpeg)

---

## Testing Workflow

The FailSafe-AI platform brings these modules together into a unified testing workflow:

**Agent Configuration → Scenarios → Test Runs → Safety & Attack Testing → Traces → Run Reports → Security Overview**
