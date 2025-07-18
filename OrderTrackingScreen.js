import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

const OrderTrackingScreen = ({ route }) => {
  const { orderId } = route.params;
  const { userToken } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Fetch order details
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${orderId}/track`);
        setOrder(response.data);
      } catch (error) {
        console.error('Error fetching order:', error);
      }
    };

    fetchOrder();

    // Setup socket connection
    const newSocket = io('https://your-backend-api.com', {
      query: { token: userToken },
    });
    
    setSocket(newSocket);

    // Join order room
    newSocket.emit('joinOrderRoom', orderId);

    // Listen for order updates
    newSocket.on('orderUpdate', (updatedOrder) => {
      setOrder(updatedOrder);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [orderId, userToken]);

  if (!order) {
    return (
      <View style={styles.container}>
        <Text>Loading order details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order #{order.id}</Text>
      <Text style={styles.status}>Status: {order.status}</Text>
      
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: order.restaurant.location.coordinates[1],
          longitude: order.restaurant.location.coordinates[0],
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker
          coordinate={{
            latitude: order.restaurant.location.coordinates[1],
            longitude: order.restaurant.location.coordinates[0],
          }}
          title="Restaurant"
          pinColor="red"
        />
        
        {order.deliveryLocation && (
          <Marker
            coordinate={{
              latitude: order.deliveryLocation.coordinates[1],
              longitude: order.deliveryLocation.coordinates[0],
            }}
            title="Delivery Location"
            pinColor="blue"
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  status: {
    fontSize: 18,
    marginBottom: 16,
  },
  map: {
    flex: 1,
    width: '100%',
  },
});

export default OrderTrackingScreen;