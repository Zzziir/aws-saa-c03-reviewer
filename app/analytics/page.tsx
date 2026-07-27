import { Container, PageHeader } from "@/components/layout/page-shell";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export default function AnalyticsPage() {
  return (
    <Container>
      <PageHeader
        eyebrow="Progress"
        title="Analytics"
        lede="Track scores, time, consistency, and where you stand across the four exam domains."
      />
      <AnalyticsView />
    </Container>
  );
}
