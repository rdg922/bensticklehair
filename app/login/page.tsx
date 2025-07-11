import { LoginForm } from "@/components/login-form";
import { SiteHeader } from "@/components/site-header";

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-4">
        <SiteHeader currentPage={undefined} />

        <main>
          <div className="max-w-md mx-auto">
            <LoginForm />
          </div>
        </main>
      </div>
    </div>
  );
}
