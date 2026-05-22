import { SafeAreaView, Text, View } from "react-native";

export default function App(): JSX.Element {
  return (
    <SafeAreaView>
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: "700" }}>Revie</Text>
        <Text style={{ marginTop: 12 }}>Mobile MVP starter is ready.</Text>
      </View>
    </SafeAreaView>
  );
}
