import { useState } from "react";
import { SafeAreaView, Text, View, Pressable } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function App(): JSX.Element {
  const [tokenStatus, setTokenStatus] = useState<string>("Not signed in");
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  const callbackUri = Linking.createURL("auth/callback");

  async function signIn(provider: "google" | "apple" | "linkedin"): Promise<void> {
    const startUrl = `${apiBaseUrl}/auth/${provider}/start?callbackUri=${encodeURIComponent(callbackUri)}`;
    const result = await WebBrowser.openAuthSessionAsync(startUrl, callbackUri);

    if (result.type === "success" && result.url) {
      const parsed = Linking.parse(result.url);
      const accessToken = typeof parsed.queryParams?.accessToken === "string" ? parsed.queryParams.accessToken : "";
      setTokenStatus(accessToken ? "Signed in successfully" : "Sign-in returned no token");
      return;
    }

    setTokenStatus("Sign-in canceled or failed");
  }

  return (
    <SafeAreaView>
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: "700" }}>Revie</Text>
        <Text style={{ marginTop: 12 }}>Sign in with a real provider:</Text>
        <View style={{ marginTop: 16, gap: 10 }}>
          <Pressable
            onPress={() => signIn("google")}
            style={{ padding: 12, borderWidth: 1, borderRadius: 8, borderColor: "#222" }}
          >
            <Text>Continue with Google</Text>
          </Pressable>
          <Pressable
            onPress={() => signIn("apple")}
            style={{ padding: 12, borderWidth: 1, borderRadius: 8, borderColor: "#222" }}
          >
            <Text>Continue with Apple</Text>
          </Pressable>
          <Pressable
            onPress={() => signIn("linkedin")}
            style={{ padding: 12, borderWidth: 1, borderRadius: 8, borderColor: "#222" }}
          >
            <Text>Continue with LinkedIn</Text>
          </Pressable>
        </View>
        <Text style={{ marginTop: 16 }}>{tokenStatus}</Text>
      </View>
    </SafeAreaView>
  );
}
