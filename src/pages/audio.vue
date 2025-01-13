<template>
    <v-container>
        <v-row>
            <v-col cols="6">
                <v-text-field label="Audio ID" v-model="audioId" placeholder="ID Аудио"></v-text-field>
            </v-col>
            <v-col cols="3">
                <v-btn :disabled="isLoading" @click="fetchAudio">Загрузить аудио</v-btn>
                <v-btn class="ml-2" @click="resetForm">Отчистить форму</v-btn>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <v-alert v-if="fetchStatus" type="info">{{ fetchStatus }}</v-alert>
                <v-progress-linear v-if="isLoading" indeterminate></v-progress-linear>
            </v-col>
        </v-row>
        <v-row v-if="audioSrc">
            <v-col cols="12">
                <audio ref="audioElement" controls :src="audioSrc" type="audio/mpeg" @loadedmetadata="onLoadedMetadata"
                    @error="onError">
                    Загрузка аудио...
                </audio>
            </v-col>
        </v-row>
    </v-container>
</template>
<script setup lang="ts">
import { ref, nextTick, onUnmounted } from 'vue';

const audioId = ref('');
const audioSrc = ref('');
const audioElement = ref<HTMLAudioElement | null>(null);
const fetchStatus = ref('');
const isLoading = ref(false);

const fetchAudio = async () => {
    fetchStatus.value = '';
    if (!audioId.value) {
        fetchStatus.value = 'Введи ID!.';
        return;
    }

    isLoading.value = true;
    audioSrc.value = `http://demogram.ru:8000/api/audio/${audioId.value}?_=${Date.now()}`;
    fetchStatus.value = 'Сосал?';

    await nextTick();
    if (audioElement.value) {
        audioElement.value.addEventListener('loadedmetadata', onLoadedMetadata);
        audioElement.value.addEventListener('error', onError);
    }
};

const onLoadedMetadata = () => {
    fetchStatus.value = 'ГОООООЛ!';
    isLoading.value = false;

};

const onError = () => {
    fetchStatus.value = 'Не получилось загрузить Аудио, анлак(.';
    isLoading.value = false;
};

const resetForm = () => {
    audioId.value = '';
    fetchStatus.value = '';
    isLoading.value = false;
};


onUnmounted(() => {
    if (audioElement.value) {
        audioElement.value.removeEventListener('loadedmetadata', onLoadedMetadata);
        audioElement.value.removeEventListener('error', onError);
    }
});
</script>