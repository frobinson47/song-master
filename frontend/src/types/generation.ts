export interface GenerateSongRequest {
  user_input: string;
  song_name: string | null;
  persona: string | null;
  use_local: boolean;
}

export interface JobResponse {
  job_id: string;
  status: string;
  websocket_url: string;
}

export interface ProgressUpdate {
  job_id: string;
  step: string;
  step_index: number;
  total_steps: number;
  message: string;
  percentage: number;
  timestamp: string;
}

export interface JobStatus {
  job_id: string;
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  result: any;
  error: string | null;
}
