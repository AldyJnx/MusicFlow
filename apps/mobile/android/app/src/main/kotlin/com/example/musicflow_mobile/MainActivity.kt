package com.example.musicflow_mobile

import android.content.ActivityNotFoundException
import android.content.Intent
import android.media.audiofx.Equalizer
import android.os.Build
import android.provider.Settings
import com.ryanheise.audioservice.AudioServiceActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : AudioServiceActivity() {
    private var equalizer: Equalizer? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            "musicflow/equalizer"
        ).setMethodCallHandler { call, result ->
            try {
                when (call.method) {
                    "setup" -> {
                        setupEqualizer(call.arguments as Int)
                        result.success(null)
                    }
                    "setEnabled" -> {
                        equalizer?.enabled = call.arguments as Boolean
                        result.success(null)
                    }
                    "setBands" -> {
                        @Suppress("UNCHECKED_CAST")
                        setBands(call.arguments as List<Double>)
                        result.success(null)
                    }
                    "release" -> {
                        releaseEqualizer()
                        result.success(null)
                    }
                    else -> result.notImplemented()
                }
            } catch (error: Throwable) {
                result.error("EQUALIZER_ERROR", error.message, null)
            }
        }

        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            "musicflow/cast"
        ).setMethodCallHandler { call, result ->
            try {
                when (call.method) {
                    "openCastSettings" -> result.success(openCastSettings())
                    else -> result.notImplemented()
                }
            } catch (error: Throwable) {
                result.error("CAST_ERROR", error.message, null)
            }
        }
    }

    private fun openCastSettings(): Boolean {
        val action = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Settings.ACTION_CAST_SETTINGS
        } else {
            Settings.ACTION_WIRELESS_SETTINGS
        }
        return try {
            startActivity(Intent(action).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            true
        } catch (_: ActivityNotFoundException) {
            startActivity(
                Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
            true
        }
    }

    private fun setupEqualizer(audioSessionId: Int) {
        releaseEqualizer()
        equalizer = Equalizer(0, audioSessionId).apply {
            enabled = true
        }
    }

    private fun setBands(bandsDb: List<Double>) {
        val eq = equalizer ?: return
        if (bandsDb.isEmpty()) return

        val levelRange = eq.bandLevelRange
        val minLevel = levelRange[0].toInt()
        val maxLevel = levelRange[1].toInt()
        val uiFrequenciesHz = doubleArrayOf(
            31.0, 62.0, 125.0, 250.0, 500.0,
            1000.0, 2000.0, 4000.0, 8000.0, 16000.0
        )

        for (nativeBand in 0 until eq.numberOfBands.toInt()) {
            val centerHz = eq.getCenterFreq(nativeBand.toShort()) / 1000.0
            val gainDb = interpolateGain(centerHz, uiFrequenciesHz, bandsDb)
            val millibels = (gainDb * 100).toInt().coerceIn(minLevel, maxLevel)
            eq.setBandLevel(nativeBand.toShort(), millibels.toShort())
        }
    }

    private fun interpolateGain(
        centerHz: Double,
        uiFrequenciesHz: DoubleArray,
        bandsDb: List<Double>
    ): Double {
        if (centerHz <= uiFrequenciesHz.first()) return bandsDb.first()
        if (centerHz >= uiFrequenciesHz.last()) return bandsDb.last()

        for (index in 0 until uiFrequenciesHz.lastIndex) {
            val lowFreq = uiFrequenciesHz[index]
            val highFreq = uiFrequenciesHz[index + 1]
            if (centerHz in lowFreq..highFreq) {
                val ratio = (centerHz - lowFreq) / (highFreq - lowFreq)
                val lowGain = bandsDb[index]
                val highGain = bandsDb[index + 1]
                return lowGain + (highGain - lowGain) * ratio
            }
        }

        return 0.0
    }

    private fun releaseEqualizer() {
        equalizer?.release()
        equalizer = null
    }
}
