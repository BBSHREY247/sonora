package com.pyracube.music.database.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import androidx.room.OnConflictStrategy
import com.pyracube.music.database.entity.Settings
import kotlinx.coroutines.flow.Flow

@Dao
interface SettingsDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(setting: Settings): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(settings: List<Settings>): List<Long>

    @Update
    suspend fun update(setting: Settings): Int

    @Query("SELECT * FROM settings WHERE key = :key")
    suspend fun get(key: String): Settings?

    @Query("SELECT value FROM settings WHERE key = :key")
    suspend fun getValue(key: String): String?

    @Query("SELECT * FROM settings")
    fun getAll(): Flow<List<Settings>>

    @Query("SELECT * FROM settings")
    suspend fun getAllList(): List<Settings>

    @Query("DELETE FROM settings WHERE key = :key")
    suspend fun delete(key: String): Int
}