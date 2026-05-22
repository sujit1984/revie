import Head from "next/head";

export default function HomePage(): JSX.Element {
  return (
    <>
      <Head>
        <title>Revie - Honest Reviews</title>
      </Head>
      <main style={{ maxWidth: 720, margin: "40px auto", fontFamily: "sans-serif" }}>
        <h1>Revie</h1>
        <p>The Honest Review platform starter is live.</p>
        <p>Next step: wire search, hierarchy browsing, and review posting.</p>
      </main>
    </>
  );
}
