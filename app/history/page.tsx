import { Container, PageHeader } from "@/components/layout/page-shell";
import { HistoryList } from "@/components/history/history-list";

export default function HistoryPage() {
  return (
    <Container narrow>
      <PageHeader
        eyebrow="Your runs"
        title="History"
        lede="Every completed run, most recent first. Expand a card to see domain breakdowns or dive into the full question review."
      />
      <HistoryList />
    </Container>
  );
}
