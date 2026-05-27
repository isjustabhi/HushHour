import Link from "next/link";

export default function CrisisLink() {
  return (
    <Link
      href="/crisis"
      className="text-sm underline underline-offset-4"
      style={{ color: "var(--hush-crisis)" }}
    >
      I&apos;m in crisis right now
    </Link>
  );
}
