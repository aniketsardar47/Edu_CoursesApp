import { View } from 'react-native';
import VideoPlayer from './video/VideoPlayer';

export default function Body() {
  return (
    <View style={{ flex: 1 }}>
      <VideoPlayer />
    </View>
  );
}
