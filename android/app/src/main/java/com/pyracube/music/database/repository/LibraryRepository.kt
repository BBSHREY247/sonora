package com.pyracube.music.database.repository

import android.content.Context
import com.pyracube.music.database.PyracubeDatabase
import com.pyracube.music.database.dao.*
import com.pyracube.music.database.entity.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext

class LibraryRepository(private val db: PyracubeDatabase) {

    companion object {
        @Volatile
        private var INSTANCE: LibraryRepository? = null

        fun getInstance(context: Context): LibraryRepository {
            return INSTANCE ?: synchronized(this) {
                val instance = LibraryRepository(PyracubeDatabase.getDatabase(context))
                INSTANCE = instance
                instance
            }
        }
    }

    val songDao = db.songDao()
    val albumDao = db.albumDao()
    val artistDao = db.artistDao()
    val playlistDao = db.playlistDao()
    val playHistoryDao = db.playHistoryDao()
    val settingsDao = db.settingsDao()
    val storageLocationDao = db.storageLocationDao()
    val downloadJobDao = db.downloadJobDao()

    // Songs
    suspend fun insertSongs(songs: List<Song>) = withContext(Dispatchers.IO) {
        songDao.insertAll(songs)
    }

    suspend fun insertOrUpdateSong(song: Song) = withContext(Dispatchers.IO) {
        songDao.insert(song)
    }

    fun getAllSongs(): Flow<List<Song>> = songDao.getAvailable()

    fun getAllSongsList() = withContext(Dispatchers.IO) {
        songDao.getAvailableList()
    }

    fun getFavorites(): Flow<List<Song>> = songDao.getFavorites()

    suspend fun getFavoritesList() = withContext(Dispatchers.IO) {
        songDao.getFavoritesList()
    }

    suspend fun getSongById(id: Long) = withContext(Dispatchers.IO) {
        songDao.getById(id)
    }

    suspend fun getSongByUri(uri: String) = withContext(Dispatchers.IO) {
        songDao.getByUri(uri)
    }

    suspend fun getSongsByAlbum(album: String, artist: String) = withContext(Dispatchers.IO) {
        songDao.getByAlbum(album, artist)
    }

    suspend fun getSongsByArtist(artist: String) = withContext(Dispatchers.IO) {
        songDao.getByArtist(artist)
    }

    suspend fun getRecentlyAdded(limit: Int = 12) = withContext(Dispatchers.IO) {
        songDao.getRecentlyAdded(limit)
    }

    suspend fun getRecentlyPlayed(limit: Int = 10) = withContext(Dispatchers.IO) {
        songDao.getRecentlyPlayed(limit)
    }

    suspend fun searchSongs(query: String) = withContext(Dispatchers.IO) {
        val searchQuery = "%$query%"
        songDao.search(searchQuery)
    }

    suspend fun toggleFavorite(songId: Long, favorite: Boolean) = withContext(Dispatchers.IO) {
        songDao.setFavorite(songId, favorite)
    }

    suspend fun recordPlay(songId: Long) = withContext(Dispatchers.IO) {
        songDao.recordPlay(songId, System.currentTimeMillis())
    }

    suspend fun setSongAvailable(songId: Long, available: Boolean) = withContext(Dispatchers.IO) {
        songDao.setAvailable(songId, available)
    }

    suspend fun setSongsAvailableByLocation(locationId: Long, available: Boolean) = withContext(Dispatchers.IO) {
        songDao.setAvailableByLocation(locationId, available)
    }

    suspend fun deleteSongsByLocation(locationId: Long) = withContext(Dispatchers.IO) {
        songDao.deleteByLocation(locationId)
    }

    // Albums
    fun getAllAlbums(): Flow<List<Album>> = albumDao.getAll()

    suspend fun getAllAlbumsList() = withContext(Dispatchers.IO) {
        albumDao.getAllList()
    }

    suspend fun getAlbumsByArtist(artist: String) = withContext(Dispatchers.IO) {
        albumDao.getByArtist(artist)
    }

    suspend fun insertAlbums(albums: List<Album>) = withContext(Dispatchers.IO) {
        albumDao.insertAll(albums)
    }

    // Artists
    fun getAllArtists(): Flow<List<Artist>> = artistDao.getAll()

    suspend fun getAllArtistsList() = withContext(Dispatchers.IO) {
        artistDao.getAllList()
    }

    suspend fun insertArtists(artists: List<Artist>) = withContext(Dispatchers.IO) {
        artistDao.insertAll(artists)
    }

    // Playlists
    fun getAllPlaylists(): Flow<List<Playlist>> = playlistDao.getAll()

    suspend fun getAllPlaylistsList() = withContext(Dispatchers.IO) {
        playlistDao.getAllList()
    }

    suspend fun getPlaylistWithSongs(playlistId: Long) = withContext(Dispatchers.IO) {
        playlistDao.getPlaylistWithSongs(playlistId)
    }

    suspend fun createPlaylist(name: String, description: String? = null) = withContext(Dispatchers.IO) {
        val playlist = Playlist(
            name = name,
            description = description,
            dateCreated = System.currentTimeMillis(),
            dateModified = System.currentTimeMillis(),
        )
        playlistDao.insert(playlist)
    }

