export interface ProviderConfig {
  current_provider: string;
  available_providers: string[];
  current_model: string;
  available_models: Record<string, string[]>;
}

export interface UpdateProviderRequest {
  provider: string;
  api_key?: string;
  model?: string;
}
