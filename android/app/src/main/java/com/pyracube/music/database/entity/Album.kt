package com.pyracube.music.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.ColumnInfo
import androidx.room.Index

@Entity(
    tableName = "albums",
    indices = [
        Index(value = ["artist"]),
        Index(value = ["year"]),
    ]
)
data class Album(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(name = "name") val name: String,
    @ColumnInfo(name = "artist") val artist: String,
    @ColumnInfo(name = "artwork_uri") val artworkUri: String? = null,
    @ColumnInfo(name = "year") val year: Int? = null,
    @ColumnInfo(name = "song_count") val songCount: Int = 0,
    @ColumnInfo(name = "total_duration") val totalDuration: Long = 0,
    @ColumnInfo(name = "date_added") val dateAdded: Long = System.currentTimeMillis(),
)