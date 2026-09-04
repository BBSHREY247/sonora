package com.pyracube.music.database.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import androidx.room.Delete
import androidx.room.OnConflictStrategy
import com.pyracube.music.database.entity.Artist
import kotlinx.coroutines.flow.Flow

@Dao
interface ArtistDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(artists: List<Artist>): List<Long>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(artist: Artist): Long

    @Update
    suspend fun update(artist: Artist): Int

    @Delete
    suspend fun delete(artist: Artist): Int

    @Query("DELETE FROM artists WHERE id = :id")
    suspend fun deleteById(id: Long): Int

    @Query("SELECT * FROM artists WHERE id = :id")
    suspend fun getById(id: Long): Artist?

    @Query("SELECT * FROM artists ORDER BY name ASC")
    fun getAll(): Flow<List<Artist>>

    @Query("SELECT * FROM artists ORDER BY name ASC")
    suspend fun getAllList(): List<Artist>

    @Query("SELECT * FROM artists WHERE name = :name")
    suspend fun getByName(name: String): Artist?

    @Query("SELECT COUNT(*) FROM artists")
    suspend fun count(): Int
}