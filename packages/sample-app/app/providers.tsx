"use client";

import { HieroProvider } from "@i-coders/hiero-react";
import { getHieroConfig } from "@/lib/config";

const config = getHieroConfig();

export function Providers({ children }: { children: React.ReactNode }) {
  if (!config.operatorId || !config.operatorKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 max-w-lg text-center">
          <h2 className="text-lg font-semibold text-amber-800 mb-2">
            Configuration needed
          </h2>
          <p className="text-amber-700 text-sm mb-4">
            Create a <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">.env.local</code> file
            in the sample-app directory with your Hedera testnet credentials:
          </p>
          <pre className="bg-gray-900 text-green-400 text-xs text-left rounded-lg p-4 overflow-x-auto">
{`NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_HEDERA_ACCOUNT_ID=0.0.YOUR_ID
NEXT_PUBLIC_HEDERA_PRIVATE_KEY=YOUR_DER_KEY`}
          </pre>
          <p className="text-amber-600 text-xs mt-3">
            Get testnet credentials at{" "}
            <a href="https://portal.hedera.com" className="underline" target="_blank" rel="noopener">
              portal.hedera.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return <HieroProvider config={config}>{children}</HieroProvider>;
}
