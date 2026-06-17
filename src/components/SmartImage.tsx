import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

interface SmartImageProps {
  uri?: string | null;
  fallbackUri?: string;
  style: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export const SmartImage: React.FC<SmartImageProps> = ({
  uri,
  fallbackUri,
  style,
  containerStyle,
  resizeMode = 'cover',
}) => {
  const normalizedUri = useMemo(() => {
    if (typeof uri !== 'string' || uri.trim().length === 0) {
      return fallbackUri || '';
    }

    return uri.startsWith('http://') ? uri.replace('http://', 'https://') : uri;
  }, [uri, fallbackUri]);

  const [currentUri, setCurrentUri] = useState(normalizedUri);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentUri(normalizedUri);
    setLoading(true);
  }, [normalizedUri]);

  return (
    <View style={[styles.container, containerStyle]}>
      {currentUri ? (
        <Image
          source={{ uri: currentUri, cache: 'force-cache' }}
          style={style}
          resizeMode={resizeMode}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            if (fallbackUri && currentUri !== fallbackUri) {
              setCurrentUri(fallbackUri);
              return;
            }
            setLoading(false);
          }}
          fadeDuration={120}
          progressiveRenderingEnabled
        />
      ) : (
        <View style={[style, styles.empty]} />
      )}

      {loading && <ActivityIndicator style={styles.loader} size="small" color="#999" />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    position: 'absolute',
  },
  empty: {
    backgroundColor: '#E6E6E6',
  },
});
