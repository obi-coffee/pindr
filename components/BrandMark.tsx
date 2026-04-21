import { View } from 'react-native';
import { PindrLogo } from './ui';

// Centered Pindr logo + "Match. Play." tagline, used at the top of auth
// and onboarding screens.
export function BrandMark() {
  return (
    <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 24 }}>
      <PindrLogo height={32} withTagline />
    </View>
  );
}
