<template>
  <v-container class="py-4">
    Space+Enter - Отправить
    <br />
    Ctrl+Enter - Проиграть заного
    <br />
    Space+Backspace - Это шум
    <v-card class="mb-4">

      <v-card-title @click="copy(audioId)">Аудио файл


        <small>
          {{ audioId }}
          <span class="text-green-lighten-1 ml-2" v-if="copied">
            Скопированно
          </span>
        </small>
      </v-card-title>

      <v-card-text>
        <audio ref="audioElement" controls autoplay v-if="audioSrc" :key="audioSrc">
          <source :src="audioSrc" type="audio/mpeg" />
          Ваш браузер не поддерживает элемент <code>audio</code>.
        </audio>

        <div v-else>Загрузка аудио...</div>
      </v-card-text>
    </v-card>

    <v-row class="mb-4" dense>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Выход нейронки</v-card-title>
          <v-card-text>
            <v-textarea v-model="neuralOutput" label="Текст" outlined readonly />
            <v-select v-model="neuralLanguage" :items="languages" label="Язык" outlined readonly />
            <div class="mt-2">
              <strong>Уверенность:</strong> {{ (languageProbability * 100).toFixed(2) }}%
              <v-progress-linear height="25" :model-value="(languageProbability * 100)" color="primary" class="mt-2">
                <strong>{{ Math.floor(languageProbability * 100) }}%</strong>
              </v-progress-linear>
            </div>
            <div class="mt-4">
              <strong>Транскрибировано:</strong> {{ transcripted ? 'Да' : 'Нет' }}
            </div>
            <div class="mt-4">
              <strong>Шум:</strong> {{ isNoise ? 'Да' : 'Нет' }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Решение человека</v-card-title>
          <v-card-text>
            <v-textarea v-model="userInput" label="Текст" outlined />
            <v-select v-model="userLanguage" :items="languages" label="Язык" outlined />
            <v-btn color="success" class="mt-4" block @click="handleSubmit">Отправить</v-btn>
            <v-btn color="warning" class="mt-4" block @click="handleNoise">Это шум</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-btn color="primary" block class="mt-4" @click="handleSkip">Пропустить</v-btn>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useMagicKeys, whenever, useActiveElement, useClipboard } from '@vueuse/core';

const BASE_URL = 'http://demogram.ru:8000'


const axiosInstance = axios.create({
  baseURL: BASE_URL
});
interface RandomAudioData {
  id: string;
  start_time: string;
  end_time: string | null;
  actor: {
    id: string;
    name: string;
  };
  transcripted: boolean;
  is_noise: boolean;
}

interface TranscriptEntry {
  id: string;
  text: string;
  start_time: string;
  end_time: string;
  actor: {
    id: string;
    name: string;
  };
  language: Language;
  language_prob: number;
}

interface ManualPayload {
  audio_file_id: string;
  text: string;
  language: Language;
  is_noise: boolean;
}

const languages = ['ru', 'pl', 'en', 'es', 'fr', 'unknown'] as const;
type Language = "ru" | "pl" | "en" | "es" | "fr" | "unknown";
const audioElement = ref<HTMLAudioElement | null>(null);
const audioSrc = ref<string>('');
const neuralOutput = ref<string>('');
const neuralLanguage = ref<Language>('ru');
const userInput = ref<string>('');
const userLanguage = ref<Language>('ru');
const transcripted = ref<boolean>(false);
const languageProbability = ref<number>(0);
const audioId = ref<string>('');
const isNoise = ref<boolean>(false);

const { copy, copied } = useClipboard({ source: audioId });

const activeElement = useActiveElement();
const isInputFocused = computed(() => {
  const tag = activeElement.value?.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea';
});

const keys = useMagicKeys();

const resetAudio = (): void => {
  if (audioElement.value) {
    audioElement.value.load();
  }
};

const resetForm = (): void => {
  audioSrc.value = '';
  neuralOutput.value = '';
  userInput.value = '';
  neuralLanguage.value = 'ru';
  transcripted.value = false;
  languageProbability.value = 0;
  audioId.value = '';
};

const fetchRandomAudio = async (): Promise<void> => {
  resetForm();
  try {
    const { data: randomData } = await axiosInstance.get<RandomAudioData>('/api/audio/random');
    audioId.value = randomData.id;
    transcripted.value = randomData.transcripted;
    isNoise.value = randomData.is_noise;
    audioSrc.value = `${BASE_URL}/api/audio/${audioId.value}?_=${Date.now()}`;
    const { data: transcript } = await axiosInstance.get<TranscriptEntry[]>(`/api/audio/${audioId.value}/transcript`);


    if (transcript && transcript.length > 0) {
      if (transcript.length > 1) {
        neuralOutput.value = transcript.map(item => item.text).join(' ');
      } else {
        neuralOutput.value = transcript[0].text;
      }

      const firstEntry = transcript[0];
      if (languages.includes(firstEntry.language)) {
        neuralLanguage.value = firstEntry.language;
      } else {
        neuralLanguage.value = 'unknown';
      }
      languageProbability.value = firstEntry.language_prob;
      userInput.value = neuralOutput.value
    }
    resetAudio();
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
  }
};

const handleSkip = async (): Promise<void> => {
  resetForm();
  await fetchRandomAudio();
};

const handleSubmit = async (): Promise<void> => {
  const payload: ManualPayload = {
    audio_file_id: audioId.value,
    text: userInput.value,
    language: userLanguage.value,
    is_noise: false
  };

  try {
    await axiosInstance.post<ManualPayload>('/api/manual', payload);
    await fetchRandomAudio();
  } catch (error) {
    console.error('Ошибка отправки данных:', error);
  }
};

const handleNoise = async (): Promise<void> => {
  const payload: ManualPayload = {
    audio_file_id: audioId.value,
    text: '',
    language: userLanguage.value,
    is_noise: true
  };

  try {
    await axios.post<ManualPayload>('http://demogram.ru:8000/api/manual', payload);
    await fetchRandomAudio();
  } catch (error) {
    console.error('Ошибка отправки данных:', error);
  }
};

whenever(() => keys['Space+Enter'].value && !isInputFocused.value, handleSubmit);
whenever(() => keys['Space+Backspace'].value && !isInputFocused.value, handleNoise);
whenever(() => keys['Ctrl+Enter'].value && !isInputFocused.value, () => {
  if (audioElement.value) {
    audioElement.value.currentTime = 0;
    audioElement.value.play();
  }
});
whenever(() => keys['Ctrl+Backspace'].value && !isInputFocused.value, handleSkip);

onMounted(() => {
  fetchRandomAudio();
});
</script>