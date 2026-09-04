package com.pyracube.music.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.ColumnInfo

@Entity(tableName = "storage_locations")
data class StorageLocation(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(name = "name") val name: String,
    @ColumnInfo(name = "root_uri") val rootUri: String,
    @ColumnInfo(name = "is_primary") val isPrimary: Boolean = false,
    @ColumnInfo(name = "is_removable") val isRemovable: Boolean = false,
    @ColumnInfo(name = "is_available") val isAvailable: Boolean = true,
    @ColumnInfo(name = "total_space") val totalSpace: Long? = null,
    @ColumnInfo(name = "free_space") val freeSpace: Long? = null,
    @ColumnInfo(name = "date_added") val dateAdded: Long = System.currentTimeMillis(),
)