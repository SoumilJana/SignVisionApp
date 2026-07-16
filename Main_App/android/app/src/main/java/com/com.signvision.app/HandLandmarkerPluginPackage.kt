package com.signvision.app

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry

/**
 * HandLandmarkerPluginPackage
 *
 * Registers the HandLandmarkerPlugin with VisionCamera's FrameProcessorPluginRegistry.
 * Must be added to MainApplication.kt's getPackages() list.
 */
class HandLandmarkerPluginPackage : ReactPackage {

    companion object {
        init {
            // Register the plugin with VisionCamera's plugin registry
            // The name "handLandmarker" is how JS will call it:
            // VisionCameraProxy.initFrameProcessorPlugin('handLandmarker')
            FrameProcessorPluginRegistry.addFrameProcessorPlugin("handLandmarker") { proxy, options ->
                HandLandmarkerPlugin(proxy, options)
            }
        }
    }

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return emptyList()
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
