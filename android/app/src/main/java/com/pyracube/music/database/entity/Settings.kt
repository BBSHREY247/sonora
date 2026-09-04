package com.pyracube.music.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.ColumnInfo

@Entity(tableName = "settings")
data class Settings(
    @PrimaryKey val key: String,
    @ColumnInfo(name = "value") val value: String,
)