# Polyglotas Point System Analysis Report

## Overview

This report provides a comprehensive analysis of the point granting system implemented in the Polyglotas language learning application. The system is designed to gamify the learning experience through points, streaks, and various achievement-based rewards.

## Database Structure

### Core Tables

#### `user_points_log`
- **Purpose**: Tracks all point-awarding activities
- **Key Fields**:
  - `points_awarded`: Number of points given
  - `reason_code`: Identifier for the type of achievement
  - `activity_type`: Type of activity (dictation, pronunciation, chat)
  - `related_lesson_id`, `related_phrase_id`: Context information
  - `related_word_text`, `related_word_language_code`: Word-specific tracking

#### `student_profiles`
- **Purpose**: Stores user's current point total and streak
- **Key Fields**:
  - `points`: Current total points (CHECK constraint: points >= 0)
  - `current_streak_days`: Current consecutive learning days
  - `last_streak_date`: Last date streak was updated

## Point Awarding System

### 1. Pronunciation Activities

**Implementation**: `process_user_activity` database function (called from `/api/speech/attempt`)

**Point Values** (based on existing documentation):
- **High-Accuracy Pronunciation**: 1 point (≥90% accuracy)
- **First Try Bonus**: 1 point (≥95% accuracy on first attempt)
- **Comeback Bonus**: 1 point (≥85% accuracy on previously failed word)

**Scoring Metrics**:
- `accuracy_score`: Primary metric for pronunciation quality
- `fluency_score`: Speech flow assessment
- `completeness_score`: How much of the phrase was spoken
- `pronunciation_score`: Overall pronunciation quality
- `prosody_score`: Rhythm and intonation

### 2. Dictation Activities

**Implementation**: `process_user_activity` database function (called from `/api/dictation/attempt`)

**Point Logic**: Similar to pronunciation but based on text similarity
- Uses Levenshtein distance algorithm for accuracy calculation
- Character-level and word-level feedback generation
- Threshold: 70% similarity for "correct" classification

**Word-Level Tracking**: Updates `user_word_spelling` table for individual word progress

### 3. Word Practice Activities

**Implementation**: `process_word_practice_attempt` database function (called from `/api/words/attempt`)

**Features**:
- Tracks individual word pronunciation improvement
- Awards points for mastering previously difficult words
- Updates `user_word_pronunciation` table

### 4. Chat Activities

**Implementation**: `process_user_activity` and `process_chat_completion` functions (called from `/api/chat/conversations/[id]/messages`)

**Point Logic**:
- Points awarded for engaging with conversation prompts
- Completion bonus when all lesson prompts are addressed
- Streak maintenance through daily chat participation

### 5. Completion Bonuses

**Implementation**: Database functions (referenced but not fully visible in codebase)

**Documented Values**:
- **Lesson Completion**: 5 points (first-time completion)
- **Unit Completion**: 25 points (first-time completion)  
- **Level Completion**: 100 points (first-time completion)

**Implementation Note**: Uses `check_and_award_unit_completion_bonus` function mentioned in schema

## Streak System

### Daily Streak Logic
- **Maintenance**: Complete at least one practice session per day
- **Reset**: Missing a day resets streak to zero
- **Calculation**: Based on UTC date

### Streak Bonus Points (from documentation)
- **Days 1-7**: 1 point per day
- **Days 8-14**: 2 points per day  
- **Days 15-21**: 3 points per day
- **Pattern**: +1 point per day for each completed week

## Database Functions Analysis

### Core Functions (Referenced in Code)

1. **`process_user_activity`**
   - Central function for most point awarding
   - Parameters: profile_id, lesson_id, language_code, activity_type, phrase_id, scores, text data
   - Returns: points_awarded_total

2. **`process_word_practice_attempt`**
   - Specialized for individual word practice
   - Returns: word_completed, new_average_score, points_awarded, needs_practice

3. **`process_chat_completion`**
   - Awards points for completing chat conversations
   - Triggered when all lesson prompts are addressed

4. **`check_and_award_unit_completion_bonus`**
   - Mentioned in schema but implementation not visible
   - Likely awards the 25-point unit completion bonus

5. **`admin_fix_user_tier`** and **`update_user_subscription_tier`**
   - Administrative functions for tier management
   - May affect point earning rates or access to features

## Real-Time Updates

### Implementation
- **Supabase Realtime**: Listens to `student_profiles` table changes
- **Query Invalidation**: React Query cache invalidation on point updates
- **UI Animations**: Lottie animations for point/streak increases
- **Audio Feedback**: Coin chiming sound on point awards

### Components
- `AnimatedStats.tsx`: Full stats display with animations
- `CompactAnimatedStats.tsx`: Condensed version for mobile
- `useRealtimeUserStats.ts`: Real-time subscription hook

## Current Issues and Inconsistencies

### 1. Missing Function Implementations
- Several database functions are referenced but not defined in the schema
- `process_user_activity` parameters and exact logic unclear
- Streak bonus calculation implementation not visible

### 2. Incomplete Documentation Alignment
- Existing `point-system.md` describes point values but implementation details are unclear
- No clear mapping between reason_codes and point values
- Streak bonus implementation may not match documentation

### 3. Activity Type Coverage
- Three activity types defined: dictation, pronunciation, chat
- No clear point values for each activity type in code
- Word practice uses separate function with different logic

### 4. Threshold Inconsistencies
- Pronunciation: 90% for high accuracy, 95% for first try, 85% for comeback
- Dictation: 70% for "correct" classification
- Different scoring mechanisms may create unbalanced rewards

## Recommendations

### 1. Standardize Point Values
Create a centralized configuration for all point values:
```sql
CREATE TABLE point_rewards (
  reason_code VARCHAR PRIMARY KEY,
  activity_type activity_type_enum,
  points_awarded INTEGER,
  threshold_percentage NUMERIC,
  description TEXT
);
```

### 2. Implement Missing Functions
- Complete implementation of streak bonus calculation
- Add unit/lesson completion detection and rewards
- Standardize the `process_user_activity` function interface

### 3. Add Comprehensive Logging
- Log all point-awarding decisions with detailed reasoning
- Track threshold achievements and near-misses
- Add analytics for point system effectiveness

### 4. Balance Activity Rewards
- Review point values across different activities
- Ensure consistent difficulty-to-reward ratios
- Consider user engagement data for optimization

### 5. Enhanced Streak System
- Add streak recovery mechanisms (grace periods)
- Implement streak milestones with special rewards
- Consider timezone-aware streak calculation

### 6. Administrative Tools
- Expand `admin_fix_user_tier` functionality
- Add point adjustment capabilities for customer service
- Create point system analytics dashboard

## Technical Implementation Notes

### Database Constraints
- Points cannot be negative (CHECK constraint)
- All point awards are logged for audit trail
- Foreign key relationships ensure data integrity

### Performance Considerations
- Real-time updates may impact database performance
- Consider batching point calculations for high-volume activities
- Index optimization for point_log queries

### Security
- All point awarding goes through authenticated API endpoints
- Database functions use SECURITY DEFINER for controlled access
- User can only affect their own points through normal gameplay

## Conclusion

The Polyglotas point system is well-architected with proper separation of concerns and real-time feedback. However, several implementation gaps exist between the documented system and the actual code. The main priorities should be:

1. Complete the missing database function implementations
2. Standardize point values and thresholds across all activities  
3. Implement comprehensive streak bonus calculations
4. Add proper completion detection for lessons, units, and levels
5. Create administrative tools for system management and debugging

The foundation is solid, but these improvements would create a more consistent, balanced, and maintainable gamification system.