-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CLIENT');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('DESKTOP_WIN', 'DESKTOP_MAC', 'DESKTOP_LINUX', 'WEB', 'MOBILE_ANDROID', 'MOBILE_IOS');

-- CreateEnum
CREATE TYPE "TrackSource" AS ENUM ('LOCAL', 'SYNCED', 'BOTH');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReverbPreset" AS ENUM ('NONE', 'SMALL_ROOM', 'MEDIUM_ROOM', 'LARGE_ROOM', 'SMALL_HALL', 'LARGE_HALL', 'CATHEDRAL', 'PLATE', 'SPRING');

-- CreateEnum
CREATE TYPE "EQScopeType" AS ENUM ('GLOBAL', 'PLAYLIST', 'TRACK', 'SEGMENT');

-- CreateEnum
CREATE TYPE "EQSegmentCreatedBy" AS ENUM ('MANUAL', 'AI');

-- CreateEnum
CREATE TYPE "AIAppliedTo" AS ENUM ('GLOBAL', 'PLAYLIST', 'TRACK', 'SEGMENT');

-- CreateEnum
CREATE TYPE "AIFeedback" AS ENUM ('GOOD', 'BAD', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "PlayDevice" AS ENUM ('DESKTOP', 'WEB', 'MOBILE', 'AUTO');

-- CreateEnum
CREATE TYPE "StatsPeriod" AS ENUM ('DAY', 'WEEK', 'MONTH', 'ALL_TIME');

-- CreateEnum
CREATE TYPE "ConflictResolution" AS ENUM ('LOCAL_WINS', 'SERVER_WINS', 'MERGE');

-- CreateEnum
CREATE TYPE "PlayerLayout" AS ENUM ('COMPACT', 'STANDARD', 'EXPANDED', 'MINIMAL');

-- CreateEnum
CREATE TYPE "LibraryLayout" AS ENUM ('LIST', 'GRID', 'CARD');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "avatar" TEXT,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "password_reset_token" TEXT,
    "password_reset_expires" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_type" "DeviceType" NOT NULL,
    "device_name" TEXT NOT NULL,
    "last_sync_at" TIMESTAMP(3),
    "fcm_token" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT NOT NULL DEFAULT '',
    "album_artist" TEXT NOT NULL DEFAULT '',
    "genre" TEXT NOT NULL DEFAULT '',
    "year" INTEGER,
    "track_number" INTEGER,
    "disc_number" INTEGER,
    "composer" TEXT NOT NULL DEFAULT '',
    "comment" TEXT NOT NULL DEFAULT '',
    "duration_ms" INTEGER NOT NULL,
    "file_path_local" TEXT,
    "file_url_remote" TEXT,
    "file_hash" TEXT NOT NULL,
    "file_size_bytes" BIGINT,
    "codec" TEXT NOT NULL DEFAULT '',
    "bitrate" INTEGER,
    "sample_rate" INTEGER,
    "cover_art" TEXT,
    "source" "TrackSource" NOT NULL DEFAULT 'LOCAL',
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "cover_art" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "share_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_tracks" (
    "id" TEXT NOT NULL,
    "playlist_id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eq_presets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "bands" JSONB NOT NULL DEFAULT '[]',
    "bass_boost" INTEGER NOT NULL DEFAULT 0,
    "virtualizer" INTEGER NOT NULL DEFAULT 0,
    "loudness" INTEGER NOT NULL DEFAULT 0,
    "reverb_preset" "ReverbPreset" NOT NULL DEFAULT 'NONE',
    "reverb_amount" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eq_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eq_configs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "scope_type" "EQScopeType" NOT NULL,
    "scope_id" TEXT,
    "preset_id" TEXT,
    "bands" JSONB NOT NULL DEFAULT '[]',
    "bass_boost" INTEGER NOT NULL DEFAULT 0,
    "virtualizer" INTEGER NOT NULL DEFAULT 0,
    "loudness" INTEGER NOT NULL DEFAULT 0,
    "reverb_preset" "ReverbPreset" NOT NULL DEFAULT 'NONE',
    "reverb_amount" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eq_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eq_segments" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "eq_config_id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "start_ms" INTEGER NOT NULL,
    "end_ms" INTEGER NOT NULL,
    "transition_ms" INTEGER NOT NULL DEFAULT 500,
    "created_by" "EQSegmentCreatedBy" NOT NULL DEFAULT 'MANUAL',
    "ai_request_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eq_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "track_id" TEXT,
    "prompt" TEXT NOT NULL,
    "context" JSONB NOT NULL DEFAULT '{}',
    "response" JSONB NOT NULL DEFAULT '{}',
    "explanation" TEXT NOT NULL DEFAULT '',
    "applied_to" "AIAppliedTo",
    "applied_id" TEXT,
    "was_accepted" BOOLEAN NOT NULL DEFAULT false,
    "feedback" "AIFeedback",
    "feedback_comment" TEXT NOT NULL DEFAULT '',
    "tokens_input" INTEGER NOT NULL DEFAULT 0,
    "tokens_output" INTEGER NOT NULL DEFAULT 0,
    "cost_usd" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "response_time_ms" INTEGER NOT NULL DEFAULT 0,
    "model_used" TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "play_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "played_at" TIMESTAMP(3) NOT NULL,
    "duration_listened_ms" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "eq_config_used_id" TEXT,
    "device" "PlayDevice" NOT NULL,

    CONSTRAINT "play_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listening_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period" "StatsPeriod" NOT NULL,
    "period_start" DATE NOT NULL,
    "total_plays" INTEGER NOT NULL DEFAULT 0,
    "total_time_ms" BIGINT NOT NULL DEFAULT 0,
    "unique_tracks" INTEGER NOT NULL DEFAULT 0,
    "unique_artists" INTEGER NOT NULL DEFAULT 0,
    "top_tracks" JSONB NOT NULL DEFAULT '[]',
    "top_artists" JSONB NOT NULL DEFAULT '[]',
    "top_albums" JSONB NOT NULL DEFAULT '[]',
    "top_eq_presets" JSONB NOT NULL DEFAULT '[]',
    "computed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listening_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "entities_uploaded" INTEGER NOT NULL DEFAULT 0,
    "entities_downloaded" INTEGER NOT NULL DEFAULT 0,
    "conflicts_detected" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "error_message" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conflict_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "local_version" JSONB NOT NULL,
    "server_version" JSONB NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolution" "ConflictResolution",
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conflict_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "user_id" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'dark_default',
    "dynamic_theme_enabled" BOOLEAN NOT NULL DEFAULT false,
    "dynamic_theme_intensity" INTEGER NOT NULL DEFAULT 50,
    "player_layout" "PlayerLayout" NOT NULL DEFAULT 'STANDARD',
    "library_layout" "LibraryLayout" NOT NULL DEFAULT 'LIST',
    "show_album_art" BOOLEAN NOT NULL DEFAULT true,
    "show_visualizer" BOOLEAN NOT NULL DEFAULT false,
    "visualizer_type" TEXT NOT NULL DEFAULT 'bars',
    "crossfade_enabled" BOOLEAN NOT NULL DEFAULT false,
    "crossfade_duration_ms" INTEGER NOT NULL DEFAULT 3000,
    "gapless_enabled" BOOLEAN NOT NULL DEFAULT true,
    "replay_gain" BOOLEAN NOT NULL DEFAULT false,
    "skip_silence" BOOLEAN NOT NULL DEFAULT false,
    "sleep_timer_default_min" INTEGER,
    "sleep_timer_fade_out" BOOLEAN NOT NULL DEFAULT true,
    "lastfm_username" TEXT NOT NULL DEFAULT '',
    "lastfm_session_key" TEXT NOT NULL DEFAULT '',
    "scrobble_enabled" BOOLEAN NOT NULL DEFAULT false,
    "scrobble_threshold" INTEGER NOT NULL DEFAULT 50,
    "lyrics_font_size" INTEGER NOT NULL DEFAULT 16,
    "lyrics_auto_scroll" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_role_idx" ON "users"("email", "role");

-- CreateIndex
CREATE INDEX "tracks_artist_idx" ON "tracks"("artist");

-- CreateIndex
CREATE INDEX "tracks_album_idx" ON "tracks"("album");

-- CreateIndex
CREATE INDEX "tracks_genre_idx" ON "tracks"("genre");

-- CreateIndex
CREATE INDEX "tracks_user_id_file_hash_idx" ON "tracks"("user_id", "file_hash");

-- CreateIndex
CREATE INDEX "tracks_user_id_sync_status_idx" ON "tracks"("user_id", "sync_status");

-- CreateIndex
CREATE INDEX "tracks_user_id_updated_at_idx" ON "tracks"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "tracks_user_id_file_hash_key" ON "tracks"("user_id", "file_hash");

-- CreateIndex
CREATE UNIQUE INDEX "playlists_share_token_key" ON "playlists"("share_token");

-- CreateIndex
CREATE INDEX "playlists_user_id_updated_at_idx" ON "playlists"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "playlist_tracks_playlist_id_track_id_key" ON "playlist_tracks"("playlist_id", "track_id");

-- CreateIndex
CREATE INDEX "eq_presets_user_id_is_global_idx" ON "eq_presets"("user_id", "is_global");

-- CreateIndex
CREATE INDEX "eq_configs_user_id_scope_type_scope_id_idx" ON "eq_configs"("user_id", "scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "eq_configs_user_id_updated_at_idx" ON "eq_configs"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "eq_configs_user_id_scope_type_scope_id_key" ON "eq_configs"("user_id", "scope_type", "scope_id");

-- CreateIndex
CREATE UNIQUE INDEX "eq_segments_eq_config_id_key" ON "eq_segments"("eq_config_id");

-- CreateIndex
CREATE INDEX "eq_segments_track_id_start_ms_end_ms_idx" ON "eq_segments"("track_id", "start_ms", "end_ms");

-- CreateIndex
CREATE INDEX "eq_segments_user_id_updated_at_idx" ON "eq_segments"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "ai_requests_user_id_created_at_idx" ON "ai_requests"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ai_requests_feedback_created_at_idx" ON "ai_requests"("feedback", "created_at" DESC);

-- CreateIndex
CREATE INDEX "play_history_user_id_played_at_idx" ON "play_history"("user_id", "played_at" DESC);

-- CreateIndex
CREATE INDEX "play_history_track_id_played_at_idx" ON "play_history"("track_id", "played_at" DESC);

-- CreateIndex
CREATE INDEX "listening_stats_user_id_period_period_start_idx" ON "listening_stats"("user_id", "period", "period_start" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "listening_stats_user_id_period_period_start_key" ON "listening_stats"("user_id", "period", "period_start");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eq_presets" ADD CONSTRAINT "eq_presets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eq_configs" ADD CONSTRAINT "eq_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eq_configs" ADD CONSTRAINT "eq_configs_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "eq_presets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eq_segments" ADD CONSTRAINT "eq_segments_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eq_segments" ADD CONSTRAINT "eq_segments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eq_segments" ADD CONSTRAINT "eq_segments_eq_config_id_fkey" FOREIGN KEY ("eq_config_id") REFERENCES "eq_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eq_segments" ADD CONSTRAINT "eq_segments_ai_request_id_fkey" FOREIGN KEY ("ai_request_id") REFERENCES "ai_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_requests" ADD CONSTRAINT "ai_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_requests" ADD CONSTRAINT "ai_requests_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "play_history" ADD CONSTRAINT "play_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "play_history" ADD CONSTRAINT "play_history_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "play_history" ADD CONSTRAINT "play_history_eq_config_used_id_fkey" FOREIGN KEY ("eq_config_used_id") REFERENCES "eq_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_stats" ADD CONSTRAINT "listening_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflict_logs" ADD CONSTRAINT "conflict_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
