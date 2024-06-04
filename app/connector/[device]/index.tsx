import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import BluetoothManager from '@/utils/BluetoothManager';
import { Peripheral } from 'react-native-ble-manager';
import {router, useLocalSearchParams, useRouter} from "expo-router";

interface DeviceConnectorProps {
    device: Peripheral;
}

const DeviceConnector: React.FC<DeviceConnectorProps> = () => {
    const {device} = useLocalSearchParams();


    const [message, setMessage] = useState<string>('');
    const [receivedMessage, setReceivedMessage] = useState<string>('');

    useEffect(() => {
        BluetoothManager.addListeners(() => {}, handleUpdateValue);
        return () => {
            BluetoothManager.removeListeners();
        };
    }, []);

    const handleUpdateValue = (data: any) => {
        console.log('Received data from characteristic', data);
        const value = String.fromCharCode(...data.value);
        setReceivedMessage(prevMessage => prevMessage + value);
    };

    const startNotification = () => {
        BluetoothManager.startNotification('ffe0', 'ffe1',
            () => console.log('Notification started'),
            (error) => console.error('Notification error', error)
        );
    };

    const sendMessage = () => {
        BluetoothManager.sendMessage('ffe0', 'ffe1', message,
            () => console.log('Message sent'),
            (error) => console.error('Message sending error', error)
        );
    };

    const disconnect = () => {
        console.log(device)
        BluetoothManager.disconnectDevice(device,
            () => {
               router.back()
            },
            (error) => console.error('Disconnection error', error)
        );
    };

    return (
        <View>
            <TextInput
                style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginTop: 20 }}
                placeholder="Enter message"
                onChangeText={text => setMessage(text)}
                value={message}
            />
            <Button title="Send Message" onPress={sendMessage} />
            <Button title="Start Notification" onPress={startNotification} />
            <Button title="Disconnect" onPress={disconnect} />
            <Text>Received Message: {receivedMessage}</Text>
        </View>
    );
};

export default DeviceConnector;
