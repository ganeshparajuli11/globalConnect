import { StyleSheet, Text, View } from "react-native";
import React, { useEffect } from "react";
import { actions, RichEditor, RichToolbar } from "react-native-pell-rich-editor";
import { theme } from "../constants/theme";

const TextEditor = ({ editorRef, onChange, initialContent }) => {
  useEffect(() => {
    if (initialContent && editorRef.current) {
      editorRef.current.setContentHTML(initialContent);
    }
  }, [initialContent]);

  return (
    <View style={{ minHeight: 285 }}>
      <RichToolbar
        actions={[
          actions.setStrikethrough,
          actions.removeFormat,
          actions.setBold,
          actions.setItalic,
          actions.insertOrderedList,
          actions.blockquote,
          actions.alignCenter,
          actions.alignLeft,
          actions.alignRight,
          actions.code,
          actions.line,
          actions.heading1,
          actions.heading2,
        ]}
        style={styles.richBar}
        flatContainerStyle={styles.flatStyle}
        selectedIconTint={theme.colors.primary}
        editor={editorRef}
        disabled={false}
        iconMap={{
          [actions.heading1]: ({ tintColor }) => (
            <Text style={{ color: tintColor }}>H1</Text>
          ),
          [actions.heading4]: ({ tintColor }) => (
            <Text style={{ color: tintColor }}>H4</Text>
          ),
        }}
      />

      <RichEditor
        ref={editorRef}
        containerStyle={styles.rich}
        editorStyle={styles.contentStyle}
        placeholder={"Share your knowledge..."}
        onChange={onChange}
        initialContentHTML={initialContent}
      />
    </View>
  );
};

export default TextEditor;

const styles = StyleSheet.create({
    richBar: {
      borderTopRightRadius: theme.radius.xl,
      borderTopLeftRadius: theme.radius.xl,
      backgroundColor: theme.colors.gray
    },
    flatStyle: {
      paddingHorizontal: 8,
      gap: 3,
    
    },
    rich:{
        minHeight:240,
        flex:1,
        borderWidth: 1.5,
        borderBottomLeftRadius: theme.radius.xl,
        borderBottomRightRadius: theme.radius.xl,
        borderColor: theme.colors.gray,
        padding: 5,
    },
    contentStyle: {
        color: theme.colors.text,
        placeholderColor: 'gray'
    }
  
});
