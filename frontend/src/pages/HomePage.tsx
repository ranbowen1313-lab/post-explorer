import { useState } from 'react'
import TopBar from '../components/TopBar'
import ResumePage from './ResumePage'
import JobPage from './JobPage'
import AnalysisView from './AnalysisView'

export type View = 'resume' | 'job' | 'analysis'

export default function HomePage() {
  const [view, setView] = useState<View>('resume')

  return (
    <>
      <TopBar view={view} onViewChange={(v) => setView(v as View)} />
      {view === 'analysis' ? (
        <AnalysisView />
      ) : (
        <div className="home-layout">
          {view === 'resume' ? <ResumePage /> : <JobPage />}
        </div>
      )}
    </>
  )
}
