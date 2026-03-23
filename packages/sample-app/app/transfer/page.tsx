"use client";

import { useState } from "react";
import { Hbar } from "@hashgraph/sdk";
import { useTransfer } from "@i-coders/hiero-react";
import { Nav } from "@/components/Nav";
import { Card, StatusBadge, CodeBlock } from "@/components/Card";

const ACCOUNT_ID_REGEX = /^0\.0\.\d+$/;

export default function TransferPage() {
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("1");
  const [showConfirm, setShowConfirm] = useState(false);
  const { send, status, error, reset } = useTransfer();

  const isValidAccountId = ACCOUNT_ID_REGEX.test(toAccount);
  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const canSend = isValidAccountId && isValidAmount && status !== "pending";

  const handleTransfer = async () => {
    if (!canSend) return;
    setShowConfirm(true);
  };

  const confirmTransfer = async () => {
    setShowConfirm(false);
    const hbarAmount = new Hbar(parsedAmount);
    await send(toAccount, hbarAmount);
  };

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transfer HBAR</h2>
          <p className="text-gray-500 mt-1">
            Demonstrates <code className="text-hiero-600 bg-hiero-50 px-1.5 py-0.5 rounded text-sm">useTransfer</code> hook
            with status tracking
          </p>
        </div>

        <Card title="Send HBAR" description="Transfer HBAR from the operator account to any recipient">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient account ID
              </label>
              <input
                type="text"
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                placeholder="0.0.67890"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hiero-400 focus:border-transparent ${
                  toAccount && !isValidAccountId ? "border-red-300" : "border-gray-300"
                }`}
              />
              {toAccount && !isValidAccountId && (
                <p className="text-red-500 text-xs mt-1">Invalid format. Use 0.0.XXXXX</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (HBAR)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1"
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hiero-400 focus:border-transparent ${
                  amount && !isValidAmount ? "border-red-300" : "border-gray-300"
                }`}
              />
              {amount && !isValidAmount && (
                <p className="text-red-500 text-xs mt-1">Enter a positive number</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleTransfer}
                disabled={!canSend}
                className="px-6 py-2.5 bg-hiero-400 text-white rounded-lg text-sm font-medium hover:bg-hiero-600 disabled:opacity-50 transition-colors"
              >
                {status === "pending" ? "Sending..." : "Send HBAR"}
              </button>
              <StatusBadge status={status} />
              {status !== "idle" && (
                <button
                  onClick={reset}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Reset
                </button>
              )}
            </div>

            {status === "success" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-700 text-sm">
                  Transfer of {amount} HBAR to {toAccount} completed successfully.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>
        </Card>

        {showConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm transfer</h3>
              <p className="text-sm text-gray-600 mb-4">
                Send <strong>{amount} HBAR</strong> to <strong className="font-mono">{toAccount}</strong>?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTransfer}
                  className="px-4 py-2 bg-hiero-400 text-white rounded-lg text-sm font-medium hover:bg-hiero-600"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        <Card title="Code example">
          <CodeBlock
            code={`import { Hbar } from "@hashgraph/sdk";
import { useTransfer } from "@i-coders/hiero-react";

function TransferForm() {
  const { send, status, error, reset } = useTransfer();

  const handleSend = async () => {
    await send("0.0.67890", new Hbar(1));
  };

  return (
    <div>
      <button onClick={handleSend} disabled={status === "pending"}>
        {status === "pending" ? "Sending..." : "Send 1 HBAR"}
      </button>
      <p>Status: {status}</p>
      {error && <p>Error: {error}</p>}
      <button onClick={reset}>Reset</button>
    </div>
  );
}`}
          />
        </Card>
      </main>
    </div>
  );
}
