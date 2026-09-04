package com.pyracube.music.database.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import androidx.room.Delete
import androidx.room.OnConflictStrategy
import androidx.room.Transaction
import com.pyracube.music.database.entity.Playlist
import com.pyracube.music.database.entity.PlaylistSong
import com.pyracube.music.database.entity.Song
import kotlinx.coroutines.flow.Flow

@Dao
interface PlaylistDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(playlists: List<Playlist>): List<Long>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(playlist: Playlist): Long

    @Update
    suspend fun update(playlist: Playlist): Int

    @Delete
    suspend fun delete(playlist: Playlist): Int

    @Query("DELETE FROM playlists WHERE id = :id")
    suspend fun deleteById(id: Long): Int

    @Query("SELECT * FROM playlists WHERE id = :id")
    suspend fun getById(id: Long): Playlist?

    @Query("SELECT * FROM playlists ORDER BY date_modified DESC")
    fun getAll(): Flow<List<Playlist>>

    @Query("SELECT * FROM playlists ORDER BY date_modified DESC")
    suspend fun getAllList(): List<Playlist>

    @Query("SELECT * FROM playlists WHERE name = :name")
    suspend fun getByName(name: String): Playlist?

    // Playlist Songs
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSong(playlistSong: PlaylistSong): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSongs(playlistSongs: List<PlaylistSong>): List<Long>

    @Delete
    suspend fun deleteSong(playlistSong: PlaylistSong): Int

    @Query("DELETE FROM playlist_songs WHERE playlist_id = :playlistId AND song_id = :songId")
    suspend fun removeSong(playlistId: Long, songId: Long): Int

    @Query("DELETE FROM playlist_songs WHERE playlist_id = :playlistId")
    suspend fun clearSongs(playlistId: Long): Int

    @Query("SELECT * FROM playlist_songs WHERE playlist_id = :playlistId ORDER BY position ASC")
    suspend fun getSongsForPlaylist(playlistId: Long): List<PlaylistSong>

    @Transaction
    suspend fun getPlaylistWithSongs(playlistId: Long): PlaylistWithSongs? {
        val playlist = getById(playlistId) ?: return null
        val songs = getSongsForPlaylist(playlistId)
        val songIds = songs.map { it.songId }
        val songEntities = songIds.map { getSongById(it) }
        return PlaylistWithSongs(playlist, songEntities.filterNotNull())
    }

    @Query("SELECT * FROM songs WHERE id = :id")
    suspend fun getSongById(id: Long): Song?

    @Query("SELECT COUNT(*) FROM playlists")
    suspend fun count(): Int

    @Transaction
    suspend fun insertWithSongs(playlist: Playlist, songIds: List<Long>) {
        val playlistId = insert(playlist)
        val playlistSongs = songIds.mapIndexed { index, songId ->
            PlaylistSong(playlistId = playlistId, songId = songId, position = index)
        }
        insertSongs(playlistSongs)
    }
}

data class PlaylistWithSongs(
    val playlist: Playlist,
    val songs: List<Song>
)