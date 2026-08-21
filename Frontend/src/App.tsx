import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Overview } from './pages/Overview'
import { AgentUnderTest } from './pages/AgentUnderTest'
import { Scenarios } from './pages/Scenarios'
import { TestRuns } from './pages/TestRuns'
import { TestRunDetail } from './pages/TestRunDetail'
import { RunReports } from './pages/RunReports'
import { RunReport } from './pages/RunReport'
import { Traces } from './pages/Traces'
import { Settings } from './pages/Settings'
import { GuardTrail } from './pages/GuardTrail'
import { AttackChains } from './pages/AttackChains'
import { AttackChainDetail } from './pages/AttackChainDetail'
import { Patches } from './pages/Patches'

export default function App() {
  return (
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/agent-under-test" element={<AgentUnderTest />} />
          <Route path="/scenarios" element={<Scenarios />} />
          <Route path="/test-runs" element={<TestRuns />} />
          <Route path="/test-runs/:runId" element={<TestRunDetail />} />
          <Route path="/run-reports" element={<RunReports />} />
          <Route path="/run-reports/:scenarioId" element={<RunReport />} />
          <Route path="/traces" element={<Traces />} />
          <Route path="/guardtrail" element={<GuardTrail />} />
          <Route path="/attack-chains" element={<AttackChains />} />
          <Route path="/attack-chains/:id" element={<AttackChainDetail />} />
          <Route path="/patches/:id" element={<Patches />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
  )
}
