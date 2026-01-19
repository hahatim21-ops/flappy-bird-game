import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * DifficultySelector Component
 * 
 * Allows players to select difficulty level before starting single-player game
 * 
 * Props:
 * - onDifficultySelected: function(difficulty) - Called when a difficulty is selected
 * - onCancel: function() - Called when user cancels selection
 */
const DifficultySelector = ({ onDifficultySelected, onCancel }) => {
  return (
    <View style={styles.container}>
      <View style={styles.overlay} />
      <View style={styles.modal}>
        <Text style={styles.title}>Select Difficulty</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.easyButton]}
          onPress={() => onDifficultySelected('easy')}
        >
          <Text style={styles.buttonText}>EASY</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.mediumButton]}
          onPress={() => onDifficultySelected('medium')}
        >
          <Text style={styles.buttonText}>MEDIUM</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.hardButton]}
          onPress={() => onDifficultySelected('hard')}
        >
          <Text style={styles.buttonText}>HARD</Text>
        </TouchableOpacity>

        {onCancel && (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: 300,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },
  easyButton: {
    backgroundColor: '#4CAF50', // Green
  },
  mediumButton: {
    backgroundColor: '#FF9800', // Orange
  },
  hardButton: {
    backgroundColor: '#F44336', // Red
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    marginTop: 10,
    minHeight: 50,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
  },
});

export default DifficultySelector;
