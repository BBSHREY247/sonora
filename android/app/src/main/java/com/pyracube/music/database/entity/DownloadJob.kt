package com.pyracube.music.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.ColumnInfo
import androidx.room.Index

@Entity(
    tableName = "download_jobs",
    indices = [
        Index(value = ["status"]),
        Index(value = ["date_created"]),
    ]
)
data class DownloadJob(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(name = "title") val title: String,
    @ColumnInfo(name = "artist") val artist: String? = null,
    @ColumnInfo(name = "source_url") val sourceUrl: String,
    @ColumnInfo(name = "output_path") val outputPath: String? = null,
    @ColumnInfo(name = "file_size") val fileSize: Long? = null,
    @ColumnInfo(name = "downloaded_bytes") val downloadedBytes: Long = 0,
    @ColumnInfo(name = "status") val status: String, // queued, downloading, processing, tagging, completed, failed, cancelled
    @ColumnInfo(name = "error_message") val errorMessage: String? = null,
    @ColumnInfo(name = "progress") val progress: Float = 0f,
    @ColumnInfo(name = "speed") val speed: Long? = null,
    @ColumnInfo(name = "eta") val eta: Long? = null,
    @ColumnInfo(name = "date_created") val dateCreated: Long = System.currentTimeMillis(),
    @ColumnInfo(name = "date_started") val dateStarted: Long? = null,
    @ColumnInfo(name = "date_completed") val dateCompleted: Long? = null,
    @ColumnInfo(name = "song_id") val songId: Long? = null,
    @ColumnInfo(name = "metadata_json") val metadataJson: String? = null,
    @ColumnInfo(name = "priority") val priority: Int = 0,
)