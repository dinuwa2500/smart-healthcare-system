// Root admin layout - no protection (auth pages are public)
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
