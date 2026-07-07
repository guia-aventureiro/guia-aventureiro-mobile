// mobile/src/services/photoService.ts
import * as ImagePicker from 'expo-image-picker';
import { Platform, Alert } from 'react-native';
import env from '../config/env';
import analyticsService from './analyticsService';
import { showAlert } from '../components/CustomAlert';
import api from './api';

interface UploadResult {
  url: string;
  publicId: string;
}

interface DeletePhotoResult {
  success: boolean;
  message: string;
}

class PhotoService {
  /**
   * Solicita permissões de câmera e galeria
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true; // Web não precisa de permissões
    }

    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
      showAlert(
        'Permissões necessárias',
        'Precisamos de acesso à câmera e galeria para você adicionar fotos aos seus roteiros.'
      );
      return false;
    }

    return true;
  }

  /**
   * Abre a câmera para tirar uma foto
   */
  async takePhoto(): Promise<string | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Desabilitado para evitar problemas no emulador
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      return result.assets[0].uri;
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      showAlert('Erro', 'Não foi possível tirar a foto.');
      return null;
    }
  }

  /**
   * Abre a galeria para selecionar uma foto
   */
  async pickFromGallery(): Promise<{ uri: string } | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      return { uri: result.assets[0].uri };
    } catch (error) {
      console.error('Erro ao selecionar foto:', error);
      showAlert('Erro', 'Não foi possível selecionar a foto.');
      return null;
    }
  }

  /**
   * Seleciona múltiplas fotos da galeria
   */
  async pickMultipleFromGallery(max: number = 10): Promise<string[]> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return [];

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: max,
        quality: 0.8,
      });

      if (result.canceled) {
        return [];
      }

      return result.assets.map((asset) => asset.uri);
    } catch (error) {
      console.error('Erro ao selecionar fotos:', error);
      showAlert('Erro', 'Não foi possível selecionar as fotos.');
      return [];
    }
  }

  /**
   * Faz upload de uma foto para o backend (que enviará ao Cloudinary)
   */
  async uploadPhoto(uri: string, itineraryId?: string): Promise<string | null> {
    try {
      if (!uri) {
        throw new Error('URI da foto não fornecida');
      }

      // Criar FormData
      const formData = new FormData();

      // Adicionar imagem
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('photo', {
        uri: Platform.OS === 'web' ? uri : uri,
        name: filename,
        type,
      } as any);

      if (itineraryId) {
        formData.append('itineraryId', itineraryId);
      }

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Analytics: foto enviada
      await analyticsService.logPhotoUpload(1, 'camera');

      return response.data.url; // Retorna apenas a URL
    } catch (error: any) {
      if (error?.response?.status) {
        const errorData = error.response.data || {};
        if (error.response.status === 403 && errorData.error === 'limit_reached') {
        } else {
        }
      }
      throw error; // Lança o erro para ser tratado pelo chamador
    }
  }

  /**
   * Faz upload de múltiplas fotos
   */
  async uploadMultiplePhotos(
    uris: string[],
    itineraryId?: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<string[]> {
    const results: string[] = [];

    for (let i = 0; i < uris.length; i++) {
      if (onProgress) {
        onProgress(i + 1, uris.length);
      }

      const result = await this.uploadPhoto(uris[i], itineraryId);
      if (result && typeof result === 'string') {
        results.push(result);
      }
    }

    // Analytics: múltiplas fotos enviadas
    if (results.length > 0) {
      await analyticsService.logPhotoUpload(results.length, 'gallery');
    }

    return results;
  }

  /**
   * Remove foto de um roteiro de forma persistente
   */
  async deletePhoto(photoUrl: string, itineraryId?: string): Promise<DeletePhotoResult> {
    try {
      if (!photoUrl || !itineraryId) {
        return {
          success: false,
          message: 'Não foi possível identificar a foto para remoção.',
        };
      }

      await api.delete('/upload', {
        data: {
          itineraryId,
          photoUrl,
        },
      });

      await analyticsService.logPhotoDelete(photoUrl);
      return {
        success: true,
        message: 'Foto removida com sucesso.',
      };
    } catch (error) {
      const message = (error as any)?.response?.data?.message;
      return {
        success: false,
        message: message || 'Não foi possível remover a foto agora. Tente novamente em instantes.',
      };
    }
  }

  /**
   * Mostra opções para escolher câmera ou galeria
   */
  showImagePickerOptions(onTakePhoto: () => void, onPickFromGallery: () => void): void {
    if (Platform.OS === 'web') {
      // No web, apenas permitir seleção de arquivo
      onPickFromGallery();
      return;
    }

    // Usar Alert nativo para evitar problemas com callbacks assíncronos
    Alert.alert(
      'Adicionar foto',
      'Escolha uma opção',
      [
        {
          text: 'Tirar foto',
          onPress: onTakePhoto,
        },
        {
          text: 'Escolher da galeria',
          onPress: onPickFromGallery,
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }
}

export const photoService = new PhotoService();
