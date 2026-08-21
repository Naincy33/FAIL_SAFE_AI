export function SafetyBadge({ value }: { value?: string | null }) {
    const label = value || 'UNKNOWN'
    const unsafe = /unsafe|violation|fail/i.test(label)
    const safe = /safe|pass/i.test(label) && !unsafe
    return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold uppercase ${unsafe ? 'border-red-500/30 bg-red-500/10 text-red-400' : safe ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>{label.replaceAll('_', ' ')}</span>
}
