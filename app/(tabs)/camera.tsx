import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import { Button, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CameraScreen() {
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');
  const [capturedPhotos, setCapturedPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const cameraRef = useRef<any>(null);

  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    loadPhotos();
  }, [permission]);

  const loadPhotos = async () => {
    const album = await MediaLibrary.getAlbumAsync('Camera');
    if (album) {
      const { assets } = await MediaLibrary.getAssetsAsync({
        album,
        mediaType: 'photo',
        sortBy: 'creationTime',
      });
      setCapturedPhotos(assets.reverse());
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      const asset = await MediaLibrary.createAssetAsync(photo.uri);
      setCapturedPhotos((prev) => [asset, ...prev]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    await MediaLibrary.deleteAssetsAsync(selectedIds);
    setSelectedIds([]);
    loadPhotos();
  };

  const shareSelected = async () => {
    if (!(await Sharing.isAvailableAsync())) return;
    for (let id of selectedIds) {
      const asset = capturedPhotos.find((photo) => photo.id === id);
      if (asset) {
        await Sharing.shareAsync(asset.uri);
      }
    }
  };

  if (!permission) {
    return <View><Text>Requesting permissions...</Text></View>;
  }

  if (!permission.granted) {
    return <View><Text>No access to camera or media library</Text></View>;
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={cameraType} ref={cameraRef}>
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <Text style={styles.text}>📸</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => setCameraType(
            cameraType === 'back' ? 'front' : 'back')}>
            <Text style={styles.text}>🔄</Text>
          </TouchableOpacity>
        </View>
      </CameraView>

      <View style={styles.actions}>
        <Button title="Delete Selected" color="red" onPress={deleteSelected} />
        <Button title="Share Selected" onPress={shareSelected} />
      </View>

      <FlatList
        data={capturedPhotos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ padding: 4 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggleSelect(item.id)}>
            <Image
              source={{ uri: item.uri }}
              style={[
                styles.thumbnail,
                selectedIds.includes(item.id) && styles.selected
              ]}
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { height: 300 },
  cameraControls: {
    flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', marginBottom: 10,
  },
  button: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 50,
  },
  text: { fontSize: 20 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  thumbnail: {
    width: 110,
    height: 110,
    margin: 2,
    borderRadius: 6,
  },
  selected: {
    borderWidth: 3,
    borderColor: 'blue',
  },
});
