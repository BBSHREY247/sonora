package com.pyracube.music.player

import android.content.Context
import android.util.Log
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaController
import androidx.media3.session.MediaSession
import androidx.media3.session.SessionCommand
import com.pyracube.music.database.entity.Song
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@UnstableApi
class PlaybackController(private val context: Context) {

    private var mediaController: MediaController? = null
    private var isConnected = false
    private val scope = CoroutineScope(Dispatchers.IO)

    interface PlaybackCallback {
        fun onPlaybackStateChanged(playing: Boolean)
        fun onProgressChanged(current: Long, duration: Long)
        fun onSongChanged(song: Song?)
        fun onError(error: String)
    }

    private var callback: PlaybackCallback? = null

    fun setCallback(callback: PlaybackCallback) {
        this.callback = callback
    }

    fun connect() {
        if (isConnected) return

        scope.launch {
            try {
                mediaController = MediaController.Builder(context, MediaPlaybackService::class.java)
                    .build()
                isConnected = true
                setupListener()
                Log.d("PlaybackController", "Connected to MediaPlaybackService")
            } catch (e: Exception) {
                Log.e("PlaybackController", "Failed to connect to service", e)
                isConnected = false
            }
        }
    }

    private fun setupListener() {
        mediaController?.addListener(object : MediaController.Listener {
            override fun onPlaybackStateChanged(state: Int) {
                val playing = state == Player.STATE_PLAYING
                callback?.onPlaybackStateChanged(playing)
            }

            override fun onMediaItemTransition(
                newMediaItem: MediaItem?,
                reason: Int,
            ) {
                newMediaItem?.mediaId?.let { id ->
                    // Get song from database
                    callback?.onSongChanged(null) // Will be updated via DB query
                }
            }

            override fun onPositionChanged(position: Long, bufferedPosition: Long) {
                val duration = mediaController?.getDuration() ?: 0L
                callback?.onProgressChanged(position, duration)
            }

            override fun onPlayerError(error: PlaybackException) {
                callback?.onError(error.message ?: "Playback error")
            }
        })
    }

    suspend fun playSong(song: Song) {
        ensureConnected()
        val mediaItem = MediaPlaybackService.buildMediaItem(song)
        mediaController?.setMediaItem(mediaItem)
        mediaController?.prepare()
        mediaController?.play()
    }

    suspend fun playSongs(songs: List<Song>, startIndex: Int = 0) {
        ensureConnected()
        val mediaItems = songs.map { MediaPlaybackService.buildMediaItem(it) }
        mediaController?.setMediaItems(mediaItems, startIndex, 0)
        mediaController?.prepare()
        mediaController?.play()
    }

    suspend fun togglePlayPause() {
        ensureConnected()
        val playing = mediaController?.playbackState?.state == Player.STATE_PLAYING
        if (playing) {
            mediaController?.pause()
        } else {
            mediaController?.play()
        }
    }

    suspend fun playNext() {
        ensureConnected()
        mediaController?.seekToNext()
    }

    suspend fun playPrevious() {
        ensureConnected()
        mediaController?.seekToPrevious()
    }

    suspend fun seekTo(position: Long) {
        ensureConnected()
        mediaController?.seekTo(position)
    }

    suspend fun setVolume(volume: Float) {
        ensureConnected()
        mediaController?.setDeviceVolume((volume * 100).toInt(), 0)
    }

    suspend fun setShuffle(enabled: Boolean) {
        ensureConnected()
        mediaController?.setShuffleModeEnabled(enabled)
    }

    suspend fun setRepeatMode(mode: Int) {
        ensureConnected()
        mediaController?.setRepeatMode(mode)
    }

    suspend fun getCurrentSong(): Song? {
        ensureConnected()
        val mediaItem = mediaController?.getCurrentMediaItem()
        val id = mediaItem?.mediaId?.toLongOrNull()
        return if (id != null) {
            // Would need to fetch from DB - for now return null
            null
        } else null
    }

    suspend fun getQueue(): List<Song> {
        ensureConnected()
        val items = mediaController?.getMediaItems() ?: emptyList()
        return items.mapNotNull { item ->
            item.mediaId?.toLongOrNull()?.let { id ->
                // Would need to fetch from DB
                null
            }
        }.filterNotNull()
    }

    private fun ensureConnected() {
        if (!isConnected) {
            connect()
        }
    }

    fun disconnect() {
        mediaController?.release()
        mediaController = null
        isConnected = false
    }
}