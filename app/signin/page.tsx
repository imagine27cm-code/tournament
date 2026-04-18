import { Suspense } from "react";
import SignInForm from "./SignInForm";

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight gradient-text" style={{fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 20px #00f0ff40'}}>ВХОД</h1>
      <p className="mt-2 text-sm" style={{color: '#8888aa'}}>
        Авторизация по email/паролю (NextAuth Credentials)
      </p>
      <Suspense fallback={<div className="mt-6 text-sm" style={{color: '#8888aa'}}>Загрузка...</div>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}