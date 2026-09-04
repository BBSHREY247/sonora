package com.pyracube.music.bridge

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.pyracube.music.storage.StorageManager
import com.pyracube.music.database.entity.StorageLocation
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@CapacitorPlugin(name = "StoragePlugin", requestCodes = [StorageManager.REQUEST_CODE_PICK_FOLDER])
class StoragePlugin : Plugin() {

    private val scope = CoroutineScope(Dispatchers.IO)
    private lateinit var storageManager: StorageManager
    private var pickFolderCallback: PluginCall? = null

    override fun load() {
        storageManager = StorageManager(context)
    }

    @PluginMethod
    fun pickFolder(call: PluginCall) {
        pickFolderCallback = call
        val activity = getActivity() ?: return call.reject("Activity not available")
        storageManager.pickStorageLocation(activity) { uri ->
            uri?.let {
                scope.launch {
                    try {
                        storageManager.persistUriPermission(it)
                        val location = storageManager.createStorageLocation(
                            name = "User Storage",
                            rootUri = it,
                            isPrimary = true
                        )
                        // Save to database would happen here
                        call.resolve(JSObject().put("uri", it.toString()))
                    } catch (e: Exception) {
                        Log.e("StoragePlugin", "Error saving storage location", e)
                        call.reject("Failed to save storage location", e)
                    }
                }
            } ?: call.reject("No folder selected")
            pickFolderCallback = null
        }
    }

    @PluginMethod
    fun getPersistedUris(call: PluginCall) {
        scope.launch {
            try {
                val uris = storageManager.getPersistedUris().map { it.toString() }
                call.resolve(JSObject().put("uris", uris))
            } catch (e: Exception) {
                Log.e("StoragePlugin", "Error getting persisted URIs", e)
                call.reject("Failed to get persisted URIs", e)
            }
        }
    }

    @PluginMethod
    fun checkAvailability(call: PluginCall) {
        val uriString = call.getString("uri") ?: return call.reject("URI required")
        val uri = Uri.parse(uriString)
        scope.launch {
            try {
                val available = storageManager.checkAvailability(uri)
                call.resolve(JSObject().put("available", available))
            } catch (e: Exception) {
                Log.e("StoragePlugin", "Error checking availability", e)
                call.reject("Failed to check availability", e)
            }
        }
    }

    @PluginMethod
    fun createPyracubeStructure(call: PluginCall) {
        val uriString = call.getString("uri") ?: return call.reject("URI required")
        val uri = Uri.parse(uriString)
        scope.launch {
            try {
                storageManager.createPyracubeStructure(uri)
                call.resolve(JSObject().put("success", true))
            } catch (e: Exception) {
                Log.e("StoragePlugin", "Error creating structure", e)
                call.reject("Failed to create structure", e)
            }
        }
    }

    @PluginMethod
    fun getStorageStats(call: PluginCall) {
        val uriString = call.getString("uri") ?: return call.reject("URI required")
        val uri = Uri.parse(uriString)
        scope.launch {
            try {
                val (total, free) = storageManager.getStorageStats(uri)
                call.resolve(JSObject().put("total", total).put("free", free))
            } catch (e: Exception) {
                Log.e("StoragePlugin", "Error getting storage stats", e)
                call.reject("Failed to get storage stats", e)
            }
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == StorageManager.REQUEST_CODE_PICK_FOLDER) {
            pickFolderCallback?.let { call ->
                if (resultCode == Activity.RESULT_OK) {
                    data?.data?.let { uri ->
                        storageManager.persistUriPermission(uri)
                        call.resolve(JSObject().put("uri", uri.toString()))
                    }
                } else {
                    call.reject("User cancelled")
                }
                pickFolderCallback = null
            }
        }
    }
}