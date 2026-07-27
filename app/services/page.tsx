import { Container, PageHeader } from "@/components/layout/page-shell";
import { ServicesView } from "@/components/services/services-view";

export default function ServicesPage() {
  return (
    <Container>
      <PageHeader
        eyebrow="Reference"
        title="Service cheat-sheet"
        lede="Every in-scope SAA-C03 service with a one-line 'when to use'. Search to jump straight to what you're stuck on."
      />
      <ServicesView />
    </Container>
  );
}
