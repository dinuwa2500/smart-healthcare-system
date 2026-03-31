// No protection for auth pages - login and register should be public
export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
