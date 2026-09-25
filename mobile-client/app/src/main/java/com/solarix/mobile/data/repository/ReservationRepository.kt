package com.solarix.mobile.data.repository

import android.content.Context
import com.solarix.mobile.data.local.AppDatabase
import com.solarix.mobile.data.local.entities.CachedBookingEntity
import com.solarix.mobile.data.remote.RetrofitClient
import com.solarix.mobile.data.remote.dtos.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ReservationRepository(context: Context) {
    private val api = RetrofitClient.getService(context)
    private val db = AppDatabase.getDatabase(context)

    suspend fun createReservation(request: CreateReservationRequest): Result<ReservationResponse> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.createReservation(request)
                if (response.isSuccessful && response.body() != null) {
                    val res = response.body()!!
                    cacheReservation(res)
                    Result.success(res)
                } else {
                    val msg = RetrofitClient.parseErrorMessage(response)
                    Result.failure(Exception(msg))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun updateReservation(
        id: String,
        prosumerNic: String,
        request: UpdateReservationRequest
    ): Result<ReservationResponse> = withContext(Dispatchers.IO) {
        try {
            val response = api.updateReservation(id, prosumerNic, request)
            if (response.isSuccessful && response.body() != null) {
                val res = response.body()!!
                cacheReservation(res)
                Result.success(res)
            } else {
                val msg = RetrofitClient.parseErrorMessage(response)
                Result.failure(Exception(msg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun cancelReservation(
        id: String,
        request: CancelReservationRequest
    ): Result<ReservationResponse> = withContext(Dispatchers.IO) {
        try {
            val response = api.cancelReservation(id, request)
            if (response.isSuccessful && response.body() != null) {
                val res = response.body()!!
                cacheReservation(res)
                Result.success(res)
            } else {
                val msg = RetrofitClient.parseErrorMessage(response)
                Result.failure(Exception(msg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getReservationById(id: String): Result<ReservationResponse> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.getReservationById(id)
                if (response.isSuccessful && response.body() != null) {
                    val res = response.body()!!
                    cacheReservation(res)
                    Result.success(res)
                } else {
                    val msg = RetrofitClient.parseErrorMessage(response)
                    Result.failure(Exception(msg))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun getReservationsByProsumer(nic: String): Result<List<ReservationResponse>> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.getReservationsByProsumer(nic)
                if (response.isSuccessful && response.body() != null) {
                    val list = response.body()!!
                    // Cache in Room SQLite
                    val entities = list.map { it.toCachedEntity() }
                    db.bookingDao().clearBookingsForProsumer(nic)
                    db.bookingDao().insertAll(entities)
                    Result.success(list)
                } else {
                    val cached = db.bookingDao().getBookingsByProsumer(nic)
                    if (cached.isNotEmpty()) {
                        Result.success(cached.map { it.toResponse() })
                    } else {
                        val msg = RetrofitClient.parseErrorMessage(response)
                        Result.failure(Exception(msg))
                    }
                }
            } catch (e: Exception) {
                // Fallback to local Room SQLite cache if offline
                val cached = db.bookingDao().getBookingsByProsumer(nic)
                if (cached.isNotEmpty()) {
                    Result.success(cached.map { it.toResponse() })
                } else {
                    Result.failure(e)
                }
            }
        }

    suspend fun getDashboardSummary(): Result<DashboardSummaryResponse> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.getDashboardSummary()
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

    suspend fun verifyAndComplete(request: VerifyAndCompleteRequest): Result<ReservationResponse> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.verifyAndComplete(request)
                if (response.isSuccessful && response.body() != null) {
                    val res = response.body()!!
                    cacheReservation(res)
                    Result.success(res)
                } else {
                    val msg = RetrofitClient.parseErrorMessage(response)
                    Result.failure(Exception(msg))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    private suspend fun cacheReservation(res: ReservationResponse) {
        db.bookingDao().insertOrUpdate(res.toCachedEntity())
    }

    private fun ReservationResponse.toCachedEntity(): CachedBookingEntity {
        return CachedBookingEntity(
            id = this.id,
            reservationNumber = this.reservationNumber,
            prosumerNIC = this.prosumerNIC,
            stationId = this.stationId,
            stationName = this.stationName,
            slotId = this.slotId,
            reservationDate = this.reservationDate,
            startTime = this.startTime,
            endTime = this.endTime,
            energyAmountKW = this.energyAmountKW,
            tradeType = this.tradeType,
            status = this.status,
            qrCodeToken = this.qrCodeToken
        )
    }

    private fun CachedBookingEntity.toResponse(): ReservationResponse {
        return ReservationResponse(
            id = this.id,
            reservationNumber = this.reservationNumber,
            prosumerNIC = this.prosumerNIC,
            stationId = this.stationId,
            stationName = this.stationName,
            slotId = this.slotId,
            reservationDate = this.reservationDate,
            startTime = this.startTime,
            endTime = this.endTime,
            energyAmountKW = this.energyAmountKW,
            tradeType = this.tradeType,
            status = this.status,
            qrCodeToken = this.qrCodeToken,
            cancellationReason = null,
            cancelledAt = null,
            finalizedByOperatorNIC = null,
            finalizedAt = null,
            operatorNotes = null,
            createdAt = null
        )
    }
}
