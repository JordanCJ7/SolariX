package com.solarix.mobile.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.solarix.mobile.data.remote.dtos.StationResponse

@Entity(tableName = "cached_stations")
data class CachedStationEntity(
    @PrimaryKey val id: String,
    val stationCode: String,
    val stationName: String,
    val locationName: String,
    val latitude: Double,
    val longitude: Double,
    val capacityKWh: Double,
    val totalBatterySlots: Int,
    val availableBatterySlots: Int,
    val isActive: Boolean,
    val operationalHours: String?,
    val contactNumber: String?,
    val createdAt: String?
) {
    fun toResponse(): StationResponse {
        return StationResponse(
            id = id,
            stationCode = stationCode,
            stationName = stationName,
            locationName = locationName,
            latitude = latitude,
            longitude = longitude,
            capacityKWh = capacityKWh,
            totalBatterySlots = totalBatterySlots,
            availableBatterySlots = availableBatterySlots,
            isActive = isActive,
            operationalHours = operationalHours,
            contactNumber = contactNumber,
            createdAt = createdAt
        )
    }
}
