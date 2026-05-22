import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";

export default function AuthCallbackPage(): JSX.Element {
  const router = useRouter();
  const accessToken = useMemo(() => {
    if (!router.isReady) {
      return "";
    }
    const value = router.query.accessToken;
    return typeof value === "string" ? value : "";
  }, [router.isReady, router.query.accessToken]);

  const userId = useMemo(() => {
    if (!router.isReady) {
      return "";
    }
    const value = router.query.userId;
    return typeof value === "string" ? value : "";
  }, [router.isReady, router.query.userId]);

  useEffect(() => {
    if (accessToken) {
      window.localStorage.setItem("revie_access_token", accessToken);
    }
  }, [accessToken]);

  return (
    <>
      <Head>
        <title>Revie - Auth Callback</title>
      </Head>
      <main style={{ maxWidth: 720, margin: "40px auto", fontFamily: "sans-serif" }}>
        <h1>Signed in</h1>
        <p>{accessToken ? "Access token saved to local storage." : "No access token was returned."}</p>
        <p>{userId ? `User: ${userId}` : "User id not available."}</p>
      </main>
    </>
  );
}
