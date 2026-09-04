package com.pyracube.music.bridge

import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.pyracube.music.player.PlaybackController
import com.pyracube.music.database.entity.Song
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@CapacitorPlugin(name = "PlayerPlugin")
class PlayerPlugin : Plugin() {

    private val scope = CoroutineScope(Dispatchers.IO)
    private lateinit var playbackController: PlaybackController

    override fun load() {
        playbackController = PlaybackController(context)
        playbackController.setCallback(object : PlaybackController.PlaybackCallback {
            override fun onPlaybackStateChanged(playing: Boolean) {
                notifyListeners("playbackStateChanged", JSObject().put("playing", playing))
            }

            override fun onProgressChanged(current: Long, duration: Long) {
                notifyListeners("progressChanged", JSObject().put("current", current).put("duration", duration))
            }

            override fun onSongChanged(song: Song?) {
                // Song metadata would be sent here
            }

            override fun onError(error: String) {
                notifyListeners("playbackError", JSObject().put("error", error))
            }
        })
        playbackController.connect()
    }

    @PluginMethod
    fun playSong(call: PluginCall) {
        val songData = call.getObject("song") ?: return call.reject("Song data required")
        scope.launch {
            try {
                val song = jsToSong(songData)
                playbackController.playSong(song)
                call.resolve()
            } catch (e: Exception) {
                Log.e("PlayerPlugin", "Error playing song", e)
                call.reject("Failed to play song", e)
            }
        }
    }

    @PluginMethod
    fun playSongs(call: PluginCall) {
        val songsData = call.getArray("songs") ?: return call.reject("Songs array required")
        val startIndex = call.getInt("startIndex") ?: 0
        scope.launch {
            try {
                val songs = songsData.map { jsToSong(it as JSObject) }
                playbackController.playSongs(songs, startIndex)
                call.resolve()
            } catch (e: Exception) {
                Log.e("PlayerPlugin", "Error playing songs", e)
                call.reject("Failed to play songs", e)
            }
        }
    }

    @PluginMethod
    fun togglePlayPause(call: PluginCall) {
        scope.launch {
            try {
                playbackController.togglePlayPause()
                call.resolve()
            } catch (e: Exception) {
                Log.e("PlayerPlugin", "Error toggling play/pause", e)
                call.reject("Failed to toggle play/pause", e)
            }
        }
    }

    @PluginMethod
    fun playNext(call: PluginCall) {
        scope.launch {
            try {
                playbackController.playNext()
                call.resolve()
            } catch (e: Exception) {
                Log.e("PlayerPlugin", "Error playing next", e)
                call.reject("Failed to play next", e)
            }
        }
    }

    @PluginMethod
    fun playPrevious(call: PluginCall) {
        scope.launch {
            try {
                playbackController.playPrevious()
                call.resolve()
            } catch (e: Exception) {
                Log.e("PlayerPlugin", "Error playing previous", e)
                call.reject("Failed to play previous", e)
            }
        }
    }

    @PluginMethod
    fun seekTo(call: PluginCall) {
        val position = call.getLong("position") ?: return call.reject("Position required")
        scope.launch {
            try {
                playbackController.seekTo(position)
                call.resolve()
            } catch (e: Exception) {
                Log.e("PlayerPlugin", "Error seeking", e)
                call.reject("Failed to seek", e)
            }
        }
    }

    @PluginMethod
    fun setVolume(call: PluginCall) {
        val volume = call.getFloat("volume") ?: return call.reject("Volume required")
        scope.launch {
            try {
                playbackController.setVolume(volume)
                call.resolve()
            } catch (e: Exception) {
                Log.e("PlayerPlugin", "Error setting volume", e)
                call.reject("Failed to set volume", e)
            }
        }
    }

    @PluginMethod
    fun setShuffle(call: PluginCall) {
        val enabled = call.getBoolean("enabled") ?: return call.reject("Enabled required")
        scope.launch {
            try {
                playbackController.setShuffle(enabled)
                call.resolve()
            } catch (e: Exception) {
                Log.e("PlayerPlugin", "Error setting shuffle", e)
                call.reject("Failed to set shuffle", e)
            }
        }
    }

    @PluginMethod
    fun setRepeatMode(call: PluginCall) {
        val mode = call.getInt("mode") ?: return call.reject("Mode required")
        scope.launch {
            try {
                playbackController.setRepeatMode(mode)
                call.resolve()
            } catch (e: Exception) {
                Log.e("PlayerPlugin", "Error setting repeat mode", e)
                call.reject("Failed to set repeat mode", e)
            }
        }
    }

    @PluginMethod
    fun getCurrentState(call: PluginCall) {
        scope.launch {
            try {
                val song = playbackController.getCurrentSong()
                val queue = playbackController.getQueue()
                val state = JSObject().put("queueSize", queue.size)
                song?.let { state.put("currentSong", songToJS(it)) }
                call.resolve(state)
            } catch (e: Exception) {
                Log.e("PlayerPlugin", "Error getting state", e)
                call.reject("Failed to get state", e)
            }
        }
    }

    private fun jsToSong(obj: JSObject): Song {
        return Song(
            id = obj.getLong("id") ?: 0,
            uri = obj.getString("uri") ?: "",
            title = obj.getString("title") ?: "",
            artist = obj.getString("artist") ?: "",
            album = obj.getString("album"),
            albumArtist = obj.getString("albumArtist"),
            duration = obj.getLong("duration") ?: 0,
            genre = obj.getString("genre"),
            year = obj.getInt("year"),
            trackNumber = obj.getInt("trackNumber"),
            artworkUri = obj.getString("artworkUri"),
            favorite = obj.getBoolean("favorite") ?: false,
            playCount = obj.getLong("playCount") ?: 0,
            lastPlayed = obj.getLong("lastPlayed"),
            dateAdded = obj.getLong("dateAdded") ?: System.currentTimeMillis(),
            isAvailable = obj.getBoolean("isAvailable") ?: true,
        )
    }

    private fun songToJS(song: Song): JSObject {
        return JSObject().apply {
            put("id", song.id)
            put("uri", song.uri)
            put("title", song.title)
            put("artist", song.artist)
            put("album", song.album)
            put("albumArtist", song.albumArtist)
            put("duration", song.duration)
            put("genre", song.genre)
            put("year", song.year)
            put("trackNumber", song.trackNumber)
            put("artworkUri", song.artworkUri)
            put("favorite", song.favorite)
            put("playCount", song.playCount)
            put("lastPlayed", song.lastPlayed)
            put("dateAdded", song.dateAdded)
            put("isAvailable", song.isAvailable)
        }
    }
}