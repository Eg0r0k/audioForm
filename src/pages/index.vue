<template>
  <v-container class="py-4">
    Space+Enter - Отправить
    <br />
    Ctrl+Enter - Проиграть заного
    <br />
    Space+Backspace - Это шум
    <v-card class="mb-4">
      <v-card-title>Аудио файл
        <small>
          {{ audioId }}
        </small>
      </v-card-title>

      <v-card-text>
        <audio ref="audioElement" controls autoplay v-if="audioSrc" :key="audioSrc">
          <source :src="audioSrc" type="audio/mpeg" />
          Ваш браузер не поддерживает элемент <code>audio</code>.
        </audio>

        <div v-else>Загрузка аудио...</div>
      </v-card-text>
      <AvMedia :media="audioSrc" type="vbar"></AvMedia>
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
import { useMagicKeys, whenever, useActiveElement } from '@vueuse/core';

const audioElement = ref<HTMLAudioElement | null>(null);
const audioSrc = ref('');
const neuralOutput = ref('');
const neuralLanguage = ref('ru');
const userInput = ref('');
const userLanguage = ref('ru');
const transcripted = ref(false);
const languageProbability = ref(0);
const audioId = ref('');
const isNoise = ref(false)
const languages = [
  'ru',
  'pl',
  'en',
  'es',
  'fr'
];

const activeElement = useActiveElement();
const isInputFocused = computed(() => {
  const tag = activeElement.value?.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea';
});

const keys = useMagicKeys();



const resetAudio = () => {
  if (audioElement.value) {
    audioElement.value.load();
  }
};

const resetForm = () => {
  audioSrc.value = '';
  neuralOutput.value = '';
  userInput.value = '';
  neuralLanguage.value = 'ru';
  transcripted.value = false;
  languageProbability.value = 0;
  audioId.value = '';
};

const fetchRandomAudio = async () => {
  resetForm();
  try {
    const { data: randomData } = await axios.get('http://demogram.ru:8000/api/audio/random');
    audioId.value = randomData.id;
    transcripted.value = randomData.transcripted;
    isNoise.value = randomData.is_noise
    audioSrc.value = `http://demogram.ru:8000/api/audio/${audioId.value}?_=${Date.now()}`;
    const { data: transcript } = await axios.get(`http://demogram.ru:8000/api/audio/${audioId.value}/transcript`);

    if (transcript && transcript.length > 0) {
      if (transcript.length > 1) {
        neuralOutput.value = transcript.map(item => item.text).join('');
      } else {
        neuralOutput.value = transcript[0].text;
      }

      const firstEntry = transcript[0];
      if (languages.includes(firstEntry.language)) {
        neuralLanguage.value = firstEntry.language;
      } else {
        neuralLanguage.value = 'unknown';
      }

      userInput.value = neuralOutput.value;
      languageProbability.value = firstEntry.language_prob;
    }
    resetAudio();
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
  }
};

const handleSkip = async () => {
  resetForm();
  await fetchRandomAudio();
};

const handleSubmit = async () => {
  const payload = {
    audio_file_id: audioId.value,
    text: userInput.value,
    language: userLanguage.value,
    is_noise: false
  };

  try {
    await axios.post('http://demogram.ru:8000/api/manual', payload);
    await fetchRandomAudio();
  } catch (error) {
    console.error('Ошибка отправки данных:', error);
  }
};

const handleNoise = async () => {
  const payload = {
    audio_file_id: audioId.value,
    text: '',
    language: userLanguage.value,
    is_noise: true
  };

  try {
    await axios.post('http://demogram.ru:8000/api/manual', payload);
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
whenever(() => keys['Ctrl+Backspace'].value && !isInputFocused.value, handleSkip)


onMounted(() => {
  fetchRandomAudio();
});
</script>