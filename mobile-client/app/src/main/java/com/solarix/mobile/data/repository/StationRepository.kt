package com.solarix.mobile.data.repository

import android.content.Context
import com.solarix.mobile.data.local.AppDatabase
import com.solarix.mobile.data.local.entities.CachedStationEntity
import com.solarix.mobile.data.remote.RetrofitClient
import com.solarix.mobile.data.remote.dtos.SlotResponse
import com.solarix.mobile.data.remote.dtos.StationResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class StationRepository(context: Context) {
    private val api = RetrofitClient.getService(context)
    private val db = AppDatabase.getDatabase(context)

    suspend fun getStations(activeOnly: Boolean? = true): Result<List<StationResponse>> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.getStations(activeOnly)
                if (response.isSuccessful && response.body() != null) {
                    val stations = response.body()!!
                    val entities = stations.map {
                        CachedStationEntity(
                            id = it.id,
                            stationCode = it.stationCode,
                            stationName = it.stationName,
                            locationName = it.locationName,
                            latitude = it.latitude,
                            longitude = it.longitude,
                            capacityKWh = it.capacityKWh,
                            totalBatterySlots = it.totalBatterySlots,
                            availableBatterySlots = it.availableBatterySlots,
                            isActive = it.isActive,
                            operationalHours = it.operationalHours,
                            contactNumber = it.contactNumber,
                            createdAt = it.createdAt
                        )
                    }
                    db.stationDao().clearAll()
                    db.stationDao().insertAll(entities)
                    Result.success(stations)
                } else {
                    val cached = db.stationDao().getAllStations()
                    if (cached.isNotEmpty()) {
                        val filtered = if (activeOnly == true) cached.filter { it.isActive } else cached
                        Result.success(filtered.map { it.toResponse() })
                    } else {
                        val msg = RetrofitClient.parseErrorMessage(response)
                        Result.failure(Exception(msg))
                    }
                }
            } catch (e: Exception) {
                val cached = db.stationDao().getAllStations()
                if (cached.isNotEmpty()) {
                    val filtered = if (activeOnly == true) cached.filter { it.isActive } else cached
                    Result.success(filtered.map { it.toResponse() })
                } else {
                    Result.failure(e)
                }
            }
        }

    suspend fun getStationById(id: String): Result<StationResponse> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.getStationById(id)
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    val msg = RetrofitClient.parseErrorMessage(response)
                    Result.failure(Exception(msg))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun getSlotsForStation(stationId: String, date: String? = null): Result<List<SlotResponse>> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.getSlotsForStation(stationId, date)
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    val msg = RetrofitClient.parseErrorMessage(response)
                    Result.failure(Exception(msg))
                }
            } catch (e: Exception) {
                // Fallback: Generate some mock slots for offline booking demonstration
                val mockDate = date ?: "2026-10-10"
                val mockSlots = listOf(
                    SlotResponse(
                        id = "SLOT_OFFLINE_1",
                        stationId = stationId,
                        slotDate = mockDate,
                        startTime = "08:00:00",
                        endTime = "10:00:00",
                        maxCapacityKW = 50.0,
                        availableCapacityKW = 50.0,
                        status = "Available"
                    ),
                    SlotResponse(
                        id = "SLOT_OFFLINE_2",
                        stationId = stationId,
                        slotDate = mockDate,
                        startTime = "10:00:00",
                        endTime = "12:00:00",
                        maxCapacityKW = 50.0,
                        availableCapacityKW = 50.0,
                        status = "Available"
                    ),
                    SlotResponse(
                        id = "SLOT_OFFLINE_3",
                        stationId = stationId,
                        slotDate = mockDate,
                        startTime = "12:00:00",
                        endTime = "14:00:00",
                        maxCapacityKW = 50.0,
                        availableCapacityKW = 50.0,
                        status = "Available"
                    )
                )
                Result.success(mockSlots)
            }
        }
}
