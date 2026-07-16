import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useCamera} from '../hooks/useCamera';
import CameraView from '../components/CameraView';
import {CameraErrorBoundary} from '../components/CameraErrorBoundary';
import {COLORS, DARK_COLORS, SHADOWS, RADIUS, SPACING, TYPOGRAPHY} from '../theme';
import {TranslationResult} from '../ml/translationPipeline';
import {dataCapture} from '../ml/dataCapture';
import {FeatureGate} from '../components/FeatureGate';
import {ASL_LABELS} from '../ml/modelService';
import {useTheme} from '../contexts/ThemeContext';

const TARGET_SAMPLES = 50;

export default function TranslatorScreen() {
  const {device, permissionStatus, requestPermission} = useCamera();
  const {isDark} = useTheme();
  const styles = React.useMemo(() => getStyles(isDark), [isDark]);

  const [translationResult, setTranslationResult] = React.useState<TranslationResult | null>(null);
  const [pipelineError, _setPipelineError] = React.useState<string | null>(null);
  const [deviceTimedOut, setDeviceTimedOut] = React.useState(false);
  const [cameraKey, setCameraKey] = React.useState(0);

  // Data capture state
  const [captureMode, setCaptureMode] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState('A');
  const [showLabelPicker, setShowLabelPicker] = React.useState(false);
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [sampleCount, setSampleCount] = React.useState(0);

  // Fix 5: Device detection timeout — don't spin forever
  React.useEffect(() => {
    if (permissionStatus !== 'granted' || device) {
      setDeviceTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setDeviceTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, [permissionStatus, device]);

  // ── Poll dataCapture.getSampleCount() every 100ms while recording ──────────
  React.useEffect(() => {
    if (!isCapturing) return;

    const interval = setInterval(async () => {
      const count = dataCapture.getSampleCount();
      setSampleCount(count);

      // Auto-stop and save when target reached
      if (count >= TARGET_SAMPLES) {
        clearInterval(interval);
        const samples = dataCapture.stopCapture();
        setIsCapturing(false);
        setSampleCount(0);

        try {
          await dataCapture.saveToLocalStorage(selectedLabel, samples);
          Alert.alert(
            '✅ Capture Complete',
            `${samples.length} samples saved for "${selectedLabel}"`,
            [{text: 'OK'}],
          );
        } catch (e) {
          Alert.alert('Save Failed', String(e));
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isCapturing, selectedLabel]);

  const startDataCapture = React.useCallback(() => {
    setSampleCount(0);
    dataCapture.startCapture(selectedLabel);
    setIsCapturing(true);
  }, [selectedLabel]);

  const stopDataCapture = React.useCallback(async () => {
    const samples = dataCapture.stopCapture();
    setIsCapturing(false);
    setSampleCount(0);

    if (samples.length > 0) {
      try {
        await dataCapture.saveToLocalStorage(selectedLabel, samples);
        Alert.alert(
          'Capture Saved',
          `${samples.length} samples saved for "${selectedLabel}"`,
          [{text: 'OK'}],
        );
      } catch (e) {
        Alert.alert('Save Failed', String(e));
      }
    }
  }, [selectedLabel]);

  const handleTranslationResult = React.useCallback(
    (result: TranslationResult | null) => {
      setTranslationResult(result);
    },
    [],
  );

  const confidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#22c55e';
    if (confidence >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  // Permission not yet determined
  if (permissionStatus === 'not-determined') {
    return (
      <View style={styles.centeredContainer}>
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          style={styles.iconCircle}>
          <Icon name="camera" size={40} color="#fff" />
        </LinearGradient>
        <Text style={styles.title}>Camera Access Required</Text>
        <Text style={styles.description}>
          SignVision needs camera access to detect and translate sign language in
          real-time.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={requestPermission}
          activeOpacity={0.85}>
          <Text style={styles.buttonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Fix 3: Permission denied — OS won't show dialog again; direct user to Settings
  if (permissionStatus === 'denied') {
    return (
      <View style={styles.centeredContainer}>
        <View style={styles.errorIconCircle}>
          <Icon name="camera-off" size={40} color={COLORS.error} />
        </View>
        <Text style={styles.title}>Camera Access Denied</Text>
        <Text style={styles.description}>
          To use sign language detection, enable camera access in your device settings.
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.retryButton]}
          onPress={() => Linking.openSettings()}
          activeOpacity={0.85}>
          <Text style={styles.buttonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No camera device found — Fix 5: timeout after 5s instead of infinite spinner
  if (!device) {
    if (deviceTimedOut) {
      return (
        <View style={styles.centeredContainer}>
          <View style={styles.errorIconCircle}>
            <Icon name="camera-off" size={40} color={COLORS.error} />
          </View>
          <Text style={styles.title}>Camera Not Found</Text>
          <Text style={styles.description}>
            Unable to access the camera. Make sure no other app is using it and try again.
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.retryButton]}
            onPress={() => {
              setDeviceTimedOut(false);
              setCameraKey(k => k + 1);
            }}
            activeOpacity={0.85}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex1}>
      <CameraErrorBoundary key={cameraKey} onRetry={() => setCameraKey(k => k + 1)}>
        <CameraView
          device={device}
          isActive={true}
          captureMode={captureMode}
          _onTranslationResult={handleTranslationResult}
        />
      </CameraErrorBoundary>

      {/* Translation Result Overlay — hidden during capture mode */}
      {!captureMode && translationResult && (
        <View style={styles.resultOverlay} pointerEvents="none">
          <View style={styles.resultCard}>
            <View style={styles.resultMain}>
              <Text style={styles.resultLabel}>{translationResult.label}</Text>
              <Text
                style={[
                  styles.resultConfidence,
                  {color: confidenceColor(translationResult.confidence)},
                ]}>
                {(translationResult.confidence * 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.resultBadges}>
              <View style={[styles.modeBadge, styles.staticBadge]}>
                <Text style={styles.modeBadgeText}>SINGLE-HAND</Text>
              </View>
              <View style={styles.latencyBadge}>
                <Text style={styles.latencyBadgeText}>
                  {translationResult.latencyMs.toFixed(1)}ms
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Pipeline error notice */}
      {pipelineError && (
        <View style={styles.pipelineErrorBanner} pointerEvents="none">
          <Text style={styles.pipelineErrorText}>{pipelineError}</Text>
        </View>
      )}

      {/* ── Capture mode UI ── */}
      {captureMode && (
        <>
          {/* Letter selector + Record/Stop button */}
          <View style={styles.captureModeOverlay}>
            <TouchableOpacity
              style={styles.labelSelector}
              onPress={() => !isCapturing && setShowLabelPicker(true)}
              disabled={isCapturing}>
              <Text style={styles.labelSelectorText}>Sign: {selectedLabel}</Text>
              <Icon name="chevron-down" size={16} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.captureBtn, isCapturing && styles.captureBtnActive]}
              onPress={isCapturing ? stopDataCapture : startDataCapture}>
              <Icon
                name={isCapturing ? 'stop' : 'record'}
                size={20}
                color="#fff"
              />
              <Text style={styles.captureBtnText}>
                {isCapturing ? `Stop (${sampleCount})` : 'Record'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Live progress banner */}
          <View style={styles.captureBanner} pointerEvents="none">
            {isCapturing ? (
              <>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {width: `${Math.min((sampleCount / TARGET_SAMPLES) * 100, 100)}%`},
                    ]}
                  />
                </View>
                <Text style={styles.captureBannerText}>
                  Capturing "{selectedLabel}" — {sampleCount} / {TARGET_SAMPLES}
                </Text>
              </>
            ) : (
              <Text style={styles.captureBannerText}>
                Select letter &amp; tap Record
              </Text>
            )}
          </View>
        </>
      )}

      {/* Data Capture Toggle — only visible to users with data_collection flag (dev/admin role) */}
      <FeatureGate flag="data_collection">
        <TouchableOpacity
          style={[styles.captureToggle, captureMode && styles.captureToggleActive]}
          onPress={() => {
            if (isCapturing) stopDataCapture();
            setCaptureMode(prev => !prev);
          }}>
          <Icon
            name={captureMode ? 'database-check' : 'database-plus'}
            size={22}
            color={captureMode ? '#fff' : COLORS.textMuted}
          />
        </TouchableOpacity>
      </FeatureGate>

      {/* Label picker modal */}
      <Modal visible={showLabelPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Sign Label</Text>
            <ScrollView>
              {ASL_LABELS.map(label => (
                <TouchableOpacity
                  key={label}
                  style={[
                    styles.labelOption,
                    label === selectedLabel && styles.labelOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedLabel(label);
                    setShowLabelPicker(false);
                  }}>
                  <Text
                    style={[
                      styles.labelOptionText,
                      label === selectedLabel && styles.labelOptionTextSelected,
                    ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowLabelPicker(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (isDark: boolean) => {
  const theme = isDark ? DARK_COLORS : COLORS;

  return StyleSheet.create({
    flex1: {flex: 1},
    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
      paddingHorizontal: 32,
    },
    iconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.lg,
      ...SHADOWS.card,
    },
    errorIconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: isDark ? '#450a0a' : '#fef2f2',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.lg,
    },
    title: {
      ...TYPOGRAPHY.h2,
      color: theme.textMain,
      marginBottom: 12,
      textAlign: 'center',
    },
    description: {
      fontSize: 15,
      color: theme.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 32,
      maxWidth: 280,
    },
    button: {
      backgroundColor: theme.primary,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: RADIUS.lg,
      ...SHADOWS.fab,
    },
    retryButton: {
      backgroundColor: theme.error,
      shadowColor: theme.error,
    },
    buttonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '700'},
    loadingText: {color: theme.textMuted, fontSize: 14, marginTop: 16},

    // Translation result
    resultOverlay: {
      position: 'absolute',
      bottom: 245,
      left: SPACING.md,
      right: SPACING.md,
    },
    resultCard: {
      backgroundColor: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      ...SHADOWS.card,
    },
    resultMain: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 8,
    },
    resultLabel: {
      fontSize: 40,
      fontWeight: '800',
      color: theme.textMain,
      marginRight: 12,
    },
    resultConfidence: {fontSize: 22, fontWeight: '700'},
    resultBadges: {flexDirection: 'row', gap: 6},
    modeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: RADIUS.full,
    },
    staticBadge: {backgroundColor: isDark ? '#1e3a8a' : '#dbeafe'},
    modeBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: isDark ? '#cbd5e1' : COLORS.textMuted,
      letterSpacing: 0.5,
    },
    latencyBadge: {
      backgroundColor: isDark ? '#334155' : '#f1f5f9',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: RADIUS.full,
    },
    latencyBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.textMuted,
      fontVariant: ['tabular-nums'],
    },
    pipelineErrorBanner: {
      position: 'absolute',
      top: 110,
      left: SPACING.md,
      right: SPACING.md,
      backgroundColor: 'rgba(239,68,68,0.9)',
      borderRadius: RADIUS.md,
      padding: SPACING.sm,
    },
    pipelineErrorText: {color: '#fff', fontSize: 12, textAlign: 'center'},

    // Capture toggle button
    captureToggle: {
      position: 'absolute',
      bottom: 200,
      left: SPACING.lg,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.cardBg,
      alignItems: 'center',
      justifyContent: 'center',
      ...SHADOWS.soft,
    },
    captureToggleActive: {
      backgroundColor: COLORS.primary,
    },

    // Capture overlay row
    captureModeOverlay: {
      position: 'absolute',
      bottom: 255,
      left: SPACING.lg,
      right: SPACING.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    labelSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBg,
      borderRadius: RADIUS.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 4,
      ...SHADOWS.soft,
    },
    labelSelectorText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.primary,
    },
    captureBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primary,
      borderRadius: RADIUS.full,
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 6,
      flex: 1,
    },
    captureBtnActive: {backgroundColor: theme.error},
    captureBtnText: {color: '#fff', fontWeight: '700', fontSize: 13},

    // Live progress banner
    captureBanner: {
      position: 'absolute',
      bottom: 215,
      alignSelf: 'center',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(0,0,0,0.72)',
      borderRadius: RADIUS.full,
      paddingHorizontal: 16,
      paddingVertical: 7,
      minWidth: 220,
    },
    captureBannerText: {color: '#fff', fontSize: 12, fontWeight: '600'},
    progressTrack: {
      width: 180,
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#22c55e',
      borderRadius: 2,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.cardBg,
      borderTopLeftRadius: RADIUS['2xl'],
      borderTopRightRadius: RADIUS['2xl'],
      maxHeight: '60%',
      padding: SPACING.lg,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textMain,
      marginBottom: SPACING.md,
      textAlign: 'center',
    },
    labelOption: {
      paddingVertical: 14,
      paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.md,
      marginBottom: 4,
    },
    labelOptionSelected: {backgroundColor: isDark ? '#1e3a8a' : '#eff6ff'},
    labelOptionText: {fontSize: 16, color: theme.textMain},
    labelOptionTextSelected: {color: theme.primary, fontWeight: '700'},
    modalClose: {
      marginTop: SPACING.md,
      alignItems: 'center',
      padding: SPACING.md,
    },
    modalCloseText: {color: theme.textMuted, fontSize: 15},
  });
};