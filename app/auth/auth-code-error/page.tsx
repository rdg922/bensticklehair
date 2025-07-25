import { SiteHeader } from "@/components/site-header";

export default function AuthCodeError() {
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-4">
        <SiteHeader currentPage={undefined} />

        <main>
          <div className="max-w-md mx-auto">
            <div className="container-90s p-6 text-center">
              <h2 className="text-3xl font-bold mb-4 text-white">
                AUTHENTICATION ERROR
              </h2>
              <p className="text-white mb-6">
                Sorry, there was an error signing you in. Please try again.
              </p>
              <a
                href="/login"
                className="btn-3d btn-primary px-6 py-3 text-xl inline-block"
              >
                TRY AGAIN
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
