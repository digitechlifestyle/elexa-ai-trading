import ChartsClient from "./ChartsClient";

export default function ChartsPage({
  searchParams,
}: {
  searchParams: Promise<{ symbol?: string }>;
}) {
  // searchParams not awaited at server level here — initial just defaults to AAPL
  return <ChartsClient initial="AAPL" />;
}
