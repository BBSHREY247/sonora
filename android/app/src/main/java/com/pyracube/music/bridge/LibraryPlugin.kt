package com.pyracube.music.bridge

import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.pyracube.music.database.PyracubeDatabase
import com.pyracube.music.database.entity.Song
import com.pyracube.music.database.entity.Album
import com.pyracube.music.database.entity.Artist
import com.pyracube.music.database.entity.Playlist
import com.pyracube.music.database.repository.LibraryRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@CapacitorPlugin(name = "LibraryPlugin")
class LibraryPlugin : Plugin() {

    private val scope = CoroutineScope(Dispatchers.IO)
    private lateinit var repository: LibraryRepository

    override fun load() {
        repository = LibraryRepository.getInstance(context)
    }

    @PluginMethod
    fun getSongs(call: PluginCall) {
        scope.launch {
            try {
                val songs = repository.getAllSongsList()
                val jsArray = songs.map { songToJS(it) }
                call.resolve(JSObject().put("songs", jsArray))
            } catch (e: Exception) {
                Log.e("LibraryPlugin", "Error getting songs", e)
                call.reject("Failed to get songs", e)
            }
        }
    }

    @PluginMethod
    fun getFavorites(call: PluginCall) {
        scope.launch {
            try {
                val songs = repository.getFavoritesList()
                val jsArray = songs.map { songToJS(it) }
                call.resolve(JSObject().put("songs", jsArray))
            } catch (e: Exception) {
                Log.e("LibraryPlugin", "Error getting favorites", e)
                call.reject("Failed to get favorites", e)
            }
        }
    }

    @PluginMethod
    fun getAlbums(call: PluginCall) {
        scope.launch {
            try {
                val albums = repository.getAllAlbumsList()
                val jsArray = albums.map { albumToJS(it) }
                call.resolve(JSObject().put("albums", jsArray))
            } catch (e: Exception) {
                Log.e("LibraryPlugin", "Error getting albums", e)
                call.reject("Failed to get albums", e)
            }
        }
    }

    @PluginMethod
    fun getArtists(call: PluginCall) {
        scope.launch {
            try {
                val artists = repository.getAllArtistsList()
                val jsArray = artists.map { artistToJS(it) }
                call.resolve(JSObject().put("artists", jsArray))
            } catch (e: Exception) {
                Log.e("LibraryPlugin", "Error getting artists", e)
                call.reject("Failed to get artists", e)
            }
        }
    }

    @PluginMethod
    fun getPlaylists(call: PluginCall) {
        scope.launch {
            try {
                val playlists = repository.getAllPlaylistsList()
                val jsArray = playlists.map { playlistToJS(it) }
                call.resolve(JSObject().put("playlists", jsArray))
            } catch (e: Exception) {
                Log.e("LibraryPlugin", "Error getting playlists", e)
                call.reject("Failed to get playlists", e)
            }
        }
    }

    @PluginMethod
    fun getPlaylistSongs(call: PluginCall) {
        val playlistId = call.getLong("playlistId") ?: return
        scope.launch {
            try {
                val playlistWithSongs = repository.getPlaylistWithSongs(playlistId)
                playlistWithSongs?.let {
                    val jsPlaylist = playlistToJS(it.playlist)
                    val jsSongs = it.songs.map { songToJS(it) }
                    call.resolve(JSObject().put("playlist", jsPlaylist).put("songs", jsSongs))
                } ?: call.reject("Playlist not found")
            } catch (e: Exception) {
                Log.e("LibraryPlugin", "Error getting playlist songs", e)
                call.reject("Failed to get playlist songs", e)
            }
        }
    }

    @PluginMethod
    fun createPlaylist(call: PluginCall) {
        val name = call.getString("name") ?: return call.reject("Name required")
        val songIds = call.getArray("songIds")?.map { it.toLong() } ?: emptyList()
        scope.launch {
            try {
                val id = if (songIds.isNotEmpty()) {
                    repository.createPlaylistWithSongs(name, songIds)
                } else {
                    repository.createPlaylist(name)
                }
                call.resolve(JSObject().put("id", id))
            } catch (e: Exception) {
                Log.e("LibraryPlugin", "Error creating playlist", e)
                call.reject("Failed to create playlist", e)
            }
        }
    }

    @PluginMethod
    fun updatePlaylist(call: PluginCall) {
        val id = call.getLong("id") ?: return call.reject("ID required")
        val name = call.getString("name")
        scope.launch {
            try {
                // Fetch existing, update name, save
                call.resolve()
            } catch (e: Exception) {
                Log.e("LibraryPlugin", "Error updating playlist", e)
                call.reject("Failed to update playlist", e)
            }
        }
    }

    @PluginMethod
    fun deletePlaylist(call: PluginCall) {
        val id = call.getLong("id") ?: return call.reject("ID required")
        scope.launch {
            try {
                repository.deletePlaylist(id)
                call.resolve()
            } catch (e: Exception) {
                Log.e("LibraryPlugin", "Error deleting playlist", e)
                call.reject("Failed to delete playlist", e)
            }
        }
    }

