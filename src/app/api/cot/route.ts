import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

// CFTC contract codes — major markets institutional traders watch
const MARKETS = [
  { code: "088691", label: "Gold", group: "Metals" },
  { code: "084691", label: "Silver", group: "Metals" },
  { code: "085692", label: "Copper", group: "Metals" },
  { code: "067651", label: "Crude oil (WTI)", group: "Energy" },
  { code: "023391", label: "Natural gas", group: "Energy" },
  { code: "13874A", label: "S&P 500 e-mini", group: "Indices" },
  { code: "209742", label: "Nasdaq-100 e-mini", group: "Indices" },
  { code: "239742", label: "Russell 2000", group: "Indices" },
  { code: "098662", label: "USD index", group: "FX" },
  { code: "099741", label: "Euro FX", group: "FX" },
  { code: "097741", label: "British pound", group: "FX" },
  { code: "043602", label: "10Y Treasury", group: "Rates" },
  { code: "020601", label: "30Y Treasury", group: "Rates" },
  { code: "133741", label: "Bitcoin", group: "Crypto" },
];

interface CotRow {
  market_and_exchange_names?: string;
  report_date_as_yyyy_mm_dd?: string;
  noncomm_positions_long_all?: string;
  noncomm_positions_short_all?: string;
  comm_positions_long_all?: string;
  comm_positions_short_all?: string;
  nonrept_positions_long_all?: string;
  nonrept_positions_short_all?: string;
  open_interest_all?: string;
}

interface MarketSummary {
  code: string;
  label: string;
  group: string;
  date: string | null;
  noncomm_long: number;
  noncomm_short: number;
  noncomm_net: number;
  comm_long: number;
  comm_short: number;
  comm_net: number;
  open_interest: number;
}

export const GET = withApi(async function GET() {
  const out: MarketSummary[] = [];
  for (const m of MARKETS) {
    try {
      const url = `https://publicreporting.cftc.gov/resource/6dca-aqww.json?cftc_contract_market_code=${m.code}&$order=report_date_as_yyyy_mm_dd%20DESC&$limit=1`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 21600 }, // cache 6h
      });
      if (!res.ok) {
        out.push({
          ...m,
          date: null,
          noncomm_long: 0,
          noncomm_short: 0,
          noncomm_net: 0,
          comm_long: 0,
          comm_short: 0,
          comm_net: 0,
          open_interest: 0,
        });
        continue;
      }
      const rows: CotRow[] = await res.json();
      const r = rows[0];
      if (!r) {
        out.push({
          ...m,
          date: null,
          noncomm_long: 0,
          noncomm_short: 0,
          noncomm_net: 0,
          comm_long: 0,
          comm_short: 0,
          comm_net: 0,
          open_interest: 0,
        });
        continue;
      }
      const ncL = Number(r.noncomm_positions_long_all ?? 0);
      const ncS = Number(r.noncomm_positions_short_all ?? 0);
      const cL = Number(r.comm_positions_long_all ?? 0);
      const cS = Number(r.comm_positions_short_all ?? 0);
      out.push({
        ...m,
        date: r.report_date_as_yyyy_mm_dd ?? null,
        noncomm_long: ncL,
        noncomm_short: ncS,
        noncomm_net: ncL - ncS,
        comm_long: cL,
        comm_short: cS,
        comm_net: cL - cS,
        open_interest: Number(r.open_interest_all ?? 0),
      });
    } catch {
      out.push({
        ...m,
        date: null,
        noncomm_long: 0,
        noncomm_short: 0,
        noncomm_net: 0,
        comm_long: 0,
        comm_short: 0,
        comm_net: 0,
        open_interest: 0,
      });
    }
  }
  return NextResponse.json({ markets: out });
});
