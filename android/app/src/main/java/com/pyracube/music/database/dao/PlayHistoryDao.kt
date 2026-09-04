package com.pyracube.music.database.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Delete
import androidx.room.OnConflictStrategy
import com.pyracube.music.database.entity.PlayHistory
import kotlinx.coroutines.flow.Flow

@Dao
interface PlayHistoryDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(history: PlayHistory): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(history: List<PlayHistory>): List<Long>

    @Delete
    suspend fun delete(history: PlayHistory): Int

    @Query("DELETE FROM play_history WHERE id = :id")
    suspend fun deleteById(id: Long): Int

    @Query("DELETE FROM play_history WHERE played_at < :cutoff")
    suspend fun deleteOlderThan(cutoff: Long): Int

    @Query("SELECT * FROM play_history ORDER BY played_at DESC LIMIT :limit")
    suspend fun getRecent(limit: Int): List<PlayHistory>

    @Query("SELECT * FROM play_history WHERE song_id = :songId ORDER BY played_at DESC")
    suspend fun getBySongId(songId: Long): List<PlayHistory>

    @Query("SELECT COUNT(*) FROM play_history")
    suspend fun count(): Int
}