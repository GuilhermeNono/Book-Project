import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FriendListItem } from '../../application/use-cases/friends/GetFriends';
import { PublicProfile } from '../../domain/entities/PublicProfile';
import { ChatModal } from '../components/ChatModal';
import { PublicShowcaseView } from '../components/PublicShowcaseView';
import { ReadMatchModal } from '../components/ReadMatchModal';
import { theme } from '../theme/theme';
import { useCommunityStore } from '../store/useCommunityStore';
import { useFriendsStore } from '../store/useFriendsStore';

const SEARCH_DEBOUNCE_MS = 400;

type ViewMode = 'friends' | 'requests' | 'search';

/** Comunidade: amigos, pedidos de amizade e busca de usuários (vitrine pública, chat, Read Match). */
export function CommunityScreen() {
  const [view, setView] = useState<ViewMode>('friends');
  const [chatFriend, setChatFriend] = useState<PublicProfile | null>(null);
  const [readMatchFriend, setReadMatchFriend] = useState<PublicProfile | null>(null);
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    friends,
    incomingRequests,
    outgoingRequests,
    loading,
    initialized,
    error: friendsError,
    init,
    sendRequest,
    accept,
    decline,
    remove,
  } = useFriendsStore();
  const {
    results,
    searching,
    error: communityError,
    search,
    clearSearch,
    openPublicShowcase,
  } = useCommunityStore();

  useEffect(() => {
    if (!initialized) {
      init();
    }
  }, [initialized, init]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChangeQuery = (text: string) => {
    setQuery(text);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (!text.trim()) {
      clearSearch();
      return;
    }
    debounceRef.current = setTimeout(() => search(text), SEARCH_DEBOUNCE_MS);
  };

  const friendIds = new Set(friends.map((f) => f.userId));
  const outgoingIds = new Set(outgoingRequests.map((f) => f.userId));
  const incomingIds = new Set(incomingRequests.map((f) => f.userId));

  const toPublicProfile = (item: { userId: string; displayName: string | null; avatarUrl: string | null }): PublicProfile => ({
    userId: item.userId,
    displayName: item.displayName,
    avatarUrl: item.avatarUrl,
  });

  const error = friendsError ?? communityError;

  if (!initialized) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Comunidade</Text>
        <View style={styles.segmented}>
          <SegmentButton label="Amigos" active={view === 'friends'} onPress={() => setView('friends')} />
          <SegmentButton
            label="Pedidos"
            active={view === 'requests'}
            badge={incomingRequests.length}
            onPress={() => setView('requests')}
          />
          <SegmentButton label="Buscar" active={view === 'search'} onPress={() => setView('search')} />
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {view === 'friends' ? (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={theme.colors.primary} style={styles.listLoading} />
            ) : (
              <Text style={styles.emptyHint}>
                Você ainda não tem amigos. Busque alguém na aba &quot;Buscar&quot;.
              </Text>
            )
          }
          renderItem={({ item }) => (
            <FriendRow
              item={item}
              onOpenShowcase={() => openPublicShowcase(toPublicProfile(item))}
              onChat={() => setChatFriend(toPublicProfile(item))}
              onReadMatch={() => setReadMatchFriend(toPublicProfile(item))}
              onRemove={() => remove(item.userId)}
            />
          )}
        />
      ) : view === 'requests' ? (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionTitle}>Recebidos</Text>
          {incomingRequests.length === 0 ? (
            <Text style={styles.emptyHint}>Nenhum pedido recebido.</Text>
          ) : (
            incomingRequests.map((item) => (
              <RequestRow
                key={item.userId}
                item={item}
                onAccept={() => accept(item.userId)}
                onDecline={() => decline(item.userId)}
              />
            ))
          )}

          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Enviados</Text>
          {outgoingRequests.length === 0 ? (
            <Text style={styles.emptyHint}>Nenhum pedido enviado.</Text>
          ) : (
            outgoingRequests.map((item) => (
              <OutgoingRequestRow key={item.userId} item={item} onCancel={() => decline(item.userId)} />
            ))
          )}
        </ScrollView>
      ) : (
        <>
          <TextInput
            value={query}
            onChangeText={handleChangeQuery}
            placeholder="Buscar por nome de exibição..."
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
          />
          <FlatList
            data={results}
            keyExtractor={(item) => item.userId}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              searching ? (
                <ActivityIndicator color={theme.colors.primary} style={styles.listLoading} />
              ) : query.trim().length > 0 ? (
                <Text style={styles.emptyHint}>Nenhum usuário encontrado.</Text>
              ) : (
                <Text style={styles.emptyHint}>Busque pelo nome de exibição de alguém.</Text>
              )
            }
            renderItem={({ item }) => (
              <SearchResultRow
                profile={item}
                relation={
                  friendIds.has(item.userId)
                    ? 'friend'
                    : outgoingIds.has(item.userId)
                      ? 'outgoing'
                      : incomingIds.has(item.userId)
                        ? 'incoming'
                        : 'none'
                }
                onAddFriend={() => sendRequest(item.userId)}
                onOpenShowcase={() => openPublicShowcase(item)}
                onChat={() => setChatFriend(item)}
                onReadMatch={() => setReadMatchFriend(item)}
              />
            )}
          />
        </>
      )}

      <PublicShowcaseView />
      <ChatModal friend={chatFriend} onClose={() => setChatFriend(null)} />
      <ReadMatchModal friend={readMatchFriend} onClose={() => setReadMatchFriend(null)} />
    </SafeAreaView>
  );
}

