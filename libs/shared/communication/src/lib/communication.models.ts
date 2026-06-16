export interface Conversation {
  id: number;
  title: string;
  type: 'GROUP' | 'INDIVIDUAL';
  participant_names: string[];
  last_message_preview: string;
  last_message_at: string;
  unread_count: number;
  online_count: number;
}

export interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  created_at: string;
  read_by: { user_id: number; read_at: string }[];
}

export interface RecipientGroup {
  type: string;
  label: string;
  count: number;
}

export interface ChatUser {
  id: number;
  name: string;
  role: string;
  avatar_url: string | null;
}

export type PresenceStatus = 'online' | 'away' | 'offline';

export interface SendMessagePayload {
  conversation_id: number;
  content: string;
}

export interface CreateConversationPayload {
  title?: string;
  recipient_ids?: number[];
  recipient_type?: string;
}

export enum AudienceType {
  ALL = 'ALL',
  STAFF = 'STAFF',
  STUDENTS = 'STUDENTS',
  PARENTS = 'PARENTS',
  SPECIFIC_ROLES = 'SPECIFIC_ROLES',
  YEAR_LEVEL_PARENTS = 'YEAR_LEVEL_PARENTS',
}

export interface OmnichannelPayload {
  title: string;
  body: string;
  audience_type: AudienceType;
  year_level_id?: number;
  send_sms: boolean;
  send_in_app: boolean;
}

export interface YearLevelOption {
  id: number;
  name: string;
  order: number;
}
