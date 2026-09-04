package com.pyracube.music.mediascan

import android.content.ContentResolver
import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.provider.MediaStore
import android.util.Log
import com.pyracube.music.database.entity.Song
import com.pyracube.music.database.entity.Album
import com.pyracube.music.database.entity.Artist
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class MediaStoreScanner(private val context: Context) {

    private val contentResolver: ContentResolver = context.contentResolver

    data class ScanResult(
        val songsAdded: Int = 0,
        val songsUpdated: Int = 0,
        val songsRemoved: Int = 0,
        val albumsAdded: Int = 0,
        val artistsAdded: Int = 0,
    )

    suspend fun scan(): ScanResult = withContext(Dispatchers.IO) {
        val result = ScanResult()
        scanSongs(result)
        scanAlbums(result)
        scanArtists(result)
        result
    }

    private fun scanSongs(result: ScanResult) {
        val projection = arrayOf(
            MediaStore.Audio.Media._ID,
            MediaStore.Audio.Media.TITLE,
            MediaStore.Audio.Media.ARTIST,
            MediaStore.Audio.Media.ALBUM,
            MediaStore.Audio.Media.ALBUM_ID,
            MediaStore.Audio.Media.DURATION,
            MediaStore.Audio.Media.DATA,
            MediaStore.Audio.Media.SIZE,
            MediaStore.Audio.Media.MIME_TYPE,
            MediaStore.Audio.Media.TRACK,
            MediaStore.Audio.Media.YEAR,
            MediaStore.Audio.Media.GENRE,
            MediaStore.Audio.Media.ALBUM_ARTIST,
            MediaStore.Audio.Media.DATE_ADDED,
            MediaStore.Audio.Media.DATE_MODIFIED,
            MediaStore.Audio.Media.IS_MUSIC,
        )

        val selection = "${MediaStore.Audio.Media.IS_MUSIC} = 1"
        val sortOrder = "${MediaStore.Audio.Media.TITLE} ASC"

        contentResolver.query(
            MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
            projection,
            selection,
            null,
            sortOrder
        )?.use { cursor ->
            val idCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
            val titleCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
            val artistCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
            val albumCol = cursor.getColumnIndex(MediaStore.Audio.Media.ALBUM)
            val albumIdCol = cursor.getColumnIndex(MediaStore.Audio.Media.ALBUM_ID)
            val durationCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)
            val dataCol = cursor.getColumnIndex(MediaStore.Audio.Media.DATA)
            val sizeCol = cursor.getColumnIndex(MediaStore.Audio.Media.SIZE)
            val mimeCol = cursor.getColumnIndex(MediaStore.Audio.Media.MIME_TYPE)
            val trackCol = cursor.getColumnIndex(MediaStore.Audio.Media.TRACK)
            val yearCol = cursor.getColumnIndex(MediaStore.Audio.Media.YEAR)
            val genreCol = cursor.getColumnIndex(MediaStore.Audio.Media.GENRE)
            val albumArtistCol = cursor.getColumnIndex(MediaStore.Audio.Media.ALBUM_ARTIST)
            val dateAddedCol = cursor.getColumnIndex(MediaStore.Audio.Media.DATE_ADDED)

            while (cursor.moveToNext()) {
                val id = cursor.getLong(idCol)
                val title = cursor.getString(titleCol) ?: "Unknown"
                val artist = cursor.getString(artistCol) ?: "Unknown"
                val album = if (albumCol >= 0) cursor.getString(albumCol) else null
                val albumId = if (albumIdCol >= 0) cursor.getLong(albumIdCol) else 0L
                val duration = cursor.getLong(durationCol)
                val data = if (dataCol >= 0) cursor.getString(dataCol) else null
                val size = if (sizeCol >= 0) cursor.getLong(sizeCol) else 0L
                val mimeType = if (mimeCol >= 0) cursor.getString(mimeCol) else null
                val trackNumber = if (trackCol >= 0) cursor.getInt(trackCol) else 0
                val year = if (yearCol >= 0) cursor.getInt(yearCol) else 0
                val genre = if (genreCol >= 0) cursor.getString(genreCol) else null
                val albumArtist = if (albumArtistCol >= 0) cursor.getString(albumArtistCol) else null
                val dateAdded = if (dateAddedCol >= 0) cursor.getLong(dateAddedCol) * 1000L else System.currentTimeMillis()

                val uri = Uri.withAppendedPath(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id.toString()).toString()
                val artworkUri = if (albumId > 0) {
                    Uri.withAppendedPath(MediaStore.Audio.Albums.EXTERNAL_CONTENT_URI, albumId.toString()).toString()
                } else null

                val song = Song(
                    uri = uri,
                    title = title,
                    artist = artist,
                    album = album,
                    albumArtist = albumArtist,
                    duration = duration,
                    genre = genre,
                    year = if (year > 0) year else null,
                    trackNumber = if (trackNumber > 0) trackNumber else null,
                    artworkUri = artworkUri,
                    dateAdded = dateAdded,
                    mediaStoreId = id,
                    fileSize = if (size > 0) size else null,
                    mimeType = mimeType,
                    isAvailable = true,
                )

                // This would be inserted via repository - returning count for now
                result.songsAdded++
            }
        }
    }

    private fun scanAlbums(result: ScanResult) {
        val projection = arrayOf(
            MediaStore.Audio.Albums._ID,
            MediaStore.Audio.Albums.ALBUM,
            MediaStore.Audio.Albums.ARTIST,
            MediaStore.Audio.Albums.ALBUM_ART,
            MediaStore.Audio.Albums.NUMBER_OF_SONGS,
            MediaStore.Audio.Albums.FIRST_YEAR,
        )

        contentResolver.query(
            MediaStore.Audio.Albums.EXTERNAL_CONTENT_URI,
            projection,
            null,
            null,
            "${MediaStore.Audio.Albums.ALBUM} ASC"
        )?.use { cursor ->
            val idCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Albums._ID)
            val nameCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Albums.ALBUM)
            val artistCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Albums.ARTIST)
            val artCol = cursor.getColumnIndex(MediaStore.Audio.Albums.ALBUM_ART)
            val songCountCol = cursor.getColumnIndex(MediaStore.Audio.Albums.NUMBER_OF_SONGS)
            val yearCol = cursor.getColumnIndex(MediaStore.Audio.Albums.FIRST_YEAR)

            while (cursor.moveToNext()) {
                val id = cursor.getLong(idCol)
                val name = cursor.getString(nameCol) ?: "Unknown"
                val artist = cursor.getString(artistCol) ?: "Unknown"
                val artworkUri = if (artCol >= 0) cursor.getString(artCol) else null
                val songCount = if (songCountCol >= 0) cursor.getInt(songCountCol) else 0
                val year = if (yearCol >= 0) cursor.getInt(yearCol) else 0

                val album = Album(
                    id = id,
                    name = name,
                    artist = artist,
                    artworkUri = artworkUri,
                    year = if (year > 0) year else null,
                    songCount = songCount,
                    dateAdded = System.currentTimeMillis(),
                )

                result.albumsAdded++
            }
        }
    }

    private fun scanArtists(result: ScanResult) {
        val projection = arrayOf(
            MediaStore.Audio.Artists._ID,
            MediaStore.Audio.Artists.ARTIST,
            MediaStore.Audio.Artists.NUMBER_OF_ALBUMS,
            MediaStore.Audio.Artists.NUMBER_OF_TRACKS,
        )

        contentResolver.query(
            MediaStore.Audio.Artists.EXTERNAL_CONTENT_URI,
            projection,
            null,
            null,
            "${MediaStore.Audio.Artists.ARTIST} ASC"
        )?.use { cursor ->
            val idCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Artists._ID)
            val nameCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Artists.ARTIST)
            val albumCountCol = cursor.getColumnIndex(MediaStore.Audio.Artists.NUMBER_OF_ALBUMS)
            val songCountCol = cursor.getColumnIndex(MediaStore.Audio.Artists.NUMBER_OF_TRACKS)

            while (cursor.moveToNext()) {
                val id = cursor.getLong(idCol)
                val name = cursor.getString(nameCol) ?: "Unknown"
                val albumCount = if (albumCountCol >= 0) cursor.getInt(albumCountCol) else 0
                val songCount = if (songCountCol >= 0) cursor.getInt(songCountCol) else 0

                val artist = Artist(
                    id = id,
                    name = name,
                    albumCount = albumCount,
                    songCount = songCount,
                )

                result.artistsAdded++
            }
        }
    }

    suspend fun getArtworkUri(albumId: Long): String? = withContext(Dispatchers.IO) {
        val uri = Uri.withAppendedPath(MediaStore.Audio.Albums.EXTERNAL_CONTENT_URI, albumId.toString())
        contentResolver.query(uri, arrayOf(MediaStore.Audio.Albums.ALBUM_ART), null, null, null)?.use { cursor ->
            val artCol = cursor.getColumnIndex(MediaStore.Audio.Albums.ALBUM_ART)
            if (cursor.moveToFirst() && artCol >= 0) {
                return@use cursor.getString(artCol)
            }
        }
        null
    }
}