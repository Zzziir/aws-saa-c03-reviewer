import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-sm flex-col justify-center px-4 py-10">
      <LoginForm />
    </div>
  );
}
