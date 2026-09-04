package com.pyracube.music.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.ColumnInfo
import androidx.room.Index

@Entity(
    tableName = "artists",
    indices = [
        Index(value = ["name"], unique = true),
    ]
)
data class Artist(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(name = "name") val name: String,
    @ColumnInfo(name = "artwork_uri") val artworkUri: String? = null,
    @ColumnInfo(name = "song_count") val songCount: Int = 0,
    @ColumnInfo(name = "album_count") val albumCount: Int = 0,
)