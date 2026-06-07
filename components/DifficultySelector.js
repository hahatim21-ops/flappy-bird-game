import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const DIFFICULTY_OPTIONS = [
  {
    id: 'easy',
    name: 'Easy',
    description: 'Relaxed pace',
    color: '#4CAF50',
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Balanced challenge',
    color: '#FF9800',
  },
  {
    id: 'hard',
    name: 'Hard',
    description: 'Fast and tight gaps',
    color: '#F44336',
  },
];

/**
 * DifficultySelector Component
 *
 * Modal content for choosing single-player difficulty.
 * Styled to match the avatar picker modal in App.js.
 */
const DifficultySelector = ({ selectedDifficulty, onDifficultySelected, onCancel }) => {
  return (
    <View style={styles.content}>
      <Text style={styles.title}>Choose Level</Text>
      <Text style={styles.subtitle}>Select difficulty</Text>

      <View style={styles.optionsGrid}>
        {DIFFICULTY_OPTIONS.map((option) => {
          const isSelected = selectedDifficulty === option.id;

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                isSelected && styles.optionCardSelected,
                isSelected && { borderColor: option.color },
              ]}
              onPress={() => onDifficultySelected(option.id)}
              activeOpacity={0.85}
            >
              <View style={[styles.optionBadge, { backgroundColor: option.color }]}>
                <Text style={styles.optionBadgeText}>{option.name.charAt(0)}</Text>
              </View>
              <Text style={[styles.optionName, isSelected && { color: option.color }]}>
                {option.name}
              </Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {onCancel && (
        <TouchableOpacity style={styles.closeButton} onPress={onCancel} activeOpacity={0.85}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 320,
    maxWidth: 420,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 22,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  optionCard: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
    width: 100,
    minHeight: 118,
  },
  optionCardSelected: {
    backgroundColor: '#F4FFF4',
  },
  optionBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  optionBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 10,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 13,
  },
  closeButton: {
    backgroundColor: '#666666',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DifficultySelector;
