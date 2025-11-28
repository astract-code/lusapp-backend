import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Modal,
  Pressable 
} from 'react-native';

export const FloatingActionButton = ({ 
  onPress, 
  icon = '+',
  actions = [],
  position = 'bottom-right',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    if (actions.length > 0) {
      toggleExpand();
    } else if (onPress) {
      onPress();
    }
  };

  const toggleExpand = () => {
    const toValue = isExpanded ? 0 : 1;
    
    Animated.parallel([
      Animated.spring(rotateAnim, {
        toValue,
        useNativeDriver: true,
        speed: 20,
        bounciness: 5,
      }),
      Animated.timing(fadeAnim, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setIsExpanded(!isExpanded);
  };

  const handleActionPress = (action) => {
    toggleExpand();
    if (action.onPress) {
      action.onPress();
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const positionStyle = {
    'bottom-right': { bottom: 24, right: 24 },
    'bottom-left': { bottom: 24, left: 24 },
    'bottom-center': { bottom: 24, alignSelf: 'center', right: '50%', marginRight: -28 },
  };

  return (
    <>
      {isExpanded && (
        <Modal transparent visible={isExpanded} animationType="none">
          <Pressable style={styles.overlay} onPress={toggleExpand}>
            <View style={[styles.actionsContainer, positionStyle[position]]}>
              {actions.map((action, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.actionItem,
                    {
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleActionPress(action)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.actionLabelContainer}>
                      <Text style={styles.actionLabel}>{action.label}</Text>
                    </View>
                    <View style={[styles.actionIcon, { backgroundColor: action.color || '#10B981' }]}>
                      <Text style={styles.actionIconText}>{action.icon}</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Pressable>
        </Modal>
      )}

      <Animated.View 
        style={[
          styles.container, 
          positionStyle[position],
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <Animated.Text 
            style={[
              styles.icon, 
              { transform: [{ rotate: rotation }] }
            ]}
          >
            {icon}
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

export const SimpleFAB = ({ onPress, icon = '+', color = '#10B981' }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        styles.simplePosition,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <TouchableOpacity
        style={[styles.button, { backgroundColor: color }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Text style={styles.icon}>{icon}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
  },
  simplePosition: {
    bottom: 24,
    right: 24,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  icon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 90,
    alignItems: 'flex-end',
  },
  actionItem: {
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionLabelContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionIconText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});
