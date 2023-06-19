import React from 'react'
import { StyleSheet, TouchableOpacity, Text } from 'react-native'

export const Card = () => {
  return (
    <TouchableOpacity style={styles.card}>
        <Text> 
            Card here
        </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
    card: {
        height: 20,
        backgroundColor: '#2f95dc'
    }
})
