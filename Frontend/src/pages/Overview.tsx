import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Bot, CheckCircle2, CircleAlert, FileBarChart, FlaskConical, GitBranch, PlayCircle, ShieldAlert, ShieldCheck, Sparkles, UserCog, XCircle } from 'lucide-react'
import { PageHeader, Button } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { EmptyState } from '../components/EmptyState'
import { CriticalFailureBanner } from '../components/CriticalFailureBanner'
import { StaleScenariosBanner } from '../components/StaleScenariosBanner'
import { AgentOnboarding } from '../components/AgentOnboarding'
import { getAgentConfig } from '../api/agent'
import { getResults } from '../api/results'
import { getScenariosStatus } from '../api/scenarios'
import { getAttackChains, getGuardrailResults } from '../api/safety'
import { startRun } from '../api/runs'
import { ApiError } from '../api/client'
import { useApi } from '../lib/useApi'
import { computeResultStats } from '../lib/aggregate'

export function Overview() {
    const navigate = useNavigate()
    const agentState = useApi(getAgentConfig, [])
    const resultsState = useApi(getResults, [])
    const statusState = useApi(getScenariosStatus, [])
    const guardrailState = useApi(getGuardrailResults, [])
    const attackChainState = useApi(getAttackChains, [])
    const [changingAgent, setChangingAgent] = useState(false)
    const [starting, setStarting] = useState(false)
    const [startError, setStartError] = useState<string | null>(null)

    const handleStartRun = async () => {
        setStarting(true)
        setStartError(null)
        try {
            const run = await startRun()
            navigate(`/test-runs/${run.id}`)
        } catch (error) {
            setStartError(error instanceof ApiError ? error.message : 'Could not start a run.')
        } finally {
            setStarting(false)
        }
    }

    if (agentState.status === 'loading') {
        return <LoadingState label="Loading agent posture…" />
    }

    const noAgentConfigured = agentState.status === 'error' && agentState.httpStatus === 404

    // No agent saved yet, or the user explicitly asked to change it: show only
    // the onboarding flow — never a dashboard with stale or fabricated data.
    if (noAgentConfigured || changingAgent) {
        return (
            <AgentOnboarding
                onAgentSaved={() => {
                    setChangingAgent(false)
                    agentState.reload()
                    resultsState.reload()
                    statusState.reload()
                    guardrailState.reload()
                    attackChainState.reload()
                }}
                onCancel={noAgentConfigured ? undefined : () => setChangingAgent(false)}
            />
        )
    }

    if (agentState.status === 'error') {
        return <ErrorState message={agentState.error} onRetry={agentState.reload} />
    }

    if (resultsState.status === 'loading') {
        return <LoadingState label="Loading agent posture…" />
    }

    if (resultsState.status === 'error') {
        return <ErrorState message={resultsState.error} onRetry={resultsState.reload} />
    }

    const agentConfig = agentState.data
    const results = resultsState.data
    const stats = computeResultStats(results)
    const guardrails = guardrailState.status === 'success' ? guardrailState.data : []
    const guardrailViolations = guardrails.filter((result) =>
        result.violation_detected || /unsafe|violation|fail/i.test(result.safety_status || result.classification || ''),
    )
    const criticalViolations = guardrailViolations.filter((result) => result.severity?.toLowerCase() === 'critical').length
    const chains = attackChainState.status === 'success' ? attackChainState.data : []
    const testedChains = chains.filter((chain) => Boolean(chain.classification))
    const failedChains = testedChains.filter((chain) => /unsafe|fail|violation/i.test(chain.classification || '')).length
    const successfulAttacks = testedChains.filter((chain) => /unsafe|attack|success/i.test(chain.classification || '')).length
    const attackSuccessRate = testedChains.length > 0 ? Math.round((successfulAttacks / testedChains.length) * 100) : null

    return (
        <div>
            <PageHeader
                title="Overview"
                subtitle="Safety posture of the current Agent Under Test"
                actions={
                    <Button variant="primary" onClick={() => setChangingAgent(true)}>
                        <UserCog size={15} /> Change Agent
                    </Button>
                }
            />
            <div className="space-y-6 p-6">
                {startError && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                        {startError}
                    </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Agent Under Test" value={agentConfig.agent_name} icon={<Bot size={13} />} />
                    <StatCard label="Scenario Library" value={stats.total} icon={<FlaskConical size={13} />} />
                    <StatCard
                        label="Failures"
                        value={stats.failed}
                        valueClassName={stats.failed > 0 ? 'text-red-600 dark:text-red-400' : undefined}
                        icon={<XCircle size={13} />}
                    />
                    <StatCard
                        label="Critical Failures"
                        value={stats.criticalFailures}
                        valueClassName={stats.criticalFailures > 0 ? 'text-red-600 dark:text-red-400' : undefined}
                        icon={<ShieldAlert size={13} />}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <SecuritySummaryCard
                        title="Safety / Guardrails"
                        icon={<ShieldCheck size={17} />}
                        href="/guardtrail"
                        loading={guardrailState.status === 'loading'}
                        error={guardrailState.status === 'error'}
                        status={guardrails.length === 0 ? 'No results' : criticalViolations > 0 ? 'Critical' : guardrailViolations.length > 0 ? 'Warning' : 'Passed'}
                        statusClassName={criticalViolations > 0 || guardrailViolations.length > 0 ? 'text-red-400' : 'text-emerald-400'}
                        metrics={[
                            ['Total Guardrails', guardrails.length],
                            ['Active Guardrails', guardrails.length],
                            ['Passed / Compliant', Math.max(guardrails.length - guardrailViolations.length, 0)],
                            ['Violations', guardrailViolations.length],
                            ['Critical Violations', criticalViolations],
                        ]}
                    />
                    <SecuritySummaryCard
                        title="Attack Chains"
                        icon={<GitBranch size={17} />}
                        href="/attack-chains"
                        loading={attackChainState.status === 'loading'}
                        error={attackChainState.status === 'error'}
                        status={chains.length === 0 ? 'No results' : failedChains > 0 ? 'Warning' : 'Passed'}
                        statusClassName={failedChains > 0 ? 'text-amber-400' : 'text-emerald-400'}
                        metrics={[
                            ['Total Attack Chains', chains.length],
                            ['Completed / Tested', testedChains.length],
                            ['Failed Chains', failedChains],
                            ['Successful Attacks', successfulAttacks],
                            ['Attack Success Rate', attackSuccessRate === null ? '—' : `${attackSuccessRate}%`],
                        ]}
                    />
                </div>

                <SecurityPosture
                    guardrailViolations={guardrailViolations.length}
                    criticalViolations={criticalViolations}
                    failedChains={failedChains}
                    scenarioFailures={stats.failed}
                    loading={guardrailState.status === 'loading' || attackChainState.status === 'loading'}
                    unavailable={guardrailState.status === 'error' || attackChainState.status === 'error'}
                />

                {statusState.status === 'success' && (
                    <StaleScenariosBanner status={statusState.data} linkTo="/scenarios" />
                )}

                <CriticalFailureBanner count={stats.criticalFailures} totalFailures={stats.failed} />

                {stats.total === 0 && (
                    <EmptyState
                        icon={FlaskConical}
                        title="No scenarios generated yet"
                        description="Generate adversarial scenarios for this agent to start testing it."
                        action={
                            <Link to="/scenarios">
                                <Button variant="primary">Go to Scenarios</Button>
                            </Link>
                        }
                    />
                )}

                {stats.total > 0 && (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                            <h2 className="text-sm font-semibold text-[var(--text)]">Agent Under Test</h2>
                            <p className="mt-1 text-sm text-[var(--text-muted)]">{agentConfig.purpose}</p>
                            <dl className="mt-3 space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-[var(--text-faint)]">Domain</dt>
                                    <dd className="text-[var(--text)]">{agentConfig.domain}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-[var(--text-faint)]">Rules</dt>
                                    <dd className="text-[var(--text)]">{agentConfig.rules.length}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-[var(--text-faint)]">Tools</dt>
                                    <dd className="text-[var(--text)]">{agentConfig.tools.length}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-[var(--text-faint)]">Pass rate</dt>
                                    <dd className="text-[var(--text)]">{stats.passRate === null ? 'Not yet classified' : `${stats.passRate}%`}</dd>
                                </div>
                            </dl>
                            <Link
                                to="/agent-under-test"
                                className="mt-3 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
                            >
                                Edit configuration →
                            </Link>
                        </div>

                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                            <h2 className="text-sm font-semibold text-[var(--text)]">Scenario Coverage</h2>
                            <div className="mt-3 space-y-2">
                                {stats.byCategory.map(({ category, count }) => {
                                    const pct = Math.round((count / stats.total) * 100)
                                    return (
                                        <div key={category}>
                                            <div className="flex justify-between text-xs text-[var(--text-muted)]">
                                                <span className="font-mono">{category}</span>
                                                <span>{count}</span>
                                            </div>
                                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                                                <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <Link to="/scenarios" className="mt-3 inline-block text-sm font-medium text-[var(--accent)] hover:underline">
                                Browse scenarios →
                            </Link>
                        </div>
                    </div>
                )}

                {stats.total > 0 && (
                    <div>
                        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Quick Actions</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <button
                                onClick={handleStartRun}
                                disabled={starting}
                                className="group flex flex-col items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface-2)] disabled:opacity-70"
                            >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                  <PlayCircle size={18} />
                </span>
                                <span className="text-sm font-semibold text-[var(--text)]">
                  {starting ? 'Starting…' : 'Start New Run'}
                </span>
                                <span className="text-xs text-[var(--text-faint)]">Execute pending scenarios, then classify results.</span>
                                <span className="mt-1 flex items-center gap-1 text-xs font-medium text-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100">
                  Go <ArrowRight size={12} />
                </span>
                            </button>

                            <Link
                                to="/scenarios"
                                className="group flex flex-col items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface-2)]"
                            >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                  <Sparkles size={18} />
                </span>
                                <span className="text-sm font-semibold text-[var(--text)]">Regenerate Scenarios</span>
                                <span className="text-xs text-[var(--text-faint)]">Have Groq write fresh adversarial scenarios.</span>
                                <span className="mt-1 flex items-center gap-1 text-xs font-medium text-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100">
                  Go <ArrowRight size={12} />
                </span>
                            </Link>

                            <Link
                                to="/run-reports"
                                className="group flex flex-col items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface-2)]"
                            >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                  <FileBarChart size={18} />
                </span>
                                <span className="text-sm font-semibold text-[var(--text)]">View Run Reports</span>
                                <span className="text-xs text-[var(--text-faint)]">Inspect every scenario classified as unsafe.</span>
                                <span className="mt-1 flex items-center gap-1 text-xs font-medium text-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100">
                  Go <ArrowRight size={12} />
                </span>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function SecuritySummaryCard({
    title,
    icon,
    href,
    loading,
    error,
    status,
    statusClassName,
    metrics,
}: {
    title: string
    icon: React.ReactNode
    href: string
    loading: boolean
    error: boolean
    status: string
    statusClassName: string
    metrics: [string, string | number][]
}) {
    return (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface-2)]">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                    <span className="text-[var(--accent)]">{icon}</span>
                    {title}
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${statusClassName}`}>
                    {status === 'Critical' || status === 'Warning' ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                    {loading ? 'Loading…' : error ? 'Unavailable' : status}
                </span>
            </div>
            {error ? (
                <p className="mt-4 text-sm text-[var(--text-faint)]">Summary unavailable. The detail page may have more information.</p>
            ) : (
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-5">
                    {metrics.map(([label, value]) => (
                        <div key={label}>
                            <div className="text-xs text-[var(--text-faint)]">{label}</div>
                            <div className="mt-1 text-lg font-semibold text-[var(--text)]">{loading ? '—' : value}</div>
                        </div>
                    ))}
                </div>
            )}
            <Link to={href} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline">
                View {title} <ArrowRight size={13} />
            </Link>
        </section>
    )
}

function SecurityPosture({
    guardrailViolations,
    criticalViolations,
    failedChains,
    scenarioFailures,
    loading,
    unavailable,
}: {
    guardrailViolations: number
    criticalViolations: number
    failedChains: number
    scenarioFailures: number
    loading: boolean
    unavailable: boolean
}) {
    const overallStatus = loading ? 'Loading' : unavailable ? 'Partial data' : criticalViolations > 0 ? 'Critical' : guardrailViolations > 0 || failedChains > 0 || scenarioFailures > 0 ? 'Warning' : 'Passed'
    const overallClass = overallStatus === 'Critical' ? 'text-red-400' : overallStatus === 'Warning' ? 'text-amber-400' : 'text-[var(--text-muted)]'
    return (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold text-[var(--text)]">Security Posture</h2>
                    <p className="mt-1 text-xs text-[var(--text-faint)]">Current safety signals across evaluations and attack testing.</p>
                </div>
                <div className={`flex items-center gap-1.5 text-sm font-semibold ${overallClass}`}>
                    {overallStatus === 'Passed' ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}
                    {overallStatus}
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <PostureMetric label="Guardrail violations" value={guardrailViolations} />
                <PostureMetric label="Critical violations" value={criticalViolations} />
                <PostureMetric label="Attack chain failures" value={failedChains} />
                <PostureMetric label="Scenario failures" value={scenarioFailures} />
            </div>
        </section>
    )
}

function PostureMetric({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-[var(--surface-2)] px-3 py-2">
            <span className="text-xs text-[var(--text-muted)]">{label}</span>
            <span className={`text-sm font-semibold ${value > 0 ? 'text-red-400' : 'text-[var(--text)]'}`}>{value}</span>
        </div>
    )
}
