export interface Category {
  id: string
  name: string
  description: string
  color: string
  created_at: string
  updated_at: string
}

export interface Prompt {
  id: string
  title: string
  description: string
  content: string
  category_id: string | null
  category?: Category
  tags: string
  is_favorite: boolean
  prompt_type: 'user' | 'system'
  created_at: string
  updated_at: string
}

export interface PromptVersion {
  id: string
  prompt_id: string
  version_number: number
  content: string
  change_description: string
  created_at: string
}

export interface AIConfig {
  id: string
  name: string
  provider: string
  api_endpoint: string
  models: string
  max_tokens: number
  temperature: number
  top_p: number
  is_active: boolean
  has_api_key: boolean
  created_at: string
  updated_at: string
}

export interface KnowledgeArticle {
  id: string
  title: string
  content: string
  description: string
  category_id: string | null
  category?: Category
  tags: string
  author: string
  source_url: string
  word_count: number
  reading_time: number
  is_favorite: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface ConversationSession {
  id: string
  title: string
  system_prompt_id: string | null
  system_prompt_content: string
  model_parameters: string
  created_at: string
  updated_at: string
}

export interface ConversationMessage {
  id: string
  session_id: string
  message_type: 'user' | 'assistant'
  content: string
  ai_config_id: string | null
  model_name: string
  tokens_used: number | null
  response_time_ms: number | null
  message_order: number
  created_at: string
}

export interface ConversationComparison {
  id: string
  session_id: string
  title: string
  description: string
  selected_ai_configs: string
  rating: number | null
  notes: string
  ratings: string
  notes_json: string
  model_parameters: string
  created_at: string
}
