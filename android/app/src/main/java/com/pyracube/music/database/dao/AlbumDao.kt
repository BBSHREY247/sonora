package com.pyracube.music.database.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import androidx.room.Delete
import androidx.room.OnConflictStrategy
import com.pyracube.music.database.entity.Album
import kotlinx.coroutines.flow.Flow

@Dao
interface AlbumDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(albums: List<Album>): List<Long>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(album: Album): Long

    @Update
    suspend fun update(album: Album): Int

    @Delete
    suspend fun delete(album: Album): Int

    @Query("DELETE FROM albums WHERE id = :id")
    suspend fun deleteById(id: Long): Int

    @Query("SELECT * FROM albums WHERE id = :id")
    suspend fun getById(id: Long): Album?

    @Query("SELECT * FROM albums ORDER BY name ASC")
    fun getAll(): Flow<List<Album>>

    @Query("SELECT * FROM albums ORDER BY name ASC")
    suspend fun getAllList(): List<Album>

    @Query("SELECT * FROM albums WHERE artist = :artist ORDER BY year DESC, name ASC")
    suspend fun getByArtist(artist: String): List<Album>

    @Query("SELECT * FROM albums WHERE name = :name AND artist = :artist")
    suspend fun getByNameAndArtist(name: String, artist: String): Album?

    @Query("SELECT COUNT(*) FROM albums")
    suspend fun count(): Int
}