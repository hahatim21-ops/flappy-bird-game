/**
 * Game Data Functions
 * 
 * This file contains functions to save and retrieve game data from Supabase.
 * Use these functions in your game to save scores, get statistics, etc.
 */

import { supabase } from './supabase';

/**
 * Save a game score to Supabase
 * 
 * @param {number} score - The final score
 * @param {number} pipesPassed - Number of pipes passed (usually same as score)
 * @returns {Promise<Object|null>} - Returns the saved score ID or null if error
 */
export const saveScore = async (score, pipesPassed = 0) => {
  try {
    // Use the database function to save score and update stats
    const { data, error } = await supabase.rpc('save_score_and_update_stats', {
      p_score: score,
      p_pipes_passed: pipesPassed || score, // Default to score if not provided
    });

    if (error) {
      console.error('Error saving score:', error);
      return null;
    }

    console.log('✅ Score saved successfully!', data);
    return data;
  } catch (err) {
    console.error('Error saving score:', err);
    return null;
  }
};

/**
 * Get current user's game statistics
 * 
 * @returns {Promise<Object|null>} - Returns user stats or null if error
 */
export const getUserStats = async () => {
  try {
    const { data, error } = await supabase.rpc('get_user_stats');

    if (error) {
      console.error('Error getting user stats:', error);
      return null;
    }

    if (data && data.length > 0) {
      return data[0]; // Return first (and only) result
    }

    // If no stats exist yet, return default values
    return {
      total_games: 0,
      total_score: 0,
      best_score: 0,
      total_pipes_passed: 0,
    };
  } catch (err) {
    console.error('Error getting user stats:', err);
    return null;
  }
};

/**
 * Get top scores for leaderboard
 * 
 * @param {number} limit - Number of top scores to retrieve (default: 10)
 * @returns {Promise<Array>} - Returns array of top scores
 */
export const getLeaderboard = async (limit = 10) => {
  try {
    const { data, error } = await supabase.rpc('get_top_scores', {
      p_limit: limit,
    });

    if (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error getting leaderboard:', err);
    return [];
  }
};

/**
 * Get current user's recent scores
 * 
 * @param {number} limit - Number of scores to retrieve (default: 10)
 * @returns {Promise<Array>} - Returns array of user's scores
 */
export const getUserScores = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting user scores:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error getting user scores:', err);
    return [];
  }
};

/**
 * Get current user's best score
 * 
 * @returns {Promise<number>} - Returns best score or 0
 */
export const getBestScore = async () => {
  try {
    const stats = await getUserStats();
    return stats ? stats.best_score : 0;
  } catch (err) {
    console.error('Error getting best score:', err);
    return 0;
  }
};

/**
 * Get current user's total games played
 * 
 * @returns {Promise<number>} - Returns total games or 0
 */
export const getTotalGames = async () => {
  try {
    const stats = await getUserStats();
    return stats ? stats.total_games : 0;
  } catch (err) {
    console.error('Error getting total games:', err);
    return 0;
  }
};
