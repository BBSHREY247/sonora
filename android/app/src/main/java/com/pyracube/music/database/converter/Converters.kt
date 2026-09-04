package com.pyracube.music.database.converter

import androidx.room.TypeConverter

class Converters {
    @TypeConverter
    fun fromBoolean(value: Boolean?): Int {
        return if (value == true) 1 else 0
    }

    @TypeConverter
    fun toBoolean(value: Int?): Boolean {
        return value == 1
    }

    @TypeConverter
    fun fromLongList(list: List<Long>?): String? {
        return list?.joinToString(",")
    }

    @TypeConverter
    fun toLongList(value: String?): List<Long>? {
        return value?.split(",")?.map { it.toLong() }
    }

    @TypeConverter
    fun fromStringList(list: List<String>?): String? {
        return list?.joinToString(",")
    }

    @TypeConverter
    fun toStringList(value: String?): List<String>? {
        return value?.split(",")
    }
}