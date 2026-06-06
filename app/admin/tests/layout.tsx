import { MainLayout } from '@/components/MainLayout'

export default function TestsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
