// mobile/src/components/PhotoPicker.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { photoService } from '../services/photoService';
import { useColors } from '../hooks/useColors';
import { useMySubscription } from '../hooks/useSubscription';
import { showAlert } from './CustomAlert';

interface PhotoPickerProps {
  onPhotosSelected?: (urls: string[]) => void;
  maxPhotos?: number;
  itineraryId?: string;
  existingPhotos?: string[];
  onUpgradePress?: () => void;
}

export const PhotoPicker: React.FC<PhotoPickerProps> = ({
  onPhotosSelected,
  maxPhotos = 10,
  itineraryId,
  existingPhotos = [],
  onUpgradePress,
}) => {
  const colors = useColors();
  const { data: subscriptionData } = useMySubscription();
  const [photos, setPhotos] = useState<string[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const currentPlan = subscriptionData?.subscription?.plan || 'free';
  
  // Determinar limite de fotos baseado no plano (vem de subscription.planDetails)
  const photoLimit = subscriptionData?.subscription?.planDetails?.limits?.photos || 0;

  // Atualizar fotos quando existingPhotos mudar (ao recarregar o roteiro)
  useEffect(() => {
    console.log('📸 PhotoPicker - Atualizando fotos existentes:', existingPhotos.length);
    setPhotos(existingPhotos);
  }, [existingPhotos]);

  const handleAddPhoto = async () => {
    try {
      // Verificar se o plano permite upload de fotos
      if (photoLimit === 0) {
        showAlert(
          'Recurso Premium',
          'Upload de fotos está disponível apenas para assinantes Premium (até 20 fotos) e Pro (até 50 fotos).',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Ver Planos',
              onPress: () => {
                onUpgradePress?.();
              }
            }
          ]
        );
        return;
      }
      
      if (photos.length >= photoLimit) {
        showAlert(
          'Limite Atingido',
          `Você atingiu o limite de ${photoLimit} fotos por roteiro do plano ${currentPlan.toUpperCase()}. Faça upgrade para adicionar mais fotos!`,
          [
            { text: 'OK', style: 'cancel' },
            {
              text: 'Ver Planos',
              onPress: () => {
                onUpgradePress?.();
              }
            }
          ]
        );
        return;
      }

      photoService.showImagePickerOptions(
        async () => {
          try {
            const uri = await photoService.takePhoto();
            if (uri) {
              await uploadPhoto(uri);
            }
          } catch (error) {
            console.error('Erro ao tirar/enviar foto:', error);
          }
        },
        async () => {
          try {
            const remainingSlots = photoLimit - photos.length;
            const uris = await photoService.pickMultipleFromGallery(remainingSlots);
            if (uris.length > 0) {
              await uploadPhotos(uris);
            }
          } catch (error) {
            console.error('Erro ao selecionar/enviar fotos:', error);
          }
        }
      );
    } catch (error) {
      console.error('Erro ao abrir seletor de fotos:', error);
      showAlert('Erro', 'Não foi possível abrir o seletor de fotos. Tente novamente.');
    }
  };

  const uploadPhoto = async (uri: string, retries = 2) => {
    try {
      setUploading(true);
      const result = await photoService.uploadPhoto(uri, itineraryId);
      setUploading(false);

      if (result && typeof result === 'string') {
        const newPhotos = [...photos, result];
        setPhotos(newPhotos);
        onPhotosSelected?.(newPhotos);
        showAlert('Sucesso', 'Foto adicionada com sucesso!');
      } else {
        showAlert('Erro', 'Não foi possível fazer upload da foto. Tente novamente.');
      }
    } catch (error: any) {
      setUploading(false);
      
      // Verificar se é erro de limite de plano
      if (error?.response?.status === 403 && error?.response?.data?.error === 'limit_reached') {
        console.log('ℹ️ Limite de fotos atingido:', error.response.data);
        showAlert(
          'Limite Atingido',
          error.response.data.message || 'Você atingiu o limite de fotos do seu plano.',
          [
            { text: 'Ver Planos', onPress: () => onUpgradePress?.() },
            { text: 'OK', style: 'cancel' }
          ]
        );
      } else if (error?.message?.includes('Network request failed') && retries > 0) {
        // Retry automático em caso de perda de conexão
        console.log(`⚠️ Upload falhou por network, tentando novamente... (${retries} tentativas restantes)`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1 segundo
        return uploadPhoto(uri, retries - 1);
      } else {
        // Log do erro mas não quebra a UI
        console.error('Erro ao fazer upload:', error);
        showAlert(
          'Erro no Upload',
          error?.message?.includes('Network request failed')
            ? 'Upload falhou. Certifique-se de manter o app aberto durante o upload e verifique sua conexão.'
            : 'Ocorreu um erro ao fazer upload da foto. Verifique sua conexão e tente novamente.'
        );
      }
    }
  };

  const uploadPhotos = async (uris: string[]) => {
    try {
      setUploading(true);
      
      // Aviso para não sair do app
      if (uris.length > 5) {
        showAlert(
          'Upload em Andamento',
          `Enviando ${uris.length} fotos. Por favor, mantenha o app aberto durante o processo.`
        );
      }
      
      const results = await photoService.uploadMultiplePhotos(
        uris,
        itineraryId,
        (current, total) => {
          setUploadProgress({ current, total });
        }
      );
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });

      if (results.length > 0) {
        const newPhotos = [...photos, ...results];
        setPhotos(newPhotos);
        onPhotosSelected?.(newPhotos);
        showAlert('Sucesso', `${results.length} foto(s) adicionada(s) com sucesso!`);
      } else {
        showAlert('Erro', 'Não foi possível fazer upload das fotos. Tente novamente.');
      }
    } catch (error: any) {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      
      // Verificar se é erro de limite de plano
      if (error?.response?.status === 403 && error?.response?.data?.error === 'limit_reached') {
        console.log('ℹ️ Limite de fotos atingido:', error.response.data);
        showAlert(
          'Limite Atingido',
          error.response.data.message || 'Você atingiu o limite de fotos do seu plano.',
          [
            { text: 'Ver Planos', onPress: () => onUpgradePress?.() },
            { text: 'OK', style: 'cancel' }
          ]
        );
      } else {
        // Log do erro mas não quebra a UI
        console.error('Erro ao fazer upload:', error);
        showAlert(
          'Erro no Upload',
          error?.message?.includes('Network request failed')
            ? 'Upload falhou. Certifique-se de manter o app aberto durante o upload e verifique sua conexão.'
            : 'Ocorreu um erro ao fazer upload das fotos. Verifique sua conexão e tente novamente.'
        );
      }
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    onPhotosSelected?.(newPhotos);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Fotos</Text>
        <Text style={[styles.counter, { color: colors.textSecondary }]}>
          {photos.length}/{photoLimit}
          {photoLimit === 0 && ' (Premium)'}
        </Text>
      </View>

      {uploading && uploadProgress.total > 0 && (
        <View style={[styles.uploadWarning, { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]}>
          <Text style={[styles.uploadWarningText, { color: colors.primary }]}>
            ⚠️ Enviando fotos... Mantenha o app aberto
          </Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
        {photos.map((photo, index) => (
          <View key={index} style={styles.photoContainer}>
            <Image source={{ uri: photo }} style={[styles.photo, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={[styles.removeButton, { backgroundColor: colors.error || '#DC2626' }]}
              onPress={() => removePhoto(index)}
            >
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {photos.length < photoLimit && (
          <TouchableOpacity
            style={[styles.addButton, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={handleAddPhoto}
            disabled={uploading}
          >
            {uploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                {uploadProgress.total > 0 && (
                  <Text style={[styles.uploadingText, { color: colors.textSecondary }]}>
                    {uploadProgress.current}/{uploadProgress.total}
                  </Text>
                )}
              </View>
            ) : (
              <>
                <Text style={[styles.addIcon, { color: colors.textSecondary }]}>+</Text>
                <Text style={[styles.addText, { color: colors.textSecondary }]}>Adicionar</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        
        {photoLimit === 0 && (
          <TouchableOpacity
            style={[styles.upgradeButton, { borderColor: colors.primary, backgroundColor: `${colors.primary}15` }]}
            onPress={onUpgradePress}
          >
            <Text style={[styles.upgradeIcon, { color: colors.primary }]}>⭐</Text>
            <Text style={[styles.upgradeText, { color: colors.primary }]}>Upgrade{'\n'}Premium</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    // color aplicado dinamicamente
  },
  counter: {
    fontSize: 14,
    // color aplicado dinamicamente
  },
  uploadWarning: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  uploadWarningText: {
    fontSize: 12,
    fontWeight: '500',
  },
  photosScroll: {
    flexDirection: 'row',
  },
  photoContainer: {
    marginRight: 12,
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    // backgroundColor aplicado dinamicamente
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    // backgroundColor aplicado dinamicamente
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    // borderColor, backgroundColor aplicados dinamicamente
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 32,
    // color aplicado dinamicamente
    marginBottom: 4,
  },
  addText: {
    fontSize: 12,
    // color aplicado dinamicamente
  },
  uploadingContainer: {
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 12,
    // color aplicado dinamicamente
    marginTop: 8,
  },
  upgradeButton: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  upgradeText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
