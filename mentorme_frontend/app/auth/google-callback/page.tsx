import { Suspense } from "react";
import { GoogleCallbackClient } from "./GoogleCallbackClient";

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
          <div className="text-center text-white">
            <p className="text-xl font-semibold">
              Signing you in with Google...
            </p>
            <p className="text-white/70 mt-2">
              Please wait while we finalize your session.
            </p>
          </div>
        </div>
      }
    >
      <GoogleCallbackClient />
    </Suspense>
  );
}
