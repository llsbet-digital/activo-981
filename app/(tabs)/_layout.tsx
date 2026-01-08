import { Tabs, router } from "expo-router";
import { Home, Calendar, BarChart3, User, Plus } from "lucide-react-native";
import React from "react";
import { colors } from "@/constants/colors";
import { TouchableOpacity, View, StyleSheet } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.backgroundCard,
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500' as const,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Home 
              color={color} 
              size={24} 
              fill={focused ? color : 'transparent'}
              strokeWidth={focused ? 2 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color }) => <Calendar color={color} size={24} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="add-workout"
        options={{
          title: '',
          tabBarIcon: () => null,
          tabBarButton: () => (
            <View style={styles.fabContainer}>
              <TouchableOpacity 
                style={styles.fabButton}
                onPress={() => router.push('/add-activity' as any)}
                activeOpacity={0.8}
              >
                <Plus color="#FFFFFF" size={28} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) => <BarChart3 color={color} size={24} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User color={color} size={24} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 4,
    borderColor: colors.backgroundCard,
  },
});
