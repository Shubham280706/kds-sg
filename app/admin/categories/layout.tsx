import { MainLayout } from '@/components/MainLayout'

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
