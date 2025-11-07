import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { BORDER_RADIUS } from '../constants/theme';

export const UserAvatar = ({ uri, size = 40, onPress }) => {
  const Container = onPress ? TouchableOpacity : View;
  
  if (!uri) {
    return (
      <Container 
        onPress={onPress} 
        style={[
          styles.placeholderContainer, 
          { width: size, height: size, borderRadius: size / 2 }
        ]}
      >
        <Text style={{ fontSize: size * 0.5 }}>👤</Text>
      </Container>
    );
  }

  return (
    <Container onPress={onPress} style={[styles.container, { width: size, height: size }]}>
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholderContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
