import {useState, useEffect, useCallback} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {Camera, useCameraDevice} from 'react-native-vision-camera';

export type CameraPermissionStatus = 'granted' | 'denied' | 'not-determined';

export function useCamera() {
  const [permissionStatus, setPermissionStatus] =
    useState<CameraPermissionStatus>('not-determined');

  // Fix 2: Only request device once permission is confirmed granted
  const device = useCameraDevice(permissionStatus === 'granted' ? 'front' : null);

  const checkPermission = useCallback(async () => {
    const status = await Camera.getCameraPermissionStatus();
    setPermissionStatus(
      status === 'granted'
        ? 'granted'
        : status === 'denied'
          ? 'denied'
          : 'not-determined',
    );
  }, []);

  // Fix 1: Check permission on mount and re-check whenever app returns to foreground
  useEffect(() => {
    checkPermission();

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkPermission();
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [checkPermission]);

  const requestPermission = useCallback(async () => {
    const status = await Camera.requestCameraPermission();
    setPermissionStatus(status === 'granted' ? 'granted' : 'denied');
    return status === 'granted';
  }, []);

  return {
    device,
    permissionStatus,
    requestPermission,
    isPermissionGranted: permissionStatus === 'granted',
  };
}
