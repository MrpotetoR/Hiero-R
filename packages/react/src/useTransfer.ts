import { useState, useCallback } from "react";
import { Hbar } from "@hashgraph/sdk";
import { useHieroContext } from "./HieroProvider";

/** Transaction status */
export type TransferStatus = "idle" | "pending" | "success" | "error";

/** Return type for the useTransfer hook */
export interface UseTransferResult {
  /** Execute a transfer */
  send: (toAccountId: string, amount: Hbar) => Promise<void>;
  /** Current status of the transfer */
  status: TransferStatus;
  /** Error message if the transfer failed */
  error: string | null;
  /** Reset the hook state back to idle */
  reset: () => void;
}

/**
 * Hook for transferring HBAR from the operator account to a recipient.
 *
 * Equivalent to calling `AccountClient.transferHbar()` in
 * hiero-enterprise-java, with added reactive status tracking.
 *
 * @returns Transfer function and status tracking
 *
 * @example
 * ```tsx
 * function TransferForm() {
 *   const { send, status, error } = useTransfer();
 *
 *   const handleSend = async () => {
 *     await send("0.0.67890", new Hbar(1));
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleSend} disabled={status === "pending"}>
 *         {status === "pending" ? "Sending..." : "Send 1 HBAR"}
 *       </button>
 *       {status === "success" && <p>Transfer complete!</p>}
 *       {error && <p>Error: {error}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTransfer(): UseTransferResult {
  const { accountService } = useHieroContext();
  const [status, setStatus] = useState<TransferStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (toAccountId: string, amount: Hbar) => {
      setStatus("pending");
      setError(null);

      try {
        await accountService.transferHbar(toAccountId, amount);
        setStatus("success");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Transfer failed";
        setError(message);
        setStatus("error");
      }
    },
    [accountService]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { send, status, error, reset };
}
