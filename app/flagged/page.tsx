import { Container, PageHeader } from "@/components/layout/page-shell";
import { FlaggedView } from "@/components/flagged/flagged-view";

export default function FlaggedPage() {
  return (
    <Container narrow>
      <PageHeader
        eyebrow="Saved"
        title="Flagged questions"
        lede="Your personal set of tricky questions. Review them here or run them as a focused practice set."
      />
      <FlaggedView />
    </Container>
  );
}
