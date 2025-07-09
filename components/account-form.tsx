"use client";

import type React from "react";
import { useActionState } from "react";
import { updateUserProfile, signOut } from "@/lib/actions";

interface AccountFormProps {
  user: any;
}

export function AccountForm({ user }: AccountFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      return await updateUserProfile(formData);
    },
    null
  );

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <div>
          <label className="block font-bold mb-2 text-white text-lg">
            NAME
          </label>
          <input
            type="text"
            name="name"
            defaultValue={user?.name || ""}
            className="w-full p-3 text-lg"
            required
          />
        </div>

        {state && "error" in state && state.error && (
          <div className="text-red-500 font-bold">{state.error}</div>
        )}

        {state && "success" in state && state.success && (
          <div className="text-green-500 font-bold">
            Profile updated successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="btn-3d btn-success w-full px-6 py-3 text-xl"
        >
          {isPending ? "UPDATING..." : "UPDATE NAME"}
        </button>
      </form>

      <div className="pt-4 border-t-2 border-white">
        <button
          onClick={handleSignOut}
          className="btn-3d btn-danger w-full px-6 py-3 text-xl"
        >
          SIGN OUT
        </button>
      </div>
    </div>
  );
}
