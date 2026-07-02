import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { theme } from '../theme/theme';
import { CommunityScreen } from '../screens/CommunityScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ShowcaseScreen } from '../screens/ShowcaseScreen';
import { useFriendsStore } from '../store/useFriendsStore';

export type RootTabParamList = {
  Leitura: undefined;
  Vitrine: undefined;
  Comunidade: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICONS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Leitura: 'book-outline',
  Vitrine: 'grid-outline',
  Comunidade: 'people-outline',
  Perfil: 'person-outline',
};

/** Navegação principal do app, pós-login: Leitura / Vitrine / Comunidade / Perfil. */
export function RootTabs() {
  const pendingCount = useFriendsStore((s) => s.pendingCount);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name as keyof RootTabParamList]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Leitura" component={HomeScreen} />
      <Tab.Screen name="Vitrine" component={ShowcaseScreen} />
      <Tab.Screen
        name="Comunidade"
        component={CommunityScreen}
        options={{ tabBarBadge: pendingCount > 0 ? pendingCount : undefined }}
      />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
