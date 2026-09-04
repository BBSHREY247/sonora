package com.pyracube.music.database.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import androidx.room.Delete
import androidx.room.OnConflictStrategy
import androidx.room.Transaction
import com.pyracube.music.database.entity.Song
import kotlinx.coroutines.flow.Flow

@Dao
interface SongDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(songs: List<Song>): List<Long>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(song: Song): Long

    @Update
    suspend fun update(song: Song): Int

    @Delete
    suspend fun delete(song: Song): Int

    @Query("DELETE FROM songs WHERE id = :id")
    suspend fun deleteById(id: Long): Int

    @Query("SELECT * FROM songs WHERE id = :id")
    suspend fun getById(id: Long): Song?

    @Query("SELECT * FROM songs WHERE uri = :uri")
    suspend fun getByUri(uri: String): Song?

    @Query("SELECT * FROM songs WHERE media_store_id = :mediaStoreId")
    suspend fun getByMediaStoreId(mediaStoreId: Long): Song?

    @Query("SELECT * FROM songs ORDER BY title ASC")
    fun getAll(): Flow<List<Song>>

    @Query("SELECT * FROM songs ORDER BY title ASC")
    suspend fun getAllList(): List<Song>

    @Query("SELECT * FROM songs WHERE favorite = 1 ORDER BY title ASC")
    fun getFavorites(): Flow<List<Song>>

    @Query("SELECT * FROM songs WHERE favorite = 1 ORDER BY title ASC")
    suspend fun getFavoritesList(): List<Song>

    @Query("SELECT * FROM songs WHERE is_available = 1 ORDER BY title ASC")
    fun getAvailable(): Flow<List<Song>>

    @Query("SELECT * FROM songs WHERE is_available = 1 ORDER BY title ASC")
    suspend fun getAvailableList(): List<Song>

    @Query("SELECT * FROM songs WHERE album = :album AND artist = :artist ORDER BY track_number ASC")
    suspend fun getByAlbum(album: String, artist: String): List<Song>

    @Query("SELECT * FROM songs WHERE artist = :artist ORDER BY album, track_number ASC")
    suspend fun getByArtist(artist: String): List<Song>

    @Query("SELECT * FROM songs WHERE genre = :genre ORDER BY title ASC")
    suspend fun getByGenre(genre: String): List<Song>

    @Query("SELECT * FROM songs WHERE storage_location_id = :locationId ORDER BY title ASC")
    suspend fun getByStorageLocation(locationId: Long): List<Song>

    @Query("SELECT * FROM songs ORDER BY date_added DESC LIMIT :limit")
    suspend fun getRecentlyAdded(limit: Int): List<Song>

    @Query("SELECT * FROM songs WHERE last_played IS NOT NULL ORDER BY last_played DESC LIMIT :limit")
    suspend fun getRecentlyPlayed(limit: Int): List<Song>

    @Query("SELECT * FROM songs WHERE title LIKE :query OR artist LIKE :query OR album LIKE :query ORDER BY title ASC")
    suspend fun search(query: String): List<Song>

    @Query("SELECT COUNT(*) FROM songs WHERE is_available = 1")
    suspend fun countAvailable(): Int

    @Query("SELECT COUNT(*) FROM songs")
    suspend fun countAll(): Int

    @Query("UPDATE songs SET favorite = :favorite WHERE id = :id")
    suspend fun setFavorite(id: Long, favorite: Boolean): Int

    @Query("UPDATE songs SET play_count = play_count + 1, last_played = :now WHERE id = :id")
    suspend fun recordPlay(id: Long, now: Long): Int

    @Query("UPDATE songs SET is_available = :available WHERE id = :id")
    suspend fun setAvailable(id: Long, available: Boolean): Int

    @Query("UPDATE songs SET is_available = :available WHERE storage_location_id = :locationId")
    suspend fun setAvailableByLocation(locationId: Long, available: Boolean): Int

    @Query("DELETE FROM songs WHERE storage_location_id = :locationId")
    suspend fun deleteByLocation(locationId: Long): Int

    @Transaction
    suspend fun insertOrUpdateAll(songs: List<Song>) {
        insertAll(songs)
    }
}