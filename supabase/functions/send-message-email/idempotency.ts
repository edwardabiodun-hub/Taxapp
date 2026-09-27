export interface DeliveryRpcClient {
  rpc: (
    functionName: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: boolean | null; error: { message?: string } | null }>;
}

async function callDeliveryRpc(
  client: DeliveryRpcClient,
  functionName: string,
  args: Record<string, unknown>,
): Promise<boolean | null> {
  const { data, error } = await client.rpc(functionName, args);
  if (error) throw new Error(error.message ?? `Delivery RPC ${functionName} failed`);
  return data;
}

export async function claimMessageEmailDelivery(
  client: DeliveryRpcClient,
  messageId: string,
): Promise<boolean> {
  return (await callDeliveryRpc(client, "claim_message_email_delivery", { p_message_id: messageId })) === true;
}

export async function markMessageEmailSent(
  client: DeliveryRpcClient,
  messageId: string,
): Promise<void> {
  await callDeliveryRpc(client, "mark_message_email_sent", { p_message_id: messageId });
}

export async function markMessageEmailFailed(
  client: DeliveryRpcClient,
  messageId: string,
  error: string,
): Promise<void> {
  await callDeliveryRpc(client, "mark_message_email_failed", {
    p_message_id: messageId,
    p_error: error.slice(0, 1000),
  });
}
