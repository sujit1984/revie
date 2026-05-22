import Head from "next/head";

export default function HomePage(): JSX.Element {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  const callbackUri = "http://localhost:3000/auth/callback";

  const authLinks = ["google", "apple", "linkedin"].map((provider) => ({
    provider,
    href: `${apiBaseUrl}/auth/${provider}/start?callbackUri=${encodeURIComponent(callbackUri)}`
  }));

  return (
    <>
      <Head>
        <title>Revie - Honest Reviews</title>
      </Head>
      <main style={{ maxWidth: 720, margin: "40px auto", fontFamily: "sans-serif" }}>
        <h1>Revie</h1>
        <p>The Honest Review platform starter is live.</p>
        <p>Sign in with a real social provider using the API OAuth flow:</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {authLinks.map((link) => (
            <a
              key={link.provider}
              href={link.href}
              style={{
                display: "inline-block",
                padding: "10px 16px",
                border: "1px solid #222",
                borderRadius: 8,
                textTransform: "capitalize",
                textDecoration: "none",
                color: "#111"
              }}
            >
              Continue with {link.provider}
            </a>
          ))}
        </div>
      </main>
    </>
  );
}
