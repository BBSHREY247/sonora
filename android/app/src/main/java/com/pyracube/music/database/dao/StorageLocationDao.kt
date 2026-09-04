package com.pyracube.music.database.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import androidx.room.Delete
import androidx.room.OnConflictStrategy
import com.pyracube.music.database.entity.StorageLocation
import kotlinx.coroutines.flow.Flow

@Dao
interface StorageLocationDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(location: StorageLocation): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(locations: List<StorageLocation>): List<Long>

    @Update
    suspend fun update(location: StorageLocation): Int

    @Delete
    suspend fun delete(location: StorageLocation): Int

    @Query("DELETE FROM storage_locations WHERE id = :id")
    suspend fun deleteById(id: Long): Int

    @Query("SELECT * FROM storage_locations WHERE id = :id")
    suspend fun getById(id: Long): StorageLocation?

    @Query("SELECT * FROM storage_locations WHERE root_uri = :uri")
    suspend fun getByUri(uri: String): StorageLocation?

    @Query("SELECT * FROM storage_locations ORDER BY is_primary DESC, date_added ASC")
    fun getAll(): Flow<List<StorageLocation>>

    @Query("SELECT * FROM storage_locations ORDER BY is_primary DESC, date_added ASC")
    suspend fun getAllList(): List<StorageLocation>

    @Query("SELECT * FROM storage_locations WHERE is_primary = 1")
    suspend fun getPrimary(): StorageLocation?

    @Query("SELECT * FROM storage_locations WHERE is_available = 1")
    suspend fun getAvailable(): List<StorageLocation>

    @Query("UPDATE storage_locations SET is_available = :available WHERE id = :id")
    suspend fun setAvailable(id: Long, available: Boolean): Int

    @Query("UPDATE storage_locations SET total_space = :total, free_space = :free WHERE id = :id")
    suspend fun updateSpace(id: Long, total: Long, free: Long): Int
}