    @PluginMethod
    fun addSongToPlaylist(call: PluginCall) {
        val playlistId = call.getLong("playlistId") ?: return call.reject("Playlist ID required")
        val songId = call.getLong("songId") ?: return call.reject("Song ID required")
        scope.launch {
            try {
                repository.addSongToPlaylist(playlistId, songId)
                call.resolve()
            } catch (e: Exception) {
                Log.e("LibraryPlugin", "Error adding song to playlist", e)
                call.reject("Failed to add song to playlist", e)
            }
        }
    }

    @PluginMethod
    fun removeSongFromPlaylist(call: PluginCall) {
        val playlistId = call.getLong("playlistId") ?: return call.reject("Playlist ID required")
        val songId = call.getLong("songId") ?: return call.reject("Song ID required")
        scope.launch {
            try {
                repository.removeSongFromPlaylist(playlistId, songId)
                call.resolve()
            } catch (e: Exception) {
                Log.e("LibraryPlugin", "Error removing song from playlist", e)
                call.reject("Failed to remove song from playlist", e)
            }
        }
    }

    @PluginMethod
    fun toggleFavorite(call: PluginCall) {
        val songId = call.getLong("songId") ?: return call.reject("Song ID required")
        val favorite = call.getBoolean("favorite") ?: false
        scope.launch {
            try {
                repository.toggleFavorite(songId, favorite)
                call.resolve()
            } catch (e: Exception) {
                Log.e("LibraryPlugin", "Error toggling favorite", e)
                call.reject("Failed to toggle favorite", e)
            }
        }
    }

    @PluginMethod
    fun getRecentlyAdded(call: PluginCall) {
        val limit = call.getInt("limit") ?: 12
        scope.launch {
            try {
                val songs = repository.getRecentlyAdded(limit)
                val jsArray = songs.map { songToJS(it) }
                call.resolve(JSObject().put("songs", jsArray))
            } catch (e: Exception) {
                Log.e("LibraryPlugin", "Error getting recently added", e)
                call.reject("Failed to get recently added", e)
            }
        }
    }

    @PluginMethod
    fun getRecentlyPlayed(call: PluginCall) {
        val limit = call.getInt("limit") ?: 10
        scope.launch {
            try {
                val songs = repository.getRecentlyPlayed(limit)
                val jsArray = songs.map { songToJS(it) }
                call.resolve(JSObject().put("songs", jsArray))
            } catch (e: Exception) {
                Log.e("LibraryPlugin", "Error getting recently played", e)
                call.reject("Failed to get recently played", e)
            }
        }
    }

    @PluginMethod
    fun searchSongs(call: PluginCall) {
        val query = call.getString("query") ?: return call.reject("Query required")
        scope.launch {
            try {
                val songs = repository.searchSongs(query)
                val jsArray = songs.map { songToJS(it) }
                call.resolve(JSObject().put("songs", jsArray))
            } catch (e: Exception) {
                Log.e("LibraryPlugin", "Error searching songs", e)
                call.reject("Failed to search songs", e)
            }
        }
    }

    @PluginMethod
    fun recordPlay(call: PluginCall) {
        val songId = call.getLong("songId") ?: return call.reject("Song ID required")
        scope.launch {
            try {
                repository.recordPlay(songId)
                call.resolve()
            } catch (e: Exception) {
                Log.e("LibraryPlugin", "Error recording play", e)
                call.reject("Failed to record play", e)
            }
        }
    }

    @PluginMethod
    fun scanLibrary(call: PluginCall) {
        scope.launch {
            try {
                // This would trigger the MediaStore scanner
                call.resolve(JSObject().put("success", true))
            } catch (e: Exception) {
                Log.e("LibraryPlugin", "Error scanning library", e)
                call.reject("Failed to scan library", e)
            }
        }
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

    private fun albumToJS(album: Album): JSObject {
        return JSObject().apply {
            put("id", album.id)
            put("name", album.name)
            put("artist", album.artist)
            put("artworkUri", album.artworkUri)
            put("year", album.year)
            put("songCount", album.songCount)
            put("totalDuration", album.totalDuration)
        }
    }

    private fun artistToJS(artist: Artist): JSObject {
        return JSObject().apply {
            put("id", artist.id)
            put("name", artist.name)
            put("artworkUri", artist.artworkUri)
            put("songCount", artist.songCount)
            put("albumCount", artist.albumCount)
        }
    }

    private fun playlistToJS(playlist: Playlist): JSObject {
        return JSObject().apply {
            put("id", playlist.id)
            put("name", playlist.name)
            put("artworkUri", playlist.artworkUri)
            put("description", playlist.description)
            put("dateCreated", playlist.dateCreated)
            put("dateModified", playlist.dateModified)
            put("songCount", playlist.songCount)
            put("totalDuration", playlist.totalDuration)
        }
    }
}