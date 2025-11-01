'use client'

import { useAppStore } from '@/lib/store'
import AuthGuard from '@/components/AuthGuard'
import MainLayout from '@/components/MainLayout'
import FilesSection from '@/components/FilesSection'
import ChatSection from '@/components/ChatSection'
import TasksSection from '@/components/TasksSection'
import CalendarSection from '@/components/CalendarSection'
import TeamSection from '@/components/TeamSection'
import StatsSection from '@/components/StatsSection'
import ProfileSection from '@/components/ProfileSection'
import OfflineNotice from '@/components/OfflineNotice'

export default function Home() {
  const { activeTab } = useAppStore()

  const renderActiveSection = () => {
    switch (activeTab) {
      case 'files':
        return <FilesSection />
      case 'chat':
        return <ChatSection />
      case 'tasks':
        return <TasksSection />
      case 'calendar':
        return <CalendarSection />
      case 'team':
        return <TeamSection />
      case 'stats':
        return <StatsSection />
      case 'profile':
        return <ProfileSection />
      default:
        return <FilesSection />
    }
  }

  return (
    <AuthGuard>
      <MainLayout>
        {renderActiveSection()}
        <OfflineNotice />
      </MainLayout>
    </AuthGuard>
  )
}