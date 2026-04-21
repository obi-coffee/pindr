import { Image, Modal, View } from 'react-native';
import type { Candidate } from '../lib/discover/queries';
import { Button, Typography, colors } from './ui';

type MatchModalProps = {
  match: Candidate | null;
  myPhotoUrl: string | null;
  onKeepSwiping: () => void;
};

export function MatchModal({
  match,
  myPhotoUrl,
  onKeepSwiping,
}: MatchModalProps) {
  const theirPhoto = match?.photo_urls[0];
  const name = match?.display_name ?? 'they';

  return (
    <Modal
      visible={match !== null}
      transparent={false}
      animationType="fade"
      onRequestClose={onKeepSwiping}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.moss,
          paddingHorizontal: 28,
          paddingVertical: 64,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ marginTop: 24 }}>
          <Typography
            variant="caption"
            color="stone"
            style={{ marginBottom: 16 }}
          >
            moment
          </Typography>
          <Typography variant="display-lg" color="paper">
            you found{'\n'}your people.
          </Typography>
          <Typography
            variant="body-lg"
            color="stone"
            style={{ marginTop: 16 }}
          >
            {name} locked in too. group chat's open — pick a tee time and pull
            up.
          </Typography>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
          }}
        >
          <Avatar uri={myPhotoUrl} />
          <Typography variant="h1" color="stone">
            ⛳
          </Typography>
          <Avatar uri={theirPhoto ?? null} />
        </View>

        <View>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={onKeepSwiping}
          >
            Keep swiping
          </Button>
        </View>
      </View>
    </Modal>
  );
}

function Avatar({ uri }: { uri: string | null }) {
  return (
    <View
      style={{
        width: 108,
        height: 108,
        borderRadius: 999,
        overflow: 'hidden',
        backgroundColor: colors['moss-soft'],
        borderWidth: 3,
        borderColor: colors.paper,
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ flex: 1 }} resizeMode="cover" />
      ) : null}
    </View>
  );
}
