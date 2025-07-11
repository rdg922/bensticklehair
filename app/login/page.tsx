import { LoginForm } from "@/components/login-form";
import { SiteHeader } from "@/components/site-header";

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams;

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-4">
        <SiteHeader currentPage={undefined} />

        <main>
          <div className="max-w-md mx-auto">
            <LoginForm redirectTo={redirect} />
          </div>
        </main>
      </div>
    </div>
  );
}
