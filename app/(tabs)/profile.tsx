import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Target, Activity, Settings, Award, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { profile, activities } = useApp();
  const { signOut } = useAuth();

  const completedActivities = activities.filter((a) => a.completed);

  const handleEditProfile = () => {
    Alert.alert('Coming Soon', 'Profile editing will be available soon!');
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'Settings screen coming soon!');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              router.replace('/login');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileHeader}>
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <User color={colors.text} size={48} />
            </LinearGradient>
            <Text style={styles.name}>{profile?.name || 'Athlete'}</Text>
            <Text style={styles.level}>
              {profile?.level?.charAt(0).toUpperCase() + (profile?.level?.slice(1) || '')} Level
            </Text>
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedActivities.length}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={[styles.statItem, styles.statItemBorder]}>
              <Text style={styles.statValue}>{profile?.weeklyTarget || 0}</Text>
              <Text style={styles.statLabel}>Weekly Goal</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{activities.length}</Text>
              <Text style={styles.statLabel}>Total Activities</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fitness Goal</Text>
            <View style={styles.goalCard}>
              <View style={styles.goalIcon}>
                <Target color={colors.primary} size={24} />
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>{profile?.goal || 'Not set'}</Text>
                <Text style={styles.goalSubtitle}>Your main fitness objective</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferred Activities</Text>
            <View style={styles.activitiesContainer}>
              {profile?.preferredActivities && profile.preferredActivities.length > 0 ? (
                profile.preferredActivities.map((activity, index) => (
                  <View key={index} style={styles.activityChip}>
                    <Activity color={colors.primary} size={16} />
                    <Text style={styles.activityChipText}>
                      {activity.charAt(0).toUpperCase() + activity.slice(1)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No preferred activities set</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity style={styles.actionCard} onPress={handleSettings}>
              <View style={styles.actionIcon}>
                <Settings color={colors.primary} size={24} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Settings</Text>
                <Text style={styles.actionSubtitle}>Manage your preferences</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => Alert.alert('Achievements', 'View all your achievements!')}
            >
              <View style={styles.actionIcon}>
                <Award color={colors.success} size={24} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Achievements</Text>
                <Text style={styles.actionSubtitle}>View your milestones</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => Alert.alert('About', 'FitTrack v1.0\nYour personal fitness companion')}
            >
              <View style={styles.actionIcon}>
                <Info color={colors.warning} size={24} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>About</Text>
                <Text style={styles.actionSubtitle}>App information</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.signOutCard]}
              onPress={handleSignOut}
            >
              <View style={styles.actionInfo}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  level: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCard,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  goalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  activitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  signOutCard: {
    backgroundColor: colors.error,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