function SegmentButton({
  label,
  active,
  badge,
  onPress,
}: {
  label: string;
  active: boolean;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.segment, active && styles.segmentActive, pressed && styles.pressed]}
    >
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
      {badge ? (
        <View style={styles.segmentBadge}>
          <Text style={styles.segmentBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function Avatar({ url }: { url: string | null }) {
  return url ? (
    <Image source={{ uri: url }} style={styles.avatar} />
  ) : (
    <View style={[styles.avatar, styles.avatarPlaceholder]}>
      <Ionicons name="person" size={18} color={theme.colors.textMuted} />
    </View>
  );
}

function FriendRow({
  item,
  onOpenShowcase,
  onChat,
  onReadMatch,
  onRemove,
}: {
  item: FriendListItem;
  onOpenShowcase: () => void;
  onChat: () => void;
  onReadMatch: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.row}>
      <Avatar url={item.avatarUrl} />
      <Text style={styles.rowName} numberOfLines={1}>
        {item.displayName ?? 'Sem nome'}
      </Text>
      <View style={styles.rowActions}>
        <IconAction icon="albums-outline" onPress={onOpenShowcase} label="Vitrine" />
        <IconAction icon="chatbubble-outline" onPress={onChat} label="Conversar" />
        <IconAction icon="stats-chart-outline" onPress={onReadMatch} label="Read Match" />
        <IconAction icon="person-remove-outline" onPress={onRemove} label="Desfazer" />
      </View>
    </View>
  );
}

function IconAction({
  icon,
  onPress,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={6} style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}>
      <Ionicons name={icon} size={18} color={theme.colors.primary} accessibilityLabel={label} />
    </Pressable>
  );
}

function RequestRow({
  item,
  onAccept,
  onDecline,
}: {
  item: FriendListItem;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <View style={styles.row}>
      <Avatar url={item.avatarUrl} />
      <Text style={styles.rowName} numberOfLines={1}>
        {item.displayName ?? 'Sem nome'}
      </Text>
      <View style={styles.rowActions}>
        <Pressable onPress={onAccept} style={({ pressed }) => [styles.acceptButton, pressed && styles.pressed]}>
          <Text style={styles.acceptButtonText}>Aceitar</Text>
        </Pressable>
        <Pressable onPress={onDecline} style={({ pressed }) => [styles.declineButton, pressed && styles.pressed]}>
          <Text style={styles.declineButtonText}>Recusar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function OutgoingRequestRow({ item, onCancel }: { item: FriendListItem; onCancel: () => void }) {
  return (
    <View style={styles.row}>
      <Avatar url={item.avatarUrl} />
      <Text style={styles.rowName} numberOfLines={1}>
        {item.displayName ?? 'Sem nome'}
      </Text>
      <Text style={styles.pendingLabel}>Pendente</Text>
      <Pressable onPress={onCancel} style={({ pressed }) => [styles.declineButton, pressed && styles.pressed]}>
        <Text style={styles.declineButtonText}>Cancelar</Text>
      </Pressable>
    </View>
  );
}

function SearchResultRow({
  profile,
  relation,
  onAddFriend,
  onOpenShowcase,
  onChat,
  onReadMatch,
}: {
  profile: PublicProfile;
  relation: 'friend' | 'outgoing' | 'incoming' | 'none';
  onAddFriend: () => void;
  onOpenShowcase: () => void;
  onChat: () => void;
  onReadMatch: () => void;
}) {
  return (
    <View style={styles.row}>
      <Avatar url={profile.avatarUrl} />
      <Text style={styles.rowName} numberOfLines={1}>
        {profile.displayName ?? 'Sem nome'}
      </Text>
      <View style={styles.rowActions}>
        <IconAction icon="albums-outline" onPress={onOpenShowcase} label="Vitrine" />
        {relation === 'friend' ? (
          <>
            <IconAction icon="chatbubble-outline" onPress={onChat} label="Conversar" />
            <IconAction icon="stats-chart-outline" onPress={onReadMatch} label="Read Match" />
          </>
        ) : relation === 'outgoing' ? (
          <Text style={styles.pendingLabel}>Convite pendente</Text>
        ) : relation === 'incoming' ? (
          <Text style={styles.pendingLabel}>Convite recebido</Text>
        ) : (
          <Pressable onPress={onAddFriend} style={({ pressed }) => [styles.acceptButton, pressed && styles.pressed]}>
            <Text style={styles.acceptButtonText}>Adicionar</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.font.title,
    fontWeight: '800',
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
  },
  segmentActive: {
    backgroundColor: theme.colors.primaryMuted,
  },
  segmentText: {
    color: theme.colors.textMuted,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: theme.colors.text,
  },
  segmentBadge: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  segmentBadgeText: {
    color: theme.colors.background,
    fontSize: 11,
    fontWeight: '800',
  },
  error: {
    color: theme.colors.accent,
    fontSize: theme.font.caption,
    paddingHorizontal: theme.spacing.lg,
  },
  input: {
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.font.body,
  },
  list: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  listLoading: {
    marginTop: theme.spacing.lg,
  },
  emptyHint: {
    color: theme.colors.textMuted,
    fontSize: theme.font.body,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.font.heading,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  sectionTitleSpaced: {
    marginTop: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceMuted,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowName: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconAction: {
    padding: theme.spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  acceptButtonText: {
    color: theme.colors.text,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  declineButton: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  declineButtonText: {
    color: theme.colors.textMuted,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  pendingLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.font.caption,
  },
});
