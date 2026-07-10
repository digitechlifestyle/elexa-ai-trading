import type { SupabaseClient } from "@supabase/supabase-js";
import { encryptSecret, decryptSecret } from "@/lib/crypto/secret-box";

export type LiveExchangeName = "alpaca";

export interface BrokerConnectionSummary {
  exchange: LiveExchangeName;
  last4: string;
  created_at: string;
  updated_at: string;
}

export interface BrokerCredentials {
  apiKey: string;
  apiSecret: string;
}

export async function saveBrokerConnection(
  admin: SupabaseClient,
  userId: string,
  exchange: LiveExchangeName,
  apiKey: string,
  apiSecret: string
): Promise<void> {
  const { error } = await admin.from("broker_connections").upsert(
    {
      user_id: userId,
      exchange,
      api_key_enc: encryptSecret(apiKey),
      api_secret_enc: encryptSecret(apiSecret),
      last4: apiKey.slice(-4),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,exchange" }
  );
  if (error) throw new Error(`Failed to save broker connection: ${error.message}`);
}

export async function getBrokerConnection(
  admin: SupabaseClient,
  userId: string,
  exchange: LiveExchangeName
): Promise<BrokerCredentials | null> {
  const { data } = await admin
    .from("broker_connections")
    .select("api_key_enc, api_secret_enc")
    .eq("user_id", userId)
    .eq("exchange", exchange)
    .maybeSingle();

  if (!data) return null;
  return {
    apiKey: decryptSecret(data.api_key_enc),
    apiSecret: decryptSecret(data.api_secret_enc),
  };
}

export async function listBrokerConnections(
  admin: SupabaseClient,
  userId: string
): Promise<BrokerConnectionSummary[]> {
  const { data } = await admin
    .from("broker_connections")
    .select("exchange, last4, created_at, updated_at")
    .eq("user_id", userId);
  return (data ?? []) as BrokerConnectionSummary[];
}

export async function deleteBrokerConnection(
  admin: SupabaseClient,
  userId: string,
  exchange: LiveExchangeName
): Promise<void> {
  await admin
    .from("broker_connections")
    .delete()
    .eq("user_id", userId)
    .eq("exchange", exchange);
}
