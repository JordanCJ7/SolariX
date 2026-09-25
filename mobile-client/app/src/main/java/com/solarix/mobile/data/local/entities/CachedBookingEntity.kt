package com.solarix.mobile.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Entity representing local cached reservations for offline viewing and quick access.
 */
@Entity(tableName = "cached_bookings")
data class CachedBookingEntity(
    @PrimaryKey
    val id: String,
    val reservationNumber: String,
    val prosumerNIC: String,
    val stationId: String,
    val stationName: String,
    val slotId: String,
    val reservationDate: String,
    val startTime: String,
    val endTime: String,
    val energyAmountKW: Double,
    val tradeType: String,
    val status: String,
    val qrCodeToken: String,
    val updatedAt: Long = System.currentTimeMillis()
)
