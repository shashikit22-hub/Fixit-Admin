import { Outlet } from 'react-router-dom'
import TopNav from './layout/TopNav'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}
