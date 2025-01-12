<template>
  <v-container class="py-4">
    <v-card class="mb-4">
      <v-card-title>Аудио файл
        <small>
          {{ audioId }}
        </small>
      </v-card-title>

      <v-card-text>
        <audio controls v-if="audioSrc" :key="audioSrc">
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

            <div class="mt-4">
              <strong>Уверенность:</strong> {{ languageProbability.toFixed(2) * 100 }}%
            </div>
            <div>
              <strong>Транскрибировано:</strong> {{ transcripted ? 'Да' : 'Нет' }}
            </div>
            <div>
              <strong>Это шум:</strong> {{ isNoise ? 'Да' : 'Нет' }}
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

            <v-btn-toggle v-model="decision" mandatory class="mt-4">
              <v-btn value="correct">Нейронка права</v-btn>
              <v-btn value="noise">Это шум</v-btn>
            </v-btn-toggle>
            <v-btn color="success" class="mt-4" block @click="handleSubmit">Отправить</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>


    <v-btn color="primary" block class="mt-4" @click="handleSkip">Пропустить</v-btn>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const audioSrc = ref('');
const neuralOutput = ref('');
const neuralLanguage = ref('ru');
const userInput = ref('');
const userLanguage = ref('ru');
const decision = ref('correct');
const transcripted = ref(false);
const isNoise = ref(false);
const languageProbability = ref(0);
const audioId = ref('');

const languages = [
  'ru',
  'pl',
  'eng',
  'es',
  'fr'
]

const resetAudio = () => {
  const audioElement = document.querySelector('audio');
  if (audioElement) {
    audioElement.load();
  }
};

const fetchRandomAudio = async () => {
  try {
    const { data: randomData } = await axios.get('http://demogram.ru:8000/api/audio/random');
    audioId.value = randomData.id;
    transcripted.value = randomData.transcripted;
    isNoise.value = randomData.is_noise;
    audioSrc.value = `http://demogram.ru:8000/api/audio/${audioId.value}?_=${Date.now()}`;
    const { data: transcript } = await axios.get(`http://demogram.ru:8000/api/audio/${audioId.value}/transcript`);
    if (transcript.length > 0) {
      const firstEntry = transcript[0];
      neuralOutput.value = firstEntry.text;
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
  audioSrc.value = '';
  await fetchRandomAudio();
};

const handleSubmit = async () => {
  const payload = {
    audio_file_id: audioId.value,
    text: userInput.value,
    language: userLanguage.value,
    is_noise: isNoise.value
  };

  try {
    await axios.post('http://demogram.ru:8000/api/manual', payload);
    await fetchRandomAudio();
  } catch (error) {
    console.error('Ошибка отправки данных:', error);
  }
};

onMounted(() => {
  fetchRandomAudio();
});
</script>
