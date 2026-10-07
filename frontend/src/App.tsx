import { AuthProvider, useAuth } from './auth'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'

function Root() {
  const { user, loading } = useAuth()
  if (loading) {
    return <div className="empty" style={{ paddingTop: 80 }}>加载中…</div>
  }
  if (!user) {
    return <LoginPage />
  }
  return <HomePage />
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  )
}
