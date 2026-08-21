import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { SafetyBadge } from '../components/SafetyBadge'
import { useApi } from '../lib/useApi'
import { getChainClassification, getChainTrace } from '../api/safety'
import type { AttackChainTurn } from '../lib/types'

export function AttackChainDetail() {
 const {id=''}=useParams(); const trace=useApi(()=>getChainTrace(id),[id]); const cls=useApi(()=>getChainClassification(id),[id])
 if(trace.status==='loading'||cls.status==='loading') return <LoadingState label="Loading security investigation…"/>
 if(trace.status==='error') return <ErrorState message={trace.error} onRetry={trace.reload}/>
 if(cls.status==='error') return <ErrorState message={cls.error} onRetry={cls.reload}/>
 const turns=trace.data.turns||trace.data.execution?.turns||[]
 return <div className="space-y-6"><PageHeader title={id} subtitle="Multi-turn security investigation"/><section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"><div className="flex flex-wrap gap-2"><SafetyBadge value={cls.data.classification}/><SafetyBadge value={cls.data.severity}/><span className="text-sm">Failed turn: {cls.data.failed_turn??'None'}</span></div><p className="mt-3 text-sm text-[var(--text-muted)]">{cls.data.reason||'No classifier rationale returned.'}</p></section><div className="flex gap-3"><Link className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm text-white" to={`/patches/${id}`}>View Generated Patch</Link><Link className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm" to={`/patches/${id}`}>View Re-test</Link></div><section><h2 className="mb-3 text-lg font-semibold">Conversation timeline</h2><div className="space-y-4">{turns.map((t,i)=><Turn key={i} value={t} index={i+1} failed={cls.data.failed_turn===t.turn||cls.data.failed_turn===i+1}/>)}</div></section></div>
}
function Turn({value,index,failed}:{value:AttackChainTurn;index:number;failed:boolean}) { const calls=value.tool_calls||(value.tool_call?[value.tool_call]:[]); return <article className={`rounded-xl border p-4 ${failed?'border-red-500 bg-red-500/5':'border-[var(--border)] bg-[var(--surface)]'}`}><div className="font-semibold">Turn {value.turn||index}{failed&&<span className="ml-2 text-xs uppercase text-red-400">First failed turn</span>}</div><Part title="User" text={value.user_message||value.user_input}/><Part title="Agent" text={value.agent_response}/>{calls.map((c,i)=><div key={i} className="mt-3 rounded-lg bg-[var(--bg-inset)] p-3 text-xs"><b>Tool call · {c.name||c.tool_name||'unknown'}</b><pre className="overflow-x-auto">{JSON.stringify(c.arguments||c.args||{},null,2)}</pre>{c.result!==undefined&&<pre className="overflow-x-auto text-emerald-400">{JSON.stringify(c.result,null,2)}</pre>}</div>)}</article> }
function Part({title,text}:{title:string;text?:string}) {return <div className="mt-3"><div className="text-xs uppercase text-[var(--text-faint)]">{title}</div><p className="whitespace-pre-wrap text-sm text-[var(--text-muted)]">{text||'—'}</p></div>}
