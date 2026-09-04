package com.pyracube.music.bridge

import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.pyracube.music.database.repository.LibraryRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@CapacitorPlugin(name = "SettingsPlugin")
class SettingsPlugin : Plugin() {

    private val scope = CoroutineScope(Dispatchers.IO)
    private lateinit var repository: LibraryRepository

    override fun load() {
        repository = LibraryRepository.getInstance(context)
    }

    @PluginMethod
    fun getSettings(call: PluginCall) {
        scope.launch {
            try {
                val settings = repository.getAllSettings()
                val jsObject = JSObject()
                settings.forEach { (key, value) ->
                    jsObject.put(key, value)
                }
                call.resolve(jsObject)
            } catch (e: Exception) {
                Log.e("SettingsPlugin", "Error getting settings", e)
                call.reject("Failed to get settings", e)
            }
        }
    }

    @PluginMethod
    fun getSetting(call: PluginCall) {
        val key = call.getString("key") ?: return call.reject("Key required")
        scope.launch {
            try {
                val value = repository.getSetting(key)
                call.resolve(JSObject().put("value", value))
            } catch (e: Exception) {
                Log.e("SettingsPlugin", "Error getting setting", e)
                call.reject("Failed to get setting", e)
            }
        }
    }

    @PluginMethod
    fun setSetting(call: PluginCall) {
        val key = call.getString("key") ?: return call.reject("Key required")
        val value = call.getString("value") ?: return call.reject("Value required")
        scope.launch {
            try {
                repository.setSetting(key, value)
                call.resolve()
            } catch (e: Exception) {
                Log.e("SettingsPlugin", "Error setting setting", e)
                call.reject("Failed to set setting", e)
            }
        }
    }

    @PluginMethod
    fun setMultipleSettings(call: PluginCall) {
        val settings = call.getObject("settings") ?: return call.reject("Settings object required")
        scope.launch {
            try {
                settings.keys().forEach { key ->
                    val value = settings.getString(key)
                    value?.let { repository.setSetting(key, it) }
                }
                call.resolve()
            } catch (e: Exception) {
                Log.e("SettingsPlugin", "Error setting multiple settings", e)
                call.reject("Failed to set multiple settings", e)
            }
        }
    }
}