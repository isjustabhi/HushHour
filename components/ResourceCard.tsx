import Link from "next/link";

interface ResourceCardProps {
  title: string;
  subtitle: string;
  href: string;
}

export default function ResourceCard({ title, subtitle, href }: ResourceCardProps) {
  const isExternal = href.startsWith("http") || href.startsWith("tel:") || href.startsWith("sms:");

  if (isExternal) {
    return (
      <a
        href={href}
        className="block rounded-xl border border-white/10 bg-[var(--hush-bg-elevated)] px-4 py-3"
      >
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-[var(--hush-muted)]">{subtitle}</p>
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="block rounded-xl border border-white/10 bg-[var(--hush-bg-elevated)] px-4 py-3"
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-[var(--hush-muted)]">{subtitle}</p>
    </Link>
  );
}
