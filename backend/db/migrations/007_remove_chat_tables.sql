-- Migration 007: Drop legacy chat subsystem tables and indexes
-- Removes chat_message and chat_topic tables, foreign keys, and indexes.

DROP INDEX IF EXISTS idx_chat_message_thread;
DROP TABLE IF EXISTS chat_message CASCADE;
DROP TABLE IF EXISTS chat_topic CASCADE;
