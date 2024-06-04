import React, { useEffect, useState } from 'react';
import {FlatList, TouchableOpacity, View, Text, Button, SafeAreaView} from 'react-native';
import BluetoothManager from '@/utils/BluetoothManager';
import { Peripheral } from 'react-native-ble-manager';
import {router} from "expo-router";

const DeviceScanner= () => {
    const [devices, setDevices] = useState<Peripheral[]>([]);

    useEffect(() => {
        BluetoothManager.init();
        BluetoothManager.addListeners(handleDiscoverPeripheral, () => {});
        scanForDevices();

        return () => {
            BluetoothManager.removeListeners();
        };
    }, []);

    const handleDiscoverPeripheral = (peripheral: Peripheral) => {
        setDevices(prevDevices => {
            if (!prevDevices.some(d => d.id === peripheral.id)) {
                return [...prevDevices, peripheral];
            }
            return prevDevices;
        });
    };

    const scanForDevices = () => {
        setDevices([]);
        BluetoothManager.scanDevices(5, () => console.log('Scanning for devices...'));
    };

    const onDeviceSelect = (peripheral: any) => {
        // Adicionar tela que esta tentando conectar...
        BluetoothManager.connectToDevice(peripheral.id, () => {

            router.push({ pathname: `connector/${peripheral.id}` })

        }, () => {});
    }

    return (
        <SafeAreaView>
            <Button title="Scan for Devices" onPress={scanForDevices} />
            <FlatList
                data={devices}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => onDeviceSelect(item)}>
                        <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
                            <Text>{item.name ? item.name : 'Unnamed Device'}</Text>
                            <Text>{item.id}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
};

export default DeviceScanner;
