import BleManager, { Peripheral, PeripheralInfo, Characteristic } from 'react-native-ble-manager';

class BluetoothManager {
  device: Peripheral | null = null;
  characteristics: Characteristic[] = [];

  init() {
    BleManager.start({ showAlert: false });
  }

  addListeners(handleDiscoverPeripheral: (peripheral: Peripheral) => void, handleUpdateValue: (data: any) => void) {
    BleManager.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
    BleManager.addListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValue);
  }

  removeListeners() {
    //BleManager.removeListener('BleManagerDiscoverPeripheral');
    //BleManager.removeListener('BleManagerDidUpdateValueForCharacteristic');
  }

  scanDevices(duration = 5, callback: () => void) {
    BleManager.scan([], duration, true)
      .then(() => {
        callback();
      })
      .catch(err => console.error(err));
  }

  stopScan() {
    BleManager.stopScan();
  }

  connectToDevice(deviceId: string, onSuccess: (deviceInfo: PeripheralInfo) => void, onError: (error: Error) => void) {
    BleManager.connect(deviceId)
      .then(() => {
        this.device = { id: deviceId } as Peripheral;
        return BleManager.retrieveServices(deviceId);
      })
      .then((deviceInfo) => {
        this.characteristics = deviceInfo.characteristics;
        onSuccess(deviceInfo);
      })
      .catch(onError);
  }

  disconnectDevice(deviceId: string, onSuccess: () => void, onError: (error: Error) => void) {
    BleManager.disconnect(deviceId)
      .then(onSuccess)
      .catch(onError);
  }

  startNotification(serviceUUID: string, characteristicUUID: string, onSuccess: () => void, onError: (error: Error) => void) {
    if (this.device) {
      BleManager.startNotification(this.device.id, serviceUUID, characteristicUUID)
        .then(onSuccess)
        .catch(onError);
    } else {
      onError(new Error('No device connected'));
    }
  }

  sendMessage(serviceUUID: string, characteristicUUID: string, message: string, onSuccess: () => void, onError: (error: Error) => void) {
    if (this.device && this.characteristics.length > 0) {
      const asciiMessage = Array.from(message).map(char => char.charCodeAt(0));
      BleManager.writeWithoutResponse(this.device.id, serviceUUID, characteristicUUID, asciiMessage)
        .then(onSuccess)
        .catch(onError);
    } else {
      onError(new Error('No device connected or characteristics not retrieved'));
    }
  }
}

export default new BluetoothManager();
