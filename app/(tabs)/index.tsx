import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, Button, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

const manager = new BleManager();
const serviceUUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const characteristicUUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
const App = () => {
    const [devices, setDevices] = useState([]);
    const [connectedDevice, setConnectedDevice] = useState(null);
    const [services, setServices] = useState([]);
    const [characteristics, setCharacteristics] = useState([]);
    const [selectedServiceUUID, setSelectedServiceUUID] = useState(characteristicUUID);
    const [selectedCharacteristicUUID, setSelectedCharacteristicUUID] = useState(serviceUUID);
    const [message, setMessage] = useState();

    useEffect(() => {
        requestPermissions();
        return () => {
            manager.destroy();
        };
    }, []);

    const requestPermissions = async () => {
        // const { status: bluetoothStatus } = await Permissions.askAsync(Permissions.BLUETOOTH_PERIPHERAL);
        // const { status: locationStatus } = await Permissions.askAsync(Permissions.LOCATION_WHEN_IN_USE);
        // if (bluetoothStatus !== 'granted' || locationStatus !== 'granted') {
        //     Alert.alert('Permission Required', 'Bluetooth and Location permissions are required to use Bluetooth');
        // }
    };

    const scanForDevices = () => {
        setDevices([]);
        manager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.error(error);
                return;
            }
            if (device && device.name) {
                setDevices(prevDevices => {
                    if (!prevDevices.find(d => d.id === device.id)) {
                        return [...prevDevices, device];
                    }
                    return prevDevices;
                });
            }
        });

        setTimeout(() => {
            manager.stopDeviceScan();
        }, 10000);
    };

    const connectToDevice = async (device) => {
        try {
            const connectedDevice = await manager.connectToDevice(device.id);
            await connectedDevice.discoverAllServicesAndCharacteristics();
            setConnectedDevice(connectedDevice);
            Alert.alert('Connected', `Connected to ${device.name}`);

            const services = await connectedDevice.services();
            setServices(services);
        } catch (error) {
            console.error('Connection error:', error);
            Alert.alert('Connection Error', error.message);
        }
    };

    const discoverCharacteristics = async (serviceUUID) => {
        try {
            const service = services.find(s => s.uuid === serviceUUID);
            if (service) {
                const characteristics = await service.characteristics();
                console.log(JSON.stringify(characteristics))
                const writableCharacteristics = characteristics.filter(c => c.isWritableWithResponse || c.isWritableWithoutResponse);
                setCharacteristics(writableCharacteristics);
            } else {
                Alert.alert('Service Not Found', 'The selected service was not found.');
            }
        } catch (error) {
            console.error('Discovery error:', error);
            Alert.alert('Discovery Error', error.message);
        }
    };

    const sendMessage = async () => {
        if (!connectedDevice || !selectedServiceUUID || !selectedCharacteristicUUID || !message) {
            Alert.alert('Incomplete Data', 'Device, service, characteristic, or message is missing');
            return;
        }

        const messageBuffer = Buffer.from(message, 'utf-8');
        const messageBase64 = messageBuffer.toString('base64');

        console.log(`Sending message: ${message}`);
        console.log(`Encoded message (base64): ${messageBase64}`);

        try {
            console.log(connectedDevice)
            await manager.writeCharacteristicWithoutResponseForDevice(connectedDevice?.id, selectedServiceUUID, selectedCharacteristicUUID, messageBase64);
            console.log('Message Sent:', message);
            Alert.alert('Message Sent', 'The message was sent successfully.');
        } catch (error) {
            console.error('Failed to send message:', error);
            Alert.alert('Message Error', error.message);
        }
    };

    const disconnectFromDevice = async () => {
        if (connectedDevice) {
            try {
                await manager.cancelDeviceConnection(connectedDevice.id);
                setConnectedDevice(null);
                setServices([]);
                setCharacteristics([]);
                setSelectedServiceUUID('');
                setSelectedCharacteristicUUID('');
                Alert.alert('Disconnected', 'Device disconnected');
            } catch (error) {
                console.error('Disconnection error:', error);
                Alert.alert('Disconnection Error', error.message);
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Button title="Scan for Devices" onPress={scanForDevices} />
            <FlatList
                data={devices}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => connectToDevice(item)}>
                        <View style={styles.device}>
                            <Text>{item.name || item.id}</Text>
                            <Text>Connect</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
            {connectedDevice && (
                <View style={styles.connectedDevice}>
                    <Text style={{
                        padding:  10,
                        backgroundColor: 'lightgrey',
                    }}>Connected to {connectedDevice.name} Service: {selectedServiceUUID} Characteristic: {selectedCharacteristicUUID}</Text>
                    <FlatList
                        data={services}
                        keyExtractor={item => item.uuid}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => {
                                setSelectedServiceUUID(item.uuid);
                                discoverCharacteristics(item.uuid);
                            }}>
                                <View style={styles.service}>
                                    <Text>Service: {item.uuid}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                    <FlatList
                        data={characteristics}
                        keyExtractor={item => item.uuid}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => setSelectedCharacteristicUUID(item.uuid)}>
                                <View style={styles.characteristic}>
                                    <Text>Characteristic: {item.uuid}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />

                </View>
            )}
            <>
                <TextInput
                    style={styles.input}
                    placeholder="Enter message"
                    value={message}
                    onChangeText={setMessage}
                />
                <Button title="Send Message" onPress={sendMessage} />
                <Button title="Disconnect" onPress={disconnectFromDevice} />
            </>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    device: {
        padding: 10,
        borderBottomWidth: 1,
    },
    connectedDevice: {
        marginTop: 20,
    },
    service: {
        padding: 10,
        borderBottomWidth: 1,
    },
    characteristic: {
        padding: 10,
        borderBottomWidth: 1,
    },
    input: {
        borderWidth: 1,
        padding: 10,
        marginBottom: 10,
        backgroundColor: 'lightgrey',
    },
});

export default App;
