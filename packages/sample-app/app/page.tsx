"use client";

import { useState } from "react";
import { useBalance, useAccountInfo } from "@i-coders/hiero-react";
import { Nav } from "@/components/Nav";
import { Card, CodeBlock } from "@/components/Card";

export default function HomePage() {
  const [accountId, setAccountId] = useState("0.0.100");
  const { balance, loading, error, refetch } = useBalance(accountId);
  const { account, loading: infoLoading } = useAccountInfo(accountId);

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Account balance</h2>
          <p className="text-gray-500 mt-1">
            Demonstrates <code className="text-hiero-600 bg-hiero-50 px-1.5 py-0.5 rounded text-sm">useBalance</code> and{" "}
            <code className="text-hiero-600 bg-hiero-50 px-1.5 py-0.5 rounded text-sm">useAccountInfo</code> hooks
          </p>
        </div>

        <Card title="Query account" description="Enter any Hedera account ID to fetch its balance">
          <div className="flex gap-3 mb-5">
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="0.0.100"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hiero-400 focus:border-transparent"
            />
            <button
              onClick={refetch}
              disabled={loading}
              className="px-4 py-2 bg-hiero-400 text-white rounded-lg text-sm font-medium hover:bg-hiero-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "Loading..." : "Fetch"}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {balance && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-hiero-50 rounded-lg p-4">
                <p className="text-xs text-hiero-600 font-medium uppercase tracking-wide">HBAR balance</p>
                <p className="text-2xl font-bold text-hiero-900 mt-1">{balance.hbars.toString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Token types</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{balance.tokens.size}</p>
              </div>
            </div>
          )}

          {account && !infoLoading && (
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Account ID</span>
                <span className="font-mono text-gray-900">{account.accountId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Memo</span>
                <span className="text-gray-900">{account.memo || "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Deleted</span>
                <span className="text-gray-900">{account.isDeleted ? "Yes" : "No"}</span>
              </div>
            </div>
          )}
        </Card>

        <Card title="Code example" description="How this page uses the library">
          <CodeBlock
            code={`import { useBalance, useAccountInfo } from "@i-coders/hiero-react";

function BalancePage() {
  const { balance, loading, error, refetch } = useBalance("0.0.100");
  const { account } = useAccountInfo("0.0.100");

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <p>HBAR: {balance?.hbars.toString()}</p>
      <p>Tokens: {balance?.tokens.size}</p>
      <p>Memo: {account?.memo}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}`}
          />
        </Card>
      </main>
    </div>
  );
}
