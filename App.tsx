import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import tw from 'twrnc';
import ConvoSection from './src/ConvoSection';

export default function App() {
  return (
    <View style={tw`flex-1`}>
      <SafeAreaView
        style={[
          tw`flex-1 flex-col`,
          {
            backgroundColor: '#fff',
          },
        ]}
      >
        <StatusBar style='auto' />
        <View style={{ flex: 1 }}>
          <ConvoSection />
        </View>
      </SafeAreaView>
    </View>
  );
}
