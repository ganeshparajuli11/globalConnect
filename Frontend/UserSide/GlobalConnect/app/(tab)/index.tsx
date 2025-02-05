import React from "react";
import { SafeAreaView, TextInput, View } from "react-native";
import Posts from "./Post"; 
import SearchPost from "./SearchPost";

const Index = () => {
  const [searchQuery, setSearchQuery] = React.useState("");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", padding: 10 }}>
      <TextInput
        placeholder="Search..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 10,
          borderRadius: 5,
          marginBottom: 10,
        }}
      />
      {searchQuery.length > 0 ? <SearchPost /> : <Posts />} 
    </SafeAreaView>
  );
};

export default Index;
