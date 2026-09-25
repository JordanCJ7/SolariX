package com.solarix.mobile.data.repository

import android.content.Context
import com.solarix.mobile.data.remote.RetrofitClient
import com.solarix.mobile.data.remote.dtos.SlotResponse
import com.solarix.mobile.data.remote.dtos.StationResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class StationRepository(context: Context) {
    private val api = RetrofitClient.getService(context)

    suspend fun getStations(activeOnly: Boolean? = true): Result<List<StationResponse>> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.getStations(activeOnly)
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
                Result.failure(e)
            }
        }
}
