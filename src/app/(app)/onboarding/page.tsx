import OnboardingForm from "@/app/(app)/onboarding/OnboardingForm";

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Onboarding</p>
        <h1 className="text-3xl font-semibold">Define your primary goal</h1>
        <p className="text-sm text-muted">
          Set your goal, daily capacity, and non-negotiables. We generate a default
          structure you can edit later.
        </p>
      </div>
      <div className="mt-6">
        <OnboardingForm />
      </div>
    </div>
  );
}
