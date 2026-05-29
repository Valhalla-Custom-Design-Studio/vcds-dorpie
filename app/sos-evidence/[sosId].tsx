import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/theme';
import { PlatinumCard, ScreenHeader, PlatinumButton } from '@/components/ui';
import { sosAPI, uploadAPI } from '@/services/api';

export default function SOSEvidence() {
  const { sosId } = useLocalSearchParams<{ sosId: string }>();
  const router = useRouter();
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, allowsMultipleSelection: true });
    if (!res.canceled) setImages(r => [...r, ...res.assets]);
  };

  const camera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Camera permission required'); return; }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All });
    if (!res.canceled) setImages(r => [...r, res.assets[0]]);
  };

  const upload = async () => {
    if (images.length === 0) { router.back(); return; }
    setUploading(true);
    try {
      for (const img of images) {
        const { data: presign } = await uploadAPI.presign(img.fileName || 'evidence.jpg', img.mimeType || 'image/jpeg');
        await fetch(presign.data.upload_url, { method: 'PUT', body: await fetch(img.uri).then(r => r.blob()) });
        await uploadAPI.confirm(presign.data.file_id);
        await sosAPI.addEvidence(sosId!, presign.data.file_id);
      }
      Alert.alert('✅ Evidence uploaded!');
      router.back();
    } catch { Alert.alert('Upload failed. Please try again.'); }
    finally { setUploading(false); }
  };

  return (
    <View style={s.container}>
      <ScreenHeader title="Add SOS Evidence" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={[Typography.body, { color: Colors.textMuted, marginBottom: 16 }]}>
          Add photos or videos to help community members identify the threat.
        </Text>
        <View style={s.btnRow}>
          <TouchableOpacity onPress={camera} style={s.mediaBtn}>
            <Ionicons name="camera" size={28} color={Colors.primary} />
            <Text style={[Typography.caption, { marginTop: 4 }]}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pick} style={s.mediaBtn}>
            <Ionicons name="images" size={28} color={Colors.primary} />
            <Text style={[Typography.caption, { marginTop: 4 }]}>Gallery</Text>
          </TouchableOpacity>
        </View>
        {images.length > 0 && (
          <PlatinumCard style={{ marginTop: 16 }}>
            <Text style={Typography.bodySemi}>{images.length} file{images.length !== 1 ? 's' : ''} selected</Text>
            {images.map((img, i) => (
              <Text key={i} style={[Typography.caption, { color: Colors.textMuted }]}>{img.fileName || `File ${i + 1}`}</Text>
            ))}
          </PlatinumCard>
        )}
        <PlatinumButton label={images.length === 0 ? 'Skip' : 'Upload Evidence'} onPress={upload} loading={uploading} style={{ marginTop: 24 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 16, paddingBottom: 32 },
  btnRow: { flexDirection: 'row', gap: 16 },
  mediaBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 24,
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
});
