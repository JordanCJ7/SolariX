package com.solarix.mobile.data.remote.dtos

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    @SerializedName("identifier") val identifier: String,
    @SerializedName("password") val password: String
)

data class LoginResponse(
    @SerializedName("nic") val nic: String,
    @SerializedName("fullName") val fullName: String,
    @SerializedName("email") val email: String,
    @SerializedName("role") val role: String,
    @SerializedName("status") val status: String,
    @SerializedName("token") val token: String
)

data class RegisterProsumerRequest(
    @SerializedName("nic") val nic: String,
    @SerializedName("fullName") val fullName: String,
    @SerializedName("email") val email: String,
    @SerializedName("phoneNumber") val phoneNumber: String,
    @SerializedName("password") val password: String,
    @SerializedName("address") val address: String,
    @SerializedName("solarCapacityKW") val solarCapacityKW: Double = 5.0
)

data class UpdateProfileRequest(
    @SerializedName("fullName") val fullName: String,
    @SerializedName("phoneNumber") val phoneNumber: String,
    @SerializedName("address") val address: String,
    @SerializedName("solarCapacityKW") val solarCapacityKW: Double
)

data class UserResponse(
    @SerializedName("id") val id: String,
    @SerializedName("nic") val nic: String,
    @SerializedName("fullName") val fullName: String,
    @SerializedName("email") val email: String,
    @SerializedName("phoneNumber") val phoneNumber: String,
    @SerializedName("role") val role: String,
    @SerializedName("status") val status: String,
    @SerializedName("address") val address: String,
    @SerializedName("solarCapacityKW") val solarCapacityKW: Double,
    @SerializedName("createdAt") val createdAt: String?
)

data class ApiResponse<T>(
    @SerializedName("message") val message: String? = null,
    @SerializedName("error") val error: String? = null,
    @SerializedName("data") val data: T? = null
)
