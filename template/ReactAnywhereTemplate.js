import React, { Component } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

class ReactAnywhereTemplate extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to ReactAnywhereTemplate!
        </Text>
        <Text style={styles.instructions}>
          Running on {Platform.OS} with react-anywhere.
        </Text>
        <Text style={styles.instructions}>
          To get started, edit ReactAnywhereTemplate.js{'\n'}
          Press Cmd+R to reload,{'\n'}
          Cmd+D or shake for dev menu and live reload
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

export default ReactAnywhereTemplate;
