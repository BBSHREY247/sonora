package com.pyracube.music.storage

import android.app.Activity
import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import androidx.documentfile.provider.DocumentFile
import com.pyracube.music.database.entity.StorageLocation
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class StorageManager(private val context: Context) {

    companion object {
        private const val REQUEST_CODE_PICK_FOLDER = 4242
        private const val PREF_STORAGE_URIS = "storage_uris"
    }

    fun pickStorageLocation(activity: Activity, callback: (Uri?) -> Unit) {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION or
            Intent.FLAG_GRANT_WRITE_URI_PERMISSION or
            Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            val downloadsUri = Uri.fromFile(downloadsDir)
            intent.putExtra(DocumentsContract.EXTRA_INITIAL_URI, downloadsUri)
        }
        activity.startActivityForResult(intent, REQUEST_CODE_PICK_FOLDER) { resultCode, data ->
            if (resultCode == Activity.RESULT_OK) {
                data?.data?.let { uri ->
                    persistUriPermission(uri)
                    callback(uri)
                }
            } else {
                callback(null)
            }
        }
    }

    fun persistUriPermission(uri: Uri) {
        val contentResolver: ContentResolver = context.contentResolver
        val takeFlags = Intent.FLAG_GRANT_READ_URI_PERMISSION or
            Intent.FLAG_GRANT_WRITE_URI_PERMISSION
        contentResolver.takePersistableUriPermission(uri, takeFlags)
    }

    fun releaseUriPermission(uri: Uri) {
        val contentResolver: ContentResolver = context.contentResolver
        contentResolver.releasePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
    }

    fun getPersistedUris(): List<Uri> {
        val contentResolver = context.contentResolver
        return contentResolver.persistedUriPermissions.map { it.uri }
    }

    fun createStorageLocation(name: String, rootUri: Uri, isPrimary: Boolean = false, isRemovable: Boolean = false): StorageLocation {
        return StorageLocation(
            name = name,
            rootUri = rootUri.toString(),
            isPrimary = isPrimary,
            isRemovable = isRemovable,
            isAvailable = checkAvailability(rootUri),
        )
    }

    fun checkAvailability(uri: Uri): Boolean {
        return try {
            val doc = DocumentFile.fromTreeUri(context, uri)
            doc != null && doc.exists()
        } catch (e: Exception) {
            false
        }
    }

    fun getDocumentFile(uri: Uri): DocumentFile? {
        return DocumentFile.fromTreeUri(context, uri)
    }

    fun listFiles(uri: Uri, mimeType: String? = null): List<DocumentFile> {
        val doc = getDocumentFile(uri) ?: return emptyList()
        return doc.listFiles()?.filter { file ->
            mimeType == null || file.type?.startsWith(mimeType) == true
        } ?: emptyList()
    }

    fun findOrCreateDir(parent: DocumentFile, name: String): DocumentFile {
        parent.listFiles()?.find { it.name == name && it.isDirectory }?.let { return it }
        return parent.createDirectory(name)!!
    }

    fun createPyracubeStructure(rootUri: Uri): DocumentFile? {
        val root = getDocumentFile(rootUri) ?: return null
        val musicDir = findOrCreateDir(root, "Music")
        val artworkDir = findOrCreateDir(root, "Artwork")
        val downloadsDir = findOrCreateDir(root, "Downloads")
        return root
    }

    fun getMusicDirectory(rootUri: Uri): DocumentFile? {
        val root = getDocumentFile(rootUri) ?: return null
        return findOrCreateDir(root, "Music")
    }

    fun getArtworkDirectory(rootUri: Uri): DocumentFile? {
        val root = getDocumentFile(rootUri) ?: return null
        return findOrCreateDir(root, "Artwork")
    }

    fun getDownloadsDirectory(rootUri: Uri): DocumentFile? {
        val root = getDocumentFile(rootUri) ?: return null
        return findOrCreateDir(root, "Downloads")
    }

    fun resolveArtistAlbumPath(musicDir: DocumentFile, artist: String, album: String): DocumentFile {
        val sanitizedArtist = sanitizeFileName(artist)
        val sanitizedAlbum = sanitizeFileName(album)
        val artistDir = findOrCreateDir(musicDir, sanitizedArtist)
        return findOrCreateDir(artistDir, sanitizedAlbum)
    }

    private fun sanitizeFileName(name: String): String {
        return name.replace("[/\\\\:*?\"<>|]", "_").trim()
    }

    fun generateTrackFileName(trackNumber: Int?, title: String): String {
        val sanitizedTitle = sanitizeFileName(title)
        return if (trackNumber != null && trackNumber > 0) {
            String.format("%02d - %s", trackNumber, sanitizedTitle)
        } else {
            sanitizedTitle
        }
    }

    suspend fun getStorageStats(uri: Uri): Pair<Long, Long> = withContext(Dispatchers.IO) {
        try {
            val doc = getDocumentFile(uri)
            if (doc != null) {
                val stat = android.os.StatFs(doc.uri.path)
                val total = stat.totalBytes.toLong()
                val free = stat.freeBytes.toLong()
                return Pair(total, free)
            }
        } catch (e: Exception) {
            Log.w("StorageManager", "Failed to get storage stats", e)
        }
        return Pair(0L, 0L)
    }
}