import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import Dashboard from '@/components/Dashboard'

export default async function Home() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/home')
  }

  return <Dashboard />
}
