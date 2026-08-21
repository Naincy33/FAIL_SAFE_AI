import { api } from './client'
import type { AttackChain, ChainClassification, ChainTrace, GuardrailResult, Patch, PatchResult } from '../lib/types'

export const getGuardrailResults = () => api.get<GuardrailResult[]>('/guardtrail/results')
export interface GuardrailRun {
	id: string
	status: 'queued' | 'running' | 'completed' | 'failed'
	started_at: string
	finished_at: string | null
	result_count: number | null
	error: string | null
}
export const runGuardrail = () => api.post<GuardrailRun>('/guardtrail/run')
export const getGuardrailRun = (id: string) => api.get<GuardrailRun>(`/guardtrail/run/${encodeURIComponent(id)}`)
export const getAttackChains = () => api.get<AttackChain[]>('/attack-chains')
export const getChainTrace = (id: string) => api.get<ChainTrace>(`/attack-chains/${encodeURIComponent(id)}/trace`)
export const getChainClassification = (id: string) => api.get<ChainClassification>(`/attack-chains/${encodeURIComponent(id)}/classification`)
export const getPatch = (id: string) => api.get<Patch>(`/attack-chains/${encodeURIComponent(id)}/patch`)
export const getPatchResult = (id: string) => api.get<PatchResult>(`/attack-chains/${encodeURIComponent(id)}/patch-result`)
export const generatePatch = (id: string) => api.post<Patch>(`/attack-chains/${encodeURIComponent(id)}/patch`)
export const retestPatch = (id: string) => api.post<PatchResult>(`/attack-chains/${encodeURIComponent(id)}/patch/retest`)
