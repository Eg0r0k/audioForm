import axios, { type AxiosInstance } from "axios";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: "http://demogram.ru:8000",
});

export interface RandomAudioData {
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

type Language = "ru" | "pl" | "en" | "es" | "fr" | "unknown";
export interface TranscriptEntry {
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

export interface ManualPayload {
  audio_file_id: string;
  text: string;
  language: Language;
  is_noise: boolean;
}

export const fetchRandomAudio = async (): Promise<RandomAudioData> => {
  const response = await axiosInstance.get<RandomAudioData>(
    "/api/audio/random"
  );
  return response.data;
};

export const fetchTranscript = async (
  id: string
): Promise<TranscriptEntry[]> => {
  const response = await axiosInstance.get<TranscriptEntry[]>(
    `/api/audio/${id}/transcript`
  );
  return response.data;
};

export const submitManualData = async (
  payload: ManualPayload
): Promise<void> => {
  await axiosInstance.post("/api/manual", payload);
};
