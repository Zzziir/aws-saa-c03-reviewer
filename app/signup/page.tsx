import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-sm flex-col justify-center px-4 py-10">
      <SignupForm />
    </div>
  );
}
