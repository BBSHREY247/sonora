package com.pyracube.music.database.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import androidx.room.Delete
import androidx.room.OnConflictStrategy
import com.pyracube.music.database.entity.DownloadJob
import kotlinx.coroutines.flow.Flow

@Dao
interface DownloadJobDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(job: DownloadJob): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(jobs: List<DownloadJob>): List<Long>

    @Update
    suspend fun update(job: DownloadJob): Int

    @Delete
    suspend fun delete(job: DownloadJob): Int

    @Query("DELETE FROM download_jobs WHERE id = :id")
    suspend fun deleteById(id: Long): Int

    @Query("SELECT * FROM download_jobs WHERE id = :id")
    suspend fun getById(id: Long): DownloadJob?

    @Query("SELECT * FROM download_jobs ORDER BY date_created DESC")
    fun getAll(): Flow<List<DownloadJob>>

    @Query("SELECT * FROM download_jobs ORDER BY date_created DESC")
    suspend fun getAllList(): List<DownloadJob>

    @Query("SELECT * FROM download_jobs WHERE status IN (:statuses) ORDER BY priority DESC, date_created ASC")
    suspend fun getByStatuses(statuses: List<String>): List<DownloadJob>

    @Query("SELECT * FROM download_jobs WHERE status = :status ORDER BY date_created ASC")
    suspend fun getByStatus(status: String): List<DownloadJob>

    @Query("SELECT * FROM download_jobs WHERE status IN ('queued', 'downloading', 'processing', 'tagging') ORDER BY priority DESC, date_created ASC")
    suspend fun getActive(): List<DownloadJob>

    @Query("SELECT * FROM download_jobs WHERE status = 'completed' ORDER BY date_completed DESC")
    suspend fun getCompleted(): List<DownloadJob>

    @Query("SELECT * FROM download_jobs WHERE status = 'failed' ORDER BY date_created DESC")
    suspend fun getFailed(): List<DownloadJob>

    @Query("DELETE FROM download_jobs WHERE status = 'completed'")
    suspend fun clearCompleted(): Int

    @Query("DELETE FROM download_jobs WHERE status = 'failed'")
    suspend fun clearFailed(): Int

    @Query("UPDATE download_jobs SET status = :status, error_message = :error WHERE id = :id")
    suspend fun updateStatus(id: Long, status: String, error: String?): Int

    @Query("UPDATE download_jobs SET downloaded_bytes = :bytes, progress = :progress, speed = :speed, eta = :eta WHERE id = :id")
    suspend fun updateProgress(id: Long, bytes: Long, progress: Float, speed: Long?, eta: Long?): Int

    @Query("UPDATE download_jobs SET status = 'downloading', date_started = :now WHERE id = :id")
    suspend fun markStarted(id: Long, now: Long): Int

    @Query("UPDATE download_jobs SET status = 'completed', date_completed = :now, output_path = :path, song_id = :songId WHERE id = :id")
    suspend fun markCompleted(id: Long, now: Long, path: String, songId: Long): Int

    @Query("UPDATE download_jobs SET status = 'failed', error_message = :error WHERE id = :id")
    suspend fun markFailed(id: Long, error: String): Int
}