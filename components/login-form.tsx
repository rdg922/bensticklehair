import { signInWithGoogle } from "@/lib/actions";

export function LoginForm() {
  return (
    <div className="container-90s p-6">
      <h3 className="text-3xl font-bold mb-6 text-center text-white glow-text">
        LOGIN TO START DRAWING
      </h3>

      <form action={signInWithGoogle} className="text-center">
        <button
          type="submit"
          className="btn-3d btn-success w-full px-6 py-3 text-xl"
        >
          SIGN IN WITH GOOGLE
        </button>
      </form>

      <div className="mt-6 text-center text-white">
        <p className="text-sm">
          Sign in with your Google account to start creating and sharing Bens
        </p>
      </div>
    </div>
  );
}
