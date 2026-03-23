"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Balance" },
  { href: "/tokens", label: "Tokens" },
  { href: "/transfer", label: "Transfer" },
  { href: "/mirror", label: "Mirror Node" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-center">
        <span className="text-xs font-medium text-amber-800">
          Demo — Testnet only — Do not use real credentials
        </span>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-hiero-400 flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">hiero-enterprise-react</h1>
            <p className="text-xs text-gray-500">Sample App — Hedera Testnet</p>
          </div>
        </div>
        <nav className="flex gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                pathname === link.href
                  ? "bg-hiero-50 text-hiero-800 font-medium"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
