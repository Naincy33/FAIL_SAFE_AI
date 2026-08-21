import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { LoadingState } from '../components/LoadingState'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { SafetyBadge } from '../components/SafetyBadge'
import { useApi } from '../lib/useApi'
import { getAttackChains } from '../api/safety'

export function AttackChains(){const state=useApi(getAttackChains,[]);const[q,setQ]=useState('');const data=state.status==='success'?state.data:[];const rows=useMemo(()=>data.filter(c=>JSON.stringify(c).toLowerCase().includes(q.toLowerCase())),[data,q]);return <div className="space-y-6"><PageHeader title="Multi-Turn Attack Chains" subtitle="Escalation tests across a complete conversation"/>{state.status==='loading'&&<LoadingState label="Loading attack chains…"/>}{state.status==='error'&&<ErrorState message={state.error} onRetry={state.reload}/>}{state.status==='success'&&(data.length===0?<EmptyState title="No attack chains available yet" description="Generate and run multi-turn chains to investigate escalation behavior."/>:<><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search chains…" className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"/><div className="overflow-x-auto rounded-xl border border-[var(--border)]"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[var(--surface-2)] text-xs uppercase text-[var(--text-faint)]"><tr><th className="p-3">Chain</th><th>Category</th><th>Target tool</th><th>Turns</th><th>Result</th><th/></tr></thead><tbody>{rows.map(c=><tr key={c.chain_id} className="border-t border-[var(--border)]"><td className="p-3 font-mono">{c.chain_id}</td><td>{c.attack_type||c.category||'—'}</td><td>{c.target_tool||'—'}</td><td>{c.turns?.length??'—'}</td><td><SafetyBadge value={c.classification}/></td><td><Link className="text-[var(--accent)]" to={`/attack-chains/${encodeURIComponent(c.chain_id)}`}>Open Chain</Link></td></tr>)}</tbody></table></div></>)}</div>}
