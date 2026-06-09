// mobile/src/components/PlaceAutocomplete.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { placesService, PlaceSuggestion, PlaceDetails } from '../services/placesService';
import { useColors } from '../hooks/useColors';
import { debounce } from '../utils/debounce';

interface PlaceAutocompleteProps {
  label: string;
  placeholder?: string;
  onPlaceSelected: (details: PlaceDetails) => void;
  error?: string;
  containerStyle?: any;
  initialValue?: string;
  testID?: string;
}

export const PlaceAutocomplete: React.FC<PlaceAutocompleteProps> = ({
  label,
  placeholder,
  onPlaceSelected,
  error,
  containerStyle,
  initialValue = '',
  testID,
}) => {
  const colors = useColors();
  const [input, setInput] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const ignoreNextSearch = useRef(false);

  // Atualizar input quando initialValue mudar
  useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
    }
  }, [initialValue]);

  // Debounce para evitar muitas requisições
  useEffect(() => {
    // Se devemos ignorar esta busca (porque veio de uma seleção)
    if (ignoreNextSearch.current) {
      ignoreNextSearch.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (input.length >= 3 && showSuggestions) {
        searchPlaces(input);
      } else if (input.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [input]);

  const searchPlaces = async (query: string) => {
    setLoading(true);
    try {
      const results = await placesService.searchPlaces(query);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Erro ao buscar lugares:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlace = async (suggestion: PlaceSuggestion) => {
    // Marcar para ignorar a próxima busca
    ignoreNextSearch.current = true;

    // Fechar teclado
    Keyboard.dismiss();

    // Esconder sugestões e atualizar input imediatamente
    setShowSuggestions(false);
    setSuggestions([]);
    setInput(suggestion.description);

    // Buscar detalhes do lugar em background
    try {
      const details = await placesService.getPlaceDetails(suggestion.placeId);
      if (details) {
        onPlaceSelected(details);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do lugar:', error);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
            error ? { borderColor: colors.error || '#DC2626' } : null,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={input}
          onChangeText={(text) => {
            setInput(text);
            setShowSuggestions(true);
          }}
          autoCapitalize="words"
          autoCorrect={false}
          testID={testID}
          accessibilityLabel={testID}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.error || '#DC2626' }]}>{error}</Text>
      ) : null}

      {showSuggestions && suggestions.length > 0 ? (
        <View
          style={[
            styles.suggestionsContainer,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <ScrollView
            style={styles.suggestionsList}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="always"
          >
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.placeId}
                style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                onPress={() => handleSelectPlace(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.mainText, { color: colors.text }]}>{item.mainText}</Text>
                <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>
                  {item.secondaryText}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {showSuggestions && suggestions.length === 0 && !loading && input.length >= 3 ? (
        <View
          style={[
            styles.noResults,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
            Nenhum resultado encontrado
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1000,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    // color aplicado dinamicamente
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    // backgroundColor, borderColor, color aplicados dinamicamente
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    // borderColor aplicado dinamicamente
  },
  loadingContainer: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  errorText: {
    // color aplicado dinamicamente
    fontSize: 14,
    marginTop: 4,
  },
  suggestionsContainer: {
    // backgroundColor, borderColor aplicados dinamicamente
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    // borderBottomColor aplicado dinamicamente
  },
  mainText: {
    fontSize: 16,
    fontWeight: '600',
    // color aplicado dinamicamente
    marginBottom: 2,
  },
  secondaryText: {
    fontSize: 14,
    // color aplicado dinamicamente
  },
  noResults: {
    // backgroundColor, borderColor aplicados dinamicamente
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    padding: 16,
  },
  noResultsText: {
    fontSize: 14,
    // color aplicado dinamicamente
    textAlign: 'center',
  },
});
