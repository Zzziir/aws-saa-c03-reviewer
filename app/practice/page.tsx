import { Container, PageHeader } from "@/components/layout/page-shell";
import { SetupForm } from "@/components/setup/setup-form";

export default function PracticePage() {
  return (
    <Container>
      <PageHeader
        eyebrow="New session"
        title="Configure your run"
        lede="Dial in the mode, difficulty, and scope. Everything is randomized and your progress is saved automatically."
      />
      <SetupForm />
    </Container>
  );
}
