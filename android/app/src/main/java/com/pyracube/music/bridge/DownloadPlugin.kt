package com.pyracube.music.bridge

import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.pyracube.music.database.entity.DownloadJob
import com.pyracube.music.database.repository.LibraryRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@CapacitorPlugin(name = "DownloadPlugin")
class DownloadPlugin : Plugin() {

    private val scope = CoroutineScope(Dispatchers.IO)
    private lateinit var repository: LibraryRepository

    override fun load() {
        repository = LibraryRepository.getInstance(context)
    }

    @PluginMethod
    fun getDownloads(call: PluginCall) {
        scope.launch {
            try {
                val downloads = repository.getAllDownloadsList()
                val jsArray = downloads.map { downloadToJS(it) }
                call.resolve(JSObject().put("downloads", jsArray))
            } catch (e: Exception) {
                Log.e("DownloadPlugin", "Error getting downloads", e)
                call.reject("Failed to get downloads", e)
            }
        }
    }

    @PluginMethod
    fun getActiveDownloads(call: PluginCall) {
        scope.launch {
            try {
                val downloads = repository.getActiveDownloads()
                val jsArray = downloads.map { downloadToJS(it) }
                call.resolve(JSObject().put("downloads", jsArray))
            } catch (e: Exception) {
                Log.e("DownloadPlugin", "Error getting active downloads", e)
                call.reject("Failed to get active downloads", e)
            }
        }
    }

    @PluginMethod
    fun queueDownload(call: PluginCall) {
        val title = call.getString("title") ?: return call.reject("Title required")
        val artist = call.getString("artist")
        val sourceUrl = call.getString("sourceUrl") ?: return call.reject("Source URL required")
        val metadataJson = call.getString("metadataJson")
        scope.launch {
            try {
                val job = DownloadJob(
                    title = title,
                    artist = artist,
                    sourceUrl = sourceUrl,
                    status = "queued",
                    metadataJson = metadataJson,
                )
                val id = repository.insertDownload(job)
                call.resolve(JSObject().put("id", id))
            } catch (e: Exception) {
                Log.e("DownloadPlugin", "Error queuing download", e)
                call.reject("Failed to queue download", e)
            }
        }
    }

    @PluginMethod
    fun cancelDownload(call: PluginCall) {
        val id = call.getLong("id") ?: return call.reject("ID required")
        scope.launch {
            try {
                repository.updateDownloadStatus(id, "cancelled")
                call.resolve()
            } catch (e: Exception) {
                Log.e("DownloadPlugin", "Error cancelling download", e)
                call.reject("Failed to cancel download", e)
            }
        }
    }

    @PluginMethod
    fun retryDownload(call: PluginCall) {
        val id = call.getLong("id") ?: return call.reject("ID required")
        scope.launch {
            try {
                repository.updateDownloadStatus(id, "queued")
                call.resolve()
            } catch (e: Exception) {
                Log.e("DownloadPlugin", "Error retrying download", e)
                call.reject("Failed to retry download", e)
            }
        }
    }

    @PluginMethod
    fun clearCompleted(call: PluginCall) {
        scope.launch {
            try {
                repository.clearCompletedDownloads()
                call.resolve()
            } catch (e: Exception) {
                Log.e("DownloadPlugin", "Error clearing completed", e)
                call.reject("Failed to clear completed", e)
            }
        }
    }

    @PluginMethod
    fun clearFailed(call: PluginCall) {
        scope.launch {
            try {
                repository.clearFailedDownloads()
                call.resolve()
            } catch (e: Exception) {
                Log.e("DownloadPlugin", "Error clearing failed", e)
                call.reject("Failed to clear failed", e)
            }
        }
    }

    @PluginMethod
    fun updateProgress(call: PluginCall) {
        val id = call.getLong("id") ?: return call.reject("ID required")
        val bytes = call.getLong("bytes") ?: return call.reject("Bytes required")
        val progress = call.getFloat("progress") ?: return call.reject("Progress required")
        val speed = call.getLong("speed")
        val eta = call.getLong("eta")
        scope.launch {
            try {
                repository.updateDownloadProgress(id, bytes, progress, speed, eta)
                call.resolve()
            } catch (e: Exception) {
                Log.e("DownloadPlugin", "Error updating progress", e)
                call.reject("Failed to update progress", e)
            }
        }
    }

    private fun downloadToJS(job: DownloadJob): JSObject {
        return JSObject().apply {
            put("id", job.id)
            put("title", job.title)
            put("artist", job.artist)
            put("sourceUrl", job.sourceUrl)
            put("outputPath", job.outputPath)
            put("fileSize", job.fileSize)
            put("downloadedBytes", job.downloadedBytes)
            put("status", job.status)
            put("errorMessage", job.errorMessage)
            put("progress", job.progress)
            put("speed", job.speed)
            put("eta", job.eta)
            put("dateCreated", job.dateCreated)
            put("dateStarted", job.dateStarted)
            put("dateCompleted", job.dateCompleted)
            put("songId", job.songId)
        }
    }
}