"use client";

import { useState } from "react";
import { useMirrorQuery } from "@i-coders/hiero-react";
import type { MirrorTransaction } from "@i-coders/hiero-react";
import { Nav } from "@/components/Nav";
import { Card, CodeBlock } from "@/components/Card";

const ACCOUNT_ID_REGEX = /^0\.0\.\d+$/;

export default function MirrorPage() {
  const [accountId, setAccountId] = useState("0.0.100");
  const [queryId, setQueryId] = useState("0.0.100");

  const isValidAccountId = ACCOUNT_ID_REGEX.test(accountId);

  const { data: transactions, loading, error, hasNextPage, fetchNextPage } =
    useMirrorQuery<MirrorTransaction>(
      queryId ? `/api/v1/transactions?account.id=${queryId}&limit=10&order=desc` : null,
      "transactions"
    );

  const handleSearch = () => {
    if (!isValidAccountId) return;
    setQueryId(accountId);
  };

  const formatTimestamp = (ts: string) => {
    if (!ts) return "—";
    const [seconds] = ts.split(".");
    const parsed = parseInt(seconds);
    if (isNaN(parsed)) return "—";
    return new Date(parsed * 1000).toLocaleString();
  };

  const tinybarToHbar = (amount: number) => {
    return (amount / 100_000_000).toFixed(4);
  };

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mirror Node explorer</h2>
          <p className="text-gray-500 mt-1">
            Demonstrates <code className="text-hiero-600 bg-hiero-50 px-1.5 py-0.5 rounded text-sm">useMirrorQuery</code> for
            transaction history via the Mirror Node REST API
          </p>
        </div>

        <Card title="Transaction history" description="Recent transactions for an account">
          <div className="flex gap-3 mb-5">
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="0.0.100"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hiero-400 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !isValidAccountId}
              className="px-4 py-2 bg-hiero-400 text-white rounded-lg text-sm font-medium hover:bg-hiero-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "Loading..." : "Search"}
            </button>
          </div>

          {accountId && !isValidAccountId && (
            <p className="text-red-500 text-xs mb-3">Invalid Account ID format. Use 0.0.XXXXX</p>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {transactions.length === 0 && !loading && !error && (
            <p className="text-gray-400 text-sm text-center py-8">
              No transactions found
            </p>
          )}

          {transactions.length > 0 && (
            <div className="space-y-2">
              {transactions.map((tx, i) => (
                <div
                  key={`${tx.transaction_id}-${i}`}
                  className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs text-gray-600 truncate max-w-[60%]">
                      {tx.transaction_id}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        tx.result === "SUCCESS"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {tx.result}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{tx.name}</span>
                    <span>{formatTimestamp(tx.consensus_timestamp)}</span>
                  </div>
                  {tx.transfers && tx.transfers.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tx.transfers.slice(0, 4).map((t, j) => (
                        <span
                          key={j}
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            t.amount >= 0
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {t.account}: {t.amount >= 0 ? "+" : ""}
                          {tinybarToHbar(t.amount)} HBAR
                        </span>
                      ))}
                      {tx.transfers.length > 4 && (
                        <span className="text-xs text-gray-400">
                          +{tx.transfers.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {hasNextPage && (
                <button
                  onClick={fetchNextPage}
                  disabled={loading}
                  className="w-full py-2 text-sm text-hiero-600 hover:text-hiero-800 font-medium disabled:opacity-50"
                >
                  {loading ? "Loading more..." : "Load more transactions"}
                </button>
              )}

              <p className="text-xs text-gray-400 text-center pt-2">
                Showing {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </Card>

        <Card title="Code example">
          <CodeBlock
            code={`import { useMirrorQuery } from "@i-coders/hiero-react";
import type { MirrorTransaction } from "@i-coders/hiero-react";

function TransactionHistory({ accountId }: { accountId: string }) {
  const { data, loading, hasNextPage, fetchNextPage } =
    useMirrorQuery<MirrorTransaction>(
      \`/api/v1/transactions?account.id=\${accountId}&limit=10\`,
      "transactions"
    );

  return (
    <div>
      {data.map(tx => (
        <div key={tx.transaction_id}>
          <p>{tx.name} — {tx.result}</p>
          <p>Fee: {tx.charged_tx_fee}</p>
        </div>
      ))}
      {hasNextPage && (
        <button onClick={fetchNextPage}>Load more</button>
      )}
    </div>
  );
}`}
          />
        </Card>
      </main>
    </div>
  );
}
