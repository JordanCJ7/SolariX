package com.solarix.mobile.data.remote.dtos

import com.google.gson.annotations.SerializedName

data class StationResponse(
    @SerializedName("id") val id: String,
    @SerializedName("stationCode") val stationCode: String,
    @SerializedName("stationName") val stationName: String,
    @SerializedName("locationName") val locationName: String,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("capacityKWh") val capacityKWh: Double,
    @SerializedName("totalBatterySlots") val totalBatterySlots: Int,
    @SerializedName("availableBatterySlots") val availableBatterySlots: Int,
    @SerializedName("isActive") val isActive: Boolean,
    @SerializedName("operationalHours") val operationalHours: String?,
    @SerializedName("contactNumber") val contactNumber: String?,
    @SerializedName("createdAt") val createdAt: String?
)

data class SlotResponse(
    @SerializedName("id") val id: String,
    @SerializedName("stationId") val stationId: String,
    @SerializedName("slotDate") val slotDate: String,
    @SerializedName("startTime") val startTime: String,
    @SerializedName("endTime") val endTime: String,
    @SerializedName("maxCapacityKW") val maxCapacityKW: Double,
    @SerializedName("availableCapacityKW") val availableCapacityKW: Double,
    @SerializedName("status") val status: String
)
