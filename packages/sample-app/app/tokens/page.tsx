"use client";

import { useState } from "react";
import { useMirrorQuery } from "@i-coders/hiero-react";
import type { MirrorTokenBalance } from "@i-coders/hiero-react";
import { Nav } from "@/components/Nav";
import { Card, CodeBlock } from "@/components/Card";

const ACCOUNT_ID_REGEX = /^0\.0\.\d+$/;

export default function TokensPage() {
  const [accountId, setAccountId] = useState("0.0.100");
  const [queryId, setQueryId] = useState("0.0.100");

  const isValidAccountId = ACCOUNT_ID_REGEX.test(accountId);

  const { data: tokens, loading, error, hasNextPage, fetchNextPage, refetch } =
    useMirrorQuery<MirrorTokenBalance>(
      queryId ? `/api/v1/accounts/${queryId}/tokens` : null,
      "tokens"
    );

  const handleSearch = () => {
    if (!isValidAccountId) return;
    setQueryId(accountId);
  };

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Token balances</h2>
          <p className="text-gray-500 mt-1">
            Demonstrates <code className="text-hiero-600 bg-hiero-50 px-1.5 py-0.5 rounded text-sm">useMirrorQuery</code> with
            automatic pagination via Mirror Node REST API
          </p>
        </div>

        <Card title="Account tokens" description="Fetch token balances for any account via Mirror Node">
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

          {tokens.length === 0 && !loading && !error && (
            <p className="text-gray-400 text-sm text-center py-8">
              No tokens found for this account
            </p>
          )}

          {tokens.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide px-3">
                <span>Token ID</span>
                <span className="text-right">Balance</span>
              </div>
              {tokens.map((token, i) => (
                <div
                  key={`${token.token_id}-${i}`}
                  className="grid grid-cols-2 gap-2 px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="font-mono text-sm text-gray-900">
                    {token.token_id}
                  </span>
                  <span className="text-sm text-gray-700 text-right font-medium">
                    {token.balance.toLocaleString()}
                  </span>
                </div>
              ))}

              {hasNextPage && (
                <button
                  onClick={fetchNextPage}
                  disabled={loading}
                  className="w-full py-2 text-sm text-hiero-600 hover:text-hiero-800 font-medium disabled:opacity-50"
                >
                  {loading ? "Loading more..." : "Load more tokens"}
                </button>
              )}

              <p className="text-xs text-gray-400 text-center pt-2">
                Showing {tokens.length} token{tokens.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </Card>

        <Card title="Code example">
          <CodeBlock
            code={`import { useMirrorQuery } from "@i-coders/hiero-react";
import type { MirrorTokenBalance } from "@i-coders/hiero-react";

function TokenList({ accountId }: { accountId: string }) {
  const { data, loading, hasNextPage, fetchNextPage } =
    useMirrorQuery<MirrorTokenBalance>(
      \`/api/v1/accounts/\${accountId}/tokens\`,
      "tokens"
    );

  return (
    <div>
      {data.map(t => (
        <p key={t.token_id}>{t.token_id}: {t.balance}</p>
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
