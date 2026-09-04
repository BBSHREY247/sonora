package com.pyracube.music.player

import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.session.MediaController
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import androidx.media3.session.SessionCommand
import androidx.media3.session.SessionCommandGroup
import androidx.media3.session.SessionResult
import com.pyracube.music.database.entity.Song

@UnstableApi
class MediaPlaybackService : MediaSessionService() {

    private var exoPlayer: ExoPlayer? = null
    private var mediaSession: MediaSession? = null

    override fun onCreate() {
        super.onCreate()
        initializePlayer()
    }

    private fun initializePlayer() {
        exoPlayer = ExoPlayer.Builder(this)
            .setMediaSourceFactory(DefaultMediaSourceFactory(this))
            .build()
        exoPlayer?.repeatMode = Player.REPEAT_MODE_OFF
        exoPlayer?.setShuffleModeEnabled(false)
    }

    override fun onGetSession(controllerInfo: MediaController.ControllerInfo): MediaSession {
        if (mediaSession == null) {
            mediaSession = MediaSession.Builder(this, exoPlayer!!)
                .setSessionCallback(MySessionCallback())
                .setAllowedCommands(getDefaultAllowedCommands())
                .build()
        }
        return mediaSession!!
    }

    private fun getDefaultAllowedCommands(): SessionCommandGroup {
        return SessionCommandGroup(
            SessionCommand.COMMAND_CODE_PLAY,
            SessionCommand.COMMAND_CODE_PAUSE,
            SessionCommand.COMMAND_CODE_PLAY_PAUSE,
            SessionCommand.COMMAND_CODE_PREPARE,
            SessionCommand.COMMAND_CODE_PREPARE_FROM_MEDIA_ID,
            SessionCommand.COMMAND_CODE_PREPARE_FROM_SEARCH,
            SessionCommand.COMMAND_CODE_PREPARE_FROM_URI,
            SessionCommand.COMMAND_CODE_SKIP_TO_NEXT,
            SessionCommand.COMMAND_CODE_SKIP_TO_PREVIOUS,
            SessionCommand.COMMAND_CODE_SEEK_TO,
            SessionCommand.COMMAND_CODE_SET_REPEAT_MODE,
            SessionCommand.COMMAND_CODE_SET_SHUFFLE_MODE,
            SessionCommand.COMMAND_CODE_STOP,
            SessionCommand.COMMAND_CODE_SET_MEDIA_ITEM,
            SessionCommand.COMMAND_CODE_ADD_MEDIA_ITEM,
            SessionCommand.COMMAND_CODE_REMOVE_MEDIA_ITEM,
            SessionCommand.COMMAND_CODE_REPLACE_MEDIA_ITEM,
            SessionCommand.COMMAND_CODE_SET_PLAYBACK_SPEED,
            SessionCommand.COMMAND_CODE_GET_MEDIA_ITEMS,
        )
    }

    inner class MySessionCallback : MediaSession.Callback() {
        override fun onAddMediaItems(
            session: MediaSession,
            controller: MediaController,
            mediaItems: List<MediaItem>,
        ): List<SessionResult> {
            mediaItems.forEach { item ->
                exoPlayer?.addMediaItem(item)
            }
            return mediaItems.map { SessionResult(SessionResult.RESULT_SUCCESS) }
        }

        override fun onSetMediaItems(
            session: MediaSession,
            controller: MediaController,
            mediaItems: List<MediaItem>,
            startIndex: Int,
            startPosition: Long,
        ): SessionResult {
            exoPlayer?.setMediaItems(mediaItems, startIndex, startPosition)
            exoPlayer?.prepare()
            exoPlayer?.playWhenReady = true
            return SessionResult(SessionResult.RESULT_SUCCESS)
        }

        override fun onRemoveMediaItems(
            session: MediaSession,
            controller: MediaController,
            mediaIds: List<String>,
        ): List<SessionResult> {
            mediaIds.forEach { id ->
                val index = exoPlayer?.mediaItemIndex?.let { mediaItemIndex ->
                    exoPlayer?.mediaItemCount?.let { count ->
                        (0 until count).firstOrNull { exoPlayer?.getMediaItemAt(it)?.mediaId == id }
                    }
                }
                index?.let { exoPlayer?.removeMediaItem(it) }
            }
            return mediaIds.map { SessionResult(SessionResult.RESULT_SUCCESS) }
        }
    }

    companion object {
        fun buildMediaItem(song: Song): MediaItem {
            return MediaItem.fromUri(song.uri)
                .buildUpon()
                .setMediaId(song.id.toString())
                .setMediaMetadata(
                    MediaMetadata.Builder()
                        .setTitle(song.title)
                        .setArtist(song.artist)
                        .setAlbumTitle(song.album ?: "")
                        .setArtworkUri(song.artworkUri)
                        .setDuration(song.duration)
                        .build()
                )
                .build()
        }
    }

    override fun onDestroy() {
        exoPlayer?.release()
        exoPlayer = null
        mediaSession?.release()
        mediaSession = null
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? {
        return super.onBind(intent)
    }
}