import { createClient } from "@/lib/supabase/server";
import { referralLinkForUser, referralCodeForUser } from "@/lib/referrals";
import ReferralsClient from "./ReferralsClient";

export default async function ReferralsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://elexa-ai-trading.vercel.app";
  const link = referralLinkForUser(user!.id, appUrl);
  const code = referralCodeForUser(user!.id);
  return <ReferralsClient code={code} link={link} />;
}
