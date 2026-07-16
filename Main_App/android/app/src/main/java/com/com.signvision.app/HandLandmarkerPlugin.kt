package com.signvision.app

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import android.graphics.Matrix
import android.graphics.Rect
import android.graphics.YuvImage
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarker
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarkerResult
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import java.io.ByteArrayOutputStream
import android.util.Log

/**
 * HandLandmarkerPlugin
 * 
 * VisionCamera v4 Frame Processor plugin that:
 * 1. Receives each camera frame as an ImageProxy (YUV format)
 * 2. Converts YUV → RGB ENTIRELY in native Kotlin (ADR-007 — never set pixelFormat="rgb" on Camera)
 * 3. Runs MediaPipe Hand Landmarker to extract 21 3D landmarks
 * 4. Supports up to 2 hands (dual-hand ASL signs)
 * 5. Returns results as a Map for JS consumption
 */
class HandLandmarkerPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?) :
    FrameProcessorPlugin() {

    companion object {
        private const val TAG = "HandLandmarkerPlugin"
        private const val MODEL_ASSET = "hand_landmarker.task"
        private const val MAX_HANDS = 2
        private const val MIN_HAND_DETECTION_CONFIDENCE = 0.5f
        private const val MIN_HAND_PRESENCE_CONFIDENCE = 0.5f
        private const val MIN_TRACKING_CONFIDENCE = 0.5f
    }

    private var handLandmarker: HandLandmarker? = null

    init {
        try {
            val context = proxy.context
            val baseOptions = BaseOptions.builder()
                .setModelAssetPath(MODEL_ASSET)
                .build()

            val handLandmarkerOptions = HandLandmarker.HandLandmarkerOptions.builder()
                .setBaseOptions(baseOptions)
                .setRunningMode(RunningMode.IMAGE)
                .setNumHands(MAX_HANDS)
                .setMinHandDetectionConfidence(MIN_HAND_DETECTION_CONFIDENCE)
                .setMinHandPresenceConfidence(MIN_HAND_PRESENCE_CONFIDENCE)
                .setMinTrackingConfidence(MIN_TRACKING_CONFIDENCE)
                .build()

            handLandmarker = HandLandmarker.createFromOptions(context, handLandmarkerOptions)
            Log.d(TAG, "HandLandmarker initialized successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize HandLandmarker: ${e.message}")
        }
    }

    override fun callback(frame: Frame, arguments: Map<String, Any>?): Any? {
        val image = frame.image

        return try {
            // Step 1: Convert YUV_420_888 → RGB Bitmap (native side, ADR-007)
            val bitmap = yuvToBitmap(frame)
                ?: return createErrorResult("YUV conversion failed")

            // Step 2: Build MPImage from Bitmap
            val mpImage = BitmapImageBuilder(bitmap).build()

            // Step 3: Run MediaPipe detection
            val handLandmarker = this.handLandmarker
                ?: return createErrorResult("HandLandmarker not initialized")

            val result: HandLandmarkerResult = handLandmarker.detect(mpImage)

            // Step 4: Convert result to JS-compatible Map
            buildResultMap(result)
        } catch (e: Exception) {
            Log.e(TAG, "Error in frame processing: ${e.message}")
            createErrorResult(e.message ?: "Unknown error")
        }
    }

    /**
     * Convert YUV_420_888 ImageProxy to RGB Bitmap.
     * This MUST happen on the native side to avoid frame drops (ADR-007).
     */
    private fun yuvToBitmap(frame: Frame): Bitmap? {
        return try {
            val image = frame.image
            val width = image.width
            val height = image.height

            val yPlane = image.planes[0]
            val uPlane = image.planes[1]
            val vPlane = image.planes[2]

            val yBuffer = yPlane.buffer
            val uBuffer = uPlane.buffer
            val vBuffer = vPlane.buffer

            val ySize = yBuffer.remaining()
            val uSize = uBuffer.remaining()
            val vSize = vBuffer.remaining()

            val nv21 = ByteArray(ySize + uSize + vSize)
            yBuffer.get(nv21, 0, ySize)
            vBuffer.get(nv21, ySize, vSize)
            uBuffer.get(nv21, ySize + vSize, uSize)

            val yuvImage = YuvImage(nv21, ImageFormat.NV21, width, height, null)
            val out = ByteArrayOutputStream()
            yuvImage.compressToJpeg(Rect(0, 0, width, height), 90, out)
            val imageBytes = out.toByteArray()

            BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
        } catch (e: Exception) {
            Log.e(TAG, "YUV conversion error: ${e.message}")
            null
        }
    }

    /**
     * Convert MediaPipe HandLandmarkerResult to a JS-compatible Map.
     * 
     * Returns structure:
     * {
     *   hands: [
     *     {
     *       isLeftHand: Boolean,
     *       confidence: Float,
     *       landmarks: [{ x: Float, y: Float, z: Float }, ...] // 21 landmarks
     *     }
     *   ]
     * }
     */
    private fun buildResultMap(result: HandLandmarkerResult): Map<String, Any> {
        val handsArray = mutableListOf<Map<String, Any>>()

        for (i in result.landmarks().indices) {
            val landmarks = result.landmarks()[i]
            val handedness = result.handednesses().getOrNull(i)

            val landmarksList = landmarks.map { landmark ->
                mapOf(
                    "x" to landmark.x().toDouble(),
                    "y" to landmark.y().toDouble(),
                    "z" to landmark.z().toDouble()
                )
            }

            val isLeftHand = handedness?.firstOrNull()?.categoryName()?.equals("Left", ignoreCase = true) ?: false
            val confidence = handedness?.firstOrNull()?.score()?.toDouble() ?: 0.0

            handsArray.add(
                mapOf(
                    "isLeftHand" to isLeftHand,
                    "confidence" to confidence,
                    "landmarks" to landmarksList
                )
            )
        }

        return mapOf(
            "hands" to handsArray,
            "handCount" to handsArray.size
        )
    }

    private fun createErrorResult(message: String): Map<String, Any> {
        return mapOf(
            "hands" to emptyList<Any>(),
            "handCount" to 0,
            "error" to message
        )
    }
}
