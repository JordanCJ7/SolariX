package com.solarix.mobile.data.remote

import com.solarix.mobile.data.remote.dtos.*
import retrofit2.Response
import retrofit2.http.*

/**
 * Complete Retrofit API service definition mapping directly to the C# ASP.NET Core Web API.
 */
interface ApiService {

    // --- Authentication & Prosumer Onboarding ---
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("auth/register-prosumer")
    suspend fun registerProsumer(@Body request: RegisterProsumerRequest): Response<UserResponse>

    @GET("auth/profile/{nic}")
    suspend fun getProfile(@Path("nic") nic: String): Response<UserResponse>

    @PUT("users/prosumer/{nic}")
    suspend fun updateProfile(
        @Path("nic") nic: String,
        @Body request: UpdateProfileRequest
    ): Response<UserResponse>

    @POST("users/{nic}/deactivate")
    suspend fun deactivateAccount(
        @Path("nic") nic: String,
        @Query("requestedByNic") requestedByNic: String
    ): Response<Map<String, String>>

    // --- Solar Stations & Slots ---
    @GET("stations")
    suspend fun getStations(@Query("activeOnly") activeOnly: Boolean? = true): Response<List<StationResponse>>

    @GET("stations/{id}")
    suspend fun getStationById(@Path("id") id: String): Response<StationResponse>

    @GET("slots/station/{stationId}")
    suspend fun getSlotsForStation(
        @Path("stationId") stationId: String,
        @Query("date") date: String? = null
    ): Response<List<SlotResponse>>

    // --- Energy Reservations & Lifecycle ---
    @POST("reservations")
    suspend fun createReservation(@Body request: CreateReservationRequest): Response<ReservationResponse>

    @PUT("reservations/{id}")
    suspend fun updateReservation(
        @Path("id") id: String,
        @Query("prosumerNic") prosumerNic: String,
        @Body request: UpdateReservationRequest
    ): Response<ReservationResponse>

    @POST("reservations/{id}/cancel")
    suspend fun cancelReservation(
        @Path("id") id: String,
        @Body request: CancelReservationRequest
    ): Response<ReservationResponse>

    @GET("reservations/{id}")
    suspend fun getReservationById(@Path("id") id: String): Response<ReservationResponse>

    @GET("reservations/prosumer/{nic}")
    suspend fun getReservationsByProsumer(@Path("nic") nic: String): Response<List<ReservationResponse>>

    @GET("reservations/dashboard-summary")
    suspend fun getDashboardSummary(): Response<DashboardSummaryResponse>

    // --- Operator QR Code Verification & Finalization ---
    @POST("reservations/verify-and-complete")
    suspend fun verifyAndComplete(@Body request: VerifyAndCompleteRequest): Response<ReservationResponse>
}