    suspend fun createPlaylistWithSongs(name: String, songIds: List<Long>) = withContext(Dispatchers.IO) {
        val playlist = Playlist(
            name = name,
            dateCreated = System.currentTimeMillis(),
            dateModified = System.currentTimeMillis(),
        )
        playlistDao.insertWithSongs(playlist, songIds)
    }

    suspend fun updatePlaylist(playlist: Playlist) = withContext(Dispatchers.IO) {
        playlistDao.update(playlist.copy(dateModified = System.currentTimeMillis()))
    }

    suspend fun deletePlaylist(playlistId: Long) = withContext(Dispatchers.IO) {
        playlistDao.deleteById(playlistId)
    }

    suspend fun addSongToPlaylist(playlistId: Long, songId: Long) = withContext(Dispatchers.IO) {
        val position = playlistDao.getSongsForPlaylist(playlistId).size
        playlistDao.insertSong(PlaylistSong(playlistId, songId, position))
    }

    suspend fun removeSongFromPlaylist(playlistId: Long, songId: Long) = withContext(Dispatchers.IO) {
        playlistDao.removeSong(playlistId, songId)
    }

    suspend fun reorderPlaylistSongs(playlistId: Long, songIds: List<Long>) = withContext(Dispatchers.IO) {
        playlistDao.clearSongs(playlistId)
        val playlistSongs = songIds.mapIndexed { index, songId ->
            PlaylistSong(playlistId, songId, index)
        }
        playlistDao.insertSongs(playlistSongs)
    }

    // Play History
    suspend fun addToHistory(songId: Long) = withContext(Dispatchers.IO) {
        playHistoryDao.insert(PlayHistory(songId = songId))
    }

    suspend fun getRecentHistory(limit: Int = 50) = withContext(Dispatchers.IO) {
        playHistoryDao.getRecent(limit)
    }

    suspend fun clearOldHistory(olderThanDays: Int = 90) = withContext(Dispatchers.IO) {
        val cutoff = System.currentTimeMillis() - (olderThanDays * 24L * 60 * 60 * 1000)
        playHistoryDao.deleteOlderThan(cutoff)
    }

    // Settings
    suspend fun getSetting(key: String): String? = withContext(Dispatchers.IO) {
        settingsDao.getValue(key)
    }

    suspend fun setSetting(key: String, value: String) = withContext(Dispatchers.IO) {
        settingsDao.insert(Settings(key, value))
    }

    suspend fun getAllSettings() = withContext(Dispatchers.IO) {
        settingsDao.getAllList().associate { it.key to it.value }
    }

    // Storage Locations
    suspend fun getStorageLocations() = withContext(Dispatchers.IO) {
        storageLocationDao.getAllList()
    }

    suspend fun getPrimaryStorageLocation() = withContext(Dispatchers.IO) {
        storageLocationDao.getPrimary()
    }

    suspend fun insertStorageLocation(location: StorageLocation) = withContext(Dispatchers.IO) {
        storageLocationDao.insert(location)
    }

    suspend fun updateStorageLocation(location: StorageLocation) = withContext(Dispatchers.IO) {
        storageLocationDao.update(location)
    }

    suspend fun setStorageLocationAvailable(id: Long, available: Boolean) = withContext(Dispatchers.IO) {
        storageLocationDao.setAvailable(id, available)
        setSongsAvailableByLocation(id, available)
    }

    // Downloads
    fun getAllDownloads(): Flow<List<DownloadJob>> = downloadJobDao.getAll()

    suspend fun getActiveDownloads() = withContext(Dispatchers.IO) {
        downloadJobDao.getActive()
    }

    suspend fun insertDownload(job: DownloadJob) = withContext(Dispatchers.IO) {
        downloadJobDao.insert(job)
    }

    suspend fun updateDownload(job: DownloadJob) = withContext(Dispatchers.IO) {
        downloadJobDao.update(job)
    }

    suspend fun updateDownloadStatus(id: Long, status: String, error: String? = null) = withContext(Dispatchers.IO) {
        downloadJobDao.updateStatus(id, status, error)
    }

    suspend fun updateDownloadProgress(id: Long, bytes: Long, progress: Float, speed: Long?, eta: Long?) = withContext(Dispatchers.IO) {
        downloadJobDao.updateProgress(id, bytes, progress, speed, eta)
    }

    suspend fun markDownloadStarted(id: Long) = withContext(Dispatchers.IO) {
        downloadJobDao.markStarted(id, System.currentTimeMillis())
    }

    suspend fun markDownloadCompleted(id: Long, path: String, songId: Long) = withContext(Dispatchers.IO) {
        downloadJobDao.markCompleted(id, System.currentTimeMillis(), path, songId)
    }

    suspend fun markDownloadFailed(id: Long, error: String) = withContext(Dispatchers.IO) {
        downloadJobDao.markFailed(id, error)
    }

    suspend fun clearCompletedDownloads() = withContext(Dispatchers.IO) {
        downloadJobDao.clearCompleted()
    }

    suspend fun clearFailedDownloads() = withContext(Dispatchers.IO) {
        downloadJobDao.clearFailed()
    }
